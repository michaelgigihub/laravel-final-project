<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatConversation extends Model
{
    protected $fillable = [
        'user_id',
        'title',
    ];

    /**
     * Get the user that owns the conversation.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the messages for the conversation.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id');
    }

    /**
     * Scope a query to only include conversations for a specific user.
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Auto-generate title from first user message if not set.
     */
    public function generateTitleFromFirstMessage(): void
    {
        if ($this->title) {
            return;
        }

        $firstUserMessage = $this->messages()
            ->where('role', 'user')
            ->oldest()
            ->first();

        if ($firstUserMessage) {
            $title = mb_substr($firstUserMessage->content, 0, 50);
            if (mb_strlen($firstUserMessage->content) > 50) {
                $title .= '...';
            }
            $this->update(['title' => $title]);
        }
    }
}
