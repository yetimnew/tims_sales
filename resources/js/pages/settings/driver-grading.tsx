import DriverGradingSettingsController from '@/actions/App/Http/Controllers/Settings/DriverGradingSettingsController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InertiaPagination } from '@/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, router } from '@inertiajs/react';
import * as React from 'react';
import { edit as profileSettingsRoute } from '@/routes/profile';
import { edit as editSettingsRoute } from '@/routes/settings/driver-grading';
import { driverGrading as driverGradingReport } from '@/routes/reports';
import { Info, Loader2, RefreshCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WeightSettings {
    performance_weight: number;
    efficiency_weight: number;
    safety_weight: number;
    compliance_weight: number;
    engagement_weight: number;
}

interface SettingsPayload {
    weights: WeightSettings;
    peer_sample_size: number;
    grade_thresholds: GradeThresholdSettings;
    last_updated_at?: string | null;
    updated_by?: { id: number; name: string } | null;
}

interface DriverGradingSettingsProps {
    settings: SettingsPayload;
    driverGrades: PaginatorData;
    filters: FilterState;
    filterOptions: FilterOptions;
    latestCalculation: LatestCalculation;
    perPageOptions: number[];
    can: {
        update: boolean;
        recalculate: boolean;
    };
    flash?: {
        success?: string;
    };
}

type WeightKey = keyof WeightSettings;

type WeightConfig = {
    key: WeightKey;
    label: string;
    description: string;
    tooltip: string;
};

interface DriverGradeRow {
    id: number | null;
    name: string;
    driverid?: string;
    status?: string;
    hire_date?: string;
    grade?: GradeDetails;
    snapshot?: SnapshotMeta;
}

interface GradeDetails {
    overall?: {
        score?: number | null;
        letter?: string | null;
    };
    weights?: Record<string, number>;
    grade_thresholds?: Record<string, number>;
    categories?: Record<string, unknown>;
    metrics?: Record<string, unknown>;
}

interface SnapshotMeta {
    calculated_at?: string | null;
    calculated_by?: { id: number; name: string } | null;
}

interface PaginatorMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface PaginatorLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatorData {
    data: DriverGradeRow[];
    meta: PaginatorMeta;
    links: PaginatorLink[];
}

interface FilterState {
    snapshot_date?: string | null;
    status?: string | null;
    grade_letter?: string | null;
    per_page?: number;
}

interface FilterOptions {
    dates?: string[];
    statuses?: string[];
}

type LatestCalculation = {
    calculated_at?: string | null;
    calculated_by?: { id: number; name: string } | null;
    count?: number | null;
} | null;

const weightFields: WeightConfig[] = [
    {
        key: 'performance_weight',
        label: 'Performance',
        description: 'On-time delivery, route completion, and trip success rates.',
        tooltip: 'Measured from driver assignment completion rates and delivery timeliness. Drivers with consistent on-time records score higher.',
    },
    {
        key: 'efficiency_weight',
        label: 'Efficiency',
        description: 'Fuel economy and speed profile optimization.',
        tooltip: 'Calculated from fuel efficiency metrics and distance travelled per hour. Drivers who optimize routes and fuel usage improve this score.',
    },
    {
        key: 'safety_weight',
        label: 'Safety',
        description: 'Incident records, safety violations, and compliance history.',
        tooltip: 'Based on reported incidents, traffic violations, and safety checks. Fewer safety issues result in higher scores.',
    },
    {
        key: 'compliance_weight',
        label: 'Compliance',
        description: 'Maintenance updates, documentation, and regulatory adherence.',
        tooltip: 'Tracks completion of required maintenance, documentation accuracy, and regulatory compliance. Better compliance increases the score.',
    },
    {
        key: 'engagement_weight',
        label: 'Engagement',
        description: 'System usage, report submissions, and communication responsiveness.',
        tooltip: 'Measures system engagement, timely reporting, and responsiveness to communications. Active engaged drivers score higher.',
    },
];

const gradeLetters = ['A', 'B', 'C', 'D', 'E'] as const;
type GradeLetter = (typeof gradeLetters)[number];
type GradeThresholdSettings = Record<GradeLetter, number>;
type GradeThresholdState = Record<GradeLetter, string>;

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Settings',
        href: profileSettingsRoute().url,
    },
    {
        title: 'Driver grading',
        href: editSettingsRoute().url,
    },
];

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

const formatTimestamp = (value?: string | null): string | null => {
    if (!value) {
        return null;
    }

    try {
        return timestampFormatter.format(new Date(value));
    } catch (_error) {
        return null;
    }
};

const toThresholdState = (input?: Partial<GradeThresholdSettings>): GradeThresholdState => {
    return gradeLetters.reduce((accumulator, letter) => {
        const value = input?.[letter];

        accumulator[letter] = value === undefined || value === null ? '' : String(value);

        return accumulator;
    }, {} as GradeThresholdState);
};

const parseThreshold = (value: string): number | null => {
    if (value === '' || value === null) {
        return null;
    }

    const numeric = Number.parseFloat(value);

    return Number.isNaN(numeric) ? null : numeric;
};

const getGradeColor = (letter?: string | null): string => {
    switch (letter?.toUpperCase()) {
        case 'A':
            return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50';
        case 'B':
            return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50';
        case 'C':
            return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50';
        case 'D':
            return 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900/50';
        case 'E':
            return 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/50';
        default:
            return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-900/50';
    }
};

const formatScore = (value?: number | null): string => (typeof value !== 'number' ? '—' : value.toFixed(1));

export default function DriverGradingSettings({
    settings,
    driverGrades,
    filters,
    filterOptions,
    latestCalculation,
    perPageOptions,
    can,
    flash,
}: DriverGradingSettingsProps) {
    const [weights, setWeights] = React.useState<WeightSettings>({ ...settings.weights });
    const [peerSample, setPeerSample] = React.useState<number>(settings.peer_sample_size);
    const [gradeThresholds, setGradeThresholds] = React.useState<GradeThresholdState>(() =>
        toThresholdState(settings.grade_thresholds),
    );

    const [snapshotDate, setSnapshotDate] = React.useState<string>(filters?.snapshot_date ?? filterOptions?.dates?.[0] ?? '');
    const [status, setStatus] = React.useState<string>(filters?.status ?? 'all');
    const [gradeLetter, setGradeLetter] = React.useState<string>(filters?.grade_letter ?? 'all');
    const [perPage, setPerPage] = React.useState<number>(filters?.per_page ?? perPageOptions?.[0] ?? 10);
    const [isRecalculating, setIsRecalculating] = React.useState(false);

    React.useEffect(() => {
        setWeights({ ...settings.weights });
        setPeerSample(settings.peer_sample_size);
    }, [settings.weights, settings.peer_sample_size]);

    React.useEffect(() => {
        setGradeThresholds(toThresholdState(settings.grade_thresholds));
    }, [settings.grade_thresholds]);

    React.useEffect(() => {
        setSnapshotDate(filters?.snapshot_date ?? filterOptions?.dates?.[0] ?? '');
        setStatus(filters?.status ?? 'all');
        setGradeLetter(filters?.grade_letter ?? 'all');
        setPerPage(filters?.per_page ?? perPageOptions?.[0] ?? 10);
    }, [filters?.snapshot_date, filters?.status, filters?.grade_letter, filters?.per_page, filterOptions?.dates, perPageOptions]);

    const totalWeight = React.useMemo(() => {
        return weightFields.reduce((sum, field) => sum + (weights[field.key] ?? 0), 0);
    }, [weights]);

    const parsedThresholds = React.useMemo(() => {
        return gradeLetters.reduce((accumulator, letter) => {
            accumulator[letter] = parseThreshold(gradeThresholds[letter]);
            return accumulator;
        }, {} as Record<GradeLetter, number | null>);
    }, [gradeThresholds]);

    const thresholdIssue = React.useMemo(() => {
        let previous = 100;

        for (let index = 0; index < gradeLetters.length - 1; index += 1) {
            const letter = gradeLetters[index];
            const value = parsedThresholds[letter];

            if (value === null) {
                return `Grade ${letter} threshold is required.`;
            }

            if (value > previous) {
                const priorLabel = index === 0 ? '100' : `grade ${gradeLetters[index - 1]}`;
                return `Grade ${letter} must be less than or equal to ${priorLabel}.`;
            }

            previous = value;
        }

        const gradeD = parsedThresholds.D;

        if (gradeD === null) {
            return 'Grade D threshold is required.';
        }

        const gradeE = parsedThresholds.E;

        if (gradeE !== null && gradeE !== 0) {
            return 'Grade E threshold must be 0.';
        }

        return null;
    }, [parsedThresholds]);

    const gradeRangePreview = React.useMemo(() => {
        return gradeLetters.map((letter, index) => {
            const current = parsedThresholds[letter];

            if (current === null) {
                return 'Set a value to define this range.';
            }

            if (index === 0) {
                return `Scores >= ${current}%`;
            }

            const previousLetter = gradeLetters[index - 1];
            const previousValue = parsedThresholds[previousLetter];

            if (letter === 'E') {
                return previousValue !== null ? `Scores < ${previousValue}%` : 'Scores below grade D.';
            }

            if (previousValue === null) {
                return `Scores >= ${current}%`;
            }

            return `Scores >= ${current}% and < ${previousValue}%`;
        });
    }, [parsedThresholds]);

    const remaining = 100 - totalWeight;
    const lastUpdated = formatTimestamp(settings.last_updated_at);
    const disabled = !can.update;

    const disableThresholdSubmit = disabled || Boolean(thresholdIssue);
    const disableWeightSubmit = disabled || remaining !== 0;

    const handleRecalculate = React.useCallback(async () => {
        if (isRecalculating || !can.recalculate) return;

        try {
            setIsRecalculating(true);

            const formData = new FormData();
            formData.append('snapshot_date', snapshotDate);
            if (status !== 'all') {
                formData.append('status', status);
            }

            const response = await fetch(DriverGradingSettingsController.recalculate.url(), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to recalculate');
            }

            router.reload({ preserveScroll: true, preserveState: true });
            toast({
                title: '✅ Grades Recalculated',
                description: 'Driver grades have been updated successfully.',
            });
        } catch (error) {
            console.error('Recalculation error:', error);
            toast({
                title: '❌ Recalculation Failed',
                description: 'Failed to recalculate driver grades. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsRecalculating(false);
        }
    }, [snapshotDate, status, can.recalculate, isRecalculating]);

    const handleFilterChange = React.useCallback(() => {
        const query: Record<string, any> = {};
        if (snapshotDate) query.snapshot_date = snapshotDate;
        if (status !== 'all') query.status = status;
        if (gradeLetter !== 'all') query.grade_letter = gradeLetter;
        if (perPage) query.per_page = perPage;

        router.get(editSettingsRoute().url, query, { preserveScroll: true, preserveState: true });
    }, [snapshotDate, status, gradeLetter, perPage]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Driver grading" />

            <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-12">
                        <Heading
                            title="Driver grading"
                            description="Tune how drivers are scored. Configure weights and grade bands, then review results in the dedicated report."
                        />

                        {flash?.success ? (
                            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                                {flash.success}
                            </div>
                        ) : null}

                        <Card>
                            <CardHeader>
                                <CardTitle>Fleet grading overview</CardTitle>
                                <CardDescription>
                                    Adjust how much each category contributes to the overall driver grade. The total must be 100% before you can
                                    save changes.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total assigned</p>
                                    <p className="text-2xl font-semibold">{totalWeight}%</p>
                                </div>
                                <div className="md:text-right">
                                    <p className="text-sm text-muted-foreground">Remaining</p>
                                    <p className="text-2xl font-semibold">{remaining}%</p>
                                </div>

                                <div className="md:col-span-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                    {lastUpdated ? (
                                        <p className="flex-1 min-w-[200px]">
                                            Last updated {lastUpdated}
                                            {settings.updated_by ? ` by ${settings.updated_by.name}` : ''}.
                                        </p>
                                    ) : (
                                        <p className="flex-1 min-w-[200px]">Weights are using the default configuration.</p>
                                    )}
                                    <Button asChild variant="outline" size="sm" className="shrink-0">
                                        <Link href={driverGradingReport().url}>View driver grading report</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Form
                            {...DriverGradingSettingsController.updateGradeThresholds.form()}
                            options={{ preserveScroll: true }}
                            className="space-y-4"
                        >
                            {({ processing, recentlySuccessful, errors }) => (
                                <>
                                    <input type="hidden" name="_method" value="PATCH" />

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Grade thresholds</CardTitle>
                                            <CardDescription>
                                                Set the minimum score required for each grade. Ranges cascade automatically from top to bottom.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid gap-4 md:grid-cols-5">
                                                {gradeLetters.map((letter, index) => {
                                                    const fieldErrorKey = `grade_thresholds.${letter}`;

                                                    return (
                                                        <div key={letter} className="space-y-2">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <Label htmlFor={`grade-threshold-${letter}`}>Grade {letter}</Label>
                                                                {letter === 'E' ? (
                                                                    <span className="text-xs text-muted-foreground">Auto fail</span>
                                                                ) : null}
                                                            </div>
                                                            <Input
                                                                id={`grade-threshold-${letter}`}
                                                                type="number"
                                                                inputMode="numeric"
                                                                name={`grade_thresholds[${letter}]`}
                                                                min={0}
                                                                max={100}
                                                                step={0.01}
                                                                value={gradeThresholds[letter]}
                                                                disabled={disabled}
                                                                onChange={event =>
                                                                    setGradeThresholds(current => ({
                                                                        ...current,
                                                                        [letter]: event.target.value,
                                                                    }))
                                                                }
                                                            />
                                                            <p className="text-xs text-muted-foreground">{gradeRangePreview[index]}</p>
                                                            <InputError className="text-xs" message={errors?.[fieldErrorKey]} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {thresholdIssue ? (
                                                <p className="text-sm text-destructive">{thresholdIssue}</p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    Grades cascade from A through E. Ensure each threshold is less than or equal to the one above it and
                                                    set grade E to 0.
                                                </p>
                                            )}
                                            <InputError className="text-sm" message={errors?.grade_thresholds} />
                                            <div className="flex flex-wrap items-center gap-4">
                                                <Button type="submit" disabled={disableThresholdSubmit || processing}>
                                                    {processing ? 'Saving…' : 'Save grade thresholds'}
                                                </Button>
                                                <Transition
                                                    show={recentlySuccessful}
                                                    enter="transition ease-out duration-150"
                                                    enterFrom="opacity-0"
                                                    enterTo="opacity-100"
                                                    leave="transition ease-in duration-150"
                                                    leaveFrom="opacity-100"
                                                    leaveTo="opacity-0"
                                                >
                                                    <p className="text-sm text-muted-foreground">Saved</p>
                                                </Transition>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </Form>

                        <Form
                            {...DriverGradingSettingsController.updateWeights.form()}
                            options={{ preserveScroll: true }}
                            className="space-y-6"
                        >
                            {({ processing, recentlySuccessful, errors }) => (
                                <>
                                    <input type="hidden" name="_method" value="PATCH" />

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Peer comparison</CardTitle>
                                            <CardDescription>
                                                Define how many similar drivers the grading engine should use for comparisons.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid gap-4 md:grid-cols-[1fr_200px] md:items-end">
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    We prioritise drivers with similar vehicle types and routes. If fewer drivers are available, we fall back to
                                                    the wider driver pool.
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="peer-sample">Peer sample size</Label>
                                                <Input
                                                    id="peer-sample"
                                                    name="peer_sample_size"
                                                    type="number"
                                                    min={1}
                                                    max={100}
                                                    value={peerSample}
                                                    disabled={disabled}
                                                    onChange={event => setPeerSample(Number.parseInt(event.target.value || '0', 10))}
                                                />
                                                <p className="text-xs text-muted-foreground">Recommended: 8-15 drivers.</p>
                                                <InputError className="text-sm" message={errors?.peer_sample_size} />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Category weights</CardTitle>
                                            <CardDescription>
                                                Enter the weighting for each grading category. Weights must total 100%.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {weightFields.map(field => (
                                                <div key={field.key} className="grid gap-2 md:grid-cols-[1fr_160px] md:items-center">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <Label htmlFor={field.key}>{field.label}</Label>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        type="button"
                                                                        className="rounded-full p-1 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                                        aria-label={`How ${field.label.toLowerCase()} is calculated`}
                                                                    >
                                                                        <Info className="h-4 w-4" aria-hidden="true" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent align="start" side="top">
                                                                    {field.tooltip}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{field.description}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            id={field.key}
                                                            type="number"
                                                            inputMode="numeric"
                                                            name={field.key}
                                                            min={0}
                                                            max={100}
                                                            value={weights[field.key] ?? 0}
                                                            disabled={disabled}
                                                            onChange={event =>
                                                                setWeights(current => ({
                                                                    ...current,
                                                                    [field.key]: Number.parseInt(event.target.value || '0', 10),
                                                                }))
                                                            }
                                                        />
                                                        <span className="text-sm text-muted-foreground">%</span>
                                                    </div>
                                                    <InputError className="text-xs" message={errors?.[field.key]} />
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    <div className="flex flex-wrap items-center gap-4">
                                        <Button type="submit" disabled={disableWeightSubmit || processing}>
                                            {processing ? 'Saving…' : 'Save weights'}
                                        </Button>

                                        {remaining !== 0 ? (
                                            <p className="text-sm text-destructive">
                                                Adjust the weights so the total equals 100% (currently {totalWeight}%).
                                            </p>
                                        ) : null}

                                        <InputError className="text-sm" message={errors?.weights} />

                                        <Transition
                                            show={recentlySuccessful}
                                            enter="transition ease-out duration-150"
                                            enterFrom="opacity-0"
                                            enterTo="opacity-100"
                                            leave="transition ease-in duration-150"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <p className="text-sm text-muted-foreground">Saved</p>
                                        </Transition>
                                    </div>
                                </>
                            )}
                        </Form>

                        {/* Driver Grades Report */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Latest driver grades</CardTitle>
                                <CardDescription>
                                    {latestCalculation?.calculated_at ? (
                                        <>
                                            Calculated{' '}
                                            {formatTimestamp(latestCalculation.calculated_at) ?? new Date(latestCalculation.calculated_at).toLocaleDateString()}
                                            {latestCalculation.calculated_by ? ` by ${latestCalculation.calculated_by.name}` : ''}
                                            {latestCalculation.count ? ` • ${latestCalculation.count} drivers` : ''}
                                        </>
                                    ) : (
                                        'No calculations yet'
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap items-end gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="snapshot-date">Snapshot date</Label>
                                        <Select value={snapshotDate} onValueChange={setSnapshotDate}>
                                            <SelectTrigger id="snapshot-date" className="w-48">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filterOptions?.dates?.map(date => (
                                                    <SelectItem key={date} value={date}>
                                                        {new Date(date).toLocaleDateString()}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="filter-status">Status</Label>
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger id="filter-status" className="w-48">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All statuses</SelectItem>
                                                {filterOptions?.statuses?.map(s => (
                                                    <SelectItem key={s} value={s}>
                                                        {s}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="filter-grade">Grade</Label>
                                        <Select value={gradeLetter} onValueChange={setGradeLetter}>
                                            <SelectTrigger id="filter-grade" className="w-48">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All grades</SelectItem>
                                                {['A', 'B', 'C', 'D', 'E'].map(letter => (
                                                    <SelectItem key={letter} value={letter}>
                                                        Grade {letter}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button onClick={handleFilterChange} variant="outline" size="sm">
                                            Apply filters
                                        </Button>
                                        <Button
                                            onClick={handleRecalculate}
                                            disabled={isRecalculating || !can.recalculate}
                                            variant="outline"
                                            size="sm"
                                        >
                                            {isRecalculating ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Recalculating…
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                                    Recalculate
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <div className="rounded-lg border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Driver</TableHead>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Hired</TableHead>
                                                <TableHead className="text-right">Score</TableHead>
                                                <TableHead className="text-center">Grade</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {driverGrades?.data?.length > 0 ? (
                                                driverGrades.data.map(row => (
                                                    <TableRow key={row.id}>
                                                        <TableCell className="font-medium">{row.name}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">{row.driverid ?? '—'}</TableCell>
                                                        <TableCell>{row.status ?? '—'}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {row.hire_date ? new Date(row.hire_date).toLocaleDateString() : '—'}
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold">
                                                            {formatScore(row.grade?.overall?.score)}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge className={`${getGradeColor(row.grade?.overall?.letter)} border`}>
                                                                {row.grade?.overall?.letter ?? 'N/A'}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                                        No driver grades found. Run a recalculation to populate results.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {driverGrades?.data?.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Showing {driverGrades.meta?.from} to {driverGrades.meta?.to} of {driverGrades.meta?.total} drivers
                                            </span>
                                            <Select value={String(perPage)} onValueChange={v => setPerPage(Number.parseInt(v, 10))}>
                                                <SelectTrigger className="w-auto">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {perPageOptions?.map(option => (
                                                        <SelectItem key={option} value={String(option)}>
                                                            {option} per page
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {driverGrades?.links && (
                                            <InertiaPagination links={driverGrades.links} meta={driverGrades.meta} />
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

