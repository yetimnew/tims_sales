import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ReportPageShellProps {
    children: ReactNode;
    className?: string;
    contentClassName?: string;
}

export function ReportPageShell({ children, className, contentClassName }: ReportPageShellProps) {
    return (
        <div
            className={cn(
                'flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40',
                className,
            )}
        >
            <div
                className={cn(
                    'flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10',
                    contentClassName,
                )}
            >
                {children}
            </div>
        </div>
    );
}
