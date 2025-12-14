import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { MessageCircle, Send, Bot, User, Plus, ChevronDown, PanelRightClose, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAnimatedText } from '@/components/ui/animated-text';
import { PromptSuggestion } from '@/components/ui/prompt-suggestion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

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

interface ApiMessage {
    id: number;
    role: 'user' | 'assistant';
    content: string;
}

const formatBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
    });
};

const formatMessage = (content: string) => {
    const lines = content.split('\n');
    const formattedElements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('* ')) {
            const listContent = trimmedLine.substring(2);
            listItems.push(<li key={`li-${index}`} className="mb-1">{formatBold(listContent)}</li>);
        } else {
            if (listItems.length > 0) {
                 formattedElements.push(<ul key={`ul-${index}`} className="list-disc pl-5 mb-2 space-y-1">{listItems}</ul>);
                 listItems = [];
            }
            if (line !== '') {
                 formattedElements.push(<p key={`p-${index}`} className="mb-1 last:mb-0 min-h-[1.2em]">{formatBold(line)}</p>);
            }
        }
    });
    
    if (listItems.length > 0) {
         formattedElements.push(<ul key={`ul-end-${lines.length}`} className="list-disc pl-5 mb-2 space-y-1">{listItems}</ul>);
    }
    
    return <div className="leading-relaxed">{formattedElements}</div>;
};

const AnimatedMessage = ({ text }: { text: string }) => {
    const animatedText = useAnimatedText(text, " ");
    return formatMessage(animatedText);
}

export function DentalChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hello! I'm your dental assistant. How can I help you today?",
            isAnimated: false
        }
    ]);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    
    // Resize Logic
    const DEFAULT_WIDTH = 600;
    const [width, setWidth] = useState(DEFAULT_WIDTH);
    const [isResizing, setIsResizing] = useState(false);

    const minWidth = DEFAULT_WIDTH;
    const maxWidth = 1000;

    const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback(
        (mouseMoveEvent: MouseEvent) => {
            if (isResizing) {
                const newWidth = window.innerWidth - mouseMoveEvent.clientX;
                if (newWidth >= minWidth && newWidth <= maxWidth) {
                    setWidth(newWidth);
                }
            }
        },
        [isResizing, maxWidth, minWidth]
    );

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    const { auth } = usePage<SharedData>().props;
    const userRole = auth.user?.role_id;

    const suggestions = useMemo(() => {
        if (userRole === 1) {
            // Admin suggestions
            return [
                "List all employed dentists",
                "Find dentist by specialization...",
                "What time does the clinic open?",
                "How much is a cleaning?",
            ];
        } else if (userRole === 2) {
            // Dentist suggestions
            return [
                "Show my schedule for today",
                "List my patients this week",
                "Find next appointment for...",
                "Show all my patients",
            ];
        }
        // Default/guest suggestions
        return [
            "What time does the clinic open?",
            "How much is a cleaning?",
            "What treatments do you offer?",
        ];
    }, [userRole]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, isOpen]);

    // Fetch conversations when chat opens, but delay slightly to allow animation to finish
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                fetchConversations();
            }, 300); // Wait for sheet animation to complete
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const fetchConversations = async () => {
        try {
            const response = await axios.get('/api/chat/conversations');
            if (response.data.success) {
                setConversations(response.data.conversations);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        }
    };

    const loadConversation = async (conversationId: number) => {
        // Prevent loading the same conversation again
        if (currentConversationId === conversationId || isHistoryLoading) return;

        setIsHistoryLoading(true);
        // Clear messages temporarily or show loading skeleton? 
        // Showing skeleton or keeping old messages is better than empty.
        // Let's keep old messages but maybe dim them or show spinner overlay.
        
        try {
            const response = await axios.get(`/api/chat/conversations/${conversationId}/messages`);
            if (response.data.success) {
                const loadedMessages: Message[] = response.data.messages.map((msg: ApiMessage) => ({
                    id: msg.id.toString(),
                    role: msg.role,
                    content: msg.content,
                    isAnimated: false
                }));
                setMessages(loadedMessages);
                setCurrentConversationId(conversationId);
            }
        } catch (error) {
            console.error('Failed to load conversation:', error);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
        };

        setMessages(prev => [...prev, userMessage]);
        setQuery('');
        setIsLoading(true);

        try {
            const response = await axios.post('/api/chat', { 
                message: text,
                conversation_id: currentConversationId 
            });
            
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.data.response,
                isAnimated: true
            };

            setMessages(prev => [...prev, aiMessage]);
            
            // Update conversation ID if this was a new conversation
            if (response.data.conversation_id && !currentConversationId) {
                setCurrentConversationId(response.data.conversation_id);
                fetchConversations(); // Refresh conversation list
            }
        } catch {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm sorry, I encountered an error. Please try again.",
                isAnimated: false
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage(query);
    };

    const handleNewChat = () => {
        setCurrentConversationId(null);
        setMessages([{
            id: Date.now().toString(),
            role: 'assistant',
            content: "Started a new chat! How can I help you?",
            isAnimated: true
        }]);
    };

    const handleDeleteConversation = async (conversationId: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent loading the conversation
        
        // Find the conversation to show in confirmation dialog
        const conv = conversations.find(c => c.id === conversationId);
        if (conv) {
            setConversationToDelete(conv);
            setDeleteConfirmOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (!conversationToDelete) return;
        
        try {
            await axios.delete(`/api/chat/conversations/${conversationToDelete.id}`);
            
            // If we deleted the current conversation, start a new one
            if (currentConversationId === conversationToDelete.id) {
                handleNewChat();
            }
            
            // Refresh conversation list
            fetchConversations();
        } catch (error) {
            console.error('Failed to delete conversation:', error);
        } finally {
            setDeleteConfirmOpen(false);
            setConversationToDelete(null);
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            // When closing, disable animations for all existing messages
            setTimeout(() => {
                setMessages(prev => prev.map(msg => ({ ...msg, isAnimated: false })));
            }, 300);
        }
    };

    return (
        <>
        <Sheet open={isOpen} onOpenChange={handleOpenChange} modal={false}>
            <SheetTrigger asChild>
                {!isOpen && (
                    <Button
                        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
                        size="icon"
                    >
                        <MessageCircle className="h-6 w-6" />
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent
                side="right"
                className={`p-0 gap-0 [&>button]:hidden ${isResizing ? 'transition-none' : 'transition-all duration-300 ease-in-out'}`}
                style={{ width: `${width}px`, maxWidth: `${maxWidth}px` }}
            >
                {/* Resize Handle */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors z-50"
                    onMouseDown={startResizing}
                />

                <div className="flex flex-col h-full">
                    {/* Header */}
                    <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
                        <SheetTitle className="sr-only">AI Chat Assistant</SheetTitle>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src="/bot-avatar.png" />
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            <Bot className="h-5 w-5" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">AI Assistant</h3>
                                    <p className="text-xs text-muted-foreground">Always here to help</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Chat History Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <ChevronDown className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64">
                                        <DropdownMenuLabel>Chat History</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {conversations.length === 0 ? (
                                            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                                No chat history yet
                                            </div>
                                        ) : (
                                            conversations.map((conv) => (
                                                <DropdownMenuItem
                                                    key={conv.id}
                                                    onClick={() => loadConversation(conv.id)}
                                                    className="group flex items-start justify-between gap-2 cursor-pointer"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate text-sm">
                                                            {conv.title}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {conv.updated_at}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive"
                                                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuItem>
                                            ))
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* New Chat Button */}
                                <Button variant="ghost" size="icon" onClick={handleNewChat}>
                                    <Plus className="h-5 w-5" />
                                </Button>

                                {/* Close Button */}
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                    <PanelRightClose className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </SheetHeader>

                    {/* Messages */}
                    <div className="flex-1 overflow-hidden relative">
                        <ScrollArea ref={scrollAreaRef} className="h-full px-6 py-4">
                            <div className="space-y-4 pb-4">
                                {isHistoryLoading ? (
                                    <div className="flex flex-col items-center justify-center h-full py-10 space-y-4">
                                         <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                         <p className="text-sm text-muted-foreground">Loading history...</p>
                                    </div>
                                ) : (
                                    messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {message.role === 'assistant' && (
                                            <Avatar className="h-8 w-8 flex-shrink-0">
                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                    <Bot className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div
                                            className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                                                message.role === 'user'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                            }`}
                                        >
                                            {message.isAnimated ? (
                                                <AnimatedMessage text={message.content} />
                                            ) : (
                                                <p className="text-sm whitespace-pre-wrap break-words">{formatMessage(message.content)}</p>
                                            )}
                                        </div>
                                        {message.role === 'user' && (
                                            <Avatar className="h-8 w-8 flex-shrink-0">
                                                <AvatarFallback>
                                                    <User className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                    ))
                                )}
                                {isLoading && (
                                    <div className="flex gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                <Bot className="h-4 w-4" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="bg-muted rounded-2xl px-4 py-3">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="px-4 pt-4 pb-8 bg-transparent space-y-4 relative z-10">
                         {messages.length === 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent mask-linear-fade">
                                {suggestions.map((suggestion, i) => (
                                    <PromptSuggestion
                                        key={i}
                                        onClick={() => handleSendMessage(suggestion)}
                                    >
                                        {suggestion}
                                    </PromptSuggestion>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleFormSubmit} className="flex gap-2">
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ask me anything..."
                                className="flex-1"
                                disabled={isLoading}
                            />
                            <Button type="submit" size="icon" disabled={isLoading || !query.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </SheetContent>
        </Sheet>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Conversation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{conversationToDelete?.title}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
