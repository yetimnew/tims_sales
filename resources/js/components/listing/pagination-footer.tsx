import { InertiaPagination } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface ListingPaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ListingPaginationFooterProps {
    from?: number | null;
    to?: number | null;
    total?: number;
    links: ListingPaginationLink[];
    className?: string;
    extra?: ReactNode;
}

export function ListingPaginationFooter({ from, to, total, links, className, extra }: ListingPaginationFooterProps) {
    if (!links || links.length === 0) {
        return null;
    }

    return (
        <div className={cn('flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between', className)}>
            <div className="text-sm text-muted-foreground">
                {typeof from === 'number' && typeof to === 'number' && typeof total === 'number'
                    ? `Showing ${from} to ${to} of ${total}`
                    : 'Showing results'}
            </div>
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                {extra}
                <InertiaPagination links={links} />
            </div>
        </div>
    );
}
