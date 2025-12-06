import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ListingLoadingPlaceholderProps {
    showStats?: boolean;
    statsCount?: number;
    filterItemCount?: number;
    rowCount?: number;
    className?: string;
}

export function ListingLoadingPlaceholder({
    showStats = true,
    statsCount = 4,
    filterItemCount = 3,
    rowCount = 8,
    className,
}: ListingLoadingPlaceholderProps) {
    return (
        <div className={cn('flex flex-col gap-4', className)}>
            {showStats && (
                <div className="hidden gap-2 md:grid md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: statsCount }).map((_, index) => (
                        <Skeleton key={index} className="h-24 w-full" />
                    ))}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
                {Array.from({ length: filterItemCount }).map((_, index) => (
                    <Skeleton key={index} className="h-10 w-48" />
                ))}
            </div>

            <div className="overflow-hidden rounded-lg border">
                {Array.from({ length: rowCount }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-4 w-24 flex-1" />
                        <Skeleton className="hidden h-4 w-16 md:inline-block" />
                        <Skeleton className="hidden h-4 w-32 lg:inline-block" />
                        <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}
