import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

interface Perf {
    id: number;
    FOnumber?: string;
    DateDispach?: string;
}

export default function PerformanceAll({ performances, limit = 200 }: { performances: Perf[]; limit?: number }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Reports', href: '/reports/performance-all' },
        { title: 'Performance (All)', href: '/reports/performance-all' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performance (All)" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Latest {limit} Performances</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">Loaded {performances?.length || 0} items.</div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}







