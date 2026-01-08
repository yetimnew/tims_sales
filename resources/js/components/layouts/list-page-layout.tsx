import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { type ReactNode } from 'react';

interface ListPageLayoutProps {
    title: string;
    description?: string;
    headTitle?: string;
    breadcrumbs: BreadcrumbItem[];
    actions?: ReactNode;
    stats?: ReactNode;
    tableTitle: string;
    tableDescription?: string;
    tableHeaderExtras?: ReactNode;
    tableHeaderLayout?: 'stacked' | 'inline';
    children: ReactNode;
    pagination?: ReactNode;
    tableContainerClassName?: string;
    disableTransitionOverlay?: boolean;
}

export default function ListPageLayout({
    title,
    description,
    headTitle,
    breadcrumbs,
    actions,
    stats,
    tableTitle,
    tableDescription,
    tableHeaderExtras,
    tableHeaderLayout = 'stacked',
    children,
    pagination,
    tableContainerClassName,
    disableTransitionOverlay = true,
}: ListPageLayoutProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs} disableTransitionOverlay={disableTransitionOverlay}>
            <Head title={headTitle ?? title} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
                        {description && (
                            <p className="text-base text-slate-600 dark:text-slate-400">
                                {description}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div className="flex items-center gap-3">
                            {actions}
                        </div>
                    )}
                </header>

                {stats}

                <Card className="flex flex-1 flex-col overflow-hidden border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                        {tableHeaderLayout === 'inline' ? (
                            <div className="flex flex-nowrap items-center gap-4 overflow-x-auto">
                                <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{tableTitle}</CardTitle>
                                    {tableDescription && (
                                        <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                                            {tableDescription}
                                        </CardDescription>
                                    )}
                                </div>
                                {tableHeaderExtras && (
                                    <div className="flex flex-nowrap items-center gap-4">
                                        {tableHeaderExtras}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{tableTitle}</CardTitle>
                                    {tableDescription && (
                                        <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                                            {tableDescription}
                                        </CardDescription>
                                    )}
                                </div>
                                {tableHeaderExtras && (
                                    <div className="flex items-center gap-4">
                                        {tableHeaderExtras}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="flex-1 p-0 flex flex-col overflow-hidden min-h-0">
                        <div
                            className={cn(
                                'rounded-lg border overflow-auto max-h-[55vh] relative flex-1 min-h-0',
                                tableContainerClassName,
                            )}
                        >
                            {children}
                        </div>
                        {pagination}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
