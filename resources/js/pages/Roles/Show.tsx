import { Link, Head, router } from '@inertiajs/react';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  FolderTree,
  Layers,
  ShieldCheck,
  SquarePen,
  Trash2,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Roles', href: '/roles' },
  { title: 'Details', href: '#' },
];

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
    return normalized.replace(/\b\w/g, (segment) => segment.toUpperCase());
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
        setExpandedModules((previous) => {
            const next: Record<string, boolean> = {};
            moduleEntries.forEach(([module]) => {
                next[module] = previous[module] ?? true;
            });
            return next;
        });
    }, [moduleEntries]);

    const totalPermissions = permissions.length;
    const totalUsers = users.length;

    const handleDelete = () => {
        setDeleteConfirmation({ id: role.id, name: role.name });
    };

    const confirmDelete = () => {
        if (!deleteConfirmation) {
            return;
        }

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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Role · ${role.name}`} />

            <div className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-3">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/roles">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Roles
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{role.name}</h1>
                            <p className="text-sm text-muted-foreground">#{role.id} · Last updated {formatDate(role.updated_at)}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {hasPermission('roles.edit') && (
                            <Button variant="outline" asChild>
                                <Link href={`/roles/${role.id}/edit`}>
                                    <SquarePen className="mr-2 h-4 w-4" />
                                    Edit Role
                                </Link>
                            </Button>
                        )}
                        {hasPermission('roles.destroy') && (
                            <Button variant="destructive" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Role
                            </Button>
                        )}
                    </div>
                </div>

                <section className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-900 text-slate-100 shadow-lg dark:border-slate-800">
                    <div className="absolute inset-0 opacity-30" aria-hidden="true">
                        <div className="absolute -left-40 top-10 h-64 w-64 rounded-full bg-blue-500 blur-3xl" />
                        <div className="absolute -right-32 bottom-0 h-56 w-56 rounded-full bg-emerald-500 blur-3xl" />
                    </div>
                    <div className="relative flex flex-col gap-6 p-8">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="flex items-start gap-3">
                                <span className="rounded-lg bg-white/15 p-3 text-white shadow-sm">
                                    <ShieldCheck className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-sm uppercase tracking-wide text-white/70">Role Snapshot</p>
                                    <h2 className="text-2xl font-semibold text-white">{role.name}</h2>
                                    <p className="mt-2 max-w-xl text-sm text-white/70">
                                        {role.description || 'No description has been provided for this role yet.'}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
                                    <p className="text-white/60">Permissions</p>
                                    <p className="mt-1 text-lg font-semibold text-white">{totalPermissions}</p>
                                </div>
                                <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
                                    <p className="text-white/60">Assigned Users</p>
                                    <p className="mt-1 text-lg font-semibold text-white">{totalUsers}</p>
                                </div>
                                <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
                                    <p className="text-white/60">Created</p>
                                    <p className="mt-1 text-lg font-semibold text-white">{formatDate(role.created_at)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                            <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
                                <Layers className="mr-1 h-3.5 w-3.5" />
                                {moduleEntries.length} module{moduleEntries.length === 1 ? '' : 's'}
                            </Badge>
                            <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
                                <Users className="mr-1 h-3.5 w-3.5" />
                                {totalUsers} team member{totalUsers === 1 ? '' : 's'}
                            </Badge>
                            <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
                                <CalendarClock className="mr-1 h-3.5 w-3.5" />
                                Updated {formatDate(role.updated_at)}
                            </Badge>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <Layers className="h-4 w-4" />
                                </span>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Permission Library</h3>
                                    <p className="text-sm text-muted-foreground">Organized view of every capability attached to this role.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            {moduleEntries.length > 0 ? (
                                moduleEntries.map(([module, modulePermissions]) => (
                                    <div
                                        key={module}
                                        className="overflow-hidden rounded-xl border border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/40"
                                    >
                                        <Collapsible
                                            open={expandedModules[module] ?? true}
                                            onOpenChange={(value) =>
                                                setExpandedModules((previous) => ({ ...previous, [module]: value }))
                                            }
                                        >
                                            <div className="flex flex-col gap-4 border-b border-slate-200/60 bg-slate-50/70 px-5 py-4 dark:border-slate-700/60 dark:bg-slate-900/60 lg:flex-row lg:items-center lg:justify-between">
                                                <CollapsibleTrigger asChild>
                                                    <button type="button" className="flex flex-1 items-center justify-between gap-4 text-left">
                                                        <div className="flex items-start gap-3">
                                                            <span className="mt-0.5 rounded-full bg-blue-100 p-1 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                                <FolderTree className="h-3.5 w-3.5" />
                                                            </span>
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                                    {formatModuleLabel(module)}
                                                                </p>
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
                                                    {modulePermissions.map((permission) => (
                                                        <Badge
                                                            key={permission.id}
                                                            variant="secondary"
                                                            className="bg-blue-50 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-200"
                                                        >
                                                            {permission.name.replace(`${module}.`, '')}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300/70 bg-white/70 p-12 text-center text-sm text-muted-foreground dark:border-slate-700/60 dark:bg-slate-900/40">
                                    <AlertCircle className="h-6 w-6 text-slate-400" />
                                    <div>
                                        <p>No permissions are assigned to this role yet.</p>
                                        {hasPermission('roles.edit') && (
                                            <Button variant="outline" asChild className="mt-3">
                                                <Link href={`/roles/${role.id}/edit`}>Assign Permissions</Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <aside className="space-y-4 lg:sticky lg:top-24">
                        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">At a glance</h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Quickly audit who this role touches and how broad its access runs.
                            </p>
                            <dl className="mt-6 space-y-4 text-sm">
                                <div className="flex items-center justify-between">
                                    <dt className="flex items-center gap-2 text-muted-foreground">
                                        <Layers className="h-4 w-4 text-blue-500" />
                                        Modules covered
                                    </dt>
                                    <dd className="font-medium text-slate-900 dark:text-slate-100">{moduleEntries.length}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="flex items-center gap-2 text-muted-foreground">
                                        <Activity className="h-4 w-4 text-emerald-500" />
                                        Permissions total
                                    </dt>
                                    <dd className="font-medium text-slate-900 dark:text-slate-100">{totalPermissions}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="flex items-center gap-2 text-muted-foreground">
                                        <Users className="h-4 w-4 text-violet-500" />
                                        Members assigned
                                    </dt>
                                    <dd className="font-medium text-slate-900 dark:text-slate-100">{totalUsers}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-xl border border-dashed border-slate-200/70 bg-slate-50/70 p-4 text-xs text-muted-foreground dark:border-slate-800/70 dark:bg-slate-900/40">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="mt-0.5 h-4 w-4 text-slate-400" />
                                <div>
                                    <p className="font-medium text-slate-700 dark:text-slate-200">Need to refine this role?</p>
                                    <p className="mt-1 leading-relaxed">
                                        Use the edit action to adjust responsibilities or prune unneeded access as your security posture evolves.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </section>

                <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="rounded-lg bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                                <Users className="h-4 w-4" />
                            </span>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">People With This Role</h3>
                                <p className="text-sm text-muted-foreground">Understand who inherits the permissions defined above.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        {totalUsers > 0 ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {users.map((user) => (
                                    <Link
                                        key={user.id}
                                        href={`/users/${user.id}`}
                                        className="group rounded-xl border border-slate-200/70 bg-white/90 p-4 shadow-sm transition hover:-translate-y-[2px] hover:border-blue-300 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/40"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="rounded-lg bg-blue-100 p-2 text-blue-600 group-hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300">
                                                <Users className="h-4 w-4" />
                                            </span>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300/70 bg-white/70 p-10 text-center text-sm text-muted-foreground dark:border-slate-700/60 dark:bg-slate-900/40">
                                <Users className="h-10 w-10 text-slate-400" />
                                <div>
                                    <p>No users are currently linked to this role.</p>
                                    <p className="mt-1 text-xs">Assign it to teammates to extend access.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                <CalendarClock className="h-4 w-4" />
                            </span>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Record Timeline</h3>
                                <p className="text-sm text-muted-foreground">Track when this role was introduced and last touched.</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200/70 bg-white/90 p-4 text-sm dark:border-slate-800/70 dark:bg-slate-900/50">
                            <p className="text-muted-foreground">Created on</p>
                            <p className="mt-1 text-base font-medium text-slate-900 dark:text-slate-100">{formatDate(role.created_at)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200/70 bg-white/90 p-4 text-sm dark:border-slate-800/70 dark:bg-slate-900/50">
                            <p className="text-muted-foreground">Last updated</p>
                            <p className="mt-1 text-base font-medium text-slate-900 dark:text-slate-100">{formatDate(role.updated_at)}</p>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="flex items-start gap-3">
                        <span className="rounded-lg bg-slate-200 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <Activity className="h-4 w-4" />
                        </span>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Activity Log</h3>
                            <p className="text-sm text-muted-foreground">Review every change that has been captured for this role.</p>
                        </div>
                    </div>
                    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-800/70">
                        <ActivityLogTable activityLogs={activityLogs} />
                    </div>
                </section>
            </div>

            <DeleteConfirmationDialog
                open={Boolean(deleteConfirmation)}
                onOpenChange={(open) => !open && setDeleteConfirmation(null)}
                title="Delete Role"
                description="Are you sure you want to delete this role? This action cannot be undone."
                itemName={deleteConfirmation?.name}
                onConfirm={confirmDelete}
            />
        </AppLayout>
    );
}
