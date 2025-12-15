import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User } from '@/types';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isAnimated?: boolean;
}

interface Conversation {
    id: number;
    title: string;
    updated_at: string;
    created_at: string;
}

interface ChatContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    currentConversationId: number | null;
    setCurrentConversationId: (id: number | null) => void;
    conversations: Conversation[];
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    width: number;
    setWidth: (width: number) => void;
    clearChat: () => void;
    resetSession: () => void;
    user: User | null;
    setUser: (user: User | null) => void;
    customTriggerMounted: boolean;
    setCustomTriggerMounted: (mounted: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const DEFAULT_WIDTH = 700;

export function ChatProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [width, setWidth] = useState(DEFAULT_WIDTH);
    const [user, setUser] = useState<User | null>(null);
    const [customTriggerMounted, setCustomTriggerMounted] = useState(false);

    const clearChat = useCallback(() => {
        setCurrentConversationId(null);
        setMessages([]);
    }, []);

    // Reset entire chat session (used on logout)
    const resetSession = useCallback(() => {
        setIsOpen(false);
        setMessages([]);
        setCurrentConversationId(null);
        setConversations([]);
        setUser(null);
    }, []);

    return (
        <ChatContext.Provider
            value={{
                isOpen,
                setIsOpen,
                messages,
                setMessages,
                currentConversationId,
                setCurrentConversationId,
                conversations,
                setConversations,
                width,
                setWidth,
                clearChat,
                resetSession,
                user,
                setUser,
                customTriggerMounted,
                setCustomTriggerMounted,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
}
