<?php

namespace App\Services;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use Illuminate\Support\Collection;

class ChatHistoryService
{
    /**
     * Create a new conversation for a user.
     *
     * @param int $userId
     * @param string|null $title
     * @return ChatConversation
     */
    public function createConversation(int $userId, ?string $title = null): ChatConversation
    {
        return ChatConversation::create([
            'user_id' => $userId,
            'title' => $title,
        ]);
    }

    /**
     * Add a message to a conversation.
     *
     * @param int $conversationId
     * @param string $role 'user' or 'assistant'
     * @param string $content
     * @param string|null $functionCalled
     * @return ChatMessage
     */
    public function addMessage(
        int $conversationId,
        string $role,
        string $content,
        ?string $functionCalled = null
    ): ChatMessage {
        $message = ChatMessage::create([
            'conversation_id' => $conversationId,
            'role' => $role,
            'content' => $content,
            'function_called' => $functionCalled,
        ]);

        // Update conversation's updated_at timestamp
        ChatConversation::where('id', $conversationId)->touch();

        // Auto-generate title if this is the first user message
        $conversation = ChatConversation::find($conversationId);
        if ($conversation && !$conversation->title && $role === 'user') {
            $conversation->generateTitleFromFirstMessage();
        }

        return $message;
    }

    /**
     * Get conversations for a user.
     *
     * @param int $userId
     * @param int $limit
     * @return Collection
     */
    public function getConversations(int $userId, int $limit = 20): Collection
    {
        return ChatConversation::forUser($userId)
            ->latest('updated_at')
            ->limit($limit)
            ->get()
            ->map(function ($conversation) {
                return [
                    'id' => $conversation->id,
                    'title' => $conversation->title ?: 'Untitled Chat',
                    'updated_at' => $conversation->updated_at->diffForHumans(),
                    'created_at' => $conversation->created_at->format('M j, Y'),
                ];
            });
    }

    /**
     * Get messages for a specific conversation.
     *
     * @param int $conversationId
     * @return Collection
     */
    public function getConversationMessages(int $conversationId): Collection
    {
        return ChatMessage::where('conversation_id', $conversationId)
            ->orderBy('created_at')
            ->get();
    }

    /**
     * Delete a conversation and all its messages.
     *
     * @param int $conversationId
     * @return void
     */
    public function deleteConversation(int $conversationId): void
    {
        ChatConversation::destroy($conversationId);
    }

    /**
     * Get or create a conversation for the current chat session.
     *
     * @param int $userId
     * @param int|null $conversationId
     * @return ChatConversation
     */
    public function getOrCreateConversation(int $userId, ?int $conversationId = null): ChatConversation
    {
        if ($conversationId) {
            $conversation = ChatConversation::forUser($userId)->find($conversationId);
            if ($conversation) {
                return $conversation;
            }
        }

        return $this->createConversation($userId);
    }
}
