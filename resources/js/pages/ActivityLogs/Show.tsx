import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { ActivityLogTable } from '@/components/activity-log-table';
import { DetailHeader } from '@/components/detail/detail-header';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Activity, ArrowLeft, FileText, History, UserCircle } from 'lucide-react';

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

    const actionLabel = toActionLabel(action);
    const occurredAt = dateFormatter.format(new Date(activity.created_at));
    const subjectLabel = activity.subject?.label ?? activity.subject_label ?? '—';
    const subjectType = activity.subject?.type ?? activity.subject_type_label ?? activity.subject_type ?? null;
    const subjectId = activity.subject?.id ?? activity.subject_id ?? null;
    const subjectHelperParts = [
        subjectType ?? undefined,
        subjectId !== null && subjectId !== undefined ? `ID ${subjectId}` : undefined,
    ].filter((value): value is string => Boolean(value));

    const summaryItems: DetailSummaryItem[] = [
        {
            key: 'occurred',
            label: 'Occurred At',
            value: occurredAt,
            helper: `Entry #${activity.id}`,
        },
        {
            key: 'actor',
            label: 'Triggered By',
            value: activity.causer?.name ?? 'System',
            helper: activity.causer?.email ?? undefined,
        },
        {
            key: 'subject',
            label: 'Subject',
            value: subjectLabel,
            helper: subjectHelperParts.length ? subjectHelperParts.join(' · ') : undefined,
        },
        {
            key: 'log',
            label: 'Log Name',
            value: activity.log_name ?? '—',
            helper: actionLabel,
        },
    ];

    if (activity.batch_uuid) {
        summaryItems.push({
            key: 'batch',
            label: 'Batch UUID',
            value: activity.batch_uuid,
            helper: 'Correlates grouped changes',
        });
    }

    const subjectIdDisplay = subjectId !== null && subjectId !== undefined ? String(subjectId) : '—';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Activity Log #${activity.id}`} />
            <div className="flex min-h-0 flex-1 flex-col gap-6 p-4">
                <DetailHeader
                    leading={(
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                        >
                            <Link href="/activity-logs" className="inline-flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Activity Logs
                            </Link>
                        </Button>
                    )}
                    icon={<Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
                    title={`Log #${activity.id}`}
                    subtitle={activity.description}
                    actions={(
                        <Badge className={cn('text-sm font-semibold capitalize', badgeClass)}>
                            {actionLabel}
                        </Badge>
                    )}
                />
                <DetailSummaryGrid items={summaryItems} />
                <DetailSectionCard
                    title="Trigger Details"
                    icon={<UserCircle className="h-5 w-5 text-slate-500" />}
                    description="Understand who performed this action and the impacted subject."
                >
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">User</span>
                            <span className="text-sm text-foreground">{activity.causer?.name ?? 'System'}</span>
                        </div>
                        {activity.causer?.email ? (
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</span>
                                <span className="text-sm text-foreground">{activity.causer.email}</span>
                            </div>
                        ) : null}
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</span>
                            <span className="text-sm text-foreground">{subjectLabel}</span>
                        </div>
                        {subjectType ? (
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject Type</span>
                                <span className="text-sm text-foreground">{subjectType}</span>
                            </div>
                        ) : null}
                        {subjectId !== null && subjectId !== undefined ? (
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject Identifier</span>
                                <span className="text-sm text-foreground">{subjectIdDisplay}</span>
                            </div>
                        ) : null}
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Log Name</span>
                            <span className="text-sm text-foreground">{activity.log_name ?? '—'}</span>
                        </div>
                        {activity.batch_uuid ? (
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Batch UUID</span>
                                <span className="text-sm text-foreground">{activity.batch_uuid}</span>
                            </div>
                        ) : null}
                    </dl>
                </DetailSectionCard>
                <div className="grid gap-4 lg:grid-cols-2">
                    <DetailSectionCard
                        title="New Values"
                        icon={<FileText className="h-5 w-5 text-emerald-600" />}
                        description="Properties after this activity executed."
                    >
                        {renderKeyValueList(newValues)}
                    </DetailSectionCard>
                    <DetailSectionCard
                        title="Previous Values"
                        icon={<History className="h-5 w-5 text-slate-500" />}
                        description="Values recorded before this activity."
                    >
                        {renderKeyValueList(oldValues)}
                    </DetailSectionCard>
                </div>

                <DetailSectionCard
                    title="Change Summary"
                    icon={<Activity className="h-5 w-5 text-indigo-600" />}
                    description="Quick reference for the properties touched by this change."
                >
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
                    <dl className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Event</span>
                            <span className="text-sm text-foreground">{actionLabel}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Log Name</span>
                            <span className="text-sm text-foreground">{activity.log_name ?? '—'}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject Identifier</span>
                            <span className="text-sm text-foreground">{subjectIdDisplay}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Batch UUID</span>
                            <span className="text-sm text-foreground">{activity.batch_uuid ?? '—'}</span>
                        </div>
                    </dl>
                </DetailSectionCard>

                <DetailSectionCard
                    title="Recent Activity for this Subject"
                    icon={<Activity className="h-5 w-5 text-slate-500" />}
                    description="Compare this change to other recent modifications."
                >
                    <ActivityLogTable logs={related} />
                </DetailSectionCard>
            </div>
        </AppLayout>
    );
}
