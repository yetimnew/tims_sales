import { type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DetailSectionCardProps {
    title: string;
    icon?: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    titleClassName?: string;
}

export function DetailSectionCard({
    title,
    icon,
    description,
    actions,
    children,
    className,
    headerClassName,
    contentClassName,
    titleClassName,
}: DetailSectionCardProps) {
    return (
        <Card className={cn('border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg', className)}>
            <CardHeader
                className={cn(
                    'flex flex-col gap-3 border-b border-transparent bg-gradient-to-r from-indigo-50 to-blue-50 p-6 dark:from-indigo-950/20 dark:to-blue-950/20 md:flex-row md:items-start md:justify-between',
                    headerClassName,
                )}
            >
                <div className="space-y-2">
                    <CardTitle className={cn('flex items-center gap-2 text-xl', titleClassName)}>
                        {icon ? <span className="shrink-0">{icon}</span> : null}
                        <span>{title}</span>
                    </CardTitle>
                    {description ? (
                        <CardDescription className="text-base">{description}</CardDescription>
                    ) : null}
                </div>
                {actions ? (
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div>
                ) : null}
            </CardHeader>
            <CardContent className={cn('space-y-4 p-6', contentClassName)}>{children}</CardContent>
        </Card>
    );
}
