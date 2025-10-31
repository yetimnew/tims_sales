import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { ReportHeader } from '@/components/report-header';
import { KpiCard } from '@/components/kpi-card';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import * as React from 'react';

interface PerformanceStats {
    total_performances?: number;
    returned_performances?: number;
    not_returned_performances?: number;
    total_tonnage?: number;
    total_distance?: number;
}

interface PerformancesReportProps {
    performanceStats?: PerformanceStats;
    filters?: { from: string; to: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/performances' },
    { title: 'Performances', href: '/reports/performances' },
];

export default function PerformancesReport({ performanceStats, filters }: PerformancesReportProps) {
    const totals = {
        total: performanceStats?.total_performances ?? 0,
        returned: performanceStats?.returned_performances ?? 0,
        notReturned: performanceStats?.not_returned_performances ?? 0,
        tonnage: performanceStats?.total_tonnage ?? 0,
        distance: performanceStats?.total_distance ?? 0,
    };
    const [from, setFrom] = React.useState(filters?.from || '');
    const [to, setTo] = React.useState(filters?.to || '');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performance Reports" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <ReportHeader title="Performance Reports" subtitle="Trips and cargo insights" from={from} to={to} onApply={(f, t) => router.get('/reports/performances', { from: f, to: t }, { preserveState: true })} />

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <KpiCard title="Total" value={totals.total} />
                    <KpiCard title="Returned" value={totals.returned} />
                    <KpiCard title="Not Returned" value={totals.notReturned} />
                    <KpiCard title="Total Tonnage" value={Number(totals.tonnage)} />
                    <KpiCard title="Total Distance" value={Number(totals.distance)} />
                </div>

                <div className="text-xs text-muted-foreground">Coming soon: monthly trends, filters, and route analytics.</div>
            </div>
        </AppLayout>
    );
}


