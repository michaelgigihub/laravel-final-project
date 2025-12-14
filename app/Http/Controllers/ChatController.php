<?php

namespace App\Http\Controllers;

use App\Services\ChatHistoryService;
use App\Services\GeminiChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function __construct(
        private readonly GeminiChatService $geminiChatService,
        private readonly ChatHistoryService $chatHistoryService
    ) {}

    /**
     * Handle incoming chat messages and return AI responses.
     */
    public function sendMessage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'conversation_id' => ['nullable', 'integer', 'exists:chat_conversations,id'],
        ]);

        $result = $this->geminiChatService->handleChat(
            $validated['message'],
            $validated['conversation_id'] ?? null,
            $request->user()
        );

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'error' => $result['error'] ?? 'An unknown error occurred.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'response' => $result['response'],
            'conversation_id' => $result['conversation_id'] ?? null,
            'function_called' => $result['function_called'] ?? null,
        ]);
    }

    /**
     * Get list of conversations for the authenticated user.
     */
    public function getConversations(Request $request): JsonResponse
    {
        $conversations = $this->chatHistoryService->getConversations(
            $request->user()->id
        );

        return response()->json([
            'success' => true,
            'conversations' => $conversations,
        ]);
    }

    /**
     * Get messages for a specific conversation.
     */
    public function getConversationMessages(Request $request, int $conversationId): JsonResponse
    {
        $messages = $this->chatHistoryService->getConversationMessages($conversationId);

        return response()->json([
            'success' => true,
            'messages' => $messages,
        ]);
    }

    /**
     * Delete a conversation.
     */
    public function deleteConversation(Request $request, int $conversationId): JsonResponse
    {
        $this->chatHistoryService->deleteConversation($conversationId);

        return response()->json([
            'success' => true,
            'message' => 'Conversation deleted successfully.',
        ]);
    }
}
