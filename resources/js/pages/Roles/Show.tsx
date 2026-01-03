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

const formatDate = (value: string): string => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(value).toLocaleDateString(undefined, options);
};

export default function RolesShow({ role, activityLogs }: RolesShowProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => [{ title: 'User management', href: '/users' }, { title: 'Roles', href: '/roles' }, { title: role.name, href: `/roles/${role.id}` }], [role.id, role.name]);

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
    { label: 'Permissions', value: totalPermissions, helper: 'Total capabilities' },
    { label: 'Assigned Users', value: totalUsers, helper: 'Team members' },
    { label: 'Modules', value: moduleEntries.length, helper: 'Areas covered' },
    { label: 'Created', value: formatDate(role.created_at), helper: 'Initial setup' },
  ];

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    router.delete(`/roles/${deleteConfirmation.id}`, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Role deleted successfully', variant: 'success' });
        setDeleteConfirmation(null);
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete role', variant: 'destructive' });
      },
    });
  };

  return (
    <DetailPageLayout
      title={role.name}
      subtitle={role.description || 'No description provided for this role yet.'}
      breadcrumbs={breadcrumbs}
      headTitle={`Role · ${role.name}`}
      icon={<ShieldCheck className="h-6 w-6 text-indigo-700 dark:text-indigo-300" />}
      iconWrapperClassName="bg-indigo-100 dark:bg-indigo-900/30"
      leading={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/roles">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Roles
          </Link>
        </Button>
      }
      actions={
        <>
          <Badge variant="outline">#{role.id} · Updated {formatDate(role.updated_at)}</Badge>
          <div className="flex gap-2">
            {hasPermission('roles.edit') && (
              <Button variant="outline" asChild>
                <Link href={`/roles/${role.id}/edit`}>
                  <SquarePen className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            )}
            {hasPermission('roles.destroy') && (
              <Button variant="destructive" onClick={() => setDeleteConfirmation({ id: role.id, name: role.name })}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </>
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
        <div className="space-y-6">
          <DetailSectionCard title="Permission Library" description="Organized view of every capability attached to this role" icon={<Layers className="h-5 w-5" />}>
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
                                  {modulePermissions.length} permission{modulePermissions.length === 1 ? '' : 's'}
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
                    <p className="text-sm text-muted-foreground">No permissions assigned to this role yet.</p>
                    {hasPermission('roles.edit') && (
                      <Button variant="outline" asChild className="mt-3">
                        <Link href={`/roles/${role.id}/edit`}>Assign Permissions</Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="People With This Role" description="Understand who inherits the permissions defined above" icon={<Users className="h-5 w-5" />}>
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
                  <p className="text-sm text-muted-foreground">No users currently linked to this role.</p>
                  <p className="mt-1 text-xs text-muted-foreground">Assign it to teammates to extend access.</p>
                </div>
              </div>
            )}
          </DetailSectionCard>
        </div>

        <div className="space-y-4">
          <DetailSectionCard title="At a Glance" description="Quick audit summary" icon={<Activity className="h-4 w-4" />}>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modules covered</span>
                <span className="font-semibold">{moduleEntries.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Permissions total</span>
                <span className="font-semibold">{totalPermissions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Members assigned</span>
                <span className="font-semibold">{totalUsers}</span>
              </div>
            </div>
          </DetailSectionCard>

          <div className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium">Need to refine this role?</p>
                <p className="mt-1 leading-relaxed">Use the edit action to adjust responsibilities or prune unneeded access as your security posture evolves.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DetailSectionCard title="Activity Log" description="Review every change captured for this role" icon={<Activity className="h-5 w-5" />}>
        <ActivityLogTable activityLogs={activityLogs} />
      </DetailSectionCard>

      <DeleteConfirmationDialog open={Boolean(deleteConfirmation)} onOpenChange={open => !open && setDeleteConfirmation(null)} title="Delete Role" description="Are you sure you want to delete this role? This action cannot be undone." itemName={deleteConfirmation?.name} onConfirm={confirmDelete} />
    </DetailPageLayout>
  );
}
