import { Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { ActivityLogTable } from '@/components/activity-log-table';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Activity, ArrowLeft, FileText, History } from 'lucide-react';

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
  if (!action) return 'Activity';
  return action.charAt(0).toUpperCase() + action.slice(1);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
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
            <TableCell className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{key}</TableCell>
            <TableCell className="text-sm">{formatValue(value)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function ActivityLogsShow({ activity, related }: ActivityLogsShowProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Activity Logs', href: '/activity-logs' },
    { title: `Log #${activity.id}`, href: `/activity-logs/${activity.id}` },
  ];

  const action = (activity.event ?? activity.action ?? '').toLowerCase();
  const badgeClass = ACTION_COLORS[action] ?? 'bg-slate-200 text-slate-700';
  const oldValues = activity.properties?.old ?? activity.old_values ?? null;
  const newValues = activity.properties?.new ?? activity.new_values ?? null;
  const actionLabel = toActionLabel(action);
  const occurredAt = dateFormatter.format(new Date(activity.created_at));
  const subjectLabel = activity.subject?.label ?? activity.subject_label ?? '—';
  const subjectType = activity.subject?.type ?? activity.subject_type_label ?? activity.subject_type ?? null;
  const subjectId = activity.subject?.id ?? activity.subject_id ?? null;
  const subjectHelperParts = [subjectType ?? undefined, subjectId !== null && subjectId !== undefined ? `ID ${subjectId}` : undefined].filter((value): value is string => Boolean(value));

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

  return (
    <DetailPageLayout
      title={`Activity Log #${activity.id}`}
      subtitle={activity.description}
      breadcrumbs={breadcrumbs}
      headTitle={`Activity Log #${activity.id}`}
      icon={<Activity className="h-6 w-6 text-purple-700 dark:text-purple-300" />}
      iconWrapperClassName="bg-purple-100 dark:bg-purple-900/30"
      leading={
        <Button variant="outline" size="sm" asChild>
          <Link href="/activity-logs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Logs
          </Link>
        </Button>
      }
      actions={<Badge className={badgeClass}>{actionLabel}</Badge>}
    >
      <DetailSummaryGrid items={summaryItems} />

      {oldValues && Object.keys(oldValues).length > 0 && (
        <DetailSectionCard title="Old Values" description="State before this change" icon={<FileText className="h-5 w-5" />}>
          {renderKeyValueList(oldValues)}
        </DetailSectionCard>
      )}

      {newValues && Object.keys(newValues).length > 0 && (
        <DetailSectionCard title="New Values" description="State after this change" icon={<FileText className="h-5 w-5" />}>
          {renderKeyValueList(newValues)}
        </DetailSectionCard>
      )}

      {related.length > 0 && (
        <DetailSectionCard title="Related Activity" description="Contextual changes in the same timeframe" icon={<History className="h-5 w-5" />}>
          <ActivityLogTable logs={related} />
        </DetailSectionCard>
      )}
    </DetailPageLayout>
  );
}
