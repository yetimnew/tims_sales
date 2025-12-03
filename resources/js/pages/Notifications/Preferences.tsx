import NotificationPreferenceAdminController from '@/actions/App/Http/Controllers/NotificationPreferenceAdminController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { usePermissions } from '@/hooks/use-permissions';
import * as React from 'react';
import { AlertCircle, Check, CheckCircle2, ChevronDown, Filter, Trash2, Undo2 } from 'lucide-react';
import { index as indexRoute } from '@/routes/notifications/preferences';

interface NotificationTypeResource {
    id: number;
    key: string;
    name: string;
    description: string | null;
    default_in_app: boolean;
    default_email: boolean;
    category: string;
    category_slug: string;
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
    category: string;
    category_slug: string;
}

interface UserResource {
    id: number;
    name: string;
    email: string;
    roles: string[];
    preferences: UserPreferenceResource[];
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
    category: string;
    categorySlug: string;
};

interface NotificationPreferencesProps {
    filters: {
        search?: string | null;
        selected_user?: string | number | null;
    };
    types: NotificationTypeResource[];
    users: UserResource[];
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

const toPreferenceRow = (preference: UserPreferenceResource): PreferenceRow => {
    const categorySlug = preference.category_slug ?? 'general';
    const categoryName = preference.category ?? 'General';

    return {
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
        category: categoryName,
        categorySlug,
    };
};

const toPreferenceRowFromType = (type: NotificationTypeResource): PreferenceRow => ({
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
    category: type.category ?? 'General',
    categorySlug: type.category_slug ?? 'general',
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
    const { hasPermission } = usePermissions();
    const canManageAssignments = hasPermission('users.update');
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
        if (selectedFromFilter !== null && users.some(user => user.id === selectedFromFilter)) {
            return selectedFromFilter;
        }

        return users[0]?.id ?? null;
    });

    React.useEffect(() => {
        setSearchTerm(filters.search ?? '');
    }, [filters.search]);

    React.useEffect(() => {
        setSelectedUserId(current => {
            if (current !== null && users.some(user => user.id === current)) {
                return current;
            }

            if (selectedFromFilter !== null && users.some(user => user.id === selectedFromFilter)) {
                return selectedFromFilter;
            }

            return users[0]?.id ?? null;
        });
    }, [users, selectedFromFilter]);

    const selectedUser = React.useMemo(() => {
        if (selectedUserId === null) {
            return null;
        }

        return users.find(user => user.id === selectedUserId) ?? null;
    }, [selectedUserId, users]);

    const [rows, setRows] = React.useState<PreferenceRow[]>(() =>
        selectedUser ? selectedUser.preferences.map(toPreferenceRow) : [],
    );
    const [originalRows, setOriginalRows] = React.useState<PreferenceRow[]>(() =>
        selectedUser ? selectedUser.preferences.map(toPreferenceRow) : [],
    );
    const [rowFilter, setRowFilter] = React.useState<'all' | 'active' | 'pending'>('all');
    const [categorySelection, setCategorySelection] = React.useState<string>('all');
    const [typePickerOpen, setTypePickerOpen] = React.useState(false);
    const [selectedTypeIds, setSelectedTypeIds] = React.useState<number[]>([]);

    React.useEffect(() => {
        setSelectedTypeIds([]);
        setTypePickerOpen(false);
    }, [categorySelection]);

    React.useEffect(() => {
        if (!canManageAssignments) {
            setTypePickerOpen(false);
            setSelectedTypeIds([]);
        }
    }, [canManageAssignments]);

    React.useEffect(() => {
        const nextRows = selectedUser ? selectedUser.preferences.map(toPreferenceRow) : [];
        setRows(nextRows.map(row => ({ ...row })));
        setOriginalRows(nextRows.map(row => ({ ...row })));
        setRowFilter('all');
        setCategorySelection('all');
        setTypePickerOpen(false);
        setSelectedTypeIds([]);
    }, [selectedUser]);

    const availableTypes = React.useMemo(() => {
        return types.filter(type => !rows.some(row => row.typeId === type.id));
    }, [types, rows]);

    const categories = React.useMemo(() => {
        const entries = new Map<string, string>();

        types.forEach(type => {
            const slug = type.category_slug ?? 'general';
            const label = type.category ?? 'General';

            if (!entries.has(slug)) {
                entries.set(slug, label);
            }
        });

        return Array.from(entries.entries())
            .map(([slug, label]) => ({ slug, label }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [types]);

    const selectedCategoryLabel = React.useMemo(() => {
        if (categorySelection === 'all') {
            return 'All categories';
        }

        return categories.find(category => category.slug === categorySelection)?.label ?? categorySelection;
    }, [categorySelection, categories]);

    const categoryFilteredAvailableTypes = React.useMemo(() => {
        if (categorySelection === 'all') {
            return [] as NotificationTypeResource[];
        }

        return availableTypes.filter(type => (type.category_slug ?? 'general') === categorySelection);
    }, [availableTypes, categorySelection]);

    React.useEffect(() => {
        setSelectedTypeIds(current =>
            current.filter(typeId => categoryFilteredAvailableTypes.some(type => type.id === typeId)),
        );
    }, [categoryFilteredAvailableTypes]);

    const toggleTypeSelection = React.useCallback((typeId: number) => {
        setSelectedTypeIds(current =>
            current.includes(typeId) ? current.filter(id => id !== typeId) : [...current, typeId],
        );
    }, []);

    const handleSelectAll = React.useCallback(() => {
        if (!canManageAssignments) {
            return;
        }

        setSelectedTypeIds(categoryFilteredAvailableTypes.map(type => type.id));
    }, [canManageAssignments, categoryFilteredAvailableTypes]);

    const handleClearSelection = React.useCallback(() => {
        if (!canManageAssignments) {
            return;
        }

        setSelectedTypeIds([]);
    }, [canManageAssignments]);

    const addTypeIds = React.useCallback(
        (typeIds: number[]) => {
            if (!canManageAssignments || typeIds.length === 0) {
                return;
            }

            setRows(current => {
                const existing = new Set(current.map(row => row.typeId));
                const next = [...current];

                typeIds.forEach(typeId => {
                    if (existing.has(typeId)) {
                        return;
                    }

                    const type = types.find(item => item.id === typeId);
                    if (!type) {
                        return;
                    }

                    existing.add(typeId);
                    next.push(toPreferenceRowFromType(type));
                });

                return next;
            });
        },
        [canManageAssignments, types],
    );

    const handleAddSelected = React.useCallback(() => {
        if (!canManageAssignments || selectedTypeIds.length === 0) {
            return;
        }

        addTypeIds(selectedTypeIds);
        setSelectedTypeIds([]);
        setTypePickerOpen(false);
    }, [addTypeIds, canManageAssignments, selectedTypeIds]);

    const handleAddType = React.useCallback(
        (typeId: number) => {
            addTypeIds([typeId]);
            setSelectedTypeIds(current => current.filter(id => id !== typeId));
        },
        [addTypeIds],
    );

    const handleAssignAllForCategory = React.useCallback(() => {
        if (!canManageAssignments || categoryFilteredAvailableTypes.length === 0) {
            return;
        }

        addTypeIds(categoryFilteredAvailableTypes.map(type => type.id));
        setSelectedTypeIds([]);
        setTypePickerOpen(false);
    }, [addTypeIds, canManageAssignments, categoryFilteredAvailableTypes]);

    const typePickerLabel = React.useMemo(() => {
        if (!canManageAssignments) {
            return 'Insufficient permissions';
        }

        if (categorySelection === 'all') {
            return 'Select a category first';
        }

        if (categoryFilteredAvailableTypes.length === 0) {
            return 'All types assigned';
        }

        if (selectedTypeIds.length === 0) {
            return 'Select notification types';
        }

        if (selectedTypeIds.length === categoryFilteredAvailableTypes.length) {
            return `Selected all (${selectedTypeIds.length})`;
        }

        return `${selectedTypeIds.length} selected`;
    }, [canManageAssignments, categorySelection, categoryFilteredAvailableTypes, selectedTypeIds]);

    const availableCount = categorySelection === 'all' ? availableTypes.length : categoryFilteredAvailableTypes.length;

    const changedTypeIds = React.useMemo(() => {
        const baseline = new Map(originalRows.map(row => [row.typeId, row]));
        const changed = new Set<number>();

        rows.forEach(row => {
            const original = baseline.get(row.typeId);

            if (!original) {
                if (!row.remove) {
                    changed.add(row.typeId);
                }

                return;
            }

            if (row.remove) {
                changed.add(row.typeId);
                return;
            }

            if (row.inAppEnabled !== original.inAppEnabled || row.emailEnabled !== original.emailEnabled) {
                changed.add(row.typeId);
            }
        });

        return changed;
    }, [rows, originalRows]);

    const hasChanges = React.useMemo(() => changedTypeIds.size > 0, [changedTypeIds]);

    const filteredRows = React.useMemo(() => {
        let dataset = rows;

        if (categorySelection !== 'all') {
            dataset = dataset.filter(row => row.categorySlug === categorySelection);
        }

        if (rowFilter === 'active') {
            return dataset.filter(row => !row.remove);
        }

        if (rowFilter === 'pending') {
            return dataset.filter(row => row.remove);
        }

        return dataset;
    }, [rows, rowFilter, categorySelection]);

    const pendingRemovalCount = React.useMemo(() => filteredRows.filter(row => row.remove).length, [filteredRows]);
    const fullyEnabledCount = React.useMemo(
        () => filteredRows.filter(row => row.inAppEnabled && row.emailEnabled && !row.remove).length,
        [filteredRows],
    );
    const inAppEnabledCount = React.useMemo(
        () => filteredRows.filter(row => row.inAppEnabled && !row.remove).length,
        [filteredRows],
    );
    const emailEnabledCount = React.useMemo(
        () => filteredRows.filter(row => row.emailEnabled && !row.remove).length,
        [filteredRows],
    );

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

    const handleToggle = React.useCallback(
        (typeId: number, channel: 'inAppEnabled' | 'emailEnabled', value: boolean) => {
            if (!canManageAssignments) {
                return;
            }

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
        [canManageAssignments],
    );

    const handleRemove = React.useCallback(
        (typeId: number) => {
            if (!canManageAssignments) {
                return;
            }

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
        },
        [canManageAssignments],
    );

    const handleRestore = React.useCallback(
        (typeId: number) => {
            if (!canManageAssignments) {
                return;
            }

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
        },
        [canManageAssignments],
    );

    const resetChanges = React.useCallback(() => {
        setRows(originalRows.map(row => ({ ...row })));
        setRowFilter('all');
    }, [originalRows]);

    const [isSaving, setIsSaving] = React.useState(false);

    const handleSave = React.useCallback(() => {
        if (!selectedUser || !hasChanges) {
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
    }, [rows, searchTerm, selectedUser, selectedUserId, hasChanges]);

    const successMessage = flash?.success ?? null;
    const saveDisabled = selectedUser === null || !hasChanges || isSaving;

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
                            {users.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No users match your search criteria.</p>
                            ) : (
                                <div className="flex flex-col">
                                    {users.map(user => {
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
                                <Select value={categorySelection} onValueChange={value => setCategorySelection(value)}>
                                    <SelectTrigger className="w-full md:w-60">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-64">
                                        <SelectItem value="all">All categories</SelectItem>
                                        {categories.length === 0 ? (
                                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                                No notification categories available yet.
                                            </div>
                                        ) : (
                                            categories.map(category => (
                                                <SelectItem key={category.slug} value={category.slug}>
                                                    {category.label}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <Popover
                                    open={canManageAssignments ? typePickerOpen : false}
                                    onOpenChange={open => {
                                        if (canManageAssignments) {
                                            setTypePickerOpen(open);
                                        }
                                    }}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-between md:w-72"
                                            disabled={
                                                !canManageAssignments ||
                                                categorySelection === 'all' ||
                                                categoryFilteredAvailableTypes.length === 0
                                            }
                                        >
                                            <span>{typePickerLabel}</span>
                                            <ChevronDown className="h-4 w-4 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search notification types" />
                                            <CommandList>
                                                <CommandEmpty>
                                                    {categoryFilteredAvailableTypes.length === 0
                                                        ? 'All notification types in this category are already assigned.'
                                                        : 'No notification types match your search.'}
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {categoryFilteredAvailableTypes.map(type => {
                                                        const isSelected = selectedTypeIds.includes(type.id);

                                                        return (
                                                            <CommandItem
                                                                key={type.id}
                                                                value={String(type.id)}
                                                                onSelect={() => canManageAssignments && toggleTypeSelection(type.id)}
                                                            >
                                                                <div className="flex w-full items-center justify-between gap-3">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium text-foreground">
                                                                            {type.name}
                                                                        </span>
                                                                        {type.description && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {type.description}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                                                                </div>
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                        <div className="flex items-center justify-between gap-2 border-t border-border bg-background/80 p-3">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleSelectAll}
                                                disabled={
                                                    !canManageAssignments ||
                                                    categoryFilteredAvailableTypes.length === 0 ||
                                                    selectedTypeIds.length === categoryFilteredAvailableTypes.length
                                                }
                                            >
                                                Select all
                                            </Button>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleClearSelection}
                                                    disabled={!canManageAssignments || selectedTypeIds.length === 0}
                                                >
                                                    Clear
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleAddSelected}
                                                    disabled={!canManageAssignments || selectedTypeIds.length === 0}
                                                >
                                                    Add selected
                                                </Button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                {selectedTypeIds.length > 0 && (
                                    <Badge variant="outline">
                                        {selectedTypeIds.length} type{selectedTypeIds.length === 1 ? '' : 's'} selected
                                    </Badge>
                                )}
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
                                    <div className="flex flex-col gap-3 rounded-lg border border-border bg-background/60 p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {categorySelection !== 'all' && (
                                                <Badge variant="outline" className="flex items-center gap-1">
                                                    <Filter className="h-3.5 w-3.5" />
                                                    {selectedCategoryLabel}
                                                </Badge>
                                            )}
                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                {fullyEnabledCount} fully enabled
                                            </Badge>

                                            <Badge variant="secondary" className="flex items-center gap-1">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                {pendingRemovalCount} pending removal
                                            </Badge>

                                            <Badge variant="outline">{inAppEnabledCount} in-app</Badge>
                                            <Badge variant="outline">{emailEnabledCount} email</Badge>
                                            <Badge variant="outline">{availableCount} available</Badge>
                                            {hasChanges && <Badge variant="destructive">Unsaved changes</Badge>}
                                        </div>
                                        <Tabs value={rowFilter} onValueChange={value => setRowFilter(value as 'all' | 'active' | 'pending')}>
                                            <TabsList>
                                                <TabsTrigger value="all" className="flex items-center gap-1">
                                                    <Filter className="h-3.5 w-3.5" /> All
                                                </TabsTrigger>
                                                <TabsTrigger value="active">Active</TabsTrigger>
                                                <TabsTrigger value="pending">Pending removal</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </div>

                                    {categorySelection !== 'all' ? (
                                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
                                            <div className="space-y-4">
                                                {filteredRows.length === 0 ? (
                                                    <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                                                        No notification types match the selected filter. Adjust the filter to view assignments.
                                                    </div>
                                                ) : (
                                                    filteredRows.map(row => {
                                                        const updatedAt = formatTimestamp(row.updatedAt);
                                                        const isDisabled = !row.inAppEnabled && !row.emailEnabled;
                                                        const isChanged = changedTypeIds.has(row.typeId);

                                                        return (
                                                            <div
                                                                key={row.typeId}
                                                                className={cn(
                                                                    'rounded-lg border border-border bg-card p-4 shadow-sm transition-colors',
                                                                    row.remove && 'border-rose-300/60 bg-rose-50/60 dark:border-rose-500/40 dark:bg-rose-500/10',
                                                                    isChanged && !row.remove && 'border-blue-300/70 ring-2 ring-blue-100 dark:border-blue-500/40 dark:ring-blue-400/20',
                                                                )}
                                                            >
                                                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                                                    <div>
                                                                        <h3 className="text-sm font-semibold text-foreground">{row.name}</h3>
                                                                        <p className="max-w-2xl text-sm text-muted-foreground">
                                                                            {row.description ?? 'No description available.'}
                                                                        </p>
                                                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                                            <Badge variant="outline">{row.category}</Badge>
                                                                            {row.assignedBy && <Badge variant="outline">Grant by {row.assignedBy.name}</Badge>}
                                                                            {row.isNew && !row.remove && <Badge variant="outline">New assignment</Badge>}
                                                                            {row.remove && <Badge variant="destructive">Will be removed</Badge>}
                                                                            {isDisabled && !row.remove && <Badge variant="secondary">Delivery disabled</Badge>}
                                                                            {updatedAt && <span>Updated {updatedAt}</span>}
                                                                        </div>
                                                                    </div>
                                                                    {canManageAssignments && (
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
                                                                    )}
                                                                </div>

                                                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                                    <div className="flex items-start gap-3 rounded-md border border-border bg-background/70 p-4">
                                                                        <Checkbox
                                                                            id={`admin-pref-${row.typeId}-in-app`}
                                                                            checked={row.inAppEnabled}
                                                                            disabled={!canManageAssignments || row.remove}
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
                                                                            disabled={!canManageAssignments || row.remove}
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
                                                    })
                                                )}
                                            </div>

                                            <aside className="flex h-fit flex-col gap-3 rounded-lg border border-border bg-background/60 p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-foreground">Not yet assigned</h3>
                                                        <p className="text-xs text-muted-foreground">
                                                            Notifications in {selectedCategoryLabel} that are still available to grant.
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleAssignAllForCategory}
                                                        disabled={
                                                            !canManageAssignments ||
                                                            categoryFilteredAvailableTypes.length === 0
                                                        }
                                                    >
                                                        Assign all
                                                    </Button>
                                                </div>

                                                {categoryFilteredAvailableTypes.length === 0 ? (
                                                    <div className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">
                                                        Every notification in this category is already assigned.
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-3">
                                                        {categoryFilteredAvailableTypes.map(type => (
                                                            <div
                                                                key={type.id}
                                                                className="rounded-md border border-border bg-card/80 p-3"
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium text-foreground">
                                                                            {type.name}
                                                                        </span>
                                                                        {type.description && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {type.description}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        onClick={() => handleAddType(type.id)}
                                                                        disabled={!canManageAssignments}
                                                                    >
                                                                        Add
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </aside>
                                        </div>
                                    ) : filteredRows.length === 0 ? (
                                        <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                                            No notification types match the selected filter. Adjust the filter to view assignments.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {filteredRows.map(row => {
                                                const updatedAt = formatTimestamp(row.updatedAt);
                                                const isDisabled = !row.inAppEnabled && !row.emailEnabled;
                                                const isChanged = changedTypeIds.has(row.typeId);

                                                return (
                                                    <div
                                                        key={row.typeId}
                                                        className={cn(
                                                            'rounded-lg border border-border bg-card p-4 shadow-sm transition-colors',
                                                            row.remove && 'border-rose-300/60 bg-rose-50/60 dark:border-rose-500/40 dark:bg-rose-500/10',
                                                            isChanged && !row.remove && 'border-blue-300/70 ring-2 ring-blue-100 dark:border-blue-500/40 dark:ring-blue-400/20',
                                                        )}
                                                    >
                                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                                            <div>
                                                                <h3 className="text-sm font-semibold text-foreground">{row.name}</h3>
                                                                <p className="max-w-2xl text-sm text-muted-foreground">
                                                                    {row.description ?? 'No description available.'}
                                                                </p>
                                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                                    <Badge variant="outline">{row.category}</Badge>
                                                                    {row.assignedBy && <Badge variant="outline">Grant by {row.assignedBy.name}</Badge>}
                                                                    {row.isNew && !row.remove && <Badge variant="outline">New assignment</Badge>}
                                                                    {row.remove && <Badge variant="destructive">Will be removed</Badge>}
                                                                    {isDisabled && !row.remove && <Badge variant="secondary">Delivery disabled</Badge>}
                                                                    {updatedAt && <span>Updated {updatedAt}</span>}
                                                                </div>
                                                            </div>
                                                            {canManageAssignments && (
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
                                                            )}
                                                        </div>

                                                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                            <div className="flex items-start gap-3 rounded-md border border-border bg-background/70 p-4">
                                                                <Checkbox
                                                                    id={`admin-pref-${row.typeId}-in-app`}
                                                                    checked={row.inAppEnabled}
                                                                    disabled={!canManageAssignments || row.remove}
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
                                                                    disabled={!canManageAssignments || row.remove}
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
                                </div>
                            )}
                        </CardContent>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
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
                                disabled={saveDisabled}
                            >
                                {isSaving ? 'Saving…' : 'Save changes'}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={resetChanges}
                                disabled={!hasChanges || isSaving}
                            >
                                Reset
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
