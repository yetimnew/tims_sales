import { Link, router } from '@inertiajs/react';
import { Activity, AlertCircle, ArrowLeft, FolderTree, Layers, ShieldCheck, SquarePen, Trash2, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { type BreadcrumbItem } from '@/types';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';
import { useTranslation } from 'react-i18next';

interface Permission {
  id: number;
  name: string;
  guard_name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions?: Permission[];
  users?: User[];
  created_at: string;
  updated_at: string;
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

interface RolesShowProps {
  role: Role;
  activityLogs: ActivityLog[];
}

const formatModuleLabel = (value: string): string => {
  const normalized = value.replace(/\./g, ' / ').replace(/[_-]/g, ' ');
  return normalized.replace(/\b\w/g, segment => segment.toUpperCase());
};

const formatDate = (value: string, locale: string): string => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(value).toLocaleDateString(locale, options);
};

export default function RolesShow({ role, activityLogs }: RolesShowProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en-US';
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: t('roles.breadcrumbs.management'), href: '/users' },
      { title: t('roles.title'), href: '/roles' },
      { title: role.name, href: `/roles/${role.id}` },
    ],
    [role.id, role.name, t],
  );

  const permissions = role.permissions ?? [];
  const users = role.users ?? [];

  const groupedPermissions = useMemo(() => {
    return permissions.reduce((accumulator, permission) => {
      const module = permission.name.split('.')[0];
      if (!accumulator[module]) {
        accumulator[module] = [];
      }
      accumulator[module].push(permission);
      return accumulator;
    }, {} as Record<string, Permission[]>);
  }, [permissions]);

  const moduleEntries = useMemo(() => Object.entries(groupedPermissions), [groupedPermissions]);

  useEffect(() => {
    setExpandedModules(previous => {
      const next: Record<string, boolean> = {};
      moduleEntries.forEach(([module]) => {
        next[module] = previous[module] ?? true;
      });
      return next;
    });
  }, [moduleEntries]);

  const totalPermissions = permissions.length;
  const totalUsers = users.length;

  const kpiSummary: DetailSummaryItem[] = [
    { label: t('roles.show.kpi.permissions.label'), value: totalPermissions, helper: t('roles.show.kpi.permissions.helper') },
    { label: t('roles.show.kpi.users.label'), value: totalUsers, helper: t('roles.show.kpi.users.helper') },
    { label: t('roles.show.kpi.modules.label'), value: moduleEntries.length, helper: t('roles.show.kpi.modules.helper') },
    { label: t('roles.show.kpi.created.label'), value: formatDate(role.created_at, locale), helper: t('roles.show.kpi.created.helper') },
  ];

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    router.delete(`/roles/${deleteConfirmation.id}`, {
      onSuccess: () => {
        toast({ title: t('roles.delete.successTitle'), description: t('roles.delete.successDescription', { name: deleteConfirmation.name }), variant: 'success' });
        setDeleteConfirmation(null);
      },
      onError: () => {
        toast({ title: t('roles.delete.failedTitle'), description: t('roles.delete.failedDescription'), variant: 'destructive' });
      },
    });
  };

  return (
    <DetailPageLayout
      title={role.name}
      subtitle={role.description || t('roles.show.subtitleFallback')}
      breadcrumbs={breadcrumbs}
      headTitle={t('roles.show.headTitle', { name: role.name })}
      icon={<ShieldCheck className="h-6 w-6 text-indigo-700 dark:text-indigo-300" />}
      iconWrapperClassName="bg-indigo-100 dark:bg-indigo-900/30"
      leading={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/roles">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('roles.actions.backToList')}
          </Link>
        </Button>
      }
      actions={
        <>
          <Badge variant="outline">{t('roles.show.updatedBadge', { id: role.id, date: formatDate(role.updated_at, locale) })}</Badge>
          <div className="flex gap-2">
            {hasPermission('roles.edit') && (
              <Button variant="outline" asChild>
                <Link href={`/roles/${role.id}/edit`}>
                  <SquarePen className="h-4 w-4 mr-2" />
                  {t('roles.actions.edit')}
                </Link>
              </Button>
            )}
            {hasPermission('roles.destroy') && (
              <Button variant="destructive" onClick={() => setDeleteConfirmation({ id: role.id, name: role.name })}>
                <Trash2 className="h-4 w-4 mr-2" />
                {t('roles.actions.delete')}
              </Button>
            )}
          </div>
        </>
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
        <div className="space-y-6">
        <DetailSectionCard title={t('roles.show.sections.permissions.title')} description={t('roles.show.sections.permissions.description')} icon={<Layers className="h-5 w-5" />}>
          <div className="space-y-4">
            {moduleEntries.length > 0 ? (
              moduleEntries.map(([module, modulePermissions]) => (
                <div key={module} className="overflow-hidden rounded-xl border">
                    <Collapsible open={expandedModules[module] ?? true} onOpenChange={value => setExpandedModules(previous => ({ ...previous, [module]: value }))}>
                      <div className="flex items-center justify-between border-b bg-muted/50 px-5 py-4">
                        <CollapsibleTrigger asChild>
                          <button type="button" className="flex flex-1 items-center justify-between gap-4 text-left">
                            <div className="flex items-center gap-3">
                              <FolderTree className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-sm font-semibold">{formatModuleLabel(module)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {t('roles.show.sections.permissions.moduleCount', { count: modulePermissions.length, suffix: modulePermissions.length === 1 ? '' : 's' })}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[11px]">
                              {modulePermissions.length}
                            </Badge>
                          </button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="px-5 pb-5 pt-4">
                        <div className="flex flex-wrap gap-2">
                          {modulePermissions.map(permission => (
                            <Badge key={permission.id} variant="secondary" className="bg-blue-50 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                              {permission.name.replace(`${module}.`, '')}
                            </Badge>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-12 text-center">
                  <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('roles.show.sections.permissions.empty')}</p>
                    {hasPermission('roles.edit') && (
                      <Button variant="outline" asChild className="mt-3">
                        <Link href={`/roles/${role.id}/edit`}>{t('roles.show.sections.permissions.assignAction')}</Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DetailSectionCard>

          <DetailSectionCard title={t('roles.show.sections.people.title')} description={t('roles.show.sections.people.description')} icon={<Users className="h-5 w-5" />}>
            {totalUsers > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {users.map(user => (
                  <Link key={user.id} href={`/users/${user.id}`} className="group rounded-xl border p-4 transition hover:-translate-y-[2px] hover:border-blue-300 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
                <Users className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('roles.show.sections.people.empty')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('roles.show.sections.people.emptyHint')}</p>
                </div>
              </div>
            )}
          </DetailSectionCard>
        </div>

        <div className="space-y-4">
          <DetailSectionCard title={t('roles.show.sections.glance.title')} description={t('roles.show.sections.glance.description')} icon={<Activity className="h-4 w-4" />}>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('roles.show.sections.glance.modules')}</span>
                <span className="font-semibold">{moduleEntries.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('roles.show.sections.glance.permissions')}</span>
                <span className="font-semibold">{totalPermissions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('roles.show.sections.glance.members')}</span>
                <span className="font-semibold">{totalUsers}</span>
              </div>
            </div>
          </DetailSectionCard>

          <div className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium">{t('roles.show.tip.title')}</p>
                <p className="mt-1 leading-relaxed">{t('roles.show.tip.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DetailSectionCard title={t('roles.show.sections.activity.title')} description={t('roles.show.sections.activity.description')} icon={<Activity className="h-5 w-5" />}>
        <ActivityLogTable activityLogs={activityLogs} />
      </DetailSectionCard>

      <DeleteConfirmationDialog
        open={Boolean(deleteConfirmation)}
        onOpenChange={open => !open && setDeleteConfirmation(null)}
        title={t('roles.delete.title')}
        description={t('roles.delete.description')}
        itemName={deleteConfirmation?.name}
        onConfirm={confirmDelete}
      />
    </DetailPageLayout>
  );
}
