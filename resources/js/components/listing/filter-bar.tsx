import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Search as SearchIcon } from 'lucide-react';
import { type ReactNode } from 'react';

interface ListingFilterBarSearch {
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
    icon?: ReactNode;
}

interface ListingFilterBarPerPageOption {
    value: string;
    label: string;
}

interface ListingFilterBarPerPage {
    value: string;
    options: ListingFilterBarPerPageOption[];
    onChange: (value: string) => void;
    label?: string;
}

interface ListingFilterBarProps {
    search?: ListingFilterBarSearch;
    perPage?: ListingFilterBarPerPage;
    children?: ReactNode;
    className?: string;
    trailing?: ReactNode;
}

export function ListingFilterBar({ search, perPage, children, className, trailing }: ListingFilterBarProps) {
    if (!search && !perPage && !children && !trailing) {
        return null;
    }

    return (
        <div className={cn('flex flex-wrap items-center gap-2', className)}>
            {search && (
                <div className="relative w-[260px] max-w-full">
                    <span className="pointer-events-none absolute left-3 top-3 inline-flex text-muted-foreground">
                        {search.icon ?? <SearchIcon className="h-4 w-4" />}
                    </span>
                    <Input
                        placeholder={search.placeholder ?? 'Search'}
                        value={search.value}
                        onChange={(event) => search.onChange(event.target.value)}
                        className="pl-10"
                    />
                </div>
            )}

            {children}

            {perPage && perPage.options.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {perPage.label && <span className="hidden sm:inline">{perPage.label}</span>}
                    <Select value={perPage.value} onValueChange={perPage.onChange}>
                        <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="Per page" />
                        </SelectTrigger>
                        <SelectContent>
                            {perPage.options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {trailing}
        </div>
    );
}
