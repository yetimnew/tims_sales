import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  Clock,
  Mail,
  MoreVertical,
  Shield,
  SquarePen,
  Trash2,
  User,
  Users as UsersIcon,
} from 'lucide-react';

import { ActivityLogTable } from '@/components/activity-log-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { index as usersIndexRoute, show as showUserRoute } from '@/routes/users';

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
    if (!value) {
        return 'Not available';
    }

    return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const formatDateTime = (value?: string | null): string => {
    if (!value) {
        return 'Unknown date';
    }

    return new Date(value).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function UsersShow({ user, activityLogs }: UsersShowProps) {
    const { toast } = useToast();
    const { hasPermission } = usePermissions();
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null);

    const breadcrumbs = useMemo<BreadcrumbItem[]>(
        () => [
            { title: 'User management', href: usersIndexRoute().url },
            { title: 'Users', href: usersIndexRoute().url },
            { title: user.name, href: showUserRoute(user.id).url },
        ],
        [user.id, user.name],
    );

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

    const handleDelete = () => {
        setDeleteConfirmation({ id: user.id, name: user.name });
    };

    const confirmDelete = () => {
        if (!deleteConfirmation) {
            return;
        }

        router.delete(`/users/${deleteConfirmation.id}`, {
            onSuccess: () => {
                toast({ title: 'Success', description: 'User deleted successfully.', variant: 'success' });
                setDeleteConfirmation(null);
            },
            onError: () => {
                toast({ title: 'Error', description: 'Failed to delete user.', variant: 'destructive' });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`User · ${user.name}`} />

            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6 pb-24">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex flex-col gap-2">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/users">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to users
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{user.name}</h1>
                            <p className="text-xs text-muted-foreground mt-0.5">#{user.id} · Last updated {formatDate(user.updated_at)}</p>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2 border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800">
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
                                        onSelect={(event) => {
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
                </div>

                <section className="relative overflow-hidden rounded-xl border border-slate-200/60 bg-slate-900 text-slate-100 shadow-sm dark:border-slate-700/60">
                    <div className="absolute inset-0 opacity-20" aria-hidden="true">
                        <div className="absolute -left-40 top-10 h-64 w-64 rounded-full bg-blue-500 blur-3xl" />
                        <div className="absolute -right-32 bottom-0 h-56 w-56 rounded-full bg-emerald-500 blur-3xl" />
                    </div>
                    <div className="relative flex flex-col gap-4 p-6">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="flex items-start gap-3">
                                <span className="rounded-lg bg-white/15 p-2.5 text-white shadow-sm">
                                    <User className="h-4 w-4" />
                                </span>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-white/70">User snapshot</p>
                                    <h2 className="text-xl font-semibold text-white mt-0.5">{user.name}</h2>
                                    <p className="mt-1 text-xs text-white/70">{user.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-xs">
                                    <p className="text-white/60">Roles</p>
                                    <p className="mt-0.5 text-base font-semibold text-white">{totalRoles}</p>
                                </div>
                                <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-xs">
                                    <p className="text-white/60">Status</p>
                                    <p className="mt-0.5 text-base font-semibold text-white">{isVerified ? 'Verified' : 'Pending'}</p>
                                </div>
                                <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-xs">
                                    <p className="text-white/60">Activity entries</p>
                                    <p className="mt-0.5 text-base font-semibold text-white">{activityCount}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                            <Badge variant="outline" className="border-white/30 bg-white/10 text-white text-xs px-2 py-0.5">
                                <CalendarClock className="mr-1 h-3 w-3" />
                                Joined {formatDate(user.created_at)}
                            </Badge>
                            <Badge variant="outline" className="border-white/30 bg-white/10 text-white text-xs px-2 py-0.5">
                                <Clock className="mr-1 h-3 w-3" />
                                {lastActivityAt ? `Last activity ${formatDateTime(lastActivityAt)}` : 'No recent activity'}
                            </Badge>
                            <Badge variant="outline" className="border-white/30 bg-white/10 text-white text-xs px-2 py-0.5">
                                <UsersIcon className="mr-1 h-3 w-3" />
                                {totalRoles === 1 ? 'Single role access' : `${totalRoles} role assignments`}
                            </Badge>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-4">
                        <Card className="border-slate-200/60 bg-white/90 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40">
                            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                                    <User className="h-4 w-4" /> Profile details
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                    Core contact information for this teammate.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid gap-6 sm:grid-cols-2">
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                                        <dd className="mt-1 text-base text-slate-900 dark:text-slate-100">{user.name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                                        <dd className="mt-1 text-base text-slate-900 dark:text-slate-100">{user.email}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Verification status</dt>
                                        <dd className="mt-2">
                                            <Badge variant={isVerified ? 'default' : 'secondary'}>
                                                {isVerified ? 'Verified' : 'Not verified'}
                                            </Badge>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Verified on</dt>
                                        <dd className="mt-1 text-base text-slate-900 dark:text-slate-100">{formatDate(user.email_verified_at)}</dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200/60 bg-white/90 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40">
                            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                                    <Shield className="h-4 w-4" /> Roles &amp; access
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                    Review which permission bundles this user inherits.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {user.roles.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {user.roles.map((role) => (
                                            <Link
                                                key={role.id}
                                                href={`/roles/${role.id}`}
                                                className="group rounded-xl border border-slate-200/70 bg-white/90 p-4 shadow-sm transition hover:-translate-y-[2px] hover:border-blue-300 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/40"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="rounded-lg bg-blue-100 p-2 text-blue-600 group-hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300">
                                                        <Shield className="h-4 w-4" />
                                                    </span>
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-slate-100">{role.name}</p>
                                                        <Badge variant="outline" className={`${getRoleBadgeClass(role.name)} border`}>Role</Badge>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300/70 bg-white/70 p-10 text-center text-sm text-muted-foreground dark:border-slate-700/60 dark:bg-slate-900/40">
                                        <Shield className="h-10 w-10 text-slate-400" />
                                        <div>
                                            <p>This user has no roles assigned yet.</p>
                                            {hasPermission('users.edit') && (
                                                <Button variant="outline" asChild className="mt-4">
                                                    <Link href={`/users/${user.id}/edit`}>Assign a role</Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200/60 bg-white/90 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40">
                            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                                    <CalendarClock className="h-4 w-4" /> Record history
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                    Important milestones for this profile.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid gap-6 sm:grid-cols-2">
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                                        <dd className="mt-1 text-base text-slate-900 dark:text-slate-100">{formatDate(user.created_at)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-muted-foreground">Last updated</dt>
                                        <dd className="mt-1 text-base text-slate-900 dark:text-slate-100">{formatDate(user.updated_at)}</dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>
                    </div>

                    <aside className="space-y-4 lg:sticky lg:top-24">
                        <Card className="border-slate-200/60 bg-white/90 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/50">
                            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quick snapshot</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                    Key reference points while you audit access.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <dl className="space-y-4 text-sm">
                                    <div className="flex items-center justify-between">
                                        <dt className="flex items-center gap-2 text-muted-foreground">
                                            <UsersIcon className="h-4 w-4 text-blue-500" />
                                            Account ID
                                        </dt>
                                        <dd className="font-medium text-slate-900 dark:text-slate-100">#{user.id}</dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <dt className="flex items-center gap-2 text-muted-foreground">
                                            <Mail className="h-4 w-4 text-emerald-500" />
                                            Email status
                                        </dt>
                                        <dd>
                                            <Badge variant={isVerified ? 'default' : 'secondary'}>
                                                {isVerified ? 'Verified' : 'Pending' }
                                            </Badge>
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <dt className="flex items-center gap-2 text-muted-foreground">
                                            <Shield className="h-4 w-4 text-violet-500" />
                                            Roles assigned
                                        </dt>
                                        <dd className="font-medium text-slate-900 dark:text-slate-100">{totalRoles}</dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <dt className="flex items-center gap-2 text-muted-foreground">
                                            <Activity className="h-4 w-4 text-amber-500" />
                                            Activity entries
                                        </dt>
                                        <dd className="font-medium text-slate-900 dark:text-slate-100">{activityCount}</dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200/60 bg-white/90 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/50">
                            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    <Clock className="h-4 w-4" /> Recent activity
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                    Last five log entries for this user.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {timelineEntries.length > 0 ? (
                                    <ul className="space-y-4">
                                        {timelineEntries.map((log, index) => (
                                            <li key={log.id} className="relative pl-6">
                                                {index < timelineEntries.length - 1 && (
                                                    <span className="absolute left-[9px] top-5 h-full w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
                                                )}
                                                <span className="absolute left-1.5 top-2 flex h-3 w-3 items-center justify-center rounded-full bg-indigo-500 dark:bg-indigo-400" aria-hidden="true" />
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        {log.description || 'Activity recorded'}
                                                    </span>
                                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                        <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                                                            {log.log_name}
                                                        </Badge>
                                                        <span>{formatDateTime(log.created_at)}</span>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="rounded-lg border border-dashed border-slate-300/70 bg-white/70 p-6 text-center text-sm text-muted-foreground dark:border-slate-700/60 dark:bg-slate-900/40">
                                        No recent activity recorded for this user.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </aside>
                </section>

                <Card className="border-slate-200/60 bg-white/90 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40">
                    <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                            <Activity className="h-4 w-4" /> Activity log
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                            Full audit trail for the user, including older entries.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ActivityLogTable activityLogs={activityLogs} />
                    </CardContent>
                </Card>
            </div>

            <DeleteConfirmationDialog
                open={Boolean(deleteConfirmation)}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteConfirmation(null);
                    }
                }}
                title="Delete User"
                description="Are you sure you want to delete this user? This action cannot be undone."
                itemName={deleteConfirmation?.name}
                onConfirm={confirmDelete}
            />
        </AppLayout>
    );
}
