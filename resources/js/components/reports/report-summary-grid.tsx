import { type Key } from 'react';
import { cn } from '@/lib/utils';
import { ReportSummaryCard, type ReportSummaryCardProps } from './report-summary-card';

export interface ReportSummaryItem extends ReportSummaryCardProps {
    key?: Key;
}

interface ReportSummaryGridProps {
    items: ReportSummaryItem[];
    className?: string;
}

export function ReportSummaryGrid({ items, className }: ReportSummaryGridProps) {
    if (items.length === 0) {
        return null;
    }

    return (
        <section className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>
            {items.map((item, index) => (
                <ReportSummaryCard key={item.key ?? index} {...item} />
            ))}
        </section>
    );
}
