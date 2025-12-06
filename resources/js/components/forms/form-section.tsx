import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface FormSectionProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
    headingClassName?: string;
    contentClassName?: string;
}

export function FormSection({
    title,
    description,
    icon,
    children,
    className,
    headingClassName,
    contentClassName,
}: FormSectionProps) {
    return (
        <section
            className={cn(
                'space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40',
                className,
            )}
        >
            <div className={cn('flex items-center gap-3', headingClassName)}>
                {icon}
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
            </div>
            <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2', contentClassName)}>{children}</div>
        </section>
    );
}
