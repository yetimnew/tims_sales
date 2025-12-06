import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DetailHeaderProps {
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    leading?: ReactNode;
    actions?: ReactNode;
    className?: string;
    iconWrapperClassName?: string;
}

export function DetailHeader({
    title,
    subtitle,
    icon,
    leading,
    actions,
    className,
    iconWrapperClassName,
}: DetailHeaderProps) {
    return (
        <div
            className={cn(
                'rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 p-6 dark:border-slate-700 dark:from-slate-900 dark:to-indigo-950/30',
                className,
            )}
        >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                    <div className="flex items-center gap-4">
                        {leading ? <div className="flex items-center gap-2">{leading}</div> : null}
                        <div className="flex items-center gap-4">
                            {icon ? (
                                <div
                                    className={cn(
                                        'rounded-xl bg-indigo-100 p-3 dark:bg-indigo-900/30',
                                        iconWrapperClassName,
                                    )}
                                >
                                    {icon}
                                </div>
                            ) : null}
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
                                {subtitle ? (
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
                {actions ? <div className="flex flex-wrap justify-end gap-2">{actions}</div> : null}
            </div>
        </div>
    );
}
