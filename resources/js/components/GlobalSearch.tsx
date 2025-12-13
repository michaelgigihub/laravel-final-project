import { router } from '@inertiajs/react';
import { Calendar, Search, Stethoscope, Users, X, FileText } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface SearchResult {
    id: number;
    type: 'patient' | 'dentist' | 'appointment' | 'page';
    title: string;
    subtitle: string;
    url: string;
}

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Keyboard shortcut to open (Ctrl+P or Cmd+P)
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if ((e.key === 'p' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Focus input when dialog opens
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 0);
        } else {
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
        }
    }, [open]);

    // Debounced search
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            setResults(data.results || []);
            setSelectedIndex(0);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
        searchTimeout.current = setTimeout(() => {
            performSearch(query);
        }, 300);

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [query, performSearch]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            router.visit(results[selectedIndex].url);
            setOpen(false);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'patient':
                return <Users className="size-4 text-blue-500" />;
            case 'dentist':
                return <Stethoscope className="size-4 text-green-500" />;
            case 'appointment':
                return <Calendar className="size-4 text-purple-500" />;
            case 'page':
                return <FileText className="size-4 text-orange-500" />;
            default:
                return <Search className="size-4" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'patient':
                return 'Patient';
            case 'dentist':
                return 'Dentist';
            case 'appointment':
                return 'Appointment';
            case 'page':
                return 'Page';
            default:
                return type;
        }
    };

    return (
        <>
            {/* Search trigger button */}
            <Button
                variant="outline"
                className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
                onClick={() => setOpen(true)}
            >
                <Search className="size-4 xl:mr-2" />
                <span className="hidden xl:inline-flex">Search...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
                    <span className="text-xs">⌘</span>P
                </kbd>
            </Button>

            {/* Search dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="overflow-hidden p-0 sm:max-w-[550px]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Search</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 size-4 shrink-0 opacity-50" />
                        <Input
                            ref={inputRef}
                            placeholder="Search patients, dentists, appointments..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex h-12 w-full border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
                        />
                        {query && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setQuery('')}
                            >
                                <X className="size-3" />
                            </Button>
                        )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-2">
                        {loading && (
                            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                                Searching...
                            </div>
                        )}
                        {!loading && query.length >= 2 && results.length === 0 && (
                            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                                No results found for "{query}"
                            </div>
                        )}
                        {!loading && query.length < 2 && (
                            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                                Type at least 2 characters to search
                            </div>
                        )}
                        {!loading && results.length > 0 && (
                            <div className="space-y-1">
                                {results.map((result, index) => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                                            index === selectedIndex
                                                ? 'bg-primary text-primary-foreground'
                                                : 'hover:bg-muted'
                                        }`}
                                        onClick={() => {
                                            router.visit(result.url);
                                            setOpen(false);
                                        }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        {getIcon(result.type)}
                                        <div className="flex-1 overflow-hidden">
                                            <div className="truncate font-medium">{result.title}</div>
                                            <div className={`truncate text-xs ${
                                                index === selectedIndex
                                                    ? 'text-primary-foreground/70'
                                                    : 'text-muted-foreground'
                                            }`}>
                                                {result.subtitle}
                                            </div>
                                        </div>
                                        <span className={`text-xs font-medium ${
                                            index === selectedIndex
                                                ? 'text-primary-foreground/70'
                                                : 'text-muted-foreground'
                                        }`}>
                                            {getTypeLabel(result.type)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between border-t bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                        <div className="flex gap-2">
                            <span><kbd className="rounded border bg-background px-1">↑↓</kbd> to navigate</span>
                            <span><kbd className="rounded border bg-background px-1">↵</kbd> to select</span>
                            <span><kbd className="rounded border bg-background px-1">esc</kbd> to close</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
