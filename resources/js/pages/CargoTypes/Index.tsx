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
        title: 'Cargo Types',
        href: '/cargo-types',
    },
];

interface CargoType {
    id: number;
    name: string;
    category: string;
    weight_per_cubic_meter?: number;
    requires_special_equipment: boolean;
    created_at?: string;
}

interface CargoTypesIndexProps {
    cargoTypes: {
        data: CargoType[];
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
}

export default function CargoTypesIndex({ cargoTypes }: CargoTypesIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortBy, setSortBy] = React.useState('name');
    const [sortDirection, setSortDirection] = React.useState('asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedType, setSelectedType] = React.useState<CargoType | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        router.get('/cargo-types',
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

        router.get('/cargo-types',
            { search: searchTerm, sort: column, direction: newDirection },
            { preserveState: false }
        );
    };

    const handleDeleteClick = (type: CargoType) => {
        setSelectedType(type);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedType) return;

        setIsDeleting(true);
        router.delete(`/cargo-types/${selectedType.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedType(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Construction':
                return 'bg-blue-100 text-blue-800';
            case 'Agricultural':
                return 'bg-green-100 text-green-800';
            case 'Industrial':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cargo Types" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Cargo Types</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage and track different cargo types used in your fleet
                        </p>
                    </div>
                    {hasPermission('cargo-types.create') && (
                        <Link href="/cargo-types/create">
                            <Button className="gap-2">
                                <Plus size={16} />
                                New Cargo Type
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Search Bar */}
                <div className="mb-6 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search by name, category, or requirements..."
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
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-2">
                                        Name
                                        <ArrowUpDown size={14} />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort('category')}
                                >
                                    <div className="flex items-center gap-2">
                                        Category
                                        <ArrowUpDown size={14} />
                                    </div>
                                </TableHead>
                                <TableHead>Weight/m³</TableHead>
                                <TableHead>Special Equipment</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cargoTypes.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        No cargo types found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                cargoTypes.data.map((type) => (
                                    <TableRow key={type.id}>
                                        <TableCell className="font-medium">
                                            {type.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getCategoryColor(type.category)}>
                                                {type.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {type.weight_per_cubic_meter ? `${type.weight_per_cubic_meter} kg` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {type.requires_special_equipment ? (
                                                <Badge variant="secondary">Yes</Badge>
                                            ) : (
                                                <span className="text-gray-500">No</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {hasPermission('cargo-types.show') && (
                                                    <Link
                                                        href={`/cargo-types/${type.id}`}
                                                        className="p-2 hover:bg-gray-100 rounded"
                                                    >
                                                        <Eye size={16} />
                                                    </Link>
                                                )}
                                                {hasPermission('cargo-types.edit') && (
                                                    <Link
                                                        href={`/cargo-types/${type.id}/edit`}
                                                        className="p-2 hover:bg-gray-100 rounded"
                                                    >
                                                        <Edit size={16} />
                                                    </Link>
                                                )}
                                                {hasPermission('cargo-types.destroy') && (
                                                    <button
                                                        onClick={() => handleDeleteClick(type)}
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
                  from={cargoTypes.from}
                  to={cargoTypes.to}
                  total={cargoTypes.total}
                  currentPage={cargoTypes.current_page}
                  lastPage={cargoTypes.last_page}
                  buildHref={(page) => {
                    const params = new URLSearchParams({
                      page: String(page),
                      search: searchTerm,
                      sort: sortBy,
                      direction: sortDirection,
                    })
                    return `/cargo-types?${params.toString()}`
                  }}
                />
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Cargo Type"
                description={`Are you sure you want to delete the cargo type "${selectedType?.name}"? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
