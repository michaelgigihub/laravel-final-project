import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { MessageCircle, Send, Bot, User, Plus, ChevronDown, PanelRightClose, Trash2, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAnimatedText } from '@/components/ui/animated-text';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useChatContext } from '@/contexts/chat-context';

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

// Category to suggested questions mapping
const categoryQuestions: Record<string, string[]> = {
    // Admin categories
    'Dashboard & Analytics': [
        "How much is our income this month?",
        "What are the appointment statistics this week?",
        "What are the most popular treatments?",
        "When is the clinic busiest this week?",
        "What's the age breakdown of our patients?",
    ],
    'Dentist Management': [
        "Who is the busiest dentist this month?",
        "Compare workload between dentists",
        "List all employed dentists",
        "When is Dr. [Name] available this week?",
        "Find dentists who specialize in Orthodontics",
    ],
    'Patient & Treatment Records': [
        "Get details for patient [Name]",
        "Search for female patients over 40",
        "What treatments has [Patient Name] received?",
        "What treatments have been done on tooth [#14]?",
        "Which patients have birthdays this month?",
        "Show treatment notes for [Patient Name]",
    ],
    'Appointments & Logs': [
        "What appointments are scheduled for today?",
        "Who created the last appointment?",
        "Why are appointments being cancelled?",
        "Search audit logs for 'deleted'",
        "Show activity logs from this week",
    ],
    // Dentist categories
    'My Schedule': [
        "What's my schedule for today?",
        "Show my appointments this week",
        "When is my next available slot?",
    ],
    'My Patients': [
        "List all my patients",
        "Search my patients named [Name]",
        "Who are my patients scheduled this week?",
        "Which of my patients have birthdays this month?",
    ],
    'Patient Records': [
        "Get details for patient [Name]",
        "What's the treatment history for [Patient Name]?",
        "What treatments have been done on tooth [#14]?",
        "Show my treatment notes for [Patient Name]",
    ],
    'General': [
        "What are the clinic hours?",
        "How much does a tooth extraction cost?",
        "List all treatment types",
    ],
    // Guest categories
    'Treatments': [
        "What services do you offer?",
        "How much does teeth cleaning cost?",
        "How long does a root canal take?",
    ],
    'Dentists': [
        "Who are your dentists?",
        "What specializations do you have?",
        "Do you have an orthodontist?",
    ],
};

// Check if a question has placeholder brackets like [Name]
const hasPlaceholder = (text: string): boolean => {
    return /\[.*?\]/.test(text);
};

// Interactive category component
const InteractiveCategory = ({ 
    category, 
    onQuestionClick,
    onQuestionFill,
}: { 
    category: string; 
    onQuestionClick: (question: string) => void;
    onQuestionFill: (question: string) => void;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const questions = categoryQuestions[category];
    
    if (!questions) {
        return <strong className="font-bold text-foreground">{category}</strong>;
    }

    const handleQuestionClick = (question: string) => {
        if (hasPlaceholder(question)) {
            // Has placeholder - just fill input for user to edit
            onQuestionFill(question);
        } else {
            // No placeholder - auto-send
            onQuestionClick(question);
        }
    };
    
    return (
        <span className="inline">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="font-bold text-foreground underline decoration-dotted underline-offset-2 hover:text-primary hover:decoration-solid transition-colors cursor-pointer inline-flex items-center gap-0.5"
            >
                {category}
                <ChevronRight className={`size-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
            {isExpanded && (
                <span className="block mt-2 ml-2 space-y-1">
                    {questions.map((q, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleQuestionClick(q)}
                            className="block text-sm text-muted-foreground hover:text-primary hover:underline cursor-pointer transition-colors text-left"
                        >
                            → {q}
                            {hasPlaceholder(q) && <span className="text-xs text-muted-foreground/60 ml-1">(edit)</span>}
                        </button>
                    ))}
                </span>
            )}
        </span>
    );
};

// Check if text matches a known category
const isKnownCategory = (text: string): boolean => {
    return Object.keys(categoryQuestions).includes(text);
};

const formatBold = (text: string, onQuestionClick?: (question: string) => void, onQuestionFill?: (question: string) => void) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            // Remove trailing colon for category matching
            const categoryName = boldText.replace(/:$/, '');
            
            if (onQuestionClick && onQuestionFill && isKnownCategory(categoryName)) {
                return (
                    <span key={index}>
                        <InteractiveCategory category={categoryName} onQuestionClick={onQuestionClick} onQuestionFill={onQuestionFill} />
                        {boldText.endsWith(':') ? ':' : ''}
                    </span>
                );
            }
            return <strong key={index} className="font-bold text-foreground">{boldText}</strong>;
        }
        return <span key={index}>{part}</span>;
    });
};

/**
 * Parse markdown table into structured data
 */
const parseMarkdownTable = (lines: string[], startIndex: number): { table: { headers: string[]; rows: string[][] }; endIndex: number } | null => {
    // Check if this looks like a table header row (contains |)
    const headerLine = lines[startIndex];
    if (!headerLine.includes('|')) return null;
    
    // Next line should be separator (|---|---|)
    const separatorLine = lines[startIndex + 1];
    if (!separatorLine || !separatorLine.match(/^\|?[\s-:|]+\|?$/)) return null;
    
    // Parse header
    const headers = headerLine
        .split('|')
        .map(h => h.trim())
        .filter(h => h.length > 0);
    
    // Parse rows
    const rows: string[][] = [];
    let currentIndex = startIndex + 2;
    
    while (currentIndex < lines.length) {
        const line = lines[currentIndex];
        if (!line.includes('|') || line.trim() === '') break;
        
        const cells = line
            .split('|')
            .map(c => c.trim())
            .filter(c => c.length > 0 || line.startsWith('|'));
        
        // Only add if row has content
        if (cells.some(c => c.length > 0)) {
            rows.push(cells.filter(c => c.length > 0));
        }
        currentIndex++;
    }
    
    if (rows.length === 0) return null;
    
    return { table: { headers, rows }, endIndex: currentIndex - 1 };
};

const formatMessage = (content: string, maxTableWidth?: number, onQuestionClick?: (question: string) => void, onQuestionFill?: (question: string) => void) => {
    const lines = content.split('\n');
    const formattedElements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Try to parse as table
        const tableResult = parseMarkdownTable(lines, i);
        if (tableResult) {
            // Flush any pending list items
            if (listItems.length > 0) {
                formattedElements.push(<ul key={`ul-${i}`} className="list-disc pl-5 mb-2 space-y-1">{listItems}</ul>);
                listItems = [];
            }
            
            // Render table with dynamic max-width based on chat width
            const { table, endIndex } = tableResult;
            const tableStyle = maxTableWidth ? { maxWidth: `${maxTableWidth}px` } : {};
            formattedElements.push(
                <div key={`table-${i}`} className="my-3 overflow-x-auto" style={tableStyle}>
                    <table className="text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-foreground/20">
                                {table.headers.map((header, hIdx) => (
                                    <th key={hIdx} className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                                        {formatBold(header)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-foreground/10">
                            {table.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-foreground/5 transition-colors">
                                    {row.map((cell, cIdx) => (
                                        <td key={cIdx} className="px-3 py-2 whitespace-nowrap">
                                            {formatBold(cell)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            i = endIndex + 1;
            continue;
        }
        
        // Handle list items
        if (trimmedLine.startsWith('* ')) {
            const listContent = trimmedLine.substring(2);
            listItems.push(<li key={`li-${i}`} className="mb-1">{formatBold(listContent, onQuestionClick, onQuestionFill)}</li>);
        } else {
            if (listItems.length > 0) {
                formattedElements.push(<ul key={`ul-${i}`} className="list-disc pl-5 mb-2 space-y-1">{listItems}</ul>);
                listItems = [];
            }
            if (line !== '') {
                formattedElements.push(<p key={`p-${i}`} className="mb-1 last:mb-0 min-h-[1.2em]">{formatBold(line, onQuestionClick, onQuestionFill)}</p>);
            }
        }
        i++;
    }
    
    if (listItems.length > 0) {
        formattedElements.push(<ul key={`ul-end-${lines.length}`} className="list-disc pl-5 mb-2 space-y-1">{listItems}</ul>);
    }
    
    return <div className="leading-relaxed">{formattedElements}</div>;
};

const AnimatedMessage = ({ 
    text, 
    maxTableWidth, 
    onQuestionClick, 
    onQuestionFill,
    onAnimationComplete 
}: { 
    text: string; 
    maxTableWidth?: number; 
    onQuestionClick?: (question: string) => void; 
    onQuestionFill?: (question: string) => void;
    onAnimationComplete?: () => void;
}) => {
    const animatedText = useAnimatedText(text, " ");
    
    useEffect(() => {
        if (animatedText === text && onAnimationComplete) {
            onAnimationComplete();
        }
    }, [animatedText, text, onAnimationComplete]);

    return formatMessage(animatedText, maxTableWidth, onQuestionClick, onQuestionFill);
}

const ThinkingAnimation = () => {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col gap-1 items-start">
            <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2 w-fit">
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
            <span className="text-xs text-foreground/50 ml-2">Toother is thinking ({seconds}s)</span>
        </div>
    );
};

export function DentalChatBot() {
    // Get persistent state from context
    const {
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
        user,
    } = useChatContext();

    const userRole = user?.role_id;

    // Local-only state (doesn't need to persist)
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    
    // Resize Logic
    const DEFAULT_WIDTH = 700;
    const [isResizing, setIsResizing] = useState(false);
    
    const minWidth = DEFAULT_WIDTH;
    const maxWidth = 1200;

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

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    const suggestions = useMemo(() => {
        if (userRole === 1) {
            // Admin suggestions
            return [
                "What can you do?",
                "List all employed dentists",
                "Find dentist by specialization...",
                "What time does the clinic open?",
            ];
        } else if (userRole === 2) {
            // Dentist suggestions
            return [
                "What can you do?",
                "Show my schedule for today",
                "List my patients this week",
                "Show all my patients",
            ];
        }
        // Default/guest suggestions
        return [
            "What services do you offer?",
            "Who are your dentists?",
            "What specializations do you have?",
            "What time does the clinic open?",
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
    // Skip for guests (no user)
    useEffect(() => {
        if (isOpen && user) {
            const timer = setTimeout(() => {
                fetchConversations();
            }, 300); // Wait for sheet animation to complete
            return () => clearTimeout(timer);
        }
    }, [isOpen, user]);

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

    const handleAnimationComplete = (messageId: string) => {
        setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, isAnimated: false } : msg
        ));
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        // Cancel any pending request before starting a new one
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        const tempId = Date.now().toString();
        const userMessage: Message = {
            id: tempId,
            role: 'user',
            content: text,
        };

        setMessages(prev => [...prev, userMessage]);
        setQuery('');
        setIsLoading(true);

        try {
            // Use guest endpoint for unauthenticated users
            const endpoint = user ? '/api/chat' : '/api/chat/guest';
            const payload = user 
                ? { message: text, conversation_id: currentConversationId }
                : { message: text };

            const response = await axios.post(endpoint, payload, {
                signal: abortControllerRef.current.signal,
                timeout: 30000, // 30 second timeout
            });
            
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.data.response,
                isAnimated: true
            };

            setMessages(prev => [...prev, aiMessage]);
            
            // Update conversation ID if this was a new conversation (authenticated users only)
            if (user && response.data.conversation_id && !currentConversationId) {
                setCurrentConversationId(response.data.conversation_id);
                fetchConversations(); // Refresh conversation list
            }
        } catch (error) {
            // Silently ignore cancelled requests
            if (axios.isCancel(error)) return;
            
            // Rollback: remove the user message on failure
            setMessages(prev => prev.filter(m => m.id !== tempId));
            
            // Check for rate limit error (HTTP 429)
            let errorContent = "I'm sorry, I encountered an error. Please try again.";
            if (axios.isAxiosError(error) && error.response?.status === 429) {
                errorContent = "Too many requests. Please wait a moment and try again.";
            }
            
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: errorContent,
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

    const handleCancelRequest = async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
            
            // Remove the pending user message from UI (last message if it's from user)
            setMessages(prev => {
                if (prev.length > 0 && prev[prev.length - 1].role === 'user') {
                    return prev.slice(0, -1);
                }
                return prev;
            });
            
            // Delete the last user message from DB if we have an active conversation
            if (currentConversationId) {
                try {
                    await axios.delete(`/api/chat/conversations/${currentConversationId}/cancel`);
                } catch (error) {
                    console.error('Failed to delete cancelled message:', error);
                }
            }
        }
    };

    const handleNewChat = () => {
        // Cancel any pending requests when starting new chat
        abortControllerRef.current?.abort();
        clearChat();
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
                        className="fixed bottom-25 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
                        size="icon"
                    >
                        <MessageCircle className="h-6 w-6" />
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent
                side="right"
                className={`p-0 gap-0 [&>button]:hidden rounded-l-3xl overflow-hidden ${(isResizing) ? 'transition-none' : 'transition-all duration-300 ease-in-out'}`}
                style={{ width: `${width}px`, maxWidth: `${maxWidth}px` }}
                onInteractOutside={(e) => e.preventDefault()}
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
                                    <h3 className="font-semibold text-lg">Toother AI</h3>
                                    <p className="text-xs text-muted-foreground">Always here to help</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Chat History Dropdown - only for authenticated users */}
                                {user && (
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
                                                        className={`group flex items-start justify-between gap-2 cursor-pointer ${
                                                            currentConversationId === conv.id 
                                                                ? 'bg-primary/10 border-l-2 border-primary' 
                                                                : ''
                                                        }`}
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`font-medium truncate text-sm ${
                                                                currentConversationId === conv.id ? 'text-primary' : ''
                                                            }`}>
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
                                )}

                                {/* New Chat Button - only for authenticated users */}
                                {user && (
                                    <Button variant="ghost" size="icon" onClick={handleNewChat}>
                                        <Plus className="h-5 w-5" />
                                    </Button>
                                )}

                                {/* Close Button */}
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                    <PanelRightClose className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </SheetHeader>

                    {/* Messages or Welcome Screen */}
                    <div className="flex-1 overflow-hidden relative w-full">
                        <ScrollArea ref={scrollAreaRef} className="h-full w-full px-6 py-4">
                            {isHistoryLoading ? (
                                <div className="flex flex-col items-center justify-center h-full py-10 space-y-4">
                                     <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                     <p className="text-sm text-muted-foreground">Loading history...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                /* Welcome Screen */
                                <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                                        <Bot className="h-7 w-7 text-primary" />
                                    </div>
                                    <h2 className="text-xl font-semibold mb-1">
                                        Hi {user?.name?.split(' ')[0] || 'there'},
                                    </h2>
                                    <p className="text-2xl font-bold mb-3">Welcome back! How can I help?</p>
                                    <p className="text-sm text-muted-foreground mb-8 max-w-sm">
                                        I'm here to help you with appointments, treatments, and clinic info. Choose an action or just ask me anything!
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-2 max-w-md">
                                        {suggestions.map((suggestion, i) => (
                                            <Button
                                                key={i}
                                                variant="outline"
                                                size="sm"
                                                className="rounded-full text-xs px-4 py-2 h-auto border-muted-foreground/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                                                onClick={() => handleSendMessage(suggestion)}
                                            >
                                                {suggestion}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* Chat Messages */
                                <div className="space-y-4 pb-4 w-full overflow-hidden">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex gap-3 w-full overflow-hidden ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {message.role === 'assistant' && (
                                                <Avatar className="h-8 w-8 flex-shrink-0">
                                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                                        <Bot className="h-4 w-4" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div
                                                className={`rounded-2xl px-4 py-2 max-w-[80%] overflow-x-auto ${
                                                    message.role === 'user'
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted'
                                                }`}
                                            >
                                                {message.isAnimated ? (
                                                    <AnimatedMessage 
                                                        text={message.content} 
                                                        maxTableWidth={Math.floor(width * 0.8 - 80)} 
                                                        onQuestionClick={handleSendMessage} 
                                                        onQuestionFill={setQuery} 
                                                        onAnimationComplete={() => handleAnimationComplete(message.id)} 
                                                    />
                                                ) : (
                                                    <div className="text-sm whitespace-pre-wrap break-words">{formatMessage(message.content, Math.floor(width * 0.8 - 80), handleSendMessage, setQuery)}</div>
                                                )}
                                            </div>
                                            {message.role === 'user' && (
                                                <Avatar className="h-8 w-8 flex-shrink-0">
                                                    <AvatarImage src={user?.avatar_url || user?.avatar} alt={user?.name} />
                                                    <AvatarFallback>
                                                        <User className="h-4 w-4" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                    <Bot className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <ThinkingAnimation />
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    <div className="px-4 pt-4 pb-8 bg-transparent space-y-4 relative z-10">
                        {/* Suggested prompts for guests (shown above input when there are messages) */}
                        {!user && messages.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map((suggestion, i) => (
                                    <Button
                                        key={i}
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full text-xs px-4 py-2 h-auto border-muted-foreground/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                                        onClick={() => handleSendMessage(suggestion)}
                                        disabled={isLoading}
                                    >
                                        {suggestion}
                                    </Button>
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
                            {isLoading ? (
                                <Button 
                                    type="button" 
                                    size="icon" 
                                    variant="destructive"
                                    onClick={handleCancelRequest}
                                    title="Cancel request"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button type="submit" size="icon" disabled={!query.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            )}
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
