import NotificationPreferenceAdminController from '@/actions/App/Http/Controllers/NotificationPreferenceAdminController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InertiaPagination } from '@/components/ui/pagination';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import * as React from 'react';
import { Plus, Trash2, Undo2 } from 'lucide-react';
import { index as indexRoute } from '@/routes/notifications/preferences';

interface NotificationTypeResource {
    id: number;
    key: string;
    name: string;
    description: string | null;
    default_in_app: boolean;
    default_email: boolean;
}

interface AssignedByResource {
    id: number;
    name: string;
}

interface UserPreferenceResource {
    type_id: number;
    key: string;
    name: string;
    description: string | null;
    in_app_enabled: boolean;
    email_enabled: boolean;
    assigned_by?: AssignedByResource | null;
    updated_at?: string | null;
}

interface UserResource {
    id: number;
    name: string;
    email: string;
    roles: string[];
    preferences: UserPreferenceResource[];
}

interface LinkResource {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginated<T> {
    data: T[];
    links: LinkResource[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
}

type PreferenceRow = {
    typeId: number;
    key: string;
    name: string;
    description: string | null;
    inAppEnabled: boolean;
    emailEnabled: boolean;
    assignedBy?: AssignedByResource | null;
    updatedAt?: string | null;
    remove?: boolean;
    isNew?: boolean;
};

interface NotificationPreferencesProps {
    filters: {
        search?: string | null;
        selected_user?: string | number | null;
    };
    types: NotificationTypeResource[];
    users: Paginated<UserResource>;
}

type FlashProps = {
    flash?: {
        success?: string;
        error?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notification assignments',
        href: indexRoute().url,
    },
];

const toPreferenceRow = (preference: UserPreferenceResource): PreferenceRow => ({
    typeId: preference.type_id,
    key: preference.key,
    name: preference.name,
    description: preference.description,
    inAppEnabled: preference.in_app_enabled,
    emailEnabled: preference.email_enabled,
    assignedBy: preference.assigned_by ?? undefined,
    updatedAt: preference.updated_at ?? undefined,
    remove: false,
    isNew: false,
});

const formatTimestamp = (timestamp?: string | null): string | null => {
    if (!timestamp) {
        return null;
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(timestamp));
    } catch (error) {
        return null;
    }
};

export default function NotificationPreferences({ filters, types, users }: NotificationPreferencesProps) {
    const { flash } = usePage<FlashProps>().props;
    const [searchTerm, setSearchTerm] = React.useState<string>(filters.search ?? '');

    const selectedFromFilter = React.useMemo(() => {
        const raw = filters.selected_user;
        if (raw === null || raw === undefined || raw === '') {
            return null;
        }

        const value = Number(raw);
        return Number.isNaN(value) ? null : value;
    }, [filters.selected_user]);

    const [selectedUserId, setSelectedUserId] = React.useState<number | null>(() => {
        if (selectedFromFilter !== null) {
            return selectedFromFilter;
        }

        return users.data[0]?.id ?? null;
    });

    React.useEffect(() => {
        setSearchTerm(filters.search ?? '');
    }, [filters.search]);

    React.useEffect(() => {
        setSelectedUserId(current => {
            if (current !== null && users.data.some(user => user.id === current)) {
                return current;
            }

            if (selectedFromFilter !== null && users.data.some(user => user.id === selectedFromFilter)) {
                return selectedFromFilter;
            }

            return users.data[0]?.id ?? null;
        });
    }, [users.data, selectedFromFilter]);

    const selectedUser = React.useMemo(() => {
        if (selectedUserId === null) {
            return null;
        }

        return users.data.find(user => user.id === selectedUserId) ?? null;
    }, [selectedUserId, users.data]);

    const [rows, setRows] = React.useState<PreferenceRow[]>(() =>
        selectedUser ? selectedUser.preferences.map(toPreferenceRow) : [],
    );

    React.useEffect(() => {
        setRows(selectedUser ? selectedUser.preferences.map(toPreferenceRow) : []);
    }, [selectedUser]);

    const availableTypes = React.useMemo(() => {
        return types.filter(type => !rows.some(row => row.typeId === type.id));
    }, [types, rows]);

    const handleSearchSubmit = React.useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            router.get(
                indexRoute.url({
                    query: {
                        search: searchTerm || undefined,
                        selected_user: selectedUserId ?? undefined,
                    },
                }),
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
        },
        [searchTerm, selectedUserId],
    );

    const handleAddType = React.useCallback(
        (value: string) => {
            const typeId = Number(value);
            if (Number.isNaN(typeId)) {
                return;
            }

            const type = types.find(item => item.id === typeId);
            if (!type) {
                return;
            }

            setRows(current => [
                ...current,
                {
                    typeId: type.id,
                    key: type.key,
                    name: type.name,
                    description: type.description,
                    inAppEnabled: type.default_in_app,
                    emailEnabled: type.default_email,
                    assignedBy: undefined,
                    updatedAt: undefined,
                    remove: false,
                    isNew: true,
                },
            ]);
        },
        [types],
    );

    const handleToggle = React.useCallback(
        (typeId: number, channel: 'inAppEnabled' | 'emailEnabled', value: boolean) => {
            setRows(current =>
                current.map(row =>
                    row.typeId === typeId
                        ? {
                              ...row,
                              [channel]: value,
                          }
                        : row,
                ),
            );
        },
        [],
    );

    const handleRemove = React.useCallback((typeId: number) => {
        setRows(current =>
            current.map(row =>
                row.typeId === typeId
                    ? {
                          ...row,
                          remove: true,
                      }
                    : row,
            ),
        );
    }, []);

    const handleRestore = React.useCallback((typeId: number) => {
        setRows(current =>
            current.map(row =>
                row.typeId === typeId
                    ? {
                          ...row,
                          remove: false,
                      }
                    : row,
            ),
        );
    }, []);

    const [isSaving, setIsSaving] = React.useState(false);

    const handleSave = React.useCallback(() => {
        if (!selectedUser) {
            return;
        }

        setIsSaving(true);

        const payload = rows.map(row => ({
            type_id: row.typeId,
            in_app_enabled: row.inAppEnabled,
            email_enabled: row.emailEnabled,
            remove: row.remove ?? false,
        }));

        const updateUrl = NotificationPreferenceAdminController.update.url(
            { user: selectedUser.id },
            {
                query: {
                    search: searchTerm || undefined,
                    selected_user: selectedUserId ?? undefined,
                },
            },
        );

        router.patch(
            updateUrl,
            {
                preferences: payload,
                search: searchTerm,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsSaving(false),
            },
        );
    }, [rows, searchTerm, selectedUser, selectedUserId]);

    const successMessage = flash?.success ?? null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notification assignments" />

            <div className="flex flex-col gap-6 px-4 py-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold">Notification assignments</h1>
                    <p className="max-w-3xl text-sm text-muted-foreground">
                        Grant notification types to team members and configure their default delivery methods. Users
                        can fine-tune the channels you enable for them via their personal settings.
                    </p>
                </div>

                <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 md:flex-row md:items-center">
                    <Input
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        placeholder="Search people by name or email"
                        className="w-full md:max-w-sm"
                        type="search"
                        name="search"
                    />
                    <div className="flex gap-2">
                        <Button type="submit" variant="secondary">
                            Search
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setSearchTerm('');
                                router.get(
                                    indexRoute.url({
                                        query: {
                                            selected_user: selectedUserId ?? undefined,
                                        },
                                    }),
                                    {
                                        preserveScroll: true,
                                        preserveState: true,
                                    },
                                );
                            }}
                            disabled={searchTerm.length === 0}
                        >
                            Clear
                        </Button>
                    </div>
                </form>

                <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle className="text-base">People</CardTitle>
                            <CardDescription>Select a person to manage their notification access.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {users.data.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No users match your search criteria.</p>
                            ) : (
                                <div className="flex flex-col">
                                    {users.data.map(user => {
                                        const isSelected = user.id === selectedUserId;

                                        return (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => setSelectedUserId(user.id)}
                                                className={cn(
                                                    'flex flex-col gap-1 rounded-md px-3 py-2 text-left transition hover:bg-muted',
                                                    isSelected && 'border border-border bg-muted',
                                                )}
                                            >
                                                <span className="text-sm font-medium text-foreground">
                                                    {user.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {user.email}
                                                </span>
                                                {user.roles.length > 0 && (
                                                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                                        {user.roles.join(', ')}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                        {users.links.length > 1 && (
                            <div className="border-t border-border px-4 py-3">
                                <InertiaPagination links={users.links} />
                            </div>
                        )}
                    </Card>

                    <Card className="min-h-[420px]">
                        <CardHeader className="flex flex-col gap-4">
                            <div>
                                <CardTitle className="text-base">Notification types</CardTitle>
                                <CardDescription>
                                    Enable notification channels for the selected person. Removing a notification stops all
                                    deliveries until it is added again.
                                </CardDescription>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Select onValueChange={handleAddType}>
                                    <SelectTrigger className="w-full md:w-72">
                                        <SelectValue placeholder="Add notification type" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-64">
                                        {availableTypes.length === 0 ? (
                                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                                All notification types are already assigned.
                                            </div>
                                        ) : (
                                            availableTypes.map(type => (
                                                <SelectItem key={type.id} value={String(type.id)}>
                                                    {type.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <Plus className="h-3 w-3" />
                                    Add type
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            {selectedUser === null ? (
                                <p className="text-sm text-muted-foreground">
                                    Select a person on the left to view their notification access.
                                </p>
                            ) : rows.length === 0 ? (
                                <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                                    {selectedUser.name} does not have any notification types assigned yet. Use the selector above to
                                    grant access.
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {rows.map(row => {
                                        const updatedAt = formatTimestamp(row.updatedAt);

                                        return (
                                            <div
                                                key={row.typeId}
                                                className={cn(
                                                    'rounded-lg border border-border bg-card p-4 shadow-sm',
                                                    row.remove && 'bg-muted/40 opacity-75',
                                                )}
                                            >
                                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-foreground">{row.name}</h3>
                                                        <p className="max-w-2xl text-sm text-muted-foreground">
                                                            {row.description ?? 'No description available.'}
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                            {row.assignedBy && <Badge variant="outline">Grant by {row.assignedBy.name}</Badge>}
                                                            {row.isNew && <Badge variant="outline">New assignment</Badge>}
                                                            {row.remove && <Badge variant="destructive">Will be removed</Badge>}
                                                            {updatedAt && <span>Updated {updatedAt}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {row.remove ? (
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => handleRestore(row.typeId)}
                                                            >
                                                                <Undo2 className="mr-1 h-4 w-4" /> Restore
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemove(row.typeId)}
                                                            >
                                                                <Trash2 className="mr-1 h-4 w-4" /> Remove
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                    <div className="flex items-start gap-3 rounded-md border border-border bg-background/70 p-4">
                                                        <Checkbox
                                                            id={`admin-pref-${row.typeId}-in-app`}
                                                            checked={row.inAppEnabled}
                                                            disabled={row.remove}
                                                            onCheckedChange={value =>
                                                                handleToggle(
                                                                    row.typeId,
                                                                    'inAppEnabled',
                                                                    value === true,
                                                                )
                                                            }
                                                        />
                                                        <div>
                                                            <Label htmlFor={`admin-pref-${row.typeId}-in-app`}>
                                                                In-app alerts
                                                            </Label>
                                                            <p className="text-sm text-muted-foreground">
                                                                Deliver real-time notifications within the dashboard.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3 rounded-md border border-border bg-background/70 p-4">
                                                        <Checkbox
                                                            id={`admin-pref-${row.typeId}-email`}
                                                            checked={row.emailEnabled}
                                                            disabled={row.remove}
                                                            onCheckedChange={value =>
                                                                handleToggle(
                                                                    row.typeId,
                                                                    'emailEnabled',
                                                                    value === true,
                                                                )
                                                            }
                                                        />
                                                        <div>
                                                            <Label htmlFor={`admin-pref-${row.typeId}-email`}>
                                                                Email alerts
                                                            </Label>
                                                            <p className="text-sm text-muted-foreground">
                                                                Send transactional emails when this event occurs.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>

                        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
                            <Transition
                                show={Boolean(successMessage)}
                                enter="transition ease-out duration-200"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="transition ease-in duration-150"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-muted-foreground">{successMessage}</p>
                            </Transition>

                            <Button
                                type="button"
                                onClick={handleSave}
                                disabled={selectedUser === null || isSaving}
                            >
                                {isSaving ? 'Saving…' : 'Save changes'}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
