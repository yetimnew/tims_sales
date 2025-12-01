import { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarClock, Gauge, Loader2, RefreshCcw, Save, Settings, SlidersHorizontal } from 'lucide-react';

type GradeWeights = Record<string, number>;
type Thresholds = Record<string, number>;

type LatestCalculation = { calculated_at?: string | null; calculated_by?: { id: number; name: string } | null; count?: number | null } | null;

type SettingsData = {
    weights?: GradeWeights;
    thresholds?: Thresholds;
    peer_sample_size?: number;
};

type Filters = { snapshot_date?: string | null; status?: string | null };

type FilterOptions = { dates?: string[]; statuses?: string[] };

type Props = {
    settings: SettingsData;
    filters: Filters;
    filterOptions: FilterOptions;
    latestCalculation: LatestCalculation;
    can?: { recalculate: boolean };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings/driver-grading' },
    { title: 'Driver grading', href: '/settings/driver-grading' },
];

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

export default function DriverGradingSettings({ settings, filters, filterOptions, latestCalculation, can }: Props) {
    const [weights, setWeights] = useState<GradeWeights>(settings?.weights ?? {});
    const [thresholds, setThresholds] = useState<Thresholds>(settings?.thresholds ?? {});
    const [peerSampleSize, setPeerSampleSize] = useState<number>(settings?.peer_sample_size ?? 50);

    const [snapshotDate, setSnapshotDate] = useState<string>(filters?.snapshot_date ?? filterOptions?.dates?.[0] ?? '');
    const [status, setStatus] = useState<string>(filters?.status ?? 'all');

    const [saving, setSaving] = useState(false);
    const [recalculating, setRecalculating] = useState(false);
    const [notice, setNotice] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        setWeights(settings?.weights ?? {});
        setThresholds(settings?.thresholds ?? {});
        setPeerSampleSize(settings?.peer_sample_size ?? 50);
    }, [settings?.weights, settings?.thresholds, settings?.peer_sample_size]);

    useEffect(() => {
        setSnapshotDate(filters?.snapshot_date ?? filterOptions?.dates?.[0] ?? '');
        setStatus(filters?.status ?? 'all');
    }, [filters?.snapshot_date, filters?.status, filterOptions?.dates]);

    const totalWeight = useMemo(() => Object.values(weights ?? {}).reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0), [weights]);

    const handleWeightChange = useCallback((key: string, value: number) => {
        setWeights((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleThresholdChange = useCallback((key: string, value: number) => {
        setThresholds((prev) => ({ ...prev, [key]: value }));
    }, []);

    const saveSettings = useCallback(async () => {
        setNotice(null);
        setSaving(true);
        const { header: csrfHeaderToken, cookie: csrfCookieToken } = resolveCsrfTokens();

        try {
            const response = await fetch('/settings/driver-grading', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfHeaderToken ? { 'X-CSRF-TOKEN': csrfHeaderToken } : {}),
                    ...(csrfCookieToken ? { 'X-XSRF-TOKEN': csrfCookieToken } : {}),
                },
                credentials: 'same-origin',
                body: JSON.stringify({ weights, thresholds, peer_sample_size: peerSampleSize }),
            });
            if (!response.ok) throw new Error(`Unexpected status code: ${response.status}`);
            setNotice({ status: 'success', message: 'Driver grading settings saved.' });
            router.reload({ only: ['settings'] });
        } catch (error) {
            console.error(error);
            setNotice({ status: 'error', message: 'Failed to save settings. Please try again.' });
        } finally {
            setSaving(false);
        }
    }, [weights, thresholds, peerSampleSize]);

    const recalculate = useCallback(async () => {
        setNotice(null);
        setRecalculating(true);
        const { header: csrfHeaderToken, cookie: csrfCookieToken } = resolveCsrfTokens();
        const payload: Record<string, unknown> = { snapshot_date: snapshotDate };
        if (status !== 'all') payload.status = status;
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
            setNotice({ status: 'success', message: body.message ?? 'Recalculation queued.' });
            router.reload({ only: ['latestCalculation'] });
        } catch (error) {
            console.error(error);
            setNotice({ status: 'error', message: 'Failed to recalculate. Please try again later.' });
        } finally {
            setRecalculating(false);
        }
    }, [snapshotDate, status]);

    const tone = useMemo(() => {
        if (!notice) return '';
        return notice.status === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200'
            : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200';
    }, [notice]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Driver grading settings" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Driver Grading</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Driver grading configuration</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">Adjust weights and thresholds used to compute driver grades. Recalculate snapshots to apply changes.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button type="button" variant="secondary" className="gap-2" onClick={saveSettings} disabled={saving}>
                                    {saving ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<Save className="h-4 w-4" />)}
                                    {saving ? 'Saving…' : 'Save settings'}
                                </Button>
                                {can?.recalculate ? (
                                    <Button type="button" className="gap-2" onClick={recalculate} disabled={recalculating || !snapshotDate}>
                                        {recalculating ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<Gauge className="h-4 w-4" />)}
                                        {recalculating ? 'Recalculating…' : 'Recalculate snapshot'}
                                    </Button>
                                ) : null}
                                <Button type="button" variant="outline" className="gap-2" onClick={() => router.reload({ preserveScroll: true })}>
                                    <RefreshCcw className="h-4 w-4" />
                                    Reset
                                </Button>
                            </div>
                        </div>
                        {notice ? (
                            <div className={`mt-4 rounded-lg border px-4 py-3 text-sm transition ${tone}`}>{notice.message}</div>
                        ) : null}
                    </header>

                    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardContent className="flex items-center gap-3 p-4">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200">
                                    <Settings className="h-5 w-5" />
                                </span>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Total weight</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{totalWeight.toFixed(2)}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardContent className="flex items-center gap-3 p-4">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200">
                                    <CalendarClock className="h-5 w-5" />
                                </span>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Snapshot</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{formatDate(filters?.snapshot_date ?? filterOptions?.dates?.[0] ?? null)}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardContent className="flex items-center gap-3 p-4">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
                                    <SlidersHorizontal className="h-5 w-5" />
                                </span>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Peer sample</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{peerSampleSize}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardContent className="flex items-center gap-3 p-4">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200">
                                    <Gauge className="h-5 w-5" />
                                </span>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Last calculated</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{formatDateTime(latestCalculation?.calculated_at)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Weights</CardTitle>
                                <CardDescription className="text-sm">Relative importance of each category. Sum does not need to be 1.0 but will be normalized internally.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableHead>Category</TableHead>
                                            <TableHead>Weight</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.keys(weights ?? {}).length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={2} className="py-6 text-center text-sm text-muted-foreground">No categories configured.</TableCell>
                                            </TableRow>
                                        ) : (
                                            Object.entries(weights).map(([key, value]) => (
                                                <TableRow key={key} className="divide-x divide-slate-200/40 odd:bg-white even:bg-slate-50/40 dark:divide-slate-800/50 dark:odd:bg-slate-900/40 dark:even:bg-slate-900/20">
                                                    <TableCell className="whitespace-nowrap text-sm font-semibold text-slate-700 dark:text-slate-200">{key}</TableCell>
                                                    <TableCell>
                                                        <Input type="number" step="0.01" value={Number.isFinite(value) ? String(value) : ''} onChange={(e) => handleWeightChange(key, parseFloat(e.target.value))} className="max-w-[160px]" />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="border-t border-slate-200/60 bg-slate-50/60 px-4 py-3 text-sm dark:border-slate-700/60 dark:bg-slate-900/60">
                                <span className="text-muted-foreground">Total weight</span>{' '}
                                <Badge variant="outline" className="ml-2">{totalWeight.toFixed(2)}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Thresholds</CardTitle>
                                <CardDescription className="text-sm">Score thresholds used when mapping numeric scores to letter grades.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableHead>Letter</TableHead>
                                            <TableHead>Min score</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.keys(thresholds ?? {}).length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={2} className="py-6 text-center text-sm text-muted-foreground">No thresholds configured.</TableCell>
                                            </TableRow>
                                        ) : (
                                            Object.entries(thresholds).map(([key, value]) => (
                                                <TableRow key={key} className="divide-x divide-slate-200/40 odd:bg-white even:bg-slate-50/40 dark:divide-slate-800/50 dark:odd:bg-slate-900/40 dark:even:bg-slate-900/20">
                                                    <TableCell className="whitespace-nowrap text-sm font-semibold text-slate-700 dark:text-slate-200">Grade {key}</TableCell>
                                                    <TableCell>
                                                        <Input type="number" step="0.1" value={Number.isFinite(value) ? String(value) : ''} onChange={(e) => handleThresholdChange(key, parseFloat(e.target.value))} className="max-w-[160px]" />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Snapshot & status</CardTitle>
                                <CardDescription className="text-sm">Choose a snapshot date and optional driver status to target when recalculating.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 p-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Snapshot date</Label>
                                    <Select value={snapshotDate} onValueChange={setSnapshotDate}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select snapshot" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(filterOptions?.dates ?? []).map((date) => (
                                                <SelectItem key={date} value={date}>{formatDate(date)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Driver status</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All statuses</SelectItem>
                                            {(filterOptions?.statuses ?? []).map((s) => (
                                                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="max-w-sm space-y-2">
                                <Label>Peer sample size</Label>
                                <Input type="number" min={1} step={1} value={peerSampleSize} onChange={(e) => setPeerSampleSize(parseInt(e.target.value, 10))} />
                                <p className="text-xs text-muted-foreground">Used by the grading service to normalize scores across a peer group.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
