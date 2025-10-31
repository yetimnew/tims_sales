import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

interface FinancialStats {
    total_revenue?: number;
    total_costs?: number;
    total_profit?: number;
}

interface FinancialReportProps {
    financialStats?: FinancialStats;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/financial' },
    { title: 'Financial', href: '/reports/financial' },
];

export default function FinancialReport({ financialStats }: FinancialReportProps) {
    const totals = {
        revenue: financialStats?.total_revenue ?? 0,
        costs: financialStats?.total_costs ?? 0,
        profit: financialStats?.total_profit ?? 0,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Financial Reports" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <div>
                    <h1 className="text-lg font-bold">Financial Reports</h1>
                    <p className="text-muted-foreground text-sm">Revenue, costs, and profit</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="text-xl font-bold">${Number(totals.revenue).toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Total Costs</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="text-xl font-bold">${Number(totals.costs).toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Total Profit</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="text-xl font-bold">${Number(totals.profit).toLocaleString()}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="text-xs text-muted-foreground">Coming soon: monthly breakdown, margins, and export.</div>
            </div>
        </AppLayout>
    );
}



