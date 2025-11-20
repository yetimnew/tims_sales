import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { toast } from '@/hooks/use-toast';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    Clock,
    ShieldAlert,
    Truck,
    User,
    UserX,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';

interface DriverTruck {
    id: number;
    driver_id: number;
    truck_id: number;
    plate: string;
    driverid: string;
    date_recived: string;
    is_attached: boolean;
    status: number;
    driver: {
        id: number;
        name: string;
        driverid: string;
    };
    truck: {
        id: number;
        plate: string;
    };
}

interface Props {
    driverTruck: DriverTruck;
}

const todayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

export default function Detach({ driverTruck }: Props) {
    const { data, setData, post, processing, errors, wasSuccessful } = useForm<{
        date_detach: string;
        reason: string;
    }>({
        date_detach: todayString(),
        reason: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Driver-Truck Assignments',
            href: '/driver-trucks',
        },
        {
            title: `${driverTruck.driver.name} - ${driverTruck.truck.plate}`,
            href: `/driver-trucks/${driverTruck.id}`,
        },
        {
            title: 'Detach Driver',
            href: `/driver-trucks/${driverTruck.id}/detach`,
        },
    ];

    const assignmentStatus = driverTruck.is_attached ? 'Attached' : 'Detached';
    const assignmentStatusTone = driverTruck.is_attached
        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';

    const formattedAssignmentDate = formatDate(driverTruck.date_recived);
    const detachmentDateDisplay = data.date_detach ? formatDate(data.date_detach) : 'Select a date';
    const assignmentDuration = useMemo(
        () => formatDuration(driverTruck.date_recived, data.date_detach),
        [driverTruck.date_recived, data.date_detach]
    );

    const quickMetrics = useMemo(
        () => [
            {
                label: 'Driver',
                value: driverTruck.driver.name,
                tone: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200',
                icon: User,
            },
            {
                label: 'Truck',
                value: driverTruck.truck.plate,
                tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
                icon: Truck,
            },
            {
                label: 'Assigned On',
                value: formattedAssignmentDate,
                tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
                icon: Calendar,
            },
            {
                label: 'Current Duration',
                value: assignmentDuration,
                tone: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200',
                icon: Clock,
            },
        ],
        [assignmentDuration, driverTruck.driver.name, driverTruck.truck.plate, formattedAssignmentDate]
    );

    useEffect(() => {
        if (wasSuccessful) {
            toast({
                title: '✅ Driver detached',
                description: 'The assignment has been updated successfully.',
                variant: 'success',
            });
        }
    }, [wasSuccessful]);

    useEffect(() => {
        const parsedErrors = Object.values(errors ?? {})
            .flatMap((message) => (Array.isArray(message) ? message : [message]))
            .filter((message): message is string => Boolean(message));

        if (parsedErrors.length > 0) {
            toast({
                title: '⚠️ Validation Error',
                description: parsedErrors.join('\n'),
                variant: 'destructive',
            });
        }
    }, [errors]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(`/driver-trucks/${driverTruck.id}/detach`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detach: ${driverTruck.driver.name} - ${driverTruck.truck.plate}`} />

            <div className="flex min-h-0 flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-amber-950/10 dark:to-rose-950/20">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(`/driver-trucks/${driverTruck.id}`)}
                                className="w-full gap-2 border-slate-300 bg-white/80 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900/60 dark:hover:bg-slate-800 lg:w-auto"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Assignment
                            </Button>
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-red-100 p-3 dark:bg-red-900/30">
                                    <UserX className="h-6 w-6 text-red-600 dark:text-red-300" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                        Detach Driver from Truck
                                    </h1>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                        {driverTruck.driver.name} · {driverTruck.truck.plate}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className={`flex items-center gap-2 rounded-full px-4 py-1 text-sm font-medium ${assignmentStatusTone}`}>
                                <span className="h-2 w-2 rounded-full bg-current" />
                                {assignmentStatus}
                            </div>
                            <div className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1 text-sm font-medium text-red-700 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300">
                                <ShieldAlert className="h-4 w-4" />
                                Detachment Workflow
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {quickMetrics.map((metric) => {
                        const Icon = metric.icon;
                        return (
                            <Card key={metric.label} className="border-0 bg-gradient-to-br from-white to-muted/20 shadow-lg dark:from-slate-900/60 dark:to-slate-900/20">
                                <CardHeader className="border-b bg-gradient-to-r from-white/90 to-transparent dark:from-slate-900/50">
                                    <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                                        {metric.label}
                                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${metric.tone}`}>
                                            <Icon className="inline-block h-3 w-3" />
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                        {metric.value}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
                    <div className="space-y-6">
                        <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
                            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20">
                                <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-slate-100">
                                    <User className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                                    Current Assignment Details
                                </CardTitle>
                                <CardDescription>
                                    Review the active pairing before completing the detachment workflow.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5 pt-5">
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Driver</Label>
                                        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                            <User className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{driverTruck.driver.name}</p>
                                                <p className="text-xs text-muted-foreground">ID: {driverTruck.driver.driverid}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Truck</Label>
                                        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                            <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{driverTruck.truck.plate}</p>
                                                <p className="text-xs text-muted-foreground">Recorded Plate: {driverTruck.plate}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Assigned On</Label>
                                        <div className="rounded-lg border border-slate-200 bg-white/80 p-3 text-sm font-semibold text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100">
                                            {formattedAssignmentDate}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Detachment Date</Label>
                                        <div className="rounded-lg border border-slate-200 bg-white/80 p-3 text-sm font-semibold text-blue-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 dark:text-blue-300">
                                            {detachmentDateDisplay}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Total Duration</Label>
                                    <div className="rounded-lg border border-slate-200 bg-white/80 p-3 text-sm font-semibold text-indigo-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 dark:text-indigo-300">
                                        {assignmentDuration}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm dark:border-amber-800/60 dark:from-amber-950/40 dark:to-orange-950/20">
                            <CardContent className="flex items-start gap-3 py-5">
                                <AlertTriangle className="mt-1 h-6 w-6 flex-shrink-0 text-amber-600 dark:text-amber-300" />
                                <div className="space-y-2 text-sm text-amber-900 dark:text-amber-100">
                                    <h3 className="text-base font-semibold">Important Detachment Notice</h3>
                                    <p>
                                        Detaching this driver will mark the assignment as inactive, free the truck for new allocations, and return the driver to the available pool.
                                    </p>
                                    <p>
                                        Ensure the detachment reason is descriptive enough for future audits. This action will be logged in the activity timeline.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
                        <CardHeader className="border-b bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/30">
                            <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-slate-100">
                                <UserX className="h-5 w-5 text-red-600 dark:text-red-300" />
                                Complete Detachment
                            </CardTitle>
                            <CardDescription>
                                Provide the detachment date and capture the operational reason for the change.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date_detach" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            Detachment Date<span className="text-red-500"> *</span>
                                        </Label>
                                        <Input
                                            id="date_detach"
                                            type="date"
                                            value={data.date_detach}
                                            min={toInputDate(driverTruck.date_recived)}
                                            max={todayString()}
                                            onChange={(event) => setData('date_detach', event.target.value)}
                                            className={`bg-white dark:bg-slate-900/60 ${errors.date_detach ? 'border-red-500 focus-visible:ring-red-500/40' : 'border-slate-300 focus-visible:ring-blue-500/30 dark:border-slate-600'}`}
                                            required
                                        />
                                        {errors.date_detach && (
                                            <p className="text-sm text-red-500">{toMessage(errors.date_detach)}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="reason" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            Detachment Reason<span className="text-red-500"> *</span>
                                        </Label>
                                        <Textarea
                                            id="reason"
                                            placeholder="Explain why this driver is being detached from the truck..."
                                            value={data.reason}
                                            onChange={(event) => setData('reason', event.target.value)}
                                            rows={5}
                                            className={`bg-white dark:bg-slate-900/60 ${errors.reason ? 'border-red-500 focus-visible:ring-red-500/40' : 'border-slate-300 focus-visible:ring-blue-500/30 dark:border-slate-600'}`}
                                            required
                                        />
                                        {errors.reason && (
                                            <p className="text-sm text-red-500">{toMessage(errors.reason)}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            The reason is stored for audits and appears in the assignment activity log.
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200">
                                    <h4 className="mb-2 font-semibold">Detachment Summary</h4>
                                    <div className="space-y-1">
                                        <p>
                                            <strong>Driver:</strong> {driverTruck.driver.name} ({driverTruck.driver.driverid})
                                        </p>
                                        <p>
                                            <strong>Truck:</strong> {driverTruck.truck.plate}
                                        </p>
                                        <p>
                                            <strong>Detachment Date:</strong> {detachmentDateDisplay}
                                        </p>
                                        <p>
                                            <strong>Total Duration:</strong> {assignmentDuration}
                                        </p>
                                        {data.reason && (
                                            <p>
                                                <strong>Reason:</strong> {data.reason}
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-3 rounded-md border border-red-300 bg-white/60 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200">
                                        After confirmation, this assignment will be marked as detached and both resources will become available for redeployment.
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.get(`/driver-trucks/${driverTruck.id}`)}
                                        className="border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                                        disabled={processing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        className="bg-gradient-to-r from-red-600 to-rose-600 px-6 text-white shadow-lg transition-colors duration-200 hover:from-red-700 hover:to-rose-700"
                                        disabled={processing || !data.date_detach || !data.reason.trim()}
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                                                Detaching...
                                            </>
                                        ) : (
                                            <>
                                                <UserX className="mr-2 h-4 w-4" />
                                                Detach Driver
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function formatDate(value?: string) {
    if (!value) {
        return 'N/A';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return 'Invalid date';
    }

    return parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatDuration(startValue?: string, endValue?: string) {
    if (!startValue || !endValue) {
        return 'Waiting for detachment date';
    }

    const start = new Date(startValue);
    const end = new Date(endValue);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return 'Unable to calculate';
    }

    const diff = end.getTime() - start.getTime();

    if (diff < 0) {
        return 'Detachment date must be after assignment date';
    }

    const minute = 1000 * 60;
    const hour = minute * 60;
    const day = hour * 24;

    const days = Math.floor(diff / day);
    const hours = Math.floor((diff % day) / hour);
    const minutes = Math.floor((diff % hour) / minute);

    const parts = [];

    if (days > 0) {
        parts.push(`${days} day${days === 1 ? '' : 's'}`);
    }

    if (hours > 0) {
        parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
    }

    if (minutes > 0) {
        parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
    }

    if (parts.length === 0) {
        return 'Less than a minute';
    }

    return parts.join(', ');
}

function toMessage(value: unknown): string {
    if (Array.isArray(value)) {
        return value[0] ?? '';
    }

    if (typeof value === 'string') {
        return value;
    }

    return String(value ?? '');
}

function toInputDate(value?: string) {
    if (!value) {
        return undefined;
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return undefined;
    }

    const iso = parsed.toISOString();
    return iso.split('T')[0] ?? undefined;
}
