import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KpiCardProps {
    title: string;
    value: string | number;
}

export function KpiCard({ title, value }: KpiCardProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
                <div className="text-xl font-bold">{typeof value === 'number' ? Number(value).toLocaleString() : value}</div>
            </CardContent>
        </Card>
    );
}



