<?php

namespace App\Http\Controllers;

use App\Services\ChatHistoryService;
use App\Services\GeminiChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
        try {
            $conversations = $this->chatHistoryService->getConversations(
                $request->user()->id
            );

            return response()->json([
                'success' => true,
                'conversations' => $conversations,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch conversations', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to load conversations. Please try again.',
            ], 500);
        }
    }

    /**
     * Get messages for a specific conversation.
     */
    public function getConversationMessages(Request $request, int $conversationId): JsonResponse
    {
        // Verify ownership - users can only access their own conversations
        $conversation = \App\Models\ChatConversation::where('id', $conversationId)
            ->where('user_id', $request->user()->id)
            ->first();
        
        if (!$conversation) {
            return response()->json([
                'success' => false,
                'error' => 'Conversation not found.',
            ], 404);
        }

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
        try {
            // Verify ownership - users can only delete their own conversations
            $conversation = \App\Models\ChatConversation::where('id', $conversationId)
                ->where('user_id', $request->user()->id)
                ->first();
            
            if (!$conversation) {
                return response()->json([
                    'success' => false,
                    'error' => 'Conversation not found.',
                ], 404);
            }

            $this->chatHistoryService->deleteConversation($conversationId);

            return response()->json([
                'success' => true,
                'message' => 'Conversation deleted successfully.',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete conversation', ['id' => $conversationId, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to delete conversation. Please try again.',
            ], 500);
        }
    }

    /**
     * Delete a specific message (for cancellation cleanup).
     */
    public function deleteMessage(Request $request, int $messageId): JsonResponse
    {
        try {
            // Verify ownership - message must belong to a conversation owned by user
            $message = \App\Models\ChatMessage::with('conversation')
                ->where('id', $messageId)
                ->first();
            
            if (!$message || !$message->conversation || $message->conversation->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'error' => 'Message not found.',
                ], 404);
            }

            $this->chatHistoryService->deleteMessage($messageId);

            return response()->json([
                'success' => true,
                'message' => 'Message deleted successfully.',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete message', ['id' => $messageId, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to delete message. Please try again.',
            ], 500);
        }
    }

    /**
     * Cancel and clean up the last user message from a conversation.
     * Used when user cancels an in-flight request before AI responds.
     */
    public function cancelLastMessage(Request $request, int $conversationId): JsonResponse
    {
        try {
            // Verify ownership
            $conversation = \App\Models\ChatConversation::where('id', $conversationId)
                ->where('user_id', $request->user()->id)
                ->first();
            
            if (!$conversation) {
                return response()->json([
                    'success' => false,
                    'error' => 'Conversation not found.',
                ], 404);
            }

            $deleted = $this->chatHistoryService->deleteLastUserMessage($conversationId);

            return response()->json([
                'success' => true,
                'deleted' => $deleted,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to cancel message', ['conversation_id' => $conversationId, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'error' => 'Failed to cancel message. Please try again.',
            ], 500);
        }
    }
}
