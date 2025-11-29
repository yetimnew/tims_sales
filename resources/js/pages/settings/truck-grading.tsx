import TruckGradingSettingsController from '@/actions/App/Http/Controllers/Settings/TruckGradingSettingsController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InertiaPagination } from '@/components/ui/pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, router } from '@inertiajs/react';
import * as React from 'react';
import { edit as editSettingsRoute } from '@/routes/settings/truck-grading';
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
    last_updated_at?: string | null;
    updated_by?: { id: number; name: string } | null;
}

type GradeCategoryKey = 'utilization' | 'efficiency' | 'reliability' | 'financial' | 'compliance';

type GradeCategoryMetrics = Record<string, number | null>;

interface GradeCategoryDetails {
    score: number;
    metrics: GradeCategoryMetrics;
}

interface GradeReport {
    overall: {
        score: number;
        letter: string;
    };
    weights: WeightSettings;
    categories?: Partial<Record<GradeCategoryKey, GradeCategoryDetails>>;
    metrics?: {
        truck?: Record<string, number | null>;
        peer_averages?: Record<string, number | null>;
    };
}

interface TruckGradeRow {
    id: number;
    plate: string;
    status?: string | null;
    vehicleType?: { id: number; name: string } | null;
    service_start_date?: string | null;
    production_date?: string | null;
    purchase_price?: number | null;
    grade: GradeReport;
}

interface PaginatedTruckGrades {
    data: TruckGradeRow[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from?: number | null;
        to?: number | null;
    };
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface TruckGradingSettingsProps {
    settings: SettingsPayload;
    can: {
        update: boolean;
    };
    truckGrades: PaginatedTruckGrades;
    perPageOptions: number[];
    filters?: {
        grade_letter?: string | null;
        per_page?: number | null;
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

const gradeCategoryOrder: ReadonlyArray<{ key: GradeCategoryKey; label: string }> = [
    { key: 'utilization', label: 'Utilization' },
    { key: 'efficiency', label: 'Efficiency' },
    { key: 'reliability', label: 'Reliability' },
    { key: 'financial', label: 'Financial' },
    { key: 'compliance', label: 'Compliance' },
];

const gradeLetters = ['A', 'B', 'C', 'D', 'E'] as const;

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

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
});

const currencyFormatter = new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 2,
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
        return '—';
    }
};

const formatCurrency = (value?: number | null): string => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }

    try {
        return currencyFormatter.format(value);
    } catch (error) {
        return '—';
    }
};

const formatScore = (value?: number | null): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '—';
    }

    return value.toFixed(1);
};

export default function TruckGradingSettings({
    settings,
    can,
    flash,
    truckGrades,
    perPageOptions,
    filters = {},
}: TruckGradingSettingsProps) {
    const [weights, setWeights] = React.useState<WeightSettings>({ ...settings.weights });
    const [peerSample, setPeerSample] = React.useState<number>(settings.peer_sample_size);
    const [selectedGradeLetter, setSelectedGradeLetter] = React.useState<string>(filters.grade_letter ?? '');
    const [selectedPerPage, setSelectedPerPage] = React.useState<number>(filters.per_page ?? (perPageOptions[0] ?? 10));

    React.useEffect(() => {
        setWeights({ ...settings.weights });
        setPeerSample(settings.peer_sample_size);
    }, [settings.weights, settings.peer_sample_size]);

    React.useEffect(() => {
        setSelectedGradeLetter(filters.grade_letter ?? '');
    }, [filters.grade_letter]);

    React.useEffect(() => {
        if (filters.per_page) {
            setSelectedPerPage(filters.per_page);
        }
    }, [filters.per_page]);

    const totalWeight = React.useMemo(() => {
        return weightFields.reduce((sum, field) => sum + (weights[field.key] ?? 0), 0);
    }, [weights]);

    const remaining = 100 - totalWeight;
    const lastUpdated = formatTimestamp(settings.last_updated_at);
    const disabled = !can.update;

    const gradeRows = truckGrades?.data ?? [];
    const gradeMeta = truckGrades?.meta ?? {
        current_page: 1,
        last_page: 1,
        per_page: selectedPerPage,
        total: gradeRows.length,
        from: gradeRows.length ? 1 : 0,
        to: gradeRows.length,
    };

    const sanitizedPerPageOptions = perPageOptions.length > 0 ? perPageOptions : [10, 25, 50];

    const applyFilters = React.useCallback(
        (updates: { grade_letter?: string | null; per_page?: number; page?: number }) => {
            const nextLetter =
                updates.grade_letter === undefined
                    ? (selectedGradeLetter ? selectedGradeLetter.toUpperCase() : null)
                    : updates.grade_letter;

            const nextPerPage = updates.per_page ?? selectedPerPage;
            const nextPage = updates.page ?? gradeMeta.current_page;

            const query: Record<string, string | number> = {};

            if (nextLetter) {
                query.grade_letter = nextLetter;
            }

            if (nextPerPage) {
                query.per_page = nextPerPage;
            }

            if (nextPage > 1) {
                query.page = nextPage;
            }

            router.visit(editSettingsRoute({ query }).url, {
                preserveScroll: true,
                preserveState: true,
            });
        },
        [gradeMeta.current_page, selectedGradeLetter, selectedPerPage],
    );

    const handleGradeLetterChange = React.useCallback(
        (value: string) => {
            const normalized = value === 'all' ? '' : value.toUpperCase();
            setSelectedGradeLetter(normalized);
            applyFilters({ grade_letter: normalized || null, page: 1 });
        },
        [applyFilters],
    );

    const handlePerPageChange = React.useCallback(
        (value: string) => {
            const parsed = Number.parseInt(value, 10);
            const nextValue = Number.isNaN(parsed) ? selectedPerPage : parsed;
            setSelectedPerPage(nextValue);
            applyFilters({ per_page: nextValue, page: 1 });
        },
        [applyFilters, selectedPerPage],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Truck grading" />

            <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-12">
                        <Heading
                            title="Truck grading"
                            description="Tune how trucks are scored and explore fleet performance across categories."
                        />

                        <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Fleet grading weights</CardTitle>
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

                            <div className="md:col-span-2 text-sm text-muted-foreground">
                                {lastUpdated ? (
                                    <p>
                                        Last updated {lastUpdated}
                                        {settings.updated_by ? ` by ${settings.updated_by.name}` : ''}.
                                    </p>
                                ) : (
                                    <p>Weights are using the default configuration.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Form
                        {...TruckGradingSettingsController.update.form()}
                        options={{ preserveScroll: true }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful }) => (
                            <>
                                <input type="hidden" name="peer_sample_size" value={peerSample} />

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
                                                We prioritise trucks with the same vehicle type. If fewer trucks are
                                                available, we fall back to the wider fleet.
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
                                            <p className="text-xs text-muted-foreground">Recommended: 8–15 trucks.</p>
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
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                <div className="flex flex-wrap items-center gap-4">
                                    <Button type="submit" disabled={disabled || processing || remaining !== 0}>
                                        {processing ? 'Saving…' : 'Save changes'}
                                    </Button>

                                    {remaining !== 0 && (
                                        <p className="text-sm text-destructive">
                                            Adjust the weights so the total equals 100% (currently {totalWeight}%).
                                        </p>
                                    )}

                                    <Transition
                                        show={recentlySuccessful || Boolean(flash?.success)}
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
                            <CardHeader className="space-y-2">
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <CardTitle>Truck grade leaderboard</CardTitle>
                                        <CardDescription>
                                            Review truck grades, compare category scores, and identify outliers after weight changes.
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-sm" htmlFor="grade-filter">
                                                Grade
                                            </Label>
                                            <Select
                                                value={selectedGradeLetter || 'all'}
                                                onValueChange={handleGradeLetterChange}
                                            >
                                                <SelectTrigger id="grade-filter" className="w-[140px]">
                                                    <SelectValue placeholder="All grades" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All grades</SelectItem>
                                                    {gradeLetters.map(letter => (
                                                        <SelectItem key={letter} value={letter}>
                                                            Grade {letter}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Label className="text-sm" htmlFor="per-page">
                                                Per page
                                            </Label>
                                            <Select value={String(selectedPerPage)} onValueChange={handlePerPageChange}>
                                                <SelectTrigger id="per-page" className="w-[140px]">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {sanitizedPerPageOptions.map(option => (
                                                        <SelectItem key={option} value={String(option)}>
                                                            {option}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Truck</TableHead>
                                                <TableHead className="text-center">Grade</TableHead>
                                                <TableHead className="text-right">Score</TableHead>
                                                {gradeCategoryOrder.map(category => (
                                                    <TableHead key={category.key} className="text-right">
                                                        {category.label}
                                                    </TableHead>
                                                ))}
                                                <TableHead className="text-right">Purchase price</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {gradeRows.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                                                        No trucks match the selected filters yet.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                gradeRows.map(row => {
                                                    const categories = row.grade.categories ?? {};

                                                    return (
                                                        <TableRow key={row.id}>
                                                            <TableCell>
                                                                <div className="font-semibold text-foreground">{row.plate}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {row.vehicleType?.name ?? '—'} · {row.status ?? '—'}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    Service since {formatDate(row.service_start_date)}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant="secondary" className="text-base font-semibold">
                                                                    {row.grade.overall.letter}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right font-semibold">
                                                                {formatScore(row.grade.overall.score)}
                                                            </TableCell>
                                                            {gradeCategoryOrder.map(category => (
                                                                <TableCell key={category.key} className="text-right text-sm">
                                                                    {formatScore(categories[category.key]?.score)}
                                                                </TableCell>
                                                            ))}
                                                            <TableCell className="text-right text-sm">
                                                                {formatCurrency(row.purchase_price)}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                <InertiaPagination
                                    links={truckGrades.links}
                                    from={gradeMeta.from ?? undefined}
                                    to={gradeMeta.to ?? undefined}
                                    total={gradeMeta.total}
                                    currentPage={gradeMeta.current_page}
                                    lastPage={gradeMeta.last_page}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
        </AppLayout>
    );
}
