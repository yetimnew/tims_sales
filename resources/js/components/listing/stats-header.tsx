import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

export interface ListingStatDefinition {
    id: string;
    label: string;
    value: ReactNode;
    description?: ReactNode;
    icon?: ReactNode;
    valueClassName?: string;
    className?: string;
}

interface ListingStatsHeaderProps {
    stats?: ListingStatDefinition[] | null;
    className?: string;
    renderFallback?: () => ReactNode;
    orientation?: 'grid' | 'row';
}

export function ListingStatsHeader({ stats, className, renderFallback, orientation = 'grid' }: ListingStatsHeaderProps) {
    if (!stats || stats.length === 0) {
        return renderFallback ? <>{renderFallback()}</> : null;
    }

    const containerClassName =
        orientation === 'row'
            ? 'grid grid-cols-1 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]'
            : 'hidden gap-2 md:grid md:grid-cols-2 xl:grid-cols-4';

    return (
        <div className={cn(containerClassName, className)}>
            {stats.map((stat) => (
                <Card
                    key={stat.id}
                    className={cn('gap-2 border border-slate-200 py-2 shadow-sm sm:py-3', stat.className)}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-1.5 sm:p-2">
                        <CardTitle className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {stat.label}
                        </CardTitle>
                        {stat.icon}
                    </CardHeader>
                    <CardContent className="px-2 pb-2 pt-0 sm:px-3 sm:pb-2">
                        <div className={cn('text-sm font-semibold sm:text-base', stat.valueClassName)}>
                            {stat.value}
                        </div>
                        {stat.description && (
                            <p className="text-[11px] text-muted-foreground">{stat.description}</p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
