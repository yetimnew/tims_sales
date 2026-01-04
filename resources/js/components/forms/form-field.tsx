import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { type ReactNode } from 'react';

interface FormFieldProps {
    id?: string;
    label: string;
    children: ReactNode;
    required?: boolean;
    tooltip?: ReactNode;
    helperText?: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    className?: string;
    labelClassName?: string;
    contentClassName?: string;
}

export function FormField({
    id,
    label,
    children,
    required,
    tooltip,
    helperText,
    hint,
    error,
    className,
    labelClassName,
    contentClassName,
}: FormFieldProps) {
    const renderTooltip = () => {
        if (!tooltip) {
            return null;
        }

        if (typeof tooltip === 'string') {
            return (
                <div className="group relative">
                    <HelpCircle className="h-4 w-4 cursor-help text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" />
                    <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        {tooltip}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                    </div>
                </div>
            );
        }

        return tooltip;
    };

    return (
        <div className={cn('space-y-2', className)}>
            <div className={cn('flex items-center gap-2', labelClassName)}>
                <Label htmlFor={id} className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {label}
                    {required && <span className="ml-1 text-red-500">*</span>}
                </Label>
                {renderTooltip()}
            </div>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            <div className={cn('space-y-2', contentClassName)}>{children}</div>
            {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
            {error && (
                <p className="flex items-center gap-1 text-sm text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                </p>
            )}
        </div>
    );
}
