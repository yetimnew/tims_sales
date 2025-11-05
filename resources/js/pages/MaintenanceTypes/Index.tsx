import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from '@/hooks/use-toast';
import { type BreadcrumbItem } from '@/types';
import { Plus, Eye, Edit, Search, ArrowUpDown, Trash2, FileDown, Settings, Wrench, CheckCircle, XCircle, DollarSign, Calendar, CheckSquare, Square } from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Maintenance Types',
        href: '/maintenance-types',
    },
];

interface MaintenanceType {
    id: number;
    name: string;
    category: string;
    interval_km: number | null;
    interval_months: number | null;
    estimated_cost: number | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface MaintenanceTypesIndexProps {
    maintenanceTypes?: {
        data: MaintenanceType[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    statistics?: {
        total: number;
        active: number;
        inactive: number;
        preventive: number;
        corrective: number;
        emergency: number;
    };
    filters?: {
        search: string;
        sort: string;
        direction: string;
    };
}

export default function MaintenanceTypesIndex({ maintenanceTypes, statistics, filters }: MaintenanceTypesIndexProps) {
    const { hasPermission } = usePermissions();

    // Provide default values to prevent undefined errors
    const defaultMaintenanceTypes = {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        from: 0,
        to: 0,
        links: [],
    };

    const defaultStatistics = {
        total: 0,
        active: 0,
        inactive: 0,
        preventive: 0,
        corrective: 0,
        emergency: 0,
    };

    const defaultFilters = {
        search: '',
        sort: 'name',
        direction: 'asc',
    };

    const safeMaintenanceTypes = maintenanceTypes || defaultMaintenanceTypes;
    const safeStatistics = statistics || defaultStatistics;
    const safeFilters = filters || defaultFilters;

    const [searchTerm, setSearchTerm] = React.useState(safeFilters.search || '');
    const [sortColumn, setSortColumn] = React.useState<string | null>(null);
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedMaintenanceType, setSelectedMaintenanceType] = React.useState<MaintenanceType | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    // Multiple selection state
    const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
    const [bulkActionDialogOpen, setBulkActionDialogOpen] = React.useState(false);
    const [bulkActionType, setBulkActionType] = React.useState<'delete' | 'activate' | 'deactivate'>('delete');
    const [isBulkActionProcessing, setIsBulkActionProcessing] = React.useState(false);

    // Get data from props
    const maintenanceTypeData = safeMaintenanceTypes?.data || [];
    const totalMaintenanceTypes = safeMaintenanceTypes?.total || 0;
    const currentPage = safeMaintenanceTypes?.current_page || 1;
    const perPage = safeMaintenanceTypes?.per_page || 10;
    const lastPage = safeMaintenanceTypes?.last_page || 1;

    // Handle search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        router.get('/maintenance-types', { search: value, page: 1 }, { preserveState: true });
    };

    // Handle sorting
    const handleSort = (column: string) => {
        const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(newDirection);
        router.get('/maintenance-types', { sort: column, direction: newDirection, search: searchTerm }, { preserveState: true });
    };

    // Sort icon component
    const SortIcon = ({ column, isActive }: { column: string; isActive: boolean }) => (
        <ArrowUpDown
            className={`ml-2 inline h-4 w-4 ${
                isActive ? 'text-primary' : 'text-muted-foreground opacity-50'
            }`}
        />
    );

    // Sortable header cell
    const SortableHead = ({
        column,
        children,
    }: {
        column: string;
        children: React.ReactNode;
    }) => (
        <TableHead
            className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
            onClick={() => handleSort(column)}
        >
            <div className="flex items-center">
                {children}
                <SortIcon column={column} isActive={sortColumn === column} />
            </div>
        </TableHead>
    );

    const handleDeleteClick = (maintenanceType: MaintenanceType) => {
        setSelectedMaintenanceType(maintenanceType);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedMaintenanceType) return;

        setIsDeleting(true);
        router.delete(`/maintenance-types/${selectedMaintenanceType.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedMaintenanceType(null);
                setIsDeleting(false);
            },
            onError: (errors) => {
                setIsDeleting(false);
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors).flat().join('\n');
                    if (errorMessages) {
                        toast({
                            title: '❌ Delete Failed',
                            description: errorMessages,
                            variant: 'destructive',
                        });
                    }
                }
            },
        });
    };

    // Multiple selection handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(maintenanceTypeData.map(item => item.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectItem = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(itemId => itemId !== id));
        }
    };

    const isAllSelected = maintenanceTypeData.length > 0 && selectedIds.length === maintenanceTypeData.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < maintenanceTypeData.length;

    // Bulk action handlers
    const handleBulkAction = (action: 'delete' | 'activate' | 'deactivate') => {
        setBulkActionType(action);
        setBulkActionDialogOpen(true);
    };

    const handleBulkActionConfirm = () => {
        if (selectedIds.length === 0) return;

        setIsBulkActionProcessing(true);

        const actionMap = {
            delete: 'DELETE',
            activate: 'PATCH',
            deactivate: 'PATCH'
        };

        const endpointMap = {
            delete: '/maintenance-types/bulk-delete',
            activate: '/maintenance-types/bulk-activate',
            deactivate: '/maintenance-types/bulk-deactivate'
        };

        router[actionMap[bulkActionType].toLowerCase() as 'delete' | 'patch'](endpointMap[bulkActionType], {
            ids: selectedIds
        }, {
            onSuccess: () => {
                setBulkActionDialogOpen(false);
                setSelectedIds([]);
                setIsBulkActionProcessing(false);
                toast({
                    title: '✅ Bulk Action Completed',
                    description: `Successfully ${bulkActionType}d ${selectedIds.length} maintenance type(s).`,
                    variant: 'default',
                });
            },
            onError: (errors) => {
                setIsBulkActionProcessing(false);
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors).flat().join('\n');
                    if (errorMessages) {
                        toast({
                            title: '❌ Bulk Action Failed',
                            description: errorMessages,
                            variant: 'destructive',
                        });
                    }
                }
            },
        });
    };


    const getCategoryBadgeVariant = (category: string) => {
        switch (category.toLowerCase()) {
            case 'preventive': return 'default';
            case 'corrective': return 'secondary';
            case 'emergency': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Maintenance Types" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Maintenance Types</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your maintenance categories of {totalMaintenanceTypes} types
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {/* Bulk Actions */}
                        {selectedIds.length > 0 && (
                            <>
                                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                                    <span className="text-sm font-medium">
                                        {selectedIds.length} selected
                                    </span>
                                </div>
                                {hasPermission('maintenance-types.destroy') && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleBulkAction('delete')}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Selected
                                    </Button>
                                )}
                                {hasPermission('maintenance-types.edit') && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleBulkAction('activate')}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Activate Selected
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleBulkAction('deactivate')}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Deactivate Selected
                                        </Button>
                                    </>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedIds([])}
                                >
                                    Clear Selection
                                </Button>
                            </>
                        )}

                        {/* Regular Actions */}
                        {selectedIds.length === 0 && (
                            <>
                                {hasPermission('maintenance-types.view') && totalMaintenanceTypes > 0 && (
                                    <Button variant="outline" onClick={() => {
                                        const params = new URLSearchParams({
                                            search: searchTerm,
                                            sort: sortColumn || 'name',
                                            direction: sortDirection,
                                        });
                                        window.location.href = `/maintenance-types/export/csv?${params.toString()}`;
                                    }}>
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Export CSV
                                    </Button>
                                )}
                                {hasPermission('maintenance-types.create') && (
                                    <Button asChild>
                                        <Link href="/maintenance-types/create">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Maintenance Type
                                        </Link>
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Statistics Dashboard */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Types</CardTitle>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{safeStatistics?.total || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                All maintenance types
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{safeStatistics?.active || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                Currently active
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{safeStatistics?.inactive || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                Currently inactive
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Preventive</CardTitle>
                            <Wrench className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{safeStatistics?.preventive || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                🔧 Preventive types
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Corrective</CardTitle>
                            <Settings className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{safeStatistics?.corrective || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                🔧 Corrective types
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Emergency</CardTitle>
                            <Wrench className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{safeStatistics?.emergency || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                🚨 Emergency types
                            </p>
                        </CardContent>
                    </Card>
                </div>


                {/* Table Section */}
                <Card className="flex flex-1 flex-col overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Maintenance Types Directory</CardTitle>
                                <CardDescription>
                                    Complete list of all maintenance types in your system
                                </CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search maintenance types..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-12">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                ref={(el) => {
                                                    if (el) el.indeterminate = isSomeSelected;
                                                }}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                        </TableHead>
                                        <SortableHead column="name">Name</SortableHead>
                                        <SortableHead column="category">Category</SortableHead>
                                        <TableHead>Interval KM</TableHead>
                                        <TableHead>Interval Months</TableHead>
                                        <SortableHead column="estimated_cost">Cost</SortableHead>
                                        <SortableHead column="is_active">Status</SortableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                            <TableBody>
                                    {maintenanceTypeData.length > 0 ? (
                                        maintenanceTypeData.map((maintenanceType) => (
                                            <TableRow key={maintenanceType.id} className="hover:bg-muted/50">
                                                <TableCell>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(maintenanceType.id)}
                                                        onChange={(e) => handleSelectItem(maintenanceType.id, e.target.checked)}
                                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {maintenanceType.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getCategoryBadgeVariant(maintenanceType.category)}>
                                                        {maintenanceType.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {maintenanceType.interval_km ? `${maintenanceType.interval_km.toLocaleString()} km` : '-'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {maintenanceType.interval_months ? `${maintenanceType.interval_months} months` : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {maintenanceType.estimated_cost ? (
                                                        <div className="flex items-center gap-1">
                                                            <DollarSign className="h-4 w-4 text-green-600" />
                                                            <span className="font-medium">{maintenanceType.estimated_cost.toLocaleString()}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={maintenanceType.is_active ? 'default' : 'secondary'}>
                                                        {maintenanceType.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button asChild size="sm" variant="ghost">
                                                            <Link href={`/maintenance-types/${maintenanceType.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        {hasPermission('maintenance-types.edit') && (
                                                            <Button asChild size="sm" variant="ghost">
                                                                <Link href={`/maintenance-types/${maintenanceType.id}/edit`}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {hasPermission('maintenance-types.destroy') && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteClick(maintenanceType)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                                No maintenance types found.
                                                {hasPermission('maintenance-types.create') && (
                                                    <Link href="/maintenance-types/create" className="ml-1 text-primary underline">
                                                        Create one
                                                    </Link>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {totalMaintenanceTypes > 0 && (
                            <div className="border-t">
                                <InertiaPagination
                                    links={safeMaintenanceTypes.links}
                                    currentPage={currentPage}
                                    lastPage={lastPage}
                                    from={safeMaintenanceTypes.from}
                                    to={safeMaintenanceTypes.to}
                                    total={safeMaintenanceTypes.total}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    title="Delete Maintenance Type"
                    description="Are you sure you want to delete this maintenance type? This action cannot be undone."
                    itemName={selectedMaintenanceType?.name}
                    onConfirm={handleDeleteConfirm}
                    isLoading={isDeleting}
                />

                {/* Bulk Action Confirmation Dialog */}
                <DeleteConfirmationDialog
                    open={bulkActionDialogOpen}
                    onOpenChange={setBulkActionDialogOpen}
                    title={`Bulk ${bulkActionType.charAt(0).toUpperCase() + bulkActionType.slice(1)} Maintenance Types`}
                    description={`Are you sure you want to ${bulkActionType} ${selectedIds.length} maintenance type(s)? ${
                        bulkActionType === 'delete'
                            ? 'This action cannot be undone.'
                            : 'This will change the status of all selected maintenance types.'
                    }`}
                    itemName={`${selectedIds.length} maintenance type(s)`}
                    onConfirm={handleBulkActionConfirm}
                    isLoading={isBulkActionProcessing}
                    isDangerous={bulkActionType === 'delete'}
                />
            </div>
        </AppLayout>
    );
}
