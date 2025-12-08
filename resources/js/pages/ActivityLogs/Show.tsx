import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { ActivityLogTable } from '@/components/activity-log-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Activity, ArrowLeft, CalendarClock, FileText, UserCircle } from 'lucide-react';

interface ActivityLogSubject {
    id?: number | string | null;
    type?: string | null;
    label?: string | null;
}

interface ActivityLogCauser {
    id?: number | null;
    name?: string | null;
    email?: string | null;
}

interface ActivityLogDetail {
    id: number;
    action?: string | null;
    description: string;
    created_at: string;
    log_name?: string | null;
    event?: string | null;
    subject_type?: string | null;
    subject_type_label?: string | null;
    subject_id?: number | string | null;
    subject_label?: string | null;
    subject?: ActivityLogSubject | null;
    causer?: ActivityLogCauser | null;
    causer_name?: string | null;
    batch_uuid?: string | null;
    properties?: {
        old?: Record<string, unknown> | null;
        new?: Record<string, unknown> | null;
    } | null;
    old_values?: Record<string, unknown> | null;
    new_values?: Record<string, unknown> | null;
    changed_fields?: string[];
}

interface ActivityLogEntrySummary {
    id: number;
    action?: string | null;
    description: string;
    created_at: string;
    user?: { name: string } | null;
    old_values?: Record<string, unknown> | null;
    new_values?: Record<string, unknown> | null;
}

interface ActivityLogsShowProps {
    activity: ActivityLogDetail;
    related: ActivityLogEntrySummary[];
}

const ACTION_COLORS: Record<string, string> = {
    created: 'bg-emerald-100 text-emerald-800',
    updated: 'bg-blue-100 text-blue-800',
    deleted: 'bg-rose-100 text-rose-800',
};

const dateFormatter = new Intl.DateTimeFormat('en-ET', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
});

function toActionLabel(action?: string | null): string {
    if (!action) {
        return 'Activity';
    }

    return action.charAt(0).toUpperCase() + action.slice(1);
}

function formatValue(value: unknown): string {
    if (value === null || value === undefined) {
        return '—';
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    if (typeof value === 'number') {
        return value.toLocaleString();
    }

    if (Array.isArray(value)) {
        return value.length ? value.join(', ') : '—';
    }

    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch (error) {
            return String(value);
        }
    }

    return String(value);
}

function renderKeyValueList(values?: Record<string, unknown> | null) {
    if (!values || Object.keys(values).length === 0) {
        return <p className="text-sm text-muted-foreground">No recorded values</p>;
    }

    return (
        <Table>
            <TableBody>
                {Object.entries(values).map(([key, value]) => (
                    <TableRow key={key}>
                        <TableCell className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {key}
                        </TableCell>
                        <TableCell className="text-sm">{formatValue(value)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function ActivityLogsShow({ activity, related }: ActivityLogsShowProps) {
    const action = (activity.event ?? activity.action ?? '').toLowerCase();
    const badgeClass = ACTION_COLORS[action] ?? 'bg-slate-200 text-slate-700';
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Activity Logs', href: '/activity-logs' },
        { title: `Log #${activity.id}`, href: `/activity-logs/${activity.id}` },
    ];

    const oldValues = activity.properties?.old ?? activity.old_values ?? null;
    const newValues = activity.properties?.new ?? activity.new_values ?? null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Activity Log #${activity.id}`} />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm text-muted-foreground">Audit Entry</span>
                        <div className="flex items-center gap-3">
                            <Badge className={cn('text-sm font-semibold capitalize', badgeClass)}>
                                {toActionLabel(action)}
                            </Badge>
                            <h1 className="text-3xl font-bold">{activity.description}</h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                                <CalendarClock className="h-4 w-4" />
                                {dateFormatter.format(new Date(activity.created_at))}
                            </span>
                            {activity.log_name ? (
                                <span className="inline-flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    {activity.log_name}
                                </span>
                            ) : null}
                            {activity.batch_uuid ? (
                                <span className="inline-flex items-center gap-1">
                                    <Activity className="h-4 w-4" />
                                    Batch {activity.batch_uuid}
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="self-start">
                        <Link href="/activity-logs" className="inline-flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to list
                        </Link>
                    </Button>
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <UserCircle className="h-5 w-5 text-slate-500" />
                            Triggered By
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Understand who performed this action and how to contact them.
                        </p>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                            <div>
                                <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">User</span>
                                <span className="text-base font-medium text-foreground">{activity.causer?.name ?? 'System'}</span>
                            </div>
                            {activity.causer?.email ? (
                                <div>
                                    <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
                                    <span>{activity.causer.email}</span>
                                </div>
                            ) : null}
                            <div>
                                <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</span>
                                <span>{activity.subject?.label ?? activity.subject_label ?? '—'}</span>
                            </div>
                            <div>
                                <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject Type</span>
                                <span>{activity.subject?.type ?? activity.subject_type_label ?? activity.subject_type ?? '—'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>New Values</CardTitle>
                        </CardHeader>
                        <CardContent>{renderKeyValueList(newValues)}</CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Previous Values</CardTitle>
                        </CardHeader>
                        <CardContent>{renderKeyValueList(oldValues)}</CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Change Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activity.changed_fields && activity.changed_fields.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {activity.changed_fields.map((field) => (
                                    <Badge key={field} variant="outline" className="text-xs">
                                        {field}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No specific property changes were tracked for this event.</p>
                        )}
                        <Separator className="my-4" />
                        <dl className="grid gap-2 sm:grid-cols-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Log Name</span>
                                <span className="text-sm">{activity.log_name ?? '—'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject Identifier</span>
                                <span className="text-sm">{activity.subject?.id ?? activity.subject_id ?? '—'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Event</span>
                                <span className="text-sm capitalize">{toActionLabel(action)}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Batch UUID</span>
                                <span className="text-sm">{activity.batch_uuid ?? '—'}</span>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Recent Activity for this Subject</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ActivityLogTable logs={related} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
