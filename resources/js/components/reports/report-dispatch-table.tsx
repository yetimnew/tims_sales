import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDecimal, formatPercentage, getFinancialTone, getMarginChipClass } from './formatters';

export interface ReportDispatchRow {
    id: number;
    fo_number: string;
    dispatch_date?: string | null;
    driver_name: string;
    truck_plate: string;
    vehicle_type?: string | null;
    operation_code: string;
    customer_name?: string | null;
    origin_name: string;
    destination_name: string;
    tonnage: number;
    ton_km: number;
    distance_wc: number;
    distance_wo: number;
    distance_total: number;
    fuel_litres: number;
    fuel_cost: number;
    perdiem: number;
    work_on_going: number;
    other_cost: number;
    expense: number;
    revenue: number;
    profit: number;
    margin_percent: number | null;
}

export interface ReportSummary {
    records: number;
    tonnage: number;
    ton_km: number;
    distance_wc: number;
    distance_wo: number;
    distance_total: number;
    fuel_litres: number;
    fuel_cost: number;
    perdiem: number;
    work_on_going: number;
    other_cost: number;
    expense: number;
    revenue: number;
    profit: number;
    margin_percent: number | null;
}

type ReportDispatchColumnKey =
    | 'fo_number'
    | 'dispatch_date'
    | 'driver_name'
    | 'truck_plate'
    | 'vehicle_type'
    | 'operation_code'
    | 'customer_name'
    | 'origin_name'
    | 'destination_name'
    | 'tonnage'
    | 'ton_km'
    | 'distance_wc'
    | 'distance_wo'
    | 'distance_total'
    | 'fuel_litres'
    | 'fuel_cost'
    | 'perdiem'
    | 'work_on_going'
    | 'other_cost'
    | 'expense'
    | 'revenue'
    | 'profit'
    | 'margin_percent';

interface ReportDispatchTableProps {
    rows: ReportDispatchRow[];
    summary: ReportSummary;
    summaryMargin: number | null;
    filterBadges: string[];
    emptyMessage?: string;
    columnLabelOverrides?: Partial<Record<ReportDispatchColumnKey, string>>;
}

export function ReportDispatchTable({
    rows,
    summary,
    summaryMargin,
    filterBadges,
    emptyMessage = 'No dispatch records match the selected filters.',
    columnLabelOverrides,
}: ReportDispatchTableProps) {
    const safeRows = Array.isArray(rows) ? rows : [];

    const columnLabels: Record<ReportDispatchColumnKey, string> = {
        fo_number: columnLabelOverrides?.fo_number ?? 'FO Number',
        dispatch_date: columnLabelOverrides?.dispatch_date ?? 'Dispatch Date',
        driver_name: columnLabelOverrides?.driver_name ?? 'Driver',
        truck_plate: columnLabelOverrides?.truck_plate ?? 'Truck',
        vehicle_type: columnLabelOverrides?.vehicle_type ?? 'Vehicle Type',
        operation_code: columnLabelOverrides?.operation_code ?? 'Operation',
        customer_name: columnLabelOverrides?.customer_name ?? 'Customer',
        origin_name: columnLabelOverrides?.origin_name ?? 'Origin',
        destination_name: columnLabelOverrides?.destination_name ?? 'Destination',
        tonnage: columnLabelOverrides?.tonnage ?? 'Tonnage (MT)',
        ton_km: columnLabelOverrides?.ton_km ?? 'Ton-KM',
        distance_wc: columnLabelOverrides?.distance_wc ?? 'Distance (WC)',
        distance_wo: columnLabelOverrides?.distance_wo ?? 'Distance (WO)',
        distance_total: columnLabelOverrides?.distance_total ?? 'Total Distance',
        fuel_litres: columnLabelOverrides?.fuel_litres ?? 'Fuel (L)',
        fuel_cost: columnLabelOverrides?.fuel_cost ?? 'Fuel Cost',
        perdiem: columnLabelOverrides?.perdiem ?? 'Perdiem',
        work_on_going: columnLabelOverrides?.work_on_going ?? 'Work Ongoing',
        other_cost: columnLabelOverrides?.other_cost ?? 'Other Cost',
        expense: columnLabelOverrides?.expense ?? 'Total Expense',
        revenue: columnLabelOverrides?.revenue ?? 'Revenue',
        profit: columnLabelOverrides?.profit ?? 'Profit',
        margin_percent: columnLabelOverrides?.margin_percent ?? 'Margin %',
    };

    return (
        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
            <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Dispatch Detail</CardTitle>
                    <CardDescription className="text-sm">Operations, routes, and financial outcomes per dispatch.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {filterBadges.map((badge) => (
                        <Badge key={badge} variant="outline">
                            {badge}
                        </Badge>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                            <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                <TableHead className="whitespace-nowrap">{columnLabels.fo_number}</TableHead>
                                <TableHead className="whitespace-nowrap">{columnLabels.dispatch_date}</TableHead>
                                <TableHead className="whitespace-nowrap">{columnLabels.driver_name}</TableHead>
                                <TableHead className="whitespace-nowrap">{columnLabels.truck_plate}</TableHead>
                                <TableHead className="whitespace-nowrap">{columnLabels.vehicle_type}</TableHead>
                                <TableHead className="whitespace-nowrap">{columnLabels.operation_code}</TableHead>
                                <TableHead className="whitespace-nowrap">{columnLabels.customer_name}</TableHead>
                                <TableHead className="whitespace-nowrap">{columnLabels.origin_name}</TableHead>
                                <TableHead className="whitespace-nowrap">{columnLabels.destination_name}</TableHead>
                                <TableHead className="whitespace-nowrap text-right">{columnLabels.tonnage}</TableHead>
                                <TableHead className="whitespace-nowrap text-right">{columnLabels.ton_km}</TableHead>
                                <TableHead className="whitespace-nowrap text-right">{columnLabels.distance_wc}</TableHead>
                                <TableHead className="whitespace-nowrap text-right">{columnLabels.distance_wo}</TableHead>
                                <TableHead className="whitespace-nowrap text-right">{columnLabels.distance_total}</TableHead>
                                <TableHead className="whitespace-nowrap text-right">{columnLabels.fuel_litres}</TableHead>
                                <TableHead className="whitespace-nowrap text-right">{columnLabels.fuel_cost}</TableHead>
                                <TableHead className="whitespace-nowrap text-right">{columnLabels.perdiem}</TableHead>
                                <TableHead className="whitespace-nowrap text-right">{columnLabels.work_on_going}</TableHead>
                                <TableHead className="whitespace-nowrap text-right">{columnLabels.other_cost}</TableHead>
                                <TableHead className="whitespace-nowrap text-right">{columnLabels.expense}</TableHead>
                                <TableHead className="whitespace-nowrap text-right">{columnLabels.revenue}</TableHead>
                                <TableHead className="whitespace-nowrap text-right">{columnLabels.profit}</TableHead>
                                <TableHead className="whitespace-nowrap text-right">{columnLabels.margin_percent}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {safeRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={23} className="py-6 text-center text-sm text-muted-foreground">
                                        {emptyMessage}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                safeRows.map((row) => {
                                    const marginValue = row.margin_percent ?? null;
                                    const profitTone = getFinancialTone(row.profit);

                                    return (
                                        <TableRow
                                            key={row.id}
                                            className="divide-x divide-slate-200/40 odd:bg-white even:bg-slate-50/40 hover:bg-slate-100/60 dark:divide-slate-800/50 dark:odd:bg-slate-900/40 dark:even:bg-slate-900/20 dark:hover:bg-slate-800/50"
                                        >
                                            <TableCell className="whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-100">{row.fo_number}</TableCell>
                                            <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-200">{row.dispatch_date ?? '—'}</TableCell>
                                            <TableCell className="whitespace-nowrap text-sm text-slate-700 dark:text-slate-100">{row.driver_name}</TableCell>
                                            <TableCell className="whitespace-nowrap text-sm text-slate-700 dark:text-slate-100">{row.truck_plate}</TableCell>
                                            <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-200">{row.vehicle_type ?? '—'}</TableCell>
                                            <TableCell className="whitespace-nowrap text-sm text-slate-700 dark:text-slate-100">{row.operation_code}</TableCell>
                                            <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-200">{row.customer_name ?? '—'}</TableCell>
                                            <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-200">{row.origin_name}</TableCell>
                                            <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-200">{row.destination_name}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.tonnage)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.ton_km)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.distance_wc)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.distance_wo)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.distance_total)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.fuel_litres)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.fuel_cost)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.perdiem)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.work_on_going)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.other_cost)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.expense)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.revenue)}</TableCell>
                                            <TableCell className={`whitespace-nowrap text-right text-sm font-semibold ${profitTone}`}>{formatCurrency(row.profit)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">
                                                {marginValue === null ? (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                ) : (
                                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getMarginChipClass(marginValue)}`}>
                                                        {formatPercentage(marginValue)}
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="divide-x divide-slate-200/60 bg-slate-100/80 text-sm font-semibold dark:divide-slate-800/50 dark:bg-slate-900/60">
                                <TableCell className="whitespace-nowrap" colSpan={9}>
                                    Totals
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatDecimal(summary?.tonnage ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatDecimal(summary?.ton_km ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatDecimal(summary?.distance_wc ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatDecimal(summary?.distance_wo ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatDecimal(summary?.distance_total ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatDecimal(summary?.fuel_litres ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatCurrency(summary?.fuel_cost ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatCurrency(summary?.perdiem ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatCurrency(summary?.work_on_going ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatCurrency(summary?.other_cost ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatCurrency(summary?.expense ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatCurrency(summary?.revenue ?? 0)}</TableCell>
                                <TableCell className={`whitespace-nowrap text-right ${getFinancialTone(summary?.profit ?? 0)}`}>{formatCurrency(summary?.profit ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">
                                    {summaryMargin === null ? (
                                        <span className="text-sm text-muted-foreground">—</span>
                                    ) : (
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getMarginChipClass(summaryMargin)}`}>
                                            {formatPercentage(summaryMargin)}
                                        </span>
                                    )}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
