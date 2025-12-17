import DriverTruckGradingSettingsController from '@/actions/App/Http/Controllers/Settings/DriverTruckGradingSettingsController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InertiaPagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, router } from '@inertiajs/react';
import * as React from 'react';
import { edit as driverTruckGradingRoute } from '@/routes/settings/driver-truck-grading';
import { ArrowUpRight, Info, Activity } from 'lucide-react';

type GradeLetter = 'A' | 'B' | 'C' | 'D' | 'E';

const gradeLetters: GradeLetter[] = ['A', 'B', 'C', 'D', 'E'];

interface WeightSettings {
    performance_weight: number;
    efficiency_weight: number;
    consistency_weight: number;
}

interface GradeThresholdSettings extends Record<GradeLetter, number> {}

interface GradeThresholdState extends Record<GradeLetter, string> {}

interface GradeSummary {
    score: number;
    letter: string;
}

type GradeCategoryKey = 'performance' | 'efficiency' | 'consistency';

interface GradeCategoryDetails {
    score: number;
    metrics: Record<string, number | null>;
}

interface GradeWeights extends WeightSettings {}

interface AssignmentGrade {
    overall?: GradeSummary | null;
    weights?: GradeWeights | null;
    categories?: Partial<Record<GradeCategoryKey, GradeCategoryDetails>> | null;
    grade_thresholds?: Record<GradeLetter, number> | null;
}

interface AssignmentRow {
    id: number;
    driver?: { id: number; name: string } | null;
    truck?: { id: number; plate: string } | null;
    date_received?: string | null;
    status?: string | null;
    is_attached: boolean;
    grade?: AssignmentGrade | null;
}

interface Paginator<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface DriverTruckGradingSettingsProps {
    settings: {
        weights: WeightSettings;
        peer_sample_size: number;
        grade_thresholds: GradeThresholdSettings;
        last_updated_at?: string | null;
        updated_by?: { id: number; name: string } | null;
    };
    can: {
        update: boolean;
    };
    flash?: {
        success?: string;
    };
    assignments: Paginator<AssignmentRow>;
    perPageOptions: number[];
    filters: {
        per_page: number;
    };
}

type WeightConfig = {
    key: keyof WeightSettings;
    label: string;
    description: string;
    tooltip: string;
};

const weightFields: WeightConfig[] = [
    {
        key: 'performance_weight',
        label: 'Performance',
        description: 'Trips completed, ton-kilometres delivered, and distance covered.',
        tooltip: 'Performance looks at trip completion counts, total kilometres travelled, and tonnage delivered versus peer assignments.',
    },
    {
        key: 'efficiency_weight',
        label: 'Efficiency',
        description: 'Fuel usage and cost per kilometre for the assignment.',
        tooltip: 'Efficiency compares fuel consumption and cost per kilometre against peers while factoring in average trip distance.',
    },
    {
        key: 'consistency_weight',
        label: 'Consistency',
        description: 'Completion rate and average turnaround time for trips.',
        tooltip: 'Consistency monitors trip completion ratios and average duration between dispatch and return for each assignment.',
    },
];

const categoryLabels: Record<GradeCategoryKey, string> = {
    performance: 'Performance',
    efficiency: 'Efficiency',
    consistency: 'Consistency',
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Driver-truck grading',
        href: driverTruckGradingRoute.url(),
    },
];

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
});

const formatTimestamp = (value?: string | null): string | null => {
    if (!value) {
        return null;
    }

    try {
        return timestampFormatter.format(new Date(value));
    } catch (error) {
        return null;
    }
};

const formatDate = (value?: string | null): string => {
    if (!value) {
        return '—';
    }

    try {
        return dateFormatter.format(new Date(value));
    } catch (error) {
        return value;
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

const formatScore = (value?: number | null, digits = 1): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return Number(value).toFixed(digits);
};

export default function DriverTruckGradingSettings({
    settings,
    can,
    flash,
    assignments,
    perPageOptions,
    filters,
}: DriverTruckGradingSettingsProps) {
    const [weights, setWeights] = React.useState<WeightSettings>({ ...settings.weights });
    const [peerSample, setPeerSample] = React.useState<number>(settings.peer_sample_size);
    const [gradeThresholds, setGradeThresholds] = React.useState<GradeThresholdState>(() =>
        toThresholdState(settings.grade_thresholds),
    );

    React.useEffect(() => {
        setWeights({ ...settings.weights });
        setPeerSample(settings.peer_sample_size);
    }, [settings.weights, settings.peer_sample_size]);

    React.useEffect(() => {
        setGradeThresholds(toThresholdState(settings.grade_thresholds));
    }, [settings.grade_thresholds]);

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

    const meta = assignments.meta;
    const links = assignments.links;

    const handlePerPageChange = React.useCallback(
        (value: string) => {
            const numeric = Number.parseInt(value, 10);

            router.visit(
                driverTruckGradingRoute.url({
                    query: {
                        per_page: Number.isNaN(numeric) ? filters.per_page : numeric,
                    },
                }),
                {
                    preserveScroll: true,
                    preserveState: true,
                },
            );
        },
        [filters.per_page],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Driver-truck grading" />

            <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-12">
                        <Heading
                            title="Driver-truck grading"
                            description="Adjust how driver-truck assignments are evaluated. Tune category weights, manage grade bands, and review recent assignment grades."
                        />

                        {flash?.success ? (
                            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                                {flash.success}
                            </div>
                        ) : null}

                        <Card>
                            <CardHeader>
                                <CardTitle>Assignment grading overview</CardTitle>
                                <CardDescription>
                                    Configure the weighting for each grading category. The total must equal 100% before saving changes.
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
                                </div>
                            </CardContent>
                        </Card>

                        <Form
                            {...DriverTruckGradingSettingsController.updateGradeThresholds.form()}
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
                                                Set the minimum score for each grade. Ranges cascade from A through E.
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
                                                    Ensure each threshold is less than or equal to the grade above it and keep grade E at 0.
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
                            {...DriverTruckGradingSettingsController.updateWeights.form()}
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
                                                Choose how many peer assignments influence grading. We prioritise the same truck, then the same driver.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid gap-4 md:grid-cols-[1fr_200px] md:items-end">
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    Peers are used to calculate averages for each category. A higher sample provides a broader comparison but may include less similar assignments.
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
                                                    onChange={event =>
                                                        setPeerSample(Number.parseInt(event.target.value || '0', 10))
                                                    }
                                                />
                                                <p className="text-xs text-muted-foreground">Recommended: 15-30 assignments.</p>
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

                        <Card>
                            <CardHeader>
                                <CardTitle>Recent assignment grades</CardTitle>
                                <CardDescription>
                                    Review recent driver-truck assignments with their overall grade and category breakdowns.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {meta.from ?? 0} – {meta.to ?? 0} of {meta.total} assignments
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="per-page" className="text-sm">Rows per page</Label>
                                        <Select
                                            value={String(filters.per_page)}
                                            onValueChange={handlePerPageChange}
                                            disabled={meta.total === 0}
                                        >
                                            <SelectTrigger id="per-page" className="h-9 w-[120px]">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {perPageOptions.map(option => (
                                                    <SelectItem key={option} value={String(option)}>
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {assignments.data.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[720px] table-auto border-collapse">
                                            <thead>
                                                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                                                    <th className="px-4 py-3 font-medium">Assignment</th>
                                                    <th className="px-4 py-3 font-medium">Grade</th>
                                                    <th className="px-4 py-3 font-medium">Categories</th>
                                                    <th className="px-4 py-3 font-medium">Date received</th>
                                                    <th className="px-4 py-3 font-medium">Status</th>
                                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assignments.data.map(row => {
                                                    const grade = row.grade ?? null;
                                                    const categories = grade?.categories ?? {};

                                                    return (
                                                        <tr key={row.id} className="border-b border-border text-sm">
                                                            <td className="px-4 py-3 align-top">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-foreground">
                                                                        {row.driver?.name ?? 'Unassigned driver'}
                                                                    </span>
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {row.truck?.plate ?? 'Unknown truck'}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {row.is_attached ? 'Attached' : 'Detached'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 align-top">
                                                                {grade?.overall ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge variant="outline" className="text-base font-semibold">
                                                                            {grade.overall.letter}
                                                                        </Badge>
                                                                        <span className="text-sm text-muted-foreground">
                                                                            {formatScore(grade.overall.score)}%
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm text-muted-foreground">Not enough data</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 align-top">
                                                                <div className="flex flex-wrap gap-2">
                                                                    {(Object.keys(categoryLabels) as GradeCategoryKey[]).map(key => {
                                                                        const category = categories?.[key];

                                                                        return (
                                                                            <div
                                                                                key={key}
                                                                                className="rounded-md border border-border px-2 py-1 text-xs"
                                                                            >
                                                                                <span className="font-medium text-foreground">{categoryLabels[key]}</span>
                                                                                <span className="ml-2 text-muted-foreground">
                                                                                    {formatScore(category?.score)}%
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                                                                {formatDate(row.date_received)}
                                                            </td>
                                                            <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                                                                {row.status ?? '—'}
                                                            </td>
                                                            <td className="px-4 py-3 align-top text-right">
                                                                <Button variant="ghost" size="sm" asChild>
                                                                    <Link href={`/driver-trucks/${row.id}`} className="inline-flex items-center gap-1">
                                                                        View
                                                                        <ArrowUpRight className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center text-muted-foreground">
                                        <Activity className="h-10 w-10" />
                                        <div>
                                            <p className="text-lg font-semibold text-foreground">No assignments found</p>
                                            <p className="mt-1 text-sm">When assignments are available, their grades will appear here.</p>
                                        </div>
                                    </div>
                                )}

                                <InertiaPagination
                                    links={links}
                                    from={meta.from ?? undefined}
                                    to={meta.to ?? undefined}
                                    total={meta.total ?? undefined}
                                    currentPage={meta.current_page ?? undefined}
                                    lastPage={meta.last_page ?? undefined}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
