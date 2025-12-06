import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DetailSummaryItem {
    key?: string | number;
    label: ReactNode;
    value: ReactNode;
    helper?: ReactNode;
    className?: string;
    labelClassName?: string;
    valueClassName?: string;
    helperClassName?: string;
}

interface DetailSummaryGridProps {
    items: DetailSummaryItem[];
    className?: string;
    itemBaseClassName?: string;
    labelClassName?: string;
    valueClassName?: string;
    helperClassName?: string;
}

export function DetailSummaryGrid({
    items,
    className,
    itemBaseClassName,
    labelClassName,
    valueClassName,
    helperClassName,
}: DetailSummaryGridProps) {
    return (
        <div className={cn('grid gap-4 md:grid-cols-2 xl:grid-cols-4', className)}>
            {items.map((item, index) => {
                const key = item.key ?? (typeof item.label === 'string' ? item.label : index);

                return (
                    <div
                        key={key}
                        className={cn(
                            'rounded-xl border-0 bg-gradient-to-br from-white to-indigo-50 p-5 text-left shadow-lg dark:from-slate-900 dark:to-indigo-950/20',
                            itemBaseClassName,
                            item.className,
                        )}
                    >
                        <p
                            className={cn(
                                'text-xs uppercase tracking-wide text-muted-foreground',
                                labelClassName,
                                item.labelClassName,
                            )}
                        >
                            {item.label}
                        </p>
                        <div
                            className={cn(
                                'mt-2 text-2xl font-bold text-foreground',
                                valueClassName,
                                item.valueClassName,
                            )}
                        >
                            {item.value}
                        </div>
                        {item.helper ? (
                            <p
                                className={cn(
                                    'mt-1 text-xs text-muted-foreground',
                                    helperClassName,
                                    item.helperClassName,
                                )}
                            >
                                {item.helper}
                            </p>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}
