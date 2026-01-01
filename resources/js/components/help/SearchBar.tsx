import * as React from 'react';
import { Search, X, Command } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
    placeholder?: string;
    onSearch: (query: string) => void;
    defaultValue?: string;
    autoFocus?: boolean;
    className?: string;
}

export const SearchBar = React.memo(function SearchBar({
    placeholder = 'Search documentation...',
    onSearch,
    defaultValue = '',
    autoFocus = false,
    className,
}: SearchBarProps) {
    const [value, setValue] = React.useState(defaultValue);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Debounced search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(value);
        }, 300);

        return () => clearTimeout(timer);
    }, [value, onSearch]);

    // Keyboard shortcut (Cmd/Ctrl + K)
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleClear = () => {
        setValue('');
        inputRef.current?.focus();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(value);
    };

    return (
        <form onSubmit={handleSubmit} className={cn('relative', className)}>
            <div className="relative">
                {/* Search Icon */}
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

                {/* Input Field */}
                <Input
                    ref={inputRef}
                    type="search"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    autoFocus={autoFocus}
                    className="pl-10 pr-24 h-11"
                />

                {/* Clear Button */}
                {value && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="absolute right-14 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear search</span>
                    </Button>
                )}

                {/* Keyboard Shortcut Hint */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-muted-foreground pointer-events-none">
                    <kbd className="flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                        <Command className="h-3 w-3" />K
                    </kbd>
                </div>
            </div>
        </form>
    );
});

