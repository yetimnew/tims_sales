import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface ReportSummaryItem {
    label: string;
    value: string;
    icon: LucideIcon;
    tone: string;
}

interface ReportSummaryGridProps {
    items: ReportSummaryItem[];
}

export function ReportSummaryGrid({ items }: ReportSummaryGridProps) {
    return (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {items.map((item) => {
                const Icon = item.icon;

                return (
                    <Card key={item.label} className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardContent className="flex items-center gap-3 p-4">
                            <span className={`flex h-10 w-10 items-center justify-center rounded-full ${item.tone}`}>
                                <Icon className="h-5 w-5" />
                            </span>
                            <div className="space-y-0.5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{item.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </section>
    );
}
