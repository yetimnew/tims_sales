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
import ListPageLayout from '@/components/layouts/list-page-layout';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Plus, Eye, Edit, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
import ReactPaginate from 'react-paginate';
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

    const headerActions = (
        <>
            {hasPermission('cargo-types.create') && (
                <Button asChild>
                    <Link href="/cargo-types/create">
                        <Plus className="mr-2 h-4 w-4" />
                        New Cargo Type
                    </Link>
                </Button>
            )}
        </>
    );

    const statsSection = null;

    const tableHeaderExtras = (
        <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search by name, category, or requirements..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
            />
        </div>
    );

    const tableContent = (
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
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/cargo-types/${type.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('cargo-types.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/cargo-types/${type.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('cargo-types.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteClick(type)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

    return (
        <ListPageLayout
            headTitle="Cargo Types"
            title="Cargo Types"
            description="Manage and track different cargo types used in your fleet"
            breadcrumbs={breadcrumbs}
            actions={headerActions}
            stats={statsSection}
            tableTitle="Cargo Types"
            tableDescription="All cargo types in your fleet"
            tableHeaderExtras={tableHeaderExtras}
            pagination={
                <div className="mt-4 flex items-center justify-between w-full">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{cargoTypes.from}</span> to <span className="font-semibold text-foreground">{cargoTypes.to}</span> of <span className="font-semibold text-foreground">{cargoTypes.total}</span> cargo types
                    </div>
                    <div>
                        <ReactPaginate
                            pageCount={cargoTypes.last_page}
                            forcePage={cargoTypes.current_page - 1}
                            onPageChange={({ selected }) => {
                                router.get('/cargo-types', {
                                    page: selected + 1,
                                    search: searchTerm,
                                    sort: sortBy,
                                    direction: sortDirection,
                                }, { preserveState: true });
                            }}
                            marginPagesDisplayed={2}
                            pageRangeDisplayed={5}
                            containerClassName="flex gap-2"
                            pageClassName="px-3 py-1 rounded border text-sm bg-background text-muted-foreground hover:bg-muted"
                            activeClassName="bg-primary text-white"
                            previousClassName="px-3 py-1 rounded border text-sm"
                            nextClassName="px-3 py-1 rounded border text-sm"
                            breakClassName="px-3 py-1 rounded border text-sm"
                            disabledClassName="pointer-events-none opacity-50"
                            previousLabel={"<"}
                            nextLabel={">"}
                        />
                    </div>
                </div>
            }
        >
            {tableContent}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Cargo Type"
                description={`Are you sure you want to delete the cargo type "${selectedType?.name}"? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
            />
        </ListPageLayout>
    );
}
