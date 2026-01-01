import * as React from 'react';
import {
    Info,
    AlertTriangle,
    Lightbulb,
    FileText,
    XCircle,
    CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoBoxProps {
    type: 'info' | 'warning' | 'tip' | 'note' | 'danger' | 'success';
    title?: string;
    children: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
    className?: string;
}

export const InfoBox = React.memo(function InfoBox({
    type,
    title,
    children,
    icon,
    className,
}: InfoBoxProps) {
    const variants = {
        info: {
            container: 'bg-blue-50 dark:bg-blue-950/30 border-l-blue-500',
            icon: 'text-blue-600 dark:text-blue-400',
            title: 'text-blue-900 dark:text-blue-300',
            defaultIcon: Info,
            defaultTitle: 'Information',
        },
        warning: {
            container: 'bg-amber-50 dark:bg-amber-950/30 border-l-amber-500',
            icon: 'text-amber-600 dark:text-amber-400',
            title: 'text-amber-900 dark:text-amber-300',
            defaultIcon: AlertTriangle,
            defaultTitle: 'Warning',
        },
        tip: {
            container: 'bg-green-50 dark:bg-green-950/30 border-l-green-500',
            icon: 'text-green-600 dark:text-green-400',
            title: 'text-green-900 dark:text-green-300',
            defaultIcon: Lightbulb,
            defaultTitle: 'Tip',
        },
        note: {
            container: 'bg-gray-50 dark:bg-gray-950/30 border-l-gray-500',
            icon: 'text-gray-600 dark:text-gray-400',
            title: 'text-gray-900 dark:text-gray-300',
            defaultIcon: FileText,
            defaultTitle: 'Note',
        },
        danger: {
            container: 'bg-red-50 dark:bg-red-950/30 border-l-red-500',
            icon: 'text-red-600 dark:text-red-400',
            title: 'text-red-900 dark:text-red-300',
            defaultIcon: XCircle,
            defaultTitle: 'Danger',
        },
        success: {
            container: 'bg-emerald-50 dark:bg-emerald-950/30 border-l-emerald-500',
            icon: 'text-emerald-600 dark:text-emerald-400',
            title: 'text-emerald-900 dark:text-emerald-300',
            defaultIcon: CheckCircle2,
            defaultTitle: 'Success',
        },
    };

    const style = variants[type];
    const Icon = icon || style.defaultIcon;
    const displayTitle = title || style.defaultTitle;

    return (
        <div
            className={cn(
                'my-6 rounded-lg border-l-4 p-4',
                style.container,
                className
            )}
        >
            <div className="flex gap-3">
                <div className="flex-shrink-0">
                    <Icon className={cn('h-5 w-5', style.icon)} />
                </div>
                <div className="flex-1">
                    <p className={cn('font-semibold mb-1 text-sm', style.title)}>
                        {displayTitle}
                    </p>
                    <div className="text-sm leading-relaxed text-foreground/90">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
});

