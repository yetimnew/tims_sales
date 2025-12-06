import { type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ReportSummaryCardProps {
    label: ReactNode;
    value: ReactNode;
    helper?: ReactNode;
    icon?: ReactNode;
    iconWrapperClassName?: string;
    valueClassName?: string;
    helperClassName?: string;
    className?: string;
    contentClassName?: string;
}

export function ReportSummaryCard({
    label,
    value,
    helper,
    icon,
    iconWrapperClassName,
    valueClassName,
    helperClassName,
    className,
    contentClassName,
}: ReportSummaryCardProps) {
    return (
        <Card
            className={cn(
                'border border-slate-200 bg-white/95 shadow-sm transition dark:border-slate-800/70 dark:bg-slate-900/70',
                className,
            )}
        >
            <CardContent className={cn('flex items-start gap-4 p-4', contentClassName)}>
                {icon ? (
                    <span
                        className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200',
                            iconWrapperClassName,
                        )}
                    >
                        {icon}
                    </span>
                ) : null}
                <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p
                        className={cn(
                            'text-lg font-semibold text-slate-900 dark:text-slate-50',
                            valueClassName,
                        )}
                    >
                        {value}
                    </p>
                    {helper ? (
                        <p className={cn('text-xs text-muted-foreground', helperClassName)}>{helper}</p>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
