<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
    const UPDATED_AT = null; // Only track created_at

    protected $fillable = [
        'conversation_id',
        'role',
        'content',
        'function_called',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Get the conversation that owns the message.
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }
}
