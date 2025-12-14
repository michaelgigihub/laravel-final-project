<?php

namespace App\Services;

use Gemini\Data\Content;
use Gemini\Data\FunctionCall;
use Gemini\Data\FunctionDeclaration;
use Gemini\Data\FunctionResponse;
use Gemini\Data\Part;
use Gemini\Data\Schema;
use Gemini\Data\Tool;
use Gemini\Enums\DataType;
use Gemini\Enums\Role;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class GeminiChatService
{
    /**
     * The Gemini model to use for chat.
     */
    private const MODEL = 'gemini-2.5-flash';

    /**
     * Base system instruction for the AI assistant.
     */
    private const BASE_SYSTEM_INSTRUCTION = 'You are a helpful dental clinic assistant. You can help patients and staff find information about appointments, treatments, and clinic hours. When asked about appointments, use the provided tools to look up accurate information. Be friendly, professional, and concise in your responses. Always assume the current year is 2025.';

    public function __construct(
        private readonly AppointmentService $appointmentService,
        private readonly TreatmentService $treatmentService,
        private readonly ClinicService $clinicService,
        private readonly DentistService $dentistService,
        private readonly ChatHistoryService $chatHistoryService
    ) {}

    /**
     * Build system instruction with user context.
     */
    private function buildSystemInstruction($user): string
    {
        $instruction = self::BASE_SYSTEM_INSTRUCTION;
        
        if ($user) {
            $roleName = match ($user->role_id) {
                1 => 'an administrator with full access to all functions including dentist management',
                2 => 'a dentist who can view their own patients and appointments',
                default => 'a guest user',
            };
            $instruction .= " The current user is {$user->name}, who is {$roleName}. You can directly use admin-only or role-specific functions without asking for confirmation since you already know their role.";
        }
        
        return $instruction;
    }

    /**
     * Handle a chat message and return the AI response.
     * 
     * @param string $message User's message
     * @param int|null $conversationId Existing conversation ID (null creates new)
     * @param \App\Models\User|null $user The authenticated user
     * @return array Response with success, response text, and conversation_id
     */
    public function handleChat(string $message, ?int $conversationId = null, $user = null): array
    {
        try {
            // Get or create conversation
            if ($user) {
                $conversation = $this->chatHistoryService->getOrCreateConversation($user->id, $conversationId);
                $conversationId = $conversation->id;
                
                // Store user message
                $this->chatHistoryService->addMessage($conversationId, 'user', $message);
            }

             // Define the function declarations
            $tools = $this->getToolDefinitions();

            // Build the chat with tools and dynamic system instruction
            $chat = Gemini::generativeModel(model: self::MODEL)
                ->withSystemInstruction(Content::parse($this->buildSystemInstruction($user)))
                ->withTool($tools)
                ->startChat();

            // Send the user message
            $response = $chat->sendMessage($message);

            // Check if the model wants to call a function
            $parts = $response->parts();
            
            if (empty($parts)) {
                return [
                    'success' => false,
                    'response' => null,
                    'error' => 'No response from Gemini.',
                ];
            }

            // Process function calls if present
            foreach ($parts as $part) {
                if ($part->functionCall !== null) {
                    $functionCall = $part->functionCall;

                    // Execute the function with RBAC
                    $functionResult = $this->executeFunction($functionCall, $user);

                    // Create the function response content
                    $functionResponseContent = new Content(
                        parts: [
                            new Part(
                                functionResponse: new FunctionResponse(
                                    name: $functionCall->name,
                                    response: $functionResult,
                                )
                            )
                        ],
                        role: Role::USER
                    );

                    // Send the function result back to Gemini
                    $finalResponse = $chat->sendMessage($functionResponseContent);
                    
                    $responseText = $finalResponse->text();
                    
                    // Store assistant message if user is authenticated
                    if ($user && $conversationId) {
                        $this->chatHistoryService->addMessage($conversationId, 'assistant', $responseText, $functionCall->name);
                    }

                    return [
                        'success' => true,
                        'response' => $responseText,
                        'function_called' => $functionCall->name,
                        'conversation_id' => $conversationId,
                    ];
                }
            }

            // No function call, return the direct text response
            $responseText = $response->text();
            
            // Store assistant message if user is authenticated
            if ($user && $conversationId) {
                $this->chatHistoryService->addMessage($conversationId, 'assistant', $responseText);
            }
            
            return [
                'success' => true,
                'response' => $responseText,
                'conversation_id' => $conversationId,
            ];

        } catch (\Exception $e) {
            // ... (error handling)
            return [
                'success' => false,
                'response' => null,
                'error' => 'Failed to process chat: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get the tool definitions for Gemini function calling.
     *
     * @return Tool
     */
    private function getToolDefinitions(): Tool
    {
        return new Tool(
            functionDeclarations: [
                new FunctionDeclaration(
                    name: 'findNextAppointment',
                    description: 'Finds the next scheduled appointment for a patient by their name.',
                    parameters: new Schema(
                        type: DataType::OBJECT,
                        properties: [
                            'patientName' => new Schema(
                                type: DataType::STRING,
                                description: 'The patient\'s name to search for.',
                            ),
                        ],
                        required: ['patientName']
                    )
                ),
                new FunctionDeclaration(
                    name: 'getTreatmentInfo',
                    description: 'Get information about dental treatments including cost and duration.',
                    parameters: new Schema(
                        type: DataType::OBJECT,
                        properties: [
                            'treatmentName' => new Schema(
                                type: DataType::STRING,
                                description: 'The name of the treatment to check (e.g., Cleaning, Root Canal).',
                            ),
                        ],
                        required: ['treatmentName']
                    )
                ),
                new FunctionDeclaration(
                    name: 'getClinicHours',
                    description: 'Get the clinic\'s operating hours or status.',
                    parameters: new Schema(
                        type: DataType::OBJECT,
                        properties: [
                            'dayQuery' => new Schema(
                                type: DataType::STRING,
                                description: 'The day to check (e.g., "Monday", "Today", "Tomorrow"). Leave empty for general weekly schedule.',
                            ),
                        ],
                    )
                ),
                new FunctionDeclaration(
                    name: 'getPatientAppointmentHistory',
                    description: 'Get past appointment history for a patient.',
                    parameters: new Schema(
                        type: DataType::OBJECT,
                        properties: [
                            'patientName' => new Schema(
                                type: DataType::STRING,
                                description: 'The patient\'s name.',
                            ),
                        ],
                        required: ['patientName']
                    )
                ),
                new FunctionDeclaration(
                    name: 'estimateTreatmentCost',
                     description: 'Estimate the total cost for one or more treatments.',
                    parameters: new Schema(
                        type: DataType::OBJECT,
                        properties: [
                            'treatmentNames' => new Schema(
                                type: DataType::ARRAY,
                                items: new Schema(type: DataType::STRING),
                                description: 'List of treatment names (e.g., ["Extraction", "Cleaning"]).',
                            ),
                        ],
                        required: ['treatmentNames']
                    )
                ),
                new FunctionDeclaration(
                    name: 'getWeeklyPatients',
                    description: 'Get list of unique patients scheduled for the current week. Dentists see only their own patients.',
                    parameters: new Schema(
                        type: DataType::OBJECT,
                        properties: []
                    )
                ),
                new FunctionDeclaration(
                    name: 'getDailySchedule',
                    description: 'Get daily appointment schedule. Dentists see only their own schedule.',
                    parameters: new Schema(
                        type: DataType::OBJECT,
                        properties: [
                            'date' => new Schema(
                                type: DataType::STRING,
                                description: 'Date in Y-m-d format or natural language like "today", "tomorrow" (optional, defaults to today).',
                            ),
                        ]
                    )
                ),
                new FunctionDeclaration(
                    name: 'listEmployedDentists',
                    description: 'List all employed dentists with their specializations. Admin only.',
                    parameters: new Schema(
                        type: DataType::OBJECT,
                        properties: []
                    )
                ),
                new FunctionDeclaration(
                    name: 'findDentistsBySpecialization',
                    description: 'Find dentists by their specialization. Admin only.',
                    parameters: new Schema(
                        type: DataType::OBJECT,
                        properties: [
                            'specialization' => new Schema(
                                type: DataType::STRING,
                                description: 'The specialization to search for (e.g., "Orthodontics", "Endodontics").',
                            ),
                        ],
                        required: ['specialization']
                    )
                ),
                new FunctionDeclaration(
                    name: 'getAllPatients',
                    description: 'Get all patients assigned to the dentist (all time, not just this week). Dentists see only their own patients.',
                    parameters: new Schema(type: DataType::OBJECT, properties: [])
                ),
            ]
        );
    }

    /**
     * Execute a function call from Gemini.
     */
    private function executeFunction(\Gemini\Data\FunctionCall $functionCall, $user): array
    {
        $args = $functionCall->args;
        // Parse arguments consistently
        if (is_object($args)) {
            $argsArray = get_object_vars($args);
        } else {
            $argsArray = (array) $args;
        }

        \Illuminate\Support\Facades\Log::info('Gemini Function Call', [
            'function' => $functionCall->name,
            'args' => $argsArray,
            'user' => $user ? $user->id : 'guest'
        ]);

        return match ($functionCall->name) {
            'findNextAppointment' => $this->executeFindNextAppointment($argsArray, $user),
            'getTreatmentInfo' => $this->executeGetTreatmentInfo($argsArray),
            'getClinicHours' => $this->executeGetClinicHours($argsArray),
            'getPatientAppointmentHistory' => $this->executeGetPatientAppointmentHistory($argsArray, $user),
            'estimateTreatmentCost' => $this->executeEstimateTreatmentCost($argsArray),
            'getWeeklyPatients' => $this->executeGetWeeklyPatients($user),
            'getDailySchedule' => $this->executeGetDailySchedule($argsArray, $user),
            'getAllPatients' => $this->executeGetAllPatients($user),
            'listEmployedDentists' => $this->executeListEmployedDentists($user),
            'findDentistsBySpecialization' => $this->executeFindDentistsBySpecialization($argsArray, $user),
            default => ['error' => "Unknown function: {$functionCall->name}"],
        };
    }

    private function executeFindNextAppointment(array $args, $user): array
    {
        $patientName = $args['patientName'] ?? '';
        if (empty($patientName)) return ['error' => 'Patient name is required.'];

        // RBAC: If user is a dentist (role_id 2), scope to their ID. Admin (role_id 1) sees all.
        $dentistId = ($user && $user->role_id === 2) ? $user->id : null;

        $appointment = $this->appointmentService->findNextAppointment($patientName, $dentistId);

        if ($appointment === null) {
            return [
                'found' => false,
                'message' => "No upcoming appointments found for '{$patientName}'" . ($dentistId ? " with you." : "."),
            ];
        }

        return ['found' => true, 'appointment' => $appointment];
    }

    private function executeGetPatientAppointmentHistory(array $args, $user): array
    {
        $patientName = $args['patientName'] ?? '';
        if (empty($patientName)) return ['error' => 'Patient name is required.'];

        // RBAC: Same scoping logic
        $dentistId = ($user && $user->role_id === 2) ? $user->id : null;

        // Note: You need to implement getAppointmentHistory in AppointmentService next
        $history = $this->appointmentService->getAppointmentHistory($patientName, $dentistId);

        if (empty($history)) {
             return [
                'found' => false,
                'message' => "No appointment history found for '{$patientName}'" . ($dentistId ? " with you." : "."),
            ];
        }

        return ['found' => true, 'history' => $history];
    }

    private function executeGetTreatmentInfo(array $args): array
    {
        $name = $args['treatmentName'] ?? '';
        if (empty($name)) return ['error' => 'Treatment name is required.'];

        $results = $this->treatmentService->findTreatmentsByName($name);
        
        if ($results->isEmpty()) {
            return ['found' => false, 'message' => "No active treatments found matching '{$name}'."];
        }

        return ['found' => true, 'treatments' => $results->toArray()];
    }

    private function executeGetClinicHours(array $args): array
    {
        $day = $args['dayQuery'] ?? '';
        
        if (!empty($day)) {
            return $this->clinicService->getHoursForDay($day);
        }

        return $this->clinicService->getOperatingHours();
    }

    private function executeEstimateTreatmentCost(array $args): array
    {
        $names = $args['treatmentNames'] ?? [];
        if (empty($names)) return ['error' => 'List of treatment names is required.'];
        
        return $this->treatmentService->estimateCost($names);
    }

    private function executeGetWeeklyPatients($user): array
    {
        if (!$user) return ['error' => 'Authentication required.'];
        if ($user->role_id !== 2) return ['error' => 'This function is only available to dentists.'];

        $patients = $this->appointmentService->getWeeklyPatients($user->id);

        if (empty($patients)) {
            return [
                'found' => false,
                'message' => 'You have no patients scheduled this week.'
            ];
        }

        return ['found' => true, 'patients' => $patients];
    }

    private function executeGetDailySchedule(array $args, $user): array
    {
        if (!$user) return ['error' => 'Authentication required.'];
        if ($user->role_id !== 2) return ['error' => 'This function is only available to dentists.'];

        $date = $args['date'] ?? null;
        $schedule = $this->appointmentService->getDailySchedule($user->id, $date);

        if (empty($schedule)) {
            $dateStr = $date ?: 'today';
            return [
                'found' => false,
                'message' => "You have no appointments scheduled for {$dateStr}."
            ];
        }

        return ['found' => true, 'schedule' => $schedule];
    }

    private function executeListEmployedDentists($user): array
    {
        if (!$user) return ['error' => 'Authentication required.'];
        if ($user->role_id !== 1) return ['error' => 'Permission denied. This function is only available to administrators.'];

        $dentists = $this->dentistService->listEmployedDentists();

        if ($dentists->isEmpty()) {
            return ['found' => false, 'message' => 'No employed dentists found.'];
        }

        return ['found' => true, 'dentists' => $dentists->toArray()];
    }

    private function executeFindDentistsBySpecialization(array $args, $user): array
    {
        if (!$user) return ['error' => 'Authentication required.'];
        if ($user->role_id !== 1) return ['error' => 'Permission denied. This function is only available to administrators.'];

        $specialization = $args['specialization'] ?? '';
        if (empty($specialization)) return ['error' => 'Specialization name is required.'];

        $dentists = $this->dentistService->findDentistsBySpecialization($specialization);

        if ($dentists->isEmpty()) {
            return ['found' => false, 'message' => "No dentists found with specialization '{$specialization}'."];
        }

        return ['found' => true, 'dentists' => $dentists->toArray()];
    }

    private function executeGetAllPatients($user): array
    {
        if (!$user) return ['error' => 'Authentication required.'];
        
        // Only dentists can view their patient list
        if ($user->role_id !== 2) {
            return ['error' => 'This function is only available to dentists.'];
        }

        $patients = $this->appointmentService->getAllPatients($user->id);

        if (empty($patients)) {
            return ['found' => false, 'message' => 'You have no patients assigned to you.'];
        }

        return [
            'found' => true,
            'total_patients' => count($patients),
            'patients' => $patients
        ];
    }
}
