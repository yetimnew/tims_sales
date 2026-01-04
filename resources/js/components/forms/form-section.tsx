import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface FormSectionProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    children?: ReactNode;
    className?: string;
    headingClassName?: string;
    contentClassName?: string;
    headingAside?: ReactNode;
    badge?: ReactNode;
}

export function FormSection({
    title,
    description,
    icon,
    children,
    className,
    headingClassName,
    contentClassName,
    headingAside,
    badge,
}: FormSectionProps) {
    return (
        <section
            className={cn(
                'space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40',
                className,
            )}
        >
            <div
                className={cn(
                    'flex flex-col gap-4 md:flex-row md:items-start md:justify-between',
                    headingClassName,
                )}
            >
                <div className="flex items-start gap-3">
                    {icon}
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
                            {badge}
                        </div>
                        {description && <p className="text-sm text-muted-foreground">{description}</p>}
                    </div>
                </div>
                {headingAside && <div className="w-full md:max-w-sm xl:max-w-md">{headingAside}</div>}
            </div>
            {children && <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2', contentClassName)}>{children}</div>}
        </section>
    );
}
