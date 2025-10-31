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
import { type BreadcrumbItem } from '@/types';
import { Plus, Eye, Edit, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Driver Safety',
        href: '/driver-safety',
    },
];

interface Driver {
    id: number;
    name: string;
}

interface SafetyRecord {
    id: number;
    driver_id: number;
    driver?: Driver;
    incident_date: string;
    incident_type: 'accident' | 'violation' | 'warning';
    severity: 'minor' | 'major' | 'critical';
    description: string;
    damage_cost?: number;
    created_at?: string;
}

interface DriverSafetyIndexProps {
    safetyRecords: {
        data: SafetyRecord[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links?: {
            first?: string;
            last?: string;
            prev?: string;
            next?: string;
        };
    };
    statistics?: {
        total_records: number;
        accidents: number;
        violations: number;
        warnings: number;
        critical_incidents: number;
        major_incidents: number;
        minor_incidents: number;
        total_damage_cost: number;
    };
}

export default function DriverSafetyIndex({ safetyRecords, statistics }: DriverSafetyIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortBy, setSortBy] = React.useState('incident_date');
    const [sortDirection, setSortDirection] = React.useState('desc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedRecord, setSelectedRecord] = React.useState<SafetyRecord | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        router.get('/driver-safety',
            { search: value, sort: sortBy, direction: sortDirection },
            { preserveState: false }
        );
    };

    const handleSort = (column: string) => {
        let newDirection = 'asc';
        if (sortBy === column && sortDirection === 'asc') {
            newDirection = 'desc';
        }

        setSortBy(column);
        setSortDirection(newDirection);

        router.get('/driver-safety',
            { search: searchTerm, sort: column, direction: newDirection },
            { preserveState: false }
        );
    };

    const handleDeleteClick = (record: SafetyRecord) => {
        setSelectedRecord(record);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedRecord) return;

        setIsDeleting(true);
        router.delete(`/driver-safety/${selectedRecord.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedRecord(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-100 text-red-800';
            case 'major':
                return 'bg-orange-100 text-orange-800';
            case 'minor':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getIncidentTypeColor = (type: string) => {
        switch (type) {
            case 'accident':
                return 'bg-red-100 text-red-800';
            case 'violation':
                return 'bg-orange-100 text-orange-800';
            case 'warning':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Driver Safety Records" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Driver Safety Records</h1>
                        <p className="text-muted-foreground mt-2">
                            Track and manage driver safety incidents
                        </p>
                    </div>
                </div>

                {/* Statistics Cards */}
                {statistics && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{statistics.total_records}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Critical Incidents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{statistics.critical_incidents}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Accidents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">{statistics.accidents}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Damage Cost</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    ${statistics.total_damage_cost?.toFixed(2) || '0.00'}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Main Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Driver Safety Records</CardTitle>
                                <CardDescription>
                                    Manage and track driver safety incidents and violations
                                </CardDescription>
                            </div>
                            {hasPermission('driver-safety.create') && (
                                <Link href="/driver-safety/create">
                                    <Button className="gap-2">
                                        <Plus size={16} />
                                        New Record
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Search Bar */}
                        <div className="mb-6 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search by driver, description, or location..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead
                                            className="cursor-pointer"
                                            onClick={() => handleSort('incident_date')}
                                        >
                                            <div className="flex items-center gap-2">
                                                Date
                                                <ArrowUpDown size={14} />
                                            </div>
                                        </TableHead>
                                        <TableHead>Driver</TableHead>
                                        <TableHead
                                            className="cursor-pointer"
                                            onClick={() => handleSort('incident_type')}
                                        >
                                            <div className="flex items-center gap-2">
                                                Type
                                                <ArrowUpDown size={14} />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer"
                                            onClick={() => handleSort('severity')}
                                        >
                                            <div className="flex items-center gap-2">
                                                Severity
                                                <ArrowUpDown size={14} />
                                            </div>
                                        </TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead
                                            className="cursor-pointer"
                                            onClick={() => handleSort('damage_cost')}
                                        >
                                            <div className="flex items-center gap-2">
                                                Damage Cost
                                                <ArrowUpDown size={14} />
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {safetyRecords.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                No safety records found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        safetyRecords.data.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-medium">
                                                    {new Date(record.incident_date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>{record.driver?.name || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge className={getIncidentTypeColor(record.incident_type)}>
                                                        {record.incident_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getSeverityColor(record.severity)}>
                                                        {record.severity}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {record.description}
                                                </TableCell>
                                                <TableCell>
                                                    ${record.damage_cost?.toFixed(2) || '0.00'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {hasPermission('driver-safety.show') && (
                                                            <Link
                                                                href={`/driver-safety/${record.id}`}
                                                                className="p-2 hover:bg-gray-100 rounded"
                                                            >
                                                                <Eye size={16} />
                                                            </Link>
                                                        )}
                                                        {hasPermission('driver-safety.edit') && (
                                                            <Link
                                                                href={`/driver-safety/${record.id}/edit`}
                                                                className="p-2 hover:bg-gray-100 rounded"
                                                            >
                                                                <Edit size={16} />
                                                            </Link>
                                                        )}
                                                        {hasPermission('driver-safety.destroy') && (
                                                            <button
                                                                onClick={() => handleDeleteClick(record)}
                                                                className="p-2 hover:bg-red-100 text-red-600 rounded"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <InertiaPagination
                          from={safetyRecords.from}
                          to={safetyRecords.to}
                          total={safetyRecords.total}
                          currentPage={safetyRecords.current_page}
                          lastPage={safetyRecords.last_page}
                          buildHref={(page) => {
                            const params = new URLSearchParams({
                              page: String(page),
                              search: searchTerm,
                              sort: sortBy,
                              direction: sortDirection,
                            })
                            return `/driver-safety?${params.toString()}`
                          }}
                        />
                    </CardContent>
                </Card>
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Safety Record"
                description={`Are you sure you want to delete this safety record for ${selectedRecord?.driver?.name}? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}

