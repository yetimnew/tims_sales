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

const formatDate = (value?: string | null): string => {
  if (!value) return 'Not available';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function UsersShow({ user, activityLogs }: UsersShowProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'User management', href: '/users' },
    { title: 'Users', href: '/users' },
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
    { label: 'Email Status', value: isVerified ? 'Verified' : 'Unverified', helper: isVerified ? formatDate(user.email_verified_at) : 'Not yet verified', valueClassName: isVerified ? 'text-green-600' : 'text-amber-600' },
    { label: 'Roles Assigned', value: totalRoles, helper: totalRoles === 1 ? '1 role' : `${totalRoles} roles` },
    { label: 'Activity Entries', value: activityCount, helper: 'Total logged actions' },
    { label: 'Last Activity', value: lastActivityAt ? formatDate(lastActivityAt) : 'No activity', helper: 'Most recent action' },
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
      subtitle={`#${user.id} · Last updated ${formatDate(user.updated_at)}`}
      breadcrumbs={breadcrumbs}
      headTitle={`User · ${user.name}`}
      icon={<User className="h-6 w-6 text-indigo-700 dark:text-indigo-300" />}
      iconWrapperClassName="bg-indigo-100 dark:bg-indigo-900/30"
      leading={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to users
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
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
              {hasPermission('users.edit') && (
                <DropdownMenuItem onSelect={() => router.visit(`/users/${user.id}/edit`)}>
                  <SquarePen className="h-4 w-4" />
                  Edit user
                </DropdownMenuItem>
              )}
              <DropdownMenuItem disabled>
                <Mail className="h-4 w-4" />
                Resend invite (pending)
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Shield className="h-4 w-4" />
                Send reset link
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
                    Delete user
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
        <DetailSectionCard title="User Profile" description="Core account information" icon={<User className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Full Name</p>
              <p className="mt-2 text-lg font-semibold">{user.name}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Email Address</p>
              <p className="mt-2 text-sm font-semibold">{user.email}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Email Status</p>
              <Badge className={`mt-2 ${isVerified ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{isVerified ? 'Verified' : 'Unverified'}</Badge>
              {isVerified && <p className="mt-1 text-xs text-muted-foreground">Verified on {formatDate(user.email_verified_at)}</p>}
            </div>
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Roles & Permissions" description="Assigned access levels" icon={<Shield className="h-5 w-5" />}>
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
            <p className="text-sm text-muted-foreground">No roles assigned yet.</p>
          )}
        </DetailSectionCard>
      </div>

      <DetailSectionCard title="Activity History" description="Recent actions by this user" icon={<Activity className="h-5 w-5" />}>
        {activityLogs.length > 0 ? <ActivityLogTable activityLogs={activityLogs} /> : <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}
      </DetailSectionCard>

      <DeleteConfirmationDialog open={!!deleteConfirmation} onOpenChange={() => setDeleteConfirmation(null)} onConfirm={confirmDelete} itemName={deleteConfirmation?.name} title="Delete User" description="Are you sure you want to delete this user?" />
    </DetailPageLayout>
  );
}
