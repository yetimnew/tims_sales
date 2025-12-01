import TruckGradingSettingsController from '@/actions/App/Http/Controllers/Settings/TruckGradingSettingsController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link } from '@inertiajs/react';
import * as React from 'react';
import { edit as editSettingsRoute } from '@/routes/settings/truck-grading';
import { truckGrading as truckGradingReport } from '@/routes/reports';
import { Info } from 'lucide-react';

interface WeightSettings {
    utilization_weight: number;
    efficiency_weight: number;
    reliability_weight: number;
    financial_weight: number;
    compliance_weight: number;
}

interface SettingsPayload {
    weights: WeightSettings;
    peer_sample_size: number;
    grade_thresholds: GradeThresholdSettings;
    last_updated_at?: string | null;
    updated_by?: { id: number; name: string } | null;
}

interface TruckGradingSettingsProps {
    settings: SettingsPayload;
    can: {
        update: boolean;
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

const weightFields: WeightConfig[] = [
    {
        key: 'utilization_weight',
        label: 'Utilization',
        description: 'How effectively the truck is used compared to peers (distance, assignment activity).',
        tooltip: 'Calculated from each truck\'s total kilometres travelled, performance logs, and active days versus its peer group. Higher utilisation lifts the score.',
    },
    {
        key: 'efficiency_weight',
        label: 'Efficiency',
        description: 'Fuel economy and operating efficiency across recent trips.',
        tooltip: 'Uses driver performance data for kilometres per litre and fuel cost per kilometre. Trucks that move goods with less fuel than peers score higher.',
    },
    {
        key: 'reliability_weight',
        label: 'Reliability',
        description: 'Maintenance completion and overdue counts indicate downtime risk.',
        tooltip: 'Based on maintenance completion rate with penalties for overdue work orders. Fewer outstanding jobs improve reliability.',
    },
    {
        key: 'financial_weight',
        label: 'Financial',
        description: 'Recent maintenance spend and cost profile versus the fleet.',
        tooltip: 'Compares maintenance spend over the last 12 months and the truck\'s cost profile against peer averages. Lower ongoing costs increase the score.',
    },
    {
        key: 'compliance_weight',
        label: 'Compliance',
        description: 'Status history changes that trigger maintenance or inactive states.',
        tooltip: 'Monitors daily status history for maintenance or inactive events during the last 90 days. Frequent downtime activity reduces compliance.',
    },
];

const gradeLetters = ['A', 'B', 'C', 'D', 'E'] as const;
type GradeLetter = (typeof gradeLetters)[number];
type GradeThresholdSettings = Record<GradeLetter, number>;
type GradeThresholdState = Record<GradeLetter, string>;

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Truck grading',
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
    } catch (error) {
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

export default function TruckGradingSettings({
    settings,
    can,
    flash,
}: TruckGradingSettingsProps) {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Truck grading" />

            <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-12">
                        <Heading
                            title="Truck grading"
                            description="Tune how trucks are scored. Configure weights and grade bands, then review results in the dedicated report."
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
                                    Adjust how much each category contributes to the overall truck grade. The total must be
                                    100% before you can save changes.
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
                                        <Link href={truckGradingReport().url}>View truck grading report</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Form
                            {...TruckGradingSettingsController.updateGradeThresholds.form()}
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
                                                Grades cascade from A through E. Ensure each threshold is less than or equal to the one above it and set grade E to 0.
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
                            {...TruckGradingSettingsController.updateWeights.form()}
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
                                                Define how many similar trucks the grading engine should use for comparisons.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid gap-4 md:grid-cols-[1fr_200px] md:items-end">
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    We prioritise trucks with the same vehicle type. If fewer trucks are available, we fall back to the wider fleet.
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
                                                <p className="text-xs text-muted-foreground">Recommended: 8-15 trucks.</p>
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
                </div>
            </div>
        </div>
        </AppLayout>
    );
}
