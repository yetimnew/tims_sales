import { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Activity, ArrowLeft, Mail, MoreVertical, Shield, SquarePen, Trash2, User } from 'lucide-react';
import { ActivityLogTable } from '@/components/activity-log-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { type BreadcrumbItem } from '@/types';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';
import { useTranslation } from 'react-i18next';

const roleBadgePalette: Record<string, string> = {
  admin: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200',
  manager: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200',
  driver: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  user: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200',
  default: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200',
};

const getRoleBadgeClass = (roleName: string) => roleBadgePalette[roleName.toLowerCase()] ?? roleBadgePalette.default;

interface Role {
  id: number;
  name: string;
}

interface UserResource {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  roles: Role[];
}

interface ActivityLog {
  id: number;
  log_name: string;
  description: string;
  subject_type: string;
  subject_id: number;
  causer_type: string;
  causer_id: number;
  properties: Record<string, unknown>;
  created_at: string;
}

interface UsersShowProps {
  user: UserResource;
  activityLogs: ActivityLog[];
}

const formatDate = (value: string | null | undefined, locale: string, emptyLabel: string): string => {
  if (!value) return emptyLabel;
  return new Date(value).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function UsersShow({ user, activityLogs }: UsersShowProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en-US';
  const notAvailableLabel = t('users.fallbacks.notAvailable');
  const breadcrumbs: BreadcrumbItem[] = [
    { title: t('users.breadcrumbs.management'), href: '/users' },
    { title: t('users.title'), href: '/users' },
    { title: user.name, href: `/users/${user.id}` },
  ];
  const { hasPermission } = usePermissions();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null);

  const timelineEntries = useMemo(
    () =>
      [...activityLogs]
        .sort((first, second) => new Date(second.created_at).getTime() - new Date(first.created_at).getTime())
        .slice(0, 5),
    [activityLogs],
  );

  const isVerified = Boolean(user.email_verified_at);
  const totalRoles = user.roles.length;
  const activityCount = activityLogs.length;
  const lastActivityAt = timelineEntries[0]?.created_at ?? null;

  const kpiSummary: DetailSummaryItem[] = [
    {
      label: t('users.show.kpi.emailStatus.label'),
      value: isVerified ? t('users.status.verified') : t('users.status.unverified'),
      helper: isVerified ? formatDate(user.email_verified_at, locale, notAvailableLabel) : t('users.show.kpi.emailStatus.helperUnverified'),
      valueClassName: isVerified ? 'text-green-600' : 'text-amber-600',
    },
    {
      label: t('users.show.kpi.roles.label'),
      value: totalRoles,
      helper: totalRoles === 1 ? t('users.show.kpi.roles.helperSingle') : t('users.show.kpi.roles.helperMultiple', { count: totalRoles }),
    },
    {
      label: t('users.show.kpi.activity.label'),
      value: activityCount,
      helper: t('users.show.kpi.activity.helper'),
    },
    {
      label: t('users.show.kpi.lastActivity.label'),
      value: lastActivityAt ? formatDate(lastActivityAt, locale, notAvailableLabel) : t('users.show.kpi.lastActivity.empty'),
      helper: t('users.show.kpi.lastActivity.helper'),
    },
  ];

  const handleDelete = () => {
    setDeleteConfirmation({ id: user.id, name: user.name });
  };

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    router.delete(`/users/${deleteConfirmation.id}`, {
      onSuccess: () => {
        setDeleteConfirmation(null);
      },
    });
  };

  return (
    <DetailPageLayout
      title={user.name}
      subtitle={t('users.show.subtitle', { id: user.id, date: formatDate(user.updated_at, locale, notAvailableLabel) })}
      breadcrumbs={breadcrumbs}
      headTitle={t('users.show.headTitle', { name: user.name })}
      icon={<User className="h-6 w-6 text-indigo-700 dark:text-indigo-300" />}
      iconWrapperClassName="bg-indigo-100 dark:bg-indigo-900/30"
      leading={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('users.actions.backToList')}
          </Link>
        </Button>
      }
      actions={
        <>
          <div className="flex flex-wrap gap-2">
            {user.roles.map(role => (
              <Badge key={role.id} className={`border ${getRoleBadgeClass(role.name)}`}>
                {role.name}
              </Badge>
            ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <MoreVertical className="h-4 w-4" />
                {t('users.actions.actions')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('users.actions.quick')}</DropdownMenuLabel>
              {hasPermission('users.edit') && (
                <DropdownMenuItem onSelect={() => router.visit(`/users/${user.id}/edit`)}>
                  <SquarePen className="h-4 w-4" />
                  {t('users.actions.edit')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem disabled>
                <Mail className="h-4 w-4" />
                {t('users.actions.resendInvite')}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Shield className="h-4 w-4" />
                {t('users.actions.sendReset')}
              </DropdownMenuItem>
              {hasPermission('users.destroy') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={event => {
                      event.preventDefault();
                      handleDelete();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('users.actions.delete')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <DetailSectionCard title={t('users.show.sections.profile.title')} description={t('users.show.sections.profile.description')} icon={<User className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{t('users.show.fields.name')}</p>
              <p className="mt-2 text-lg font-semibold">{user.name}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{t('users.show.fields.email')}</p>
              <p className="mt-2 text-sm font-semibold">{user.email}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{t('users.show.fields.emailStatus')}</p>
              <Badge className={`mt-2 ${isVerified ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                {isVerified ? t('users.status.verified') : t('users.status.unverified')}
              </Badge>
              {isVerified && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('users.show.fields.verifiedOn', { date: formatDate(user.email_verified_at, locale, notAvailableLabel) })}
                </p>
              )}
            </div>
          </div>
        </DetailSectionCard>

        <DetailSectionCard title={t('users.show.sections.roles.title')} description={t('users.show.sections.roles.description')} icon={<Shield className="h-5 w-5" />}>
          {user.roles.length > 0 ? (
            <div className="space-y-3">
              {user.roles.map(role => (
                <div key={role.id} className="flex items-center justify-between rounded-lg border p-3">
                  <Link href={`/roles/${role.id}`} className="font-semibold hover:underline">
                    {role.name}
                  </Link>
                  <Badge className={`border ${getRoleBadgeClass(role.name)}`}>{role.name}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('users.show.sections.roles.empty')}</p>
          )}
        </DetailSectionCard>
      </div>

      <DetailSectionCard title={t('users.show.sections.activity.title')} description={t('users.show.sections.activity.description')} icon={<Activity className="h-5 w-5" />}>
        {activityLogs.length > 0 ? (
          <ActivityLogTable activityLogs={activityLogs} />
        ) : (
          <p className="text-sm text-muted-foreground">{t('users.show.sections.activity.empty')}</p>
        )}
      </DetailSectionCard>

      <DeleteConfirmationDialog
        open={!!deleteConfirmation}
        onOpenChange={() => setDeleteConfirmation(null)}
        onConfirm={confirmDelete}
        itemName={deleteConfirmation?.name}
        title={t('users.delete.title')}
        description={t('users.delete.description')}
      />
    </DetailPageLayout>
  );
}
