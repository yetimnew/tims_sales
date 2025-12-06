import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { type ReactNode } from 'react';

interface FormPageLayoutProps {
    title: string;
    description?: string;
    headTitle?: string;
    breadcrumbs: BreadcrumbItem[];
    icon?: ReactNode;
    headerAside?: ReactNode;
    children: ReactNode;
    layoutClassName?: string;
    cardClassName?: string;
    contentClassName?: string;
}

export function FormPageLayout({
    title,
    description,
    headTitle,
    breadcrumbs,
    icon,
    headerAside,
    children,
    layoutClassName,
    cardClassName,
    contentClassName,
}: FormPageLayoutProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={headTitle ?? title} />
            <div className={cn('flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4', layoutClassName)}>
                <Card
                    className={cn(
                        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70',
                        cardClassName,
                    )}
                >
                    <CardHeader className="px-6 pb-0">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                {icon && <div className="rounded-xl bg-blue-100 p-2 text-blue-600 shadow-sm dark:bg-blue-900/30 dark:text-blue-400">{icon}</div>}
                                <div>
                                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{title}</CardTitle>
                                    {description && (
                                        <CardDescription className="text-sm text-slate-600 dark:text-slate-400">{description}</CardDescription>
                                    )}
                                </div>
                            </div>
                            {headerAside && <div className="flex flex-wrap items-center gap-3">{headerAside}</div>}
                        </div>
                    </CardHeader>
                    <CardContent className={cn('flex flex-1 flex-col overflow-hidden p-0', contentClassName)}>{children}</CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
