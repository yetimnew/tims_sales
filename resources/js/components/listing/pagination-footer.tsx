import { InertiaPagination } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

export interface ListingPaginationLink {
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
        <div
            className={cn(
                'flex flex-col items-center justify-between gap-4 border-t border-slate-200/60 bg-gradient-to-b from-slate-50/50 to-white px-6 py-4 dark:border-slate-700/40 dark:from-slate-900/50 dark:to-slate-900 sm:flex-row',
                className,
            )}
        >
            {/* Results Info */}
            <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                    {typeof from === 'number' && typeof to === 'number' && typeof total === 'number' ? (
                        <>
                            Showing{' '}
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {from}–{to}
                            </span>{' '}
                            of{' '}
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {total.toLocaleString()}
                            </span>
                        </>
                    ) : (
                        'Showing results'
                    )}
                </span>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col-reverse items-center gap-4 sm:flex-row">
                {extra && <div className="flex items-center gap-2">{extra}</div>}
                <InertiaPagination links={links} />
            </div>
        </div>
    );
}
