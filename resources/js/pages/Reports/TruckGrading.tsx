import { useMemo } from 'react';
import { Link, router } from '@inertiajs/react';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { InertiaPagination } from '@/components/ui/pagination';
import { RefreshCcw } from 'lucide-react';

type GradeCategory = {
    score?: number | null;
    letter?: string | null;
    weight?: number | null;
};

type GradeDetails = {
    overall?: {
        score?: number | null;
        letter?: string | null;
    };
    categories?: Record<string, GradeCategory>;
    weights?: Record<string, number>;
    grade_thresholds?: Record<string, number>;
};

type SnapshotMeta = {
    calculated_at?: string | null;
    calculated_by?: {
        id: number;
        name: string;
    } | null;
};

type VehicleTypeOption = {
    id: number;
    name: string;
};

type TruckGradingRow = {
    id: number | null;
    plate: string;
    status?: string | null;
    vehicleType?: VehicleTypeOption | null;
    service_start_date?: string | null;
    production_date?: string | null;
    purchase_price?: number | null;
    grade?: GradeDetails;
    snapshot?: SnapshotMeta;
};

type TruckGradingFilters = {
    snapshot_date?: string | null;
    vehicle_type_id?: number | null;
    status?: string | null;
    grade_letter?: string | null;
    per_page?: number | null;
};

type TruckGradingFilterOptions = {
    dates?: string[];
    vehicle_types?: VehicleTypeOption[];
    statuses?: string[];
};

type PaginationMeta = {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    from?: number | null;
    to?: number | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active?: boolean;
};

type TruckGradingPaginator = {
    data?: TruckGradingRow[];
    meta?: PaginationMeta;
    links?: PaginationLink[];
};

type LatestCalculation = {
    calculated_at?: string | null;
    calculated_by?: {
        id: number;
        name: string;
    } | null;
    count?: number | null;
} | null;

type TruckGradingReportProps = {
    filters: TruckGradingFilters;
    filterOptions: TruckGradingFilterOptions;
    paginator: TruckGradingPaginator;
    latestCalculation: LatestCalculation;
    perPageOptions?: number[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/truck-grading' },
    { title: 'Truck grading', href: '/reports/truck-grading' },
];

const fallBackPerPageOptions = [10, 25, 50];

const formatDate = (value?: string | null): string => {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString();
};

const formatDateTime = (value?: string | null): string => {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString();
};

const formatScore = (value?: number | null): string => {
    if (typeof value !== 'number') {
        return '—';
    }

    return value.toFixed(1);
};

const formatNumber = (value?: number | null): string => {
    if (typeof value !== 'number') {
        return '—';
    }

    return value.toLocaleString();
};

const gradeBadgeTone = (letter?: string | null): string => {
    if (!letter) {
        return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
    }

    const normalized = letter.toUpperCase();

    if (normalized === 'A') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
    }

    if (normalized === 'B') {
        return 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200';
    }

    if (normalized === 'C') {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
    }

    if (normalized === 'D') {
        return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200';
    }

    if (normalized === 'E') {
        return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200';
    }

    return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
};

const statusBadgeTone = (status?: string | null): string => {
    if (!status) {
        return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
    }

    const normalized = status.toLowerCase();

    if (normalized === 'active') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
    }

    if (normalized === 'maintenance') {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
    }

    if (normalized === 'inactive') {
        return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
    }

    if (normalized === 'retired') {
        return 'bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-200';
    }

    return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
};

const normalizeQuery = (value: TruckGradingFilters): Record<string, unknown> => {
    const query: Record<string, unknown> = {};

    if (value.snapshot_date) {
        query.snapshot_date = value.snapshot_date;
    }

    if (typeof value.vehicle_type_id === 'number' && value.vehicle_type_id > 0) {
        query.vehicle_type_id = value.vehicle_type_id;
    }

    if (value.status) {
        query.status = value.status;
    }

    if (value.grade_letter) {
        query.grade_letter = value.grade_letter;
    }

    if (typeof value.per_page === 'number' && value.per_page > 0) {
        query.per_page = value.per_page;
    }

    return query;
};

export default function TruckGradingReport({
    filters,
    filterOptions,
    paginator,
    latestCalculation,
    perPageOptions,
}: TruckGradingReportProps) {
    const rows = Array.isArray(paginator?.data) ? paginator?.data ?? [] : [];
    const snapshotDates = Array.isArray(filterOptions?.dates) ? filterOptions?.dates ?? [] : [];
    const vehicleTypes = Array.isArray(filterOptions?.vehicle_types) ? filterOptions?.vehicle_types ?? [] : [];
    const statusOptions = Array.isArray(filterOptions?.statuses) ? filterOptions?.statuses ?? [] : [];

    const availablePerPageOptions = useMemo(
        () => (perPageOptions && perPageOptions.length > 0 ? perPageOptions : fallBackPerPageOptions),
        [perPageOptions],
    );

    const gradeLetterOptions = useMemo(() => {
        const observed = new Set<string>();

        rows.forEach((row) => {
            const letter = row.grade?.overall?.letter;
            if (letter) {
                observed.add(letter.toUpperCase());
            }
        });

        return Array.from(new Set(['A', 'B', 'C', 'D', 'E', ...observed]));
    }, [rows]);

    const resolvedSnapshotDate = filters?.snapshot_date ?? snapshotDates[0] ?? '';
    const selectedVehicleType = filters?.vehicle_type_id ? String(filters.vehicle_type_id) : 'all';
    const selectedStatus = filters?.status ?? 'all';
    const selectedGradeLetter = filters?.grade_letter ?? 'all';
    const resolvedPerPage = String(filters?.per_page ?? paginator?.meta?.per_page ?? availablePerPageOptions[0] ?? 10);

    const handleFilterChange = (partial: Partial<TruckGradingFilters>) => {
        const next: TruckGradingFilters = {
            snapshot_date: filters?.snapshot_date ?? snapshotDates[0] ?? null,
            vehicle_type_id: filters?.vehicle_type_id ?? null,
            status: filters?.status ?? null,
            grade_letter: filters?.grade_letter ?? null,
            per_page: filters?.per_page ?? paginator?.meta?.per_page ?? availablePerPageOptions[0] ?? null,
            ...partial,
        };

        const query = normalizeQuery(next);

        router.get('/reports/truck-grading', query, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        router.get('/reports/truck-grading', {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const tableHeaderExtras = (
        <div className="flex flex-wrap items-center gap-2">
            <Select value={resolvedSnapshotDate} onValueChange={(value) => handleFilterChange({ snapshot_date: value })}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Snapshot date" />
                </SelectTrigger>
                <SelectContent>
                    {snapshotDates.map((date) => (
                        <SelectItem key={date} value={date}>
                            {formatDate(date)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={selectedVehicleType} onValueChange={(value) => handleFilterChange({ vehicle_type_id: value === 'all' ? null : Number(value) })}>
                <SelectTrigger className="w-[190px]">
                    <SelectValue placeholder="Vehicle type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All vehicle types</SelectItem>
                    {vehicleTypes.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={(value) => handleFilterChange({ status: value === 'all' ? null : value })}>
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={selectedGradeLetter} onValueChange={(value) => handleFilterChange({ grade_letter: value === 'all' ? null : value.toUpperCase() })}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All grades</SelectItem>
                    {gradeLetterOptions.map((letter) => (
                        <SelectItem key={letter} value={letter}>
                            Grade {letter}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={resolvedPerPage} onValueChange={(value) => handleFilterChange({ per_page: Number(value) })}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent>
                    {availablePerPageOptions.map((option) => (
                        <SelectItem key={option} value={String(option)}>
                            {option} / page
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Button type="button" variant="ghost" size="sm" onClick={handleReset} className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                Reset
            </Button>
        </div>
    );

    const tableDescription = latestCalculation
        ? `Based on ${latestCalculation?.count ?? paginator?.meta?.total ?? 0} graded truck${(latestCalculation?.count ?? paginator?.meta?.total ?? 0) === 1 ? '' : 's'}. Last calculated ${formatDateTime(latestCalculation?.calculated_at)}${latestCalculation?.calculated_by?.name ? ` by ${latestCalculation.calculated_by.name}` : ''}.`
        : 'Once grading runs, snapshots will appear here with the latest scoring details.';

    const statsSection = (
        <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-card px-4 py-3 shadow-sm">
                <p className="text-sm text-muted-foreground">Snapshot date</p>
                <p className="text-lg font-semibold text-foreground">{formatDate(resolvedSnapshotDate)}</p>
            </div>
            <div className="rounded-lg border bg-card px-4 py-3 shadow-sm">
                <p className="text-sm text-muted-foreground">Tracked trucks</p>
                <p className="text-lg font-semibold text-foreground">{formatNumber(paginator?.meta?.total ?? 0)}</p>
            </div>
            <div className="rounded-lg border bg-card px-4 py-3 shadow-sm">
                <p className="text-sm text-muted-foreground">Last calculated</p>
                <p className="text-lg font-semibold text-foreground">{formatDateTime(latestCalculation?.calculated_at)}</p>
                {latestCalculation?.calculated_by?.name ? (
                    <p className="text-xs text-muted-foreground">by {latestCalculation.calculated_by.name}</p>
                ) : null}
            </div>
        </div>
    );

    return (
        <ListPageLayout
            headTitle="Truck grading report"
            title="Truck grading report"
            description="Review the graded leaderboard, compare category scores, and identify outliers after adjusting the configuration."
            breadcrumbs={breadcrumbs}
            actions={(
                <Button asChild variant="outline" size="sm">
                    <Link href="/settings/truck-grading">Adjust grading settings</Link>
                </Button>
            )}
            stats={statsSection}
            tableTitle="All grades"
            tableDescription={tableDescription}
            tableHeaderExtras={tableHeaderExtras}
            pagination={(
                <InertiaPagination
                    from={paginator?.meta?.from ?? undefined}
                    to={paginator?.meta?.to ?? undefined}
                    total={paginator?.meta?.total ?? undefined}
                    links={paginator?.links}
                    currentPage={paginator?.meta?.current_page ?? undefined}
                    lastPage={paginator?.meta?.last_page ?? undefined}
                />
            )}
            tableContainerClassName="bg-background"
        >
            <Table>
                <TableHeader>
                    <TableRow className="sticky top-0 z-30 bg-background">
                        <TableHead className="w-16 text-xs uppercase tracking-wide text-muted-foreground">Rank</TableHead>
                        <TableHead className="min-w-[160px] text-xs uppercase tracking-wide text-muted-foreground">Truck</TableHead>
                        <TableHead className="min-w-[150px] text-xs uppercase tracking-wide text-muted-foreground">Vehicle type</TableHead>
                        <TableHead className="min-w-[120px] text-xs uppercase tracking-wide text-muted-foreground">Grade</TableHead>
                        <TableHead className="min-w-[140px] text-xs uppercase tracking-wide text-muted-foreground">Key categories</TableHead>
                        <TableHead className="min-w-[120px] text-xs uppercase tracking-wide text-muted-foreground">Service start</TableHead>
                        <TableHead className="min-w-[120px] text-xs uppercase tracking-wide text-muted-foreground">Production</TableHead>
                        <TableHead className="min-w-[140px] text-xs uppercase tracking-wide text-muted-foreground">Purchase price</TableHead>
                        <TableHead className="min-w-[180px] text-xs uppercase tracking-wide text-muted-foreground">Snapshot info</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                                No graded trucks found for this snapshot.
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map((row, index) => {
                            const rowNumber = (paginator?.meta?.from ?? 1) + index;
                            const overallLetter = row.grade?.overall?.letter ?? '—';
                            const overallScore = row.grade?.overall?.score ?? null;
                            const categories = row.grade?.categories ?? {};
                            const topCategories = Object.entries(categories)
                                .map(([key, details]) => ({
                                    key,
                                    score: typeof details?.score === 'number' ? details.score : null,
                                }))
                                .sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity))
                                .slice(0, 3);

                            return (
                                <TableRow key={row.id ?? `${row.plate}-${rowNumber}`} className="hover:bg-muted/50">
                                    <TableCell className="font-semibold text-muted-foreground">{rowNumber}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold text-foreground">{row.plate}</span>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge className={statusBadgeTone(row.status)}>{row.status ?? 'Unknown'}</Badge>
                                                {row.service_start_date ? (
                                                    <span className="text-xs text-muted-foreground">In service {formatDate(row.service_start_date)}</span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {row.vehicleType?.name ?? '—'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge className={gradeBadgeTone(overallLetter)}>
                                                Grade {overallLetter}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">Score {formatScore(overallScore)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {topCategories.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {topCategories.map((category) => (
                                                    <Badge key={category.key} variant="secondary" className="capitalize">
                                                        {category.key.replace(/[_-]+/g, ' ')}{category.score !== null ? ` · ${category.score.toFixed(1)}` : ''}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{formatDate(row.service_start_date)}</TableCell>
                                    <TableCell>{formatDate(row.production_date)}</TableCell>
                                    <TableCell>{formatNumber(row.purchase_price)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-foreground">{formatDateTime(row.snapshot?.calculated_at)}</span>
                                            {row.snapshot?.calculated_by?.name ? (
                                                <span className="text-xs text-muted-foreground">by {row.snapshot.calculated_by.name}</span>
                                            ) : null}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </ListPageLayout>
    );
}
