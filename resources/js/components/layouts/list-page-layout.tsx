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
    children: ReactNode;
    pagination?: ReactNode;
    tableContainerClassName?: string;
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
    children,
    pagination,
    tableContainerClassName,
}: ListPageLayoutProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={headTitle ?? title} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{title}</h1>
                        {description && (
                            <p className="text-muted-foreground mt-2">
                                {description}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div className="flex items-center gap-3">
                            {actions}
                        </div>
                    )}
                </div>

                {stats}

                <Card className="flex flex-1 flex-col overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{tableTitle}</CardTitle>
                                {tableDescription && (
                                    <CardDescription>
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
                    </CardHeader>
                    <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                        <div
                            className={cn(
                                'rounded-lg border overflow-auto max-h-[55vh] relative flex-1',
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
