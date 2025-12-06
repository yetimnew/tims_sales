import { type ComponentProps, type Key, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ReportSectionBadgeItem {
    key?: Key;
    label: ReactNode;
    variant?: ComponentProps<typeof Badge>['variant'];
    className?: string;
}

interface ReportSectionCardProps {
    title: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    badgeItems?: ReportSectionBadgeItem[];
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
}

export function ReportSectionCard({
    title,
    description,
    children,
    badgeItems = [],
    className,
    headerClassName,
    contentClassName,
}: ReportSectionCardProps) {
    return (
        <Card
            className={cn(
                'border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70',
                className,
            )}
        >
            <CardHeader
                className={cn(
                    'space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60',
                    headerClassName,
                )}
            >
                <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</CardTitle>
                    {description ? <CardDescription className="text-sm">{description}</CardDescription> : null}
                </div>
                {badgeItems.length > 0 ? (
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {badgeItems.map((badge, index) => (
                            <Badge key={badge.key ?? index} variant={badge.variant ?? 'outline'} className={badge.className}>
                                {badge.label}
                            </Badge>
                        ))}
                    </div>
                ) : null}
            </CardHeader>
            <CardContent className={cn('p-0', contentClassName)}>{children}</CardContent>
        </Card>
    );
}
