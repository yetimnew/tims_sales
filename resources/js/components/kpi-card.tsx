import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KpiCardProps {
    title: string;
    value: string | number;
    helper?: string;
    trend?: number;
}

export function KpiCard({ title, value, helper, trend }: KpiCardProps) {
    const trendLabel = typeof trend === 'number' ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%` : null;
    const trendTone = trend && trend !== 0 ? (trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400') : 'text-muted-foreground';

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
                <div className="text-xl font-bold">{typeof value === 'number' ? Number(value).toLocaleString() : value}</div>
                {(helper || trendLabel) && (
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                        {helper && <span>{helper}</span>}
                        {trendLabel && <span className={trendTone}>{trendLabel}</span>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}



