import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { ReportHeader } from '@/components/report-header';
import { KpiCard } from '@/components/kpi-card';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import * as React from 'react';

interface OperationStats {
    total_operations?: number;
    active_operations?: number;
    inactive_operations?: number;
    operations_with_performances?: number;
}

interface OperationsReportProps {
    operationStats?: OperationStats;
    filters?: { from: string; to: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/operations' },
    { title: 'Operations', href: '/reports/operations' },
];

export default function OperationsReport({ operationStats, filters }: OperationsReportProps) {
    const totals = {
        total: operationStats?.total_operations ?? 0,
        active: operationStats?.active_operations ?? 0,
        inactive: operationStats?.inactive_operations ?? 0,
        withPerformances: operationStats?.operations_with_performances ?? 0,
    };
    const [from, setFrom] = React.useState(filters?.from || '');
    const [to, setTo] = React.useState(filters?.to || '');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Operation Reports" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <ReportHeader title="Operation Reports" subtitle="Operational overview and customer breakdown" from={from} to={to} onApply={(f, t) => router.get('/reports/operations', { from: f, to: t }, { preserveState: true })} />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <KpiCard title="Total Operations" value={totals.total} />
                    <KpiCard title="Active" value={totals.active} />
                    <KpiCard title="Inactive" value={totals.inactive} />
                    <KpiCard title="With Performances" value={totals.withPerformances} />
                </div>

                <div className="text-xs text-muted-foreground">Coming soon: customer-wise distribution and activity trends.</div>
            </div>
        </AppLayout>
    );
}


