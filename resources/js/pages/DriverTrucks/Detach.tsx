import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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
import { isValid, parseISO, startOfDay, startOfToday } from 'date-fns';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const { data, setData, post, processing, errors, wasSuccessful } = useForm<{
        date_detach: string;
        reason: string;
    }>({
        date_detach: todayString(),
        reason: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('driverTrucks.breadcrumb'),
            href: '/driver-trucks',
        },
        {
            title: t('driverTrucks.show.breadcrumbItem', { driver: driverTruck.driver.name, plate: driverTruck.truck.plate }),
            href: `/driver-trucks/${driverTruck.id}`,
        },
        {
            title: t('driverTrucks.detach.breadcrumb'),
            href: `/driver-trucks/${driverTruck.id}/detach`,
        },
    ];

    const assignmentStatus = driverTruck.is_attached ? t('driverTrucks.status.attached') : t('driverTrucks.status.detached');
    const assignmentStatusTone = driverTruck.is_attached
        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';

    const formattedAssignmentDate = formatDate(driverTruck.date_recived, t('driverTrucks.fallbacks.notAvailable'));
    const detachmentDateDisplay = data.date_detach
        ? formatDate(data.date_detach, t('driverTrucks.fallbacks.notAvailable'))
        : t('driverTrucks.detach.selectDate');
    const durationLabels = useMemo(() => ({
        waiting: t('driverTrucks.detach.duration.waiting'),
        unable: t('driverTrucks.detach.duration.unable'),
        invalid: t('driverTrucks.detach.duration.invalid'),
        lessThanMinute: t('driverTrucks.detach.duration.lessThanMinute'),
        day: t('driverTrucks.detach.duration.day'),
        days: t('driverTrucks.detach.duration.days'),
        hour: t('driverTrucks.detach.duration.hour'),
        hours: t('driverTrucks.detach.duration.hours'),
        minute: t('driverTrucks.detach.duration.minute'),
        minutes: t('driverTrucks.detach.duration.minutes'),
    }), [t]);

    const assignmentDuration = useMemo(
        () => formatDuration(driverTruck.date_recived, data.date_detach, durationLabels),
        [data.date_detach, driverTruck.date_recived, durationLabels]
    );

    const quickMetrics = useMemo(
        () => [
            {
                label: t('driverTrucks.detach.metrics.driver'),
                value: driverTruck.driver.name,
                tone: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200',
                icon: User,
            },
            {
                label: t('driverTrucks.detach.metrics.truck'),
                value: driverTruck.truck.plate,
                tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200',
                icon: Truck,
            },
            {
                label: t('driverTrucks.detach.metrics.assignedOn'),
                value: formattedAssignmentDate,
                tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200',
                icon: Calendar,
            },
            {
                label: t('driverTrucks.detach.metrics.currentDuration'),
                value: assignmentDuration,
                tone: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200',
                icon: Clock,
            },
        ],
        [assignmentDuration, driverTruck.driver.name, driverTruck.truck.plate, formattedAssignmentDate, t]
    );

    const minDetachmentDate = useMemo(() => {
        if (!driverTruck.date_recived) {
            return undefined;
        }

        const parsed = parseISO(driverTruck.date_recived);

        if (!isValid(parsed)) {
            return undefined;
        }

        return startOfDay(parsed);
    }, [driverTruck.date_recived]);

    const maxDetachmentDate = useMemo(() => startOfToday(), []);

    useEffect(() => {
        if (wasSuccessful) {
            toast({
                title: t('driverTrucks.detach.successTitle'),
                description: t('driverTrucks.detach.successDescription'),
                variant: 'success',
            });
        }
    }, [wasSuccessful, t]);

    useEffect(() => {
        const parsedErrors = Object.values(errors ?? {})
            .flatMap((message) => (Array.isArray(message) ? message : [message]))
            .filter((message): message is string => Boolean(message));

        if (parsedErrors.length > 0) {
            toast({
                title: t('driverTrucks.form.validation.title'),
                description: parsedErrors.join('\n'),
                variant: 'destructive',
            });
        }
    }, [errors, t]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(`/driver-trucks/${driverTruck.id}/detach`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('driverTrucks.detach.headTitle', { driver: driverTruck.driver.name, plate: driverTruck.truck.plate })} />

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto rounded-xl p-4">
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
                                {t('driverTrucks.detach.actions.backToAssignment')}
                            </Button>
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-red-100 p-3 dark:bg-red-900/30">
                                    <UserX className="h-6 w-6 text-red-600 dark:text-red-300" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                        {t('driverTrucks.detach.title')}
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
                                {t('driverTrucks.detach.workflow')}
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
                                {t('driverTrucks.detach.currentDetails.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('driverTrucks.detach.currentDetails.description')}
                            </CardDescription>
                        </CardHeader>
                            <CardContent className="space-y-5 pt-5">
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">{t('driverTrucks.detach.currentDetails.driver')}</Label>
                                        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                            <User className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{driverTruck.driver.name}</p>
                                                <p className="text-xs text-muted-foreground">{t('driverTrucks.detach.currentDetails.driverId', { value: driverTruck.driver.driverid })}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">{t('driverTrucks.detach.currentDetails.truck')}</Label>
                                        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                            <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{driverTruck.truck.plate}</p>
                                                <p className="text-xs text-muted-foreground">{t('driverTrucks.detach.currentDetails.recordedPlate', { value: driverTruck.plate })}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">{t('driverTrucks.detach.currentDetails.assignedOn')}</Label>
                                        <div className="rounded-lg border border-slate-200 bg-white/80 p-3 text-sm font-semibold text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100">
                                            {formattedAssignmentDate}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">{t('driverTrucks.detach.currentDetails.detachmentDate')}</Label>
                                        <div className="rounded-lg border border-slate-200 bg-white/80 p-3 text-sm font-semibold text-blue-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 dark:text-blue-300">
                                            {detachmentDateDisplay}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">{t('driverTrucks.detach.currentDetails.totalDuration')}</Label>
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
                                    <h3 className="text-base font-semibold">{t('driverTrucks.detach.notice.title')}</h3>
                                    <p>
                                        {t('driverTrucks.detach.notice.line1')}
                                    </p>
                                    <p>
                                        {t('driverTrucks.detach.notice.line2')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
                        <CardHeader className="border-b bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/30">
                            <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-slate-100">
                                <UserX className="h-5 w-5 text-red-600 dark:text-red-300" />
                                {t('driverTrucks.detach.form.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('driverTrucks.detach.form.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            {t('driverTrucks.detach.form.dateLabel')}<span className="text-red-500"> *</span>
                                        </Label>
                                        <DatePicker
                                            value={data.date_detach || ''}
                                            onChange={(next) => setData('date_detach', next ?? '')}
                                            fromDate={minDetachmentDate}
                                            toDate={maxDetachmentDate}
                                            placeholder={t('driverTrucks.detach.form.datePlaceholder')}
                                            showClearButton={false}
                                            className={cn(
                                                'h-11 w-full justify-start rounded-md border border-slate-300 bg-white text-left hover:border-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900/60 dark:hover:border-slate-500',
                                                errors.date_detach
                                                    ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/40'
                                                    : undefined,
                                            )}
                                        />
                                        {errors.date_detach && (
                                            <p className="text-sm text-red-500">{toMessage(errors.date_detach)}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="reason" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            {t('driverTrucks.detach.form.reasonLabel')}<span className="text-red-500"> *</span>
                                        </Label>
                                        <Textarea
                                            id="reason"
                                            placeholder={t('driverTrucks.detach.form.reasonPlaceholder')}
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
                                            {t('driverTrucks.detach.form.reasonHelper')}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200">
                                    <h4 className="mb-2 font-semibold">{t('driverTrucks.detach.summary.title')}</h4>
                                    <div className="space-y-1">
                                        <p>
                                            <strong>{t('driverTrucks.detach.summary.driver')}:</strong> {driverTruck.driver.name} ({driverTruck.driver.driverid})
                                        </p>
                                        <p>
                                            <strong>{t('driverTrucks.detach.summary.truck')}:</strong> {driverTruck.truck.plate}
                                        </p>
                                        <p>
                                            <strong>{t('driverTrucks.detach.summary.date')}:</strong> {detachmentDateDisplay}
                                        </p>
                                        <p>
                                            <strong>{t('driverTrucks.detach.summary.duration')}:</strong> {assignmentDuration}
                                        </p>
                                        {data.reason && (
                                            <p>
                                                <strong>{t('driverTrucks.detach.summary.reason')}:</strong> {data.reason}
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-3 rounded-md border border-red-300 bg-white/60 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200">
                                        {t('driverTrucks.detach.summary.note')}
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
                                        {t('driverTrucks.actions.cancel')}
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
                                                {t('driverTrucks.detach.form.submitting')}
                                            </>
                                        ) : (
                                            <>
                                                <UserX className="mr-2 h-4 w-4" />
                                                {t('driverTrucks.detach.form.submit')}
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

function formatDate(value?: string, fallbackLabel = 'N/A') {
    if (!value) {
        return fallbackLabel;
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return fallbackLabel;
    }

    return parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatDuration(
    startValue: string | undefined,
    endValue: string | undefined,
    labels: {
        waiting: string;
        unable: string;
        invalid: string;
        lessThanMinute: string;
        day: string;
        days: string;
        hour: string;
        hours: string;
        minute: string;
        minutes: string;
    },
) {
    if (!startValue || !endValue) {
        return labels.waiting;
    }

    const start = new Date(startValue);
    const end = new Date(endValue);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return labels.unable;
    }

    const diff = end.getTime() - start.getTime();

    if (diff < 0) {
        return labels.invalid;
    }

    const minute = 1000 * 60;
    const hour = minute * 60;
    const day = hour * 24;

    const days = Math.floor(diff / day);
    const hours = Math.floor((diff % day) / hour);
    const minutes = Math.floor((diff % hour) / minute);

    const parts = [];

    if (days > 0) {
        parts.push(`${days} ${days === 1 ? labels.day : labels.days}`);
    }

    if (hours > 0) {
        parts.push(`${hours} ${hours === 1 ? labels.hour : labels.hours}`);
    }

    if (minutes > 0) {
        parts.push(`${minutes} ${minutes === 1 ? labels.minute : labels.minutes}`);
    }

    if (parts.length === 0) {
    return labels.lessThanMinute;
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
