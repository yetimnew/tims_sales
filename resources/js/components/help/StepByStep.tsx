import * as React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepByStepProps {
    number: number;
    title?: string;
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'info';
    className?: string;
}

export const StepByStep = React.memo(function StepByStep({
    number,
    title,
    children,
    variant = 'default',
    className,
}: StepByStepProps) {
    const variants = {
        default: {
            badge: 'bg-primary text-primary-foreground',
            border: 'border-l-primary',
            icon: null,
        },
        success: {
            badge: 'bg-green-500 text-white',
            border: 'border-l-green-500',
            icon: CheckCircle2,
        },
        warning: {
            badge: 'bg-amber-500 text-white',
            border: 'border-l-amber-500',
            icon: AlertCircle,
        },
        info: {
            badge: 'bg-blue-500 text-white',
            border: 'border-l-blue-500',
            icon: Info,
        },
    };

    const style = variants[variant];
    const Icon = style.icon;

    return (
        <div className={cn('relative mb-8 last:mb-0', className)}>
            {/* Connector Line - only show if not the last step */}
            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border hidden sm:block" />

            <div className={cn('relative flex gap-4 border-l-4 pl-4 sm:pl-6', style.border)}>
                {/* Step Number Badge */}
                <div className="flex-shrink-0">
                    <div
                        className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg shadow-sm',
                            style.badge
                        )}
                    >
                        {Icon ? <Icon className="h-6 w-6" /> : number}
                    </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 pb-2">
                    {title && (
                        <h3 className="text-lg font-semibold mb-3 mt-2">{title}</h3>
                    )}
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
});

