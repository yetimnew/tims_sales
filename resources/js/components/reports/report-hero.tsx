import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ReportHeroProps {
    eyebrow?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    className?: string;
    contentClassName?: string;
    actionsClassName?: string;
}

export function ReportHero({
    eyebrow,
    title,
    description,
    actions,
    className,
    contentClassName,
    actionsClassName,
}: ReportHeroProps) {
    return (
        <header
            className={cn(
                'rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70',
                className,
            )}
        >
            <div
                className={cn(
                    'flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between',
                    contentClassName,
                )}
            >
                <div className="space-y-2">
                    {eyebrow ? (
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                            {eyebrow}
                        </p>
                    ) : null}
                    <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">{title}</h1>
                    {description ? (
                        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">{description}</p>
                    ) : null}
                </div>
                {actions ? (
                    <div className={cn('flex flex-wrap items-center gap-2', actionsClassName)}>{actions}</div>
                ) : null}
            </div>
        </header>
    );
}
