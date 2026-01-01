import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InertiaPagination } from '@/components/ui/pagination';
import { CalendarClock, Gauge, LineChart, ListFilter, Loader2, Settings, User, type LucideIcon } from 'lucide-react';
import { ReportPageLayout } from '@/components/report/report-page-layout';

type GradeDetails = {
    overall?: { score?: number | null; letter?: string | null };
    categories?: Record<string, unknown>;
    weights?: Record<string, number>;
    grade_thresholds?: Record<string, number>;
    metrics?: Record<string, unknown>;
};

type SnapshotMeta = {
    calculated_at?: string | null;
    calculated_by?: { id: number; name: string } | null;
};

type DriverRow = {
    id: number | null;
    name: string;
    status?: string | null;
    grade?: GradeDetails;
    snapshot?: SnapshotMeta;
};

type Filters = {
    snapshot_date?: string | null;
    status?: string | null;
    grade_letter?: string | null;
    per_page?: number | null;
};

type FilterOptions = {
    dates?: string[];
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

type PaginationLink = { url: string | null; label: string; active?: boolean };

type Paginator = { data?: DriverRow[]; meta?: PaginationMeta; links?: PaginationLink[] };

type LatestCalculation = { calculated_at?: string | null; calculated_by?: { id: number; name: string } | null; count?: number | null } | null;

type Permissions = { recalculate: boolean };

type Props = {
    filters: Filters;
    filterOptions: FilterOptions;
    paginator: Paginator;
    latestCalculation: LatestCalculation;
    perPageOptions?: number[];
    can?: Permissions;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/driver-grading' },
    { title: 'Driver grading', href: '/reports/driver-grading' },
];

const fallBackPerPageOptions = [10, 25, 50];

const formatDate = (value?: string | null): string => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const formatDateTime = (value?: string | null): string => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const formatScore = (value?: number | null): string => (typeof value !== 'number' ? '—' : value.toFixed(1));

const gradeBadgeTone = (letter?: string | null): string => {
    if (!letter) return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
    const normalized = letter.toUpperCase();
    if (normalized === 'A') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
    if (normalized === 'B') return 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200';
    if (normalized === 'C') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
    if (normalized === 'D') return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200';
    if (normalized === 'E') return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200';
    return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
};

const statusBadgeTone = (status?: string | null): string => {
    if (!status) return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
    const normalized = status.toLowerCase();
    if (normalized === 'active') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
    if (normalized === 'inactive' || normalized === 'maintenance') return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
    return 'bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-200';
};

const normalizeQuery = (value: Filters): Record<string, unknown> => {
    const query: Record<string, unknown> = {};
    if (value.snapshot_date) query.snapshot_date = value.snapshot_date;
    if (value.status) query.status = value.status;
    if (value.grade_letter) query.grade_letter = value.grade_letter;
    if (typeof value.per_page === 'number' && value.per_page > 0) query.per_page = value.per_page;
    return query;
};

const resolveCsrfTokens = (): { header?: string; cookie?: string } => {
    if (typeof document === 'undefined') return {};
    const tokens: { header?: string; cookie?: string } = {};
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    if (meta?.content) tokens.header = meta.content;
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    if (!match) return tokens;
    try { tokens.cookie = decodeURIComponent(match[1]); } catch { tokens.cookie = match[1]; }
    return tokens;
};

export default function DriverGradingReport({ filters, filterOptions, paginator, latestCalculation, perPageOptions, can }: Props) {
    const rows = useMemo<DriverRow[]>(() => (Array.isArray(paginator?.data) ? paginator.data : []), [paginator?.data]);
    const snapshotDates = useMemo<string[]>(() => (Array.isArray(filterOptions?.dates) ? filterOptions.dates : []), [filterOptions?.dates]);
    const statusOptions = useMemo<string[]>(() => (Array.isArray(filterOptions?.statuses) ? filterOptions.statuses : []), [filterOptions?.statuses]);
    const availablePerPageOptions = useMemo(() => (perPageOptions && perPageOptions.length > 0 ? perPageOptions : fallBackPerPageOptions), [perPageOptions]);
    const canRecalculate = can?.recalculate ?? false;

    // Calculate min/max dates for date picker
    const minSnapshotDate = useMemo(() => snapshotDates[snapshotDates.length - 1] ?? null, [snapshotDates]);
    const maxSnapshotDate = useMemo(() => snapshotDates[0] ?? null, [snapshotDates]);

    const [recalculationNotice, setRecalculationNotice] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
    const [recalculating, setRecalculating] = useState(false);

    const [snapshotDate, setSnapshotDate] = useState(filters?.snapshot_date ?? snapshotDates[0] ?? '');
    const [status, setStatus] = useState<string>(filters?.status ?? 'all');
    const [gradeLetter, setGradeLetter] = useState<string>(filters?.grade_letter ?? 'all');
    const [perPage, setPerPage] = useState<number>(filters?.per_page ?? paginator?.meta?.per_page ?? availablePerPageOptions[0] ?? 10);
    const [filtersOpen, setFiltersOpen] = useState(false);

    useEffect(() => {
        setSnapshotDate(filters?.snapshot_date ?? snapshotDates[0] ?? '');
        setStatus(filters?.status ?? 'all');
        setGradeLetter(filters?.grade_letter ?? 'all');
        setPerPage(filters?.per_page ?? paginator?.meta?.per_page ?? availablePerPageOptions[0] ?? 10);
    }, [filters?.snapshot_date, filters?.status, filters?.grade_letter, filters?.per_page, snapshotDates, availablePerPageOptions, paginator?.meta?.per_page]);

    const appliedSnapshotDate = filters?.snapshot_date ?? snapshotDates[0] ?? '';
    const appliedStatus = filters?.status ?? 'all';
    const appliedGradeLetter = filters?.grade_letter ?? 'all';
    const appliedPerPage = filters?.per_page ?? paginator?.meta?.per_page ?? availablePerPageOptions[0] ?? 10;

    const gradeLetterOptions = useMemo(() => {
        const observed = new Set<string>(['A', 'B', 'C', 'D', 'E']);
        rows.forEach((row) => {
            const letter = row.grade?.overall?.letter;
            if (letter) observed.add(letter.toUpperCase());
        });
        return Array.from(observed);
    }, [rows]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (snapshotDate && snapshotDate !== (filters?.snapshot_date ?? snapshotDates[0] ?? '')) count += 1;
        if (status !== (filters?.status ?? 'all')) count += 1;
        if (gradeLetter !== (filters?.grade_letter ?? 'all')) count += 1;
        if (perPage !== (filters?.per_page ?? paginator?.meta?.per_page ?? availablePerPageOptions[0] ?? 10)) count += 1;
        return count;
    }, [snapshotDate, status, gradeLetter, perPage, filters?.snapshot_date, filters?.status, filters?.grade_letter, filters?.per_page, snapshotDates, availablePerPageOptions, paginator?.meta?.per_page]);

    const handleGenerateReport = () => {
        setFiltersOpen(false);
        const query = normalizeQuery({ snapshot_date: snapshotDate || null, status: status === 'all' ? null : status, grade_letter: gradeLetter === 'all' ? null : gradeLetter, per_page: perPage });
        router.get('/reports/driver-grading', query, { preserveScroll: true, preserveState: true });
    };

    const handleReset = () => {
        setSnapshotDate(snapshotDates[0] ?? '');
        setStatus('all');
        setGradeLetter('all');
        setPerPage(availablePerPageOptions[0] ?? 10);
        setFiltersOpen(false);
        router.get('/reports/driver-grading', {}, { preserveScroll: true, preserveState: false });
    };

    const handleSnapshotDateChange = (newDate: string) => {
        setSnapshotDate(newDate);
        // Reset other filters to 'all' when snapshot date changes
        // to avoid no-results due to incompatible filter combinations
        setStatus('all');
        setGradeLetter('all');
    };

    const handleRecalculateSnapshot = useCallback(async () => {
        if (!canRecalculate || !appliedSnapshotDate || recalculating) return;
        setRecalculationNotice(null);
        setRecalculating(true);
        const { header: csrfHeaderToken, cookie: csrfCookieToken } = resolveCsrfTokens();
        const payload: Record<string, unknown> = { snapshot_date: appliedSnapshotDate };
        if (appliedStatus !== 'all') payload.status = appliedStatus;

        try {
            const response = await fetch('/settings/driver-grading/recalculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfHeaderToken ? { 'X-CSRF-TOKEN': csrfHeaderToken } : {}),
                    ...(csrfCookieToken ? { 'X-XSRF-TOKEN': csrfCookieToken } : {}),
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(`Unexpected status code: ${response.status}`);
            const body = (await response.json()) as { message?: string };
            setRecalculationNotice({ status: 'success', message: body.message ?? 'Recalculated driver grades for the selected filters.' });
            router.reload({ only: ['filters', 'filterOptions', 'paginator', 'latestCalculation'], preserveScroll: true, onFinish: () => setRecalculating(false), onError: () => setRecalculating(false) });
        } catch (error) {
            console.error(error);
            setRecalculationNotice({ status: 'error', message: 'Failed to recalculate driver grades. Please try again shortly.' });
            setRecalculating(false);
        }
    }, [canRecalculate, appliedSnapshotDate, appliedStatus, recalculating]);

    const averageScore = useMemo(() => {
        let total = 0; let count = 0;
        rows.forEach((row) => { const value = row.grade?.overall?.score; if (typeof value === 'number') { total += value; count += 1; } });
        return count === 0 ? null : total / count;
    }, [rows]);

    const topGrade = useMemo(() => {
        const letters = rows.map((row) => row.grade?.overall?.letter).filter((letter): letter is string => Boolean(letter)).map((letter) => letter.toUpperCase());
        if (letters.length === 0) return null;
        const priority = ['A', 'B', 'C', 'D', 'E'];
        return priority.find((letter) => letters.includes(letter)) ?? letters[0];
    }, [rows]);

    const kpiCards = useMemo<
        ReadonlyArray<{ label: string; value: string; icon: LucideIcon; tone: string }>
    >(() => {
        const totalDrivers = paginator?.meta?.total ?? rows.length;
        const lastCalculatedAt = latestCalculation?.calculated_at ?? rows[0]?.snapshot?.calculated_at ?? null;
        const calculatedBy = latestCalculation?.calculated_by?.name ?? rows[0]?.snapshot?.calculated_by?.name ?? null;
        return [
            { label: 'Snapshot date', value: formatDate(appliedSnapshotDate), icon: CalendarClock, tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200' },
            { label: 'Tracked drivers', value: String(totalDrivers), icon: User, tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200' },
            { label: 'Average score', value: averageScore === null ? '—' : averageScore.toFixed(1), icon: Gauge, tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200' },
            { label: 'Top grade', value: topGrade ? `Grade ${topGrade}` : '—', icon: LineChart, tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200' },
            { label: 'Last calculated', value: formatDateTime(lastCalculatedAt), icon: ListFilter, tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200' },
            { label: 'Calculated by', value: calculatedBy ?? '—', icon: Settings, tone: 'bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200' },
        ];
    }, [appliedSnapshotDate, paginator?.meta?.total, rows, latestCalculation, averageScore, topGrade]);

    const recalculationTone = useMemo(() => {
        if (!recalculationNotice) return '';
        return recalculationNotice.status === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200'
            : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200';
    }, [recalculationNotice]);

    return (
        <ReportPageLayout
            title="Driver grading report"
            description="Review graded drivers, compare categories, and identify outliers after adjusting the configuration."
            breadcrumbs={breadcrumbs}
            icon={<User className="h-6 w-6" />}
            filters={
                <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                                    <DialogTrigger asChild>
                                        <Button type="button" variant="outline" className="gap-2">
                                            <ListFilter className="h-4 w-4" />
                                            Filters
                                            {activeFilterCount > 0 ? (
                                                <Badge variant="secondary" className="h-5 min-w-[2rem] justify-center px-2 text-xs font-semibold">{activeFilterCount}</Badge>
                                            ) : null}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-full sm:max-w-4xl sm:rounded-2xl">
                                        <DialogHeader className="text-left">
                                            <DialogTitle>Filter graded drivers</DialogTitle>
                                            <DialogDescription>Select snapshot and status filters before regenerating the leaderboard.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-6">
                                            <div className="grid gap-4 rounded-xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Snapshot date</label>
                                                        <DatePicker
                                                            mode="single"
                                                            value={snapshotDate}
                                                            onChange={(newDate) => {
                                                                if (newDate) {
                                                                    handleSnapshotDateChange(newDate);
                                                                }
                                                            }}
                                                            placeholder="Select snapshot date"
                                                            fromDate={minSnapshotDate ? new Date(minSnapshotDate) : undefined}
                                                            toDate={maxSnapshotDate ? new Date(maxSnapshotDate) : undefined}
                                                            className="w-full"
                                                        />
                                                        <p className="text-xs text-muted-foreground">
                                                            Pick any date between {formatDate(minSnapshotDate)} and {formatDate(maxSnapshotDate)}. Changing date resets other filters.
                                                        </p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Driver status</label>
                                                        <Select value={status} onValueChange={setStatus}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="All statuses" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">All statuses</SelectItem>
                                                                {statusOptions.map((option) => (
                                                                    <SelectItem key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Grade letter</label>
                                                        <Select value={gradeLetter} onValueChange={setGradeLetter}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="All grades" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">All grades</SelectItem>
                                                                {gradeLetterOptions.map((letter) => (
                                                                    <SelectItem key={letter} value={letter}>Grade {letter}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Rows per page</label>
                                                        <Select value={String(perPage)} onValueChange={(value) => setPerPage(Number(value))}>
                                                            <SelectTrigger className="w-[160px]">
                                                                <SelectValue placeholder="Rows per page" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {availablePerPageOptions.map((option) => (
                                                                    <SelectItem key={option} value={String(option)}>{option} / page</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={handleReset}>Reset</Button>
                                            <Button type="button" onClick={handleGenerateReport}>Generate report</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </>
            }
            summarySection={
                <>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild variant="secondary" className="gap-2">
                            <Link href="/settings/driver-grading">
                                <Settings className="h-4 w-4" />
                                Adjust settings
                            </Link>
                        </Button>
                        {canRecalculate ? (
                            <Button type="button" className="gap-2" onClick={handleRecalculateSnapshot} disabled={recalculating || !appliedSnapshotDate}>
                                {recalculating ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<Gauge className="h-4 w-4" />)}
                                {recalculating ? 'Recalculating…' : 'Recalculate snapshot'}
                                    </Button>
                                ) : null}
                                <Button type="button" variant="outline" className="gap-2" onClick={handleReset}>
                                    <RefreshCcw className="h-4 w-4" />
                                    Reset
                                </Button>
                            </div>
                            {recalculationNotice ? (
                                <div className={`mt-4 rounded-lg border px-4 py-3 text-sm transition ${recalculationTone}`}>{recalculationNotice.message}</div>
                            ) : null}
                        </div>
                    </header>

                    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        {kpiCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <Card key={card.label} className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                                    <CardContent className="flex items-center gap-3 p-4">
                                        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${card.tone}`}>
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{card.label}</p>
                                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{card.value}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </>
            }
            canExport={false}
            contentClassName="p-0"
        >
            <div className="space-y-6 p-6">
                <Card className="border border-slate-200 bg-slate-50/50 shadow-sm dark:border-slate-800 dark:bg-slate-800/50">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Graded drivers</CardTitle>
                                <CardDescription className="text-sm">Latest snapshot insight for the workforce. Use filters to refine the leaderboard.</CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline">Snapshot {formatDate(appliedSnapshotDate)}</Badge>
                                <Badge variant="outline">{appliedStatus === 'all' ? 'All statuses' : appliedStatus.charAt(0).toUpperCase() + appliedStatus.slice(1)}</Badge>
                                <Badge variant="outline">{appliedGradeLetter === 'all' ? 'All grades' : `Grade ${appliedGradeLetter}`}</Badge>
                                <Badge variant="outline">{appliedPerPage} per page</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableHead className="whitespace-nowrap">Rank</TableHead>
                                            <TableHead className="whitespace-nowrap">Driver</TableHead>
                                            <TableHead className="whitespace-nowrap">Status</TableHead>
                                            <TableHead className="whitespace-nowrap">Grade</TableHead>
                                            <TableHead className="whitespace-nowrap">Snapshot info</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">No graded drivers found for this snapshot.</TableCell>
                                            </TableRow>
                                        ) : (
                                            rows.map((row, index) => {
                                                const rowNumber = (paginator?.meta?.from ?? 1) + index;
                                                const overallLetter = row.grade?.overall?.letter ?? '—';
                                                const overallScore = row.grade?.overall?.score ?? null;
                                                return (
                                                    <TableRow key={row.id ?? `${row.name}-${rowNumber}`} className="divide-x divide-slate-200/40 odd:bg-white even:bg-slate-50/40 hover:bg-slate-100/60 dark:divide-slate-800/50 dark:odd:bg-slate-900/40 dark:even:bg-slate-900/20 dark:hover:bg-slate-800/50">
                                                        <TableCell className="whitespace-nowrap text-sm font-semibold text-slate-600 dark:text-slate-200">{rowNumber}</TableCell>
                                                        <TableCell className="whitespace-nowrap">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="font-semibold text-slate-900 dark:text-slate-50">{row.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">
                                                            <Badge className={statusBadgeTone(row.status)}>{row.status ?? 'Unknown'}</Badge>
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">
                                                            <div className="flex flex-col gap-1">
                                                                <Badge className={gradeBadgeTone(overallLetter)}>Grade {overallLetter}</Badge>
                                                                <span className="text-sm text-muted-foreground">Score {formatScore(overallScore)}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-sm text-slate-900 dark:text-slate-50">{formatDateTime(row.snapshot?.calculated_at)}</span>
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
                            </div>
                            <div className="border-t border-slate-200/60 bg-slate-50/60 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-900/60">
                                <InertiaPagination from={paginator?.meta?.from ?? undefined} to={paginator?.meta?.to ?? undefined} total={paginator?.meta?.total ?? undefined} links={paginator?.links} currentPage={paginator?.meta?.current_page ?? undefined} lastPage={paginator?.meta?.last_page ?? undefined} />
                            </div>
                        </CardContent>
                    </Card>
            </div>
        </ReportPageLayout>
    );
}
