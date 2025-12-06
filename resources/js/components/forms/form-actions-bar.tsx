import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface FormActionsBarProps {
    left?: ReactNode;
    right?: ReactNode;
    className?: string;
}

export function FormActionsBar({ left, right, className }: FormActionsBarProps) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40',
                className,
            )}
        >
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">{left}</div>
            <div className="flex items-center gap-3">{right}</div>
        </div>
    );
}
