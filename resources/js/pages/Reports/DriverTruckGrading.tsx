import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';
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

type QueryParamValue = string | number | boolean | null | undefined | Array<string | number | boolean>;
import {
    CalendarClock,
    Gauge,
    Link as LinkIcon,
    LineChart,
    ListFilter,
    Loader2,
    RefreshCcw,
    Settings,
    Truck,
    User,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { ReportPageLayout } from '@/components/report/report-page-layout';

type GradeDetails = {
    overall?: { score?: number | null; letter?: string | null };
    categories?: Record<string, unknown> | null;
    weights?: Record<string, number> | null;
    grade_thresholds?: Record<string, number> | null;
    metrics?: Record<string, unknown> | null;
};

type SnapshotMeta = {
    calculated_at?: string | null;
    calculated_by?: { id: number; name: string } | null;
};

type AssignmentRow = {
    id: number | null;
    driver?: { id: number; name?: string | null } | null;
    truck?: { id: number; plate?: string | null } | null;
    status?: string | null;
    is_attached?: boolean | null;
    grade?: GradeDetails | null;
    snapshot?: SnapshotMeta | null;
};

type Filters = {
    snapshot_date?: string | null;
    status?: string | null;
    attachment_state?: string | null;
    grade_letter?: string | null;
    per_page?: number | null;
};

type FilterOptions = {
    dates?: string[];
    statuses?: string[];
    attachment_states?: string[];
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

type Paginator = { data?: AssignmentRow[]; meta?: PaginationMeta; links?: PaginationLink[] };

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
    { title: 'Reports', href: '/reports/driver-truck-grading' },
    { title: 'Driver-truck grading', href: '/reports/driver-truck-grading' },
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
    if (normalized === 'inactive') return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
    if (normalized === 'reassigned') return 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200';
    return 'bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-200';
};

const attachmentBadgeTone = (value?: boolean | null): string => {
    if (value === true) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
    if (value === false) return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200';
    return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
};

const resolveQuery = (value: Filters): Record<string, QueryParamValue> => {
    const query: Record<string, QueryParamValue> = {};

    if (value.snapshot_date) query.snapshot_date = value.snapshot_date;
    if (value.status) query.status = value.status;
    if (value.attachment_state) query.attachment_state = value.attachment_state;
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

export default function DriverTruckGradingReport({ filters, filterOptions, paginator, latestCalculation, perPageOptions, can }: Props) {
    const rows = useMemo<AssignmentRow[]>(() => (Array.isArray(paginator?.data) ? paginator.data : []), [paginator?.data]);
    const snapshotDates = useMemo<string[]>(() => (Array.isArray(filterOptions?.dates) ? filterOptions.dates : []), [filterOptions?.dates]);
    const statusOptions = useMemo<string[]>(() => (Array.isArray(filterOptions?.statuses) ? filterOptions.statuses : []), [filterOptions?.statuses]);
    const attachmentOptions = useMemo<string[]>(() => (Array.isArray(filterOptions?.attachment_states) ? filterOptions.attachment_states : []), [filterOptions?.attachment_states]);
    const availablePerPageOptions = useMemo(() => (perPageOptions && perPageOptions.length > 0 ? perPageOptions : fallBackPerPageOptions), [perPageOptions]);

    // Calculate min/max dates for date picker
    const minSnapshotDate = useMemo(() => snapshotDates[snapshotDates.length - 1] ?? null, [snapshotDates]);
    const maxSnapshotDate = useMemo(() => snapshotDates[0] ?? null, [snapshotDates]);
    const canRecalculate = can?.recalculate ?? false;

    const [recalculationNotice, setRecalculationNotice] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
    const [recalculating, setRecalculating] = useState(false);

    const [snapshotDate, setSnapshotDate] = useState(filters?.snapshot_date ?? snapshotDates[0] ?? '');
    const [status, setStatus] = useState<string>(filters?.status ?? 'all');
    const [attachmentState, setAttachmentState] = useState<string>(filters?.attachment_state ?? 'all');
    const [gradeLetter, setGradeLetter] = useState<string>(filters?.grade_letter ?? 'all');
    const [perPage, setPerPage] = useState<number>(filters?.per_page ?? paginator?.meta?.per_page ?? availablePerPageOptions[0] ?? 10);
    const [filtersOpen, setFiltersOpen] = useState(false);

    useEffect(() => {
        setSnapshotDate(filters?.snapshot_date ?? snapshotDates[0] ?? '');
        setStatus(filters?.status ?? 'all');
        setAttachmentState(filters?.attachment_state ?? 'all');
        setGradeLetter(filters?.grade_letter ?? 'all');
        setPerPage(filters?.per_page ?? paginator?.meta?.per_page ?? availablePerPageOptions[0] ?? 10);
    }, [filters?.snapshot_date, filters?.status, filters?.attachment_state, filters?.grade_letter, filters?.per_page, snapshotDates, availablePerPageOptions, paginator?.meta?.per_page]);

    const appliedSnapshotDate = filters?.snapshot_date ?? snapshotDates[0] ?? '';
    const appliedStatus = filters?.status ?? 'all';
    const appliedAttachmentState = filters?.attachment_state ?? 'all';

    const gradeLetterOptions = useMemo(() => {
        const observed = new Set<string>(['A', 'B', 'C', 'D', 'E']);
        rows.forEach((row) => {
            const letter = row.grade?.overall?.letter;
            if (letter) observed.add(letter.toUpperCase());
        });
        return Array.from(observed);
    }, [rows]);

    const attachmentFilterOptions = useMemo(() => {
        const options = new Set<string>(attachmentOptions);
        rows.forEach((row) => {
            if (row.is_attached === true) options.add('attached');
            if (row.is_attached === false) options.add('detached');
        });
        return Array.from(options);
    }, [attachmentOptions, rows]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (snapshotDate && snapshotDate !== (filters?.snapshot_date ?? snapshotDates[0] ?? '')) count += 1;
        if (status !== (filters?.status ?? 'all')) count += 1;
        if (attachmentState !== (filters?.attachment_state ?? 'all')) count += 1;
        if (gradeLetter !== (filters?.grade_letter ?? 'all')) count += 1;
        if (perPage !== (filters?.per_page ?? paginator?.meta?.per_page ?? availablePerPageOptions[0] ?? 10)) count += 1;
        return count;
    }, [snapshotDate, status, attachmentState, gradeLetter, perPage, filters?.snapshot_date, filters?.status, filters?.attachment_state, filters?.grade_letter, filters?.per_page, snapshotDates, availablePerPageOptions, paginator?.meta?.per_page]);

    const handleGenerateReport = () => {
        setFiltersOpen(false);
        const query = resolveQuery({
            snapshot_date: snapshotDate || null,
            status: status === 'all' ? null : status,
            attachment_state: attachmentState === 'all' ? null : attachmentState,
            grade_letter: gradeLetter === 'all' ? null : gradeLetter,
            per_page: perPage,
        });
        router.get('/reports/driver-truck-grading', query, { preserveScroll: true, preserveState: true });
    };

    const handleReset = () => {
        setSnapshotDate(snapshotDates[0] ?? '');
        setStatus('all');
        setAttachmentState('all');
        setGradeLetter('all');
        setPerPage(availablePerPageOptions[0] ?? 10);
        setFiltersOpen(false);
        router.get('/reports/driver-truck-grading', undefined, { preserveScroll: true, preserveState: false });
    };

    const handleSnapshotDateChange = (newDate: string) => {
        setSnapshotDate(newDate);
        // Reset other filters when snapshot date changes
        // to avoid no-results due to incompatible filter combinations
        setStatus('all');
        setAttachmentState('all');
        setGradeLetter('all');
    };

    const handleRecalculateSnapshot = useCallback(async () => {
        if (!canRecalculate || !appliedSnapshotDate || recalculating) return;
        setRecalculationNotice(null);
        setRecalculating(true);
        const { header: csrfHeaderToken, cookie: csrfCookieToken } = resolveCsrfTokens();
        const payload: Record<string, unknown> = { snapshot_date: appliedSnapshotDate };
        if (appliedStatus !== 'all') payload.status = appliedStatus;
        if (appliedAttachmentState !== 'all') payload.attachment_state = appliedAttachmentState;

        try {
            const response = await fetch('/settings/driver-truck-grading/recalculate', {
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
            setRecalculationNotice({ status: 'success', message: body.message ?? 'Recalculated driver-truck grades for the selected filters.' });
            router.reload({ only: ['filters', 'filterOptions', 'paginator', 'latestCalculation'], preserveScroll: true, onFinish: () => setRecalculating(false), onError: () => setRecalculating(false) });
        } catch (error) {
            console.error(error);
            setRecalculationNotice({ status: 'error', message: 'Failed to recalculate driver-truck grades. Please try again shortly.' });
            setRecalculating(false);
        }
    }, [canRecalculate, appliedSnapshotDate, appliedStatus, appliedAttachmentState, recalculating]);

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

    const paginationMeta = paginator?.meta ?? {};
    const paginationLinks = Array.isArray(paginator?.links) ? paginator.links : [];

    const totalAssignments = paginationMeta.total ?? rows.length;

    const attachedCount = useMemo(() => rows.filter((row) => row.is_attached === true).length, [rows]);
    const detachedCount = useMemo(() => rows.filter((row) => row.is_attached === false).length, [rows]);

    const kpiCards = useMemo<ReadonlyArray<{ label: string; value: string; icon: LucideIcon; tone: string }>>(() => {
        const lastCalculatedAt = latestCalculation?.calculated_at ?? rows[0]?.snapshot?.calculated_at ?? null;
        const calculatedBy = latestCalculation?.calculated_by?.name ?? rows[0]?.snapshot?.calculated_by?.name ?? null;
        return [
            { label: 'Snapshot date', value: formatDate(appliedSnapshotDate), icon: CalendarClock, tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200' },
            { label: 'Assignments', value: String(totalAssignments), icon: Users, tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200' },
            { label: 'Average score', value: averageScore === null ? '—' : averageScore.toFixed(1), icon: Gauge, tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200' },
            { label: 'Top grade', value: topGrade ? `Grade ${topGrade}` : '—', icon: LineChart, tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200' },
            { label: 'Attached assignments', value: String(attachedCount), icon: LinkIcon, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200' },
            { label: 'Detached assignments', value: String(detachedCount), icon: RefreshCcw, tone: 'bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200' },
            { label: 'Last calculated', value: formatDateTime(lastCalculatedAt), icon: CalendarClock, tone: 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-200' },
            { label: 'Calculated by', value: calculatedBy ?? '—', icon: Settings, tone: 'bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200' },
        ];
    }, [appliedSnapshotDate, totalAssignments, averageScore, topGrade, attachedCount, detachedCount, latestCalculation, rows]);

    const recalculationTone = useMemo(() => {
        if (!recalculationNotice) return '';
        return recalculationNotice.status === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200'
            : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200';
    }, [recalculationNotice]);

    return (
        <ReportPageLayout
            title="Driver-truck grading report"
            breadcrumbs={breadcrumbs}
            icon={<LinkIcon className="h-6 w-6" />}
            filters={
                <>
                    <Button asChild variant="secondary" className="gap-2">
                        <Link href="/settings/driver-truck-grading">
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
                                            <DialogTitle>Filter graded assignments</DialogTitle>
                                            <DialogDescription>Select snapshot and assignment filters before regenerating the leaderboard.</DialogDescription>
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
                                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Assignment status</label>
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
                                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Attachment state</label>
                                                        <Select value={attachmentState} onValueChange={setAttachmentState}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="All attachment states" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">All assignments</SelectItem>
                                                                {attachmentFilterOptions.map((option) => (
                                                                    <SelectItem key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
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
                    {recalculationNotice ? (
                        <div className={`rounded-lg border px-4 py-3 text-sm transition ${recalculationTone}`}>{recalculationNotice.message}</div>
                    ) : null}
                    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {kpiCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <Card key={card.label} className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                                    <CardContent className="flex items-center gap-3 p-4">
                                        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${card.tone}`}>
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{card.label}</p>
                                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{card.value}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </section>
                </>
            }
            canExport={false}
            contentClassName="p-0"
        >
            <div className="space-y-6 p-6">
                <section className="rounded-2xl border border-slate-200 bg-slate-50/50 shadow-sm dark:border-slate-800 dark:bg-slate-800/50">
                        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>Driver-truck assignment leaderboard</CardTitle>
                                <CardDescription>Sorted by overall score (highest first) for the selected snapshot and filters.</CardDescription>
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                Showing {paginator?.meta?.from ?? 0}–{paginator?.meta?.to ?? 0} of {paginator?.meta?.total ?? 0} assignments
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[180px]">Assignment</TableHead>
                                            <TableHead className="min-w-[120px]">Status</TableHead>
                                            <TableHead className="min-w-[120px]">Attachment</TableHead>
                                            <TableHead className="min-w-[140px]">Overall score</TableHead>
                                            <TableHead className="min-w-[110px]">Grade</TableHead>
                                            <TableHead className="min-w-[200px]">Snapshot details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                                    No driver-truck grades found. Run a recalculation to populate results.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            rows.map((row) => {
                                                const score = row.grade?.overall?.score;
                                                const letter = row.grade?.overall?.letter;
                                                const driverName = row.driver?.name ?? '—';
                                                const truckPlate = row.truck?.plate ?? '—';

                                                return (
                                                    <TableRow key={row.id ?? `${driverName}-${truckPlate}`}>
                                                        <TableCell>
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2">
                                                                    <User className="h-4 w-4 text-slate-400" />
                                                                    <span className="font-medium text-slate-900 dark:text-slate-50">{driverName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                                    <Truck className="h-4 w-4" />
                                                                    <span>{truckPlate}</span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={statusBadgeTone(row.status)}>{row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'Unknown'}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={attachmentBadgeTone(row.is_attached)}>{row.is_attached ? 'Attached' : 'Detached'}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="text-base font-semibold text-slate-900 dark:text-slate-100">{formatScore(score)}</span>
                                                                <span className="text-xs text-slate-500 dark:text-slate-400">Weighted</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={gradeBadgeTone(letter)}>{letter ?? '—'}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
                                                                <p>Calculated {formatDateTime(row.snapshot?.calculated_at)}</p>
                                                                <p>{row.snapshot?.calculated_by?.name ? `By ${row.snapshot.calculated_by.name}` : '—'}</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <InertiaPagination
                                links={paginationLinks}
                                from={paginationMeta.from ?? undefined}
                                to={paginationMeta.to ?? undefined}
                                total={paginationMeta.total ?? undefined}
                                currentPage={paginationMeta.current_page ?? undefined}
                                lastPage={paginationMeta.last_page ?? undefined}
                            />
                        </CardContent>
                    </section>
            </div>
        </ReportPageLayout>
    );
}
