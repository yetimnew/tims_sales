import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import ListPageLayout from '@/components/layouts/list-page-layout'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { usePermissions } from '@/hooks/use-permissions'
import { useToast } from '@/hooks/use-toast'
import { Link, router } from '@inertiajs/react'
import { type BreadcrumbItem } from '@/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InertiaPagination } from '@/components/ui/pagination'
import { Input } from '@/components/ui/input'
import * as React from 'react'
import { ArrowUpDown, Boxes, ClipboardList, Eye, Package, Plus, Scale, Search, SquarePen, Trash2 } from 'lucide-react'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Cargo Types',
        href: '/cargo-types',
    },
];

interface CargoTypeSummary {
    id: number
    name: string
    category: string
    weight_per_cubic_meter?: number | null
    requires_special_equipment: boolean
    handling_requirements?: string | null
    safety_requirements?: string | null
}

interface CargoTypesIndexProps {
    cargoTypes: {
        data: CargoTypeSummary[]
        current_page: number
        last_page: number
        total: number
        from: number
        to: number
        links: Array<{
            url: string | null
            label: string
            active: boolean
        }>
    }
    metrics: {
        total: number
        requires_special_equipment: number
        without_special_equipment: number
        average_weight: number
        distinct_categories: number
    }
    filters: {
        search?: string | null
        category?: string | null
        requires_special_equipment?: string | null
        sort?: string | null
        direction?: 'asc' | 'desc' | null
        per_page?: number | null
    }
    categoryOptions: Array<{ label: string; value: string }>
    perPageOptions: number[]
}

const columns: Array<{ key: string; label: string; sortable?: boolean; sortKey?: string }> = [
    { key: 'name', label: 'Name', sortable: true, sortKey: 'name' },
    { key: 'category', label: 'Category', sortable: true, sortKey: 'category' },
    { key: 'weight_per_cubic_meter', label: 'Weight / m³', sortable: true, sortKey: 'weight_per_cubic_meter' },
    { key: 'requires_special_equipment', label: 'Special Equipment', sortable: true, sortKey: 'requires_special_equipment' },
]

const specialEquipmentOptions: Array<{ label: string; value: string }> = [
    { label: 'All types', value: 'all' },
    { label: 'Requires special equipment', value: '1' },
    { label: 'No special equipment', value: '0' },
]

const formatWeight = (value?: number | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '—'
    }

    return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`
}

export default function CargoTypesIndex({ cargoTypes, metrics, filters, categoryOptions, perPageOptions }: CargoTypesIndexProps) {
    const { hasPermission } = usePermissions()
    const { toast } = useToast()
    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '')
    const [selectedCategory, setSelectedCategory] = React.useState(filters?.category ?? 'all')
    const [selectedSpecialEquipment, setSelectedSpecialEquipment] = React.useState(filters?.requires_special_equipment ?? 'all')
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'name')
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'asc')
    const availablePerPageOptions = React.useMemo(() => (perPageOptions?.length ? perPageOptions : [15, 25, 50, 100]), [perPageOptions])
    const resolvedPerPage = React.useMemo(() => {
        const candidate = filters?.per_page
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate
        }

        return availablePerPageOptions[0] ?? 15
    }, [filters?.per_page, availablePerPageOptions])
    const [perPage, setPerPage] = React.useState<string>(() => String(resolvedPerPage))
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
    const [selectedType, setSelectedType] = React.useState<CargoTypeSummary | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage))
    }, [resolvedPerPage])

    const cargoTypeData = cargoTypes?.data ?? []
    const totalRecords = metrics?.total ?? cargoTypes?.total ?? 0
    const currentPage = cargoTypes?.current_page ?? 1
    const lastPage = cargoTypes?.last_page ?? 1

    const handleNavigate = React.useCallback((overrides: Partial<{
        search?: string
        category?: string
        requires_special_equipment?: string
        sort?: string
        direction?: 'asc' | 'desc'
        page?: number
        per_page?: number
    }>) => {
        const perPageValue = overrides.per_page !== undefined ? overrides.per_page : Number(perPage)
        const params: Record<string, string | number | undefined> = {
            search: overrides.search !== undefined ? overrides.search : (searchTerm.trim() ? searchTerm.trim() : undefined),
            category: overrides.category !== undefined ? overrides.category : (selectedCategory !== 'all' ? selectedCategory : undefined),
            requires_special_equipment: overrides.requires_special_equipment !== undefined ? overrides.requires_special_equipment : (selectedSpecialEquipment !== 'all' ? selectedSpecialEquipment : undefined),
            sort: overrides.sort ?? sortColumn,
            direction: overrides.direction ?? sortDirection,
            page: overrides.page,
            per_page: perPageValue,
        }

        Object.keys(params).forEach((key) => {
            const value = params[key]
            if (
                value === undefined ||
                value === null ||
                value === '' ||
                (key === 'per_page' && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0))
            ) {
                delete params[key]
            }
        })

        router.get('/cargo-types', params, { preserveState: true, replace: false })
    }, [searchTerm, selectedCategory, selectedSpecialEquipment, sortColumn, sortDirection, perPage])

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 })
    }

    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value)
        handleNavigate({ category: value !== 'all' ? value : undefined, page: 1 })
    }

    const handleSpecialEquipmentChange = (value: string) => {
        setSelectedSpecialEquipment(value)
        handleNavigate({ requires_special_equipment: value !== 'all' ? value : undefined, page: 1 })
    }

    const handlePerPageChange = (value: string) => {
        setPerPage(value)
        const numericValue = Number(value)
        handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 })
    }

    const handleSort = (column: string) => {
        const newDirection: 'asc' | 'desc' = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc'
        setSortColumn(column)
        setSortDirection(newDirection)
        handleNavigate({ sort: column, direction: newDirection })
    }

    const handleDeleteClick = (type: CargoTypeSummary) => {
        setSelectedType(type)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = () => {
        if (!selectedType) {
            return
        }

        setIsDeleting(true)
        router.delete(`/cargo-types/${selectedType.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleting(false)
                setDeleteDialogOpen(false)
                setSelectedType(null)
                toast({
                    title: 'Cargo type deleted',
                    description: 'The cargo type was removed successfully.',
                })
            },
            onError: (errors) => {
                setIsDeleting(false)
                const errorMessages = errors && typeof errors === 'object'
                    ? Object.values(errors as Record<string, unknown>)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter((value): value is string => typeof value === 'string')
                        .join('\n')
                    : 'Failed to delete cargo type.'
                toast({
                    title: 'Delete failed',
                    description: errorMessages,
                    variant: 'destructive',
                })
            },
        })
    }

    const handleExport = React.useCallback(() => {
        const params = new URLSearchParams()
        if (searchTerm.trim()) {
            params.set('search', searchTerm.trim())
        }
        if (selectedCategory !== 'all') {
            params.set('category', selectedCategory)
        }
        if (selectedSpecialEquipment !== 'all') {
            params.set('requires_special_equipment', selectedSpecialEquipment)
        }
        params.set('sort', sortColumn)
        params.set('direction', sortDirection)

        const queryString = params.toString()
        window.location.href = queryString ? `/cargo-types/export?${queryString}` : '/cargo-types/export'
    }, [searchTerm, selectedCategory, selectedSpecialEquipment, sortColumn, sortDirection])

    const getCategoryBadgeClass = (category: string) => {
        const normalized = category.toLowerCase()
        if (normalized.includes('construct')) {
            return 'bg-blue-500 text-white hover:bg-blue-600'
        }
        if (normalized.includes('agri')) {
            return 'bg-emerald-500 text-white hover:bg-emerald-600'
        }
        if (normalized.includes('industrial')) {
            return 'bg-orange-500 text-white hover:bg-orange-600'
        }
        return 'bg-muted text-muted-foreground'
    }

    const renderHeaderCell = (column: { key: string; label: string; sortable?: boolean; sortKey?: string }) => {
        const sortable = column.sortable ?? false
        const columnKey = column.sortKey ?? column.key
        const isActive = sortColumn === columnKey

        if (!sortable) {
            return (
                <TableHead key={column.key} className="sticky top-0 z-20 bg-background">
                    {column.label}
                </TableHead>
            )
        }

        return (
            <TableHead
                key={column.key}
                className="sticky top-0 z-20 cursor-pointer select-none bg-background transition-colors hover:bg-muted/70"
                onClick={() => handleSort(columnKey)}
            >
                <div className="flex items-center gap-2">
                    {column.label}
                    <ArrowUpDown size={14} className={isActive ? 'text-primary' : 'text-muted-foreground opacity-50'} />
                </div>
            </TableHead>
        )
    }

    const statsCards = [
        {
            title: 'Cargo Types',
            value: metrics ? metrics.total.toLocaleString() : '0',
            description: `${metrics?.distinct_categories?.toLocaleString() ?? 0} categories`,
            icon: <Boxes className="h-3.5 w-3.5 text-blue-600" />,
            valueClassName: 'text-blue-600',
        },
        {
            title: 'Special Equipment',
            value: metrics ? metrics.requires_special_equipment.toLocaleString() : '0',
            description: `${metrics?.without_special_equipment?.toLocaleString() ?? 0} standard types`,
            icon: <Package className="h-3.5 w-3.5 text-purple-600" />,
            valueClassName: 'text-purple-600',
        },
        {
            title: 'Average Weight',
            value: metrics?.average_weight ? `${metrics.average_weight.toFixed(2)} kg` : '0.00 kg',
            description: 'Per cubic meter',
            icon: <Scale className="h-3.5 w-3.5 text-emerald-600" />,
            valueClassName: 'text-emerald-600',
        },
        {
            title: 'Handling Notes',
            value: metrics ? metrics.total.toLocaleString() : '0',
            description: 'Review safety requirements',
            icon: <ClipboardList className="h-3.5 w-3.5 text-amber-600" />,
            valueClassName: 'text-amber-600',
        },
    ]

    const statsSection = (
        <div className="hidden gap-2 md:grid md:grid-cols-2 xl:grid-cols-4">
            {statsCards.map((card) => (
                <div key={card.title} className="gap-2 rounded-lg border border-slate-200 py-2 shadow-sm sm:py-3">
                    <div className="flex items-center justify-between px-2 pb-1 sm:px-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {card.title}
                        </span>
                        {card.icon}
                    </div>
                    <div className="px-2 pb-2 pt-0 sm:px-3">
                        <div className={`text-sm font-semibold sm:text-base ${card.valueClassName}`}>{card.value}</div>
                        <p className="text-[11px] text-muted-foreground">{card.description}</p>
                    </div>
                </div>
            ))}
        </div>
    )

    const tableHeaderExtras = (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-[260px] max-w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search cargo types..."
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="pl-10"
                />
            </div>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedSpecialEquipment} onValueChange={handleSpecialEquipmentChange}>
                <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Special equipment" />
                </SelectTrigger>
                <SelectContent>
                    {specialEquipmentOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="hidden sm:inline">Rows</span>
                <Select value={perPage} onValueChange={handlePerPageChange}>
                    <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Per page" />
                    </SelectTrigger>
                    <SelectContent>
                        {availablePerPageOptions.map((option) => (
                            <SelectItem key={option} value={String(option)}>
                                {option} / page
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )

    const tableContent = (
        <Table>
            <TableHeader className="[&_tr]:sticky [&_tr]:top-0 [&_tr]:z-20 [&_tr]:bg-background [&_tr]:shadow-sm">
                <TableRow className="border-b bg-background">
                    {columns.map((column) => renderHeaderCell(column))}
                    <TableHead className="sticky top-0 z-20 bg-background text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {cargoTypeData.length > 0 ? (
                    cargoTypeData.map((type) => (
                        <TableRow key={type.id} className="hover:bg-muted/50">
                            <TableCell className="font-semibold">{type.name}</TableCell>
                            <TableCell>
                                <Badge className={getCategoryBadgeClass(type.category)}>{type.category}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{formatWeight(type.weight_per_cubic_meter)}</TableCell>
                            <TableCell>
                                {type.requires_special_equipment ? (
                                    <Badge className="bg-rose-500 text-white hover:bg-rose-600">Required</Badge>
                                ) : (
                                    <span className="text-muted-foreground">Not required</span>
                                )}
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex justify-center gap-2">
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
                                                <SquarePen className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('cargo-types.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteClick(type)}
                                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
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
                        <TableCell colSpan={columns.length + 1} className="py-8 text-center text-muted-foreground">
                            No cargo types found.
                            {hasPermission('cargo-types.create') && (
                                <Link href="/cargo-types/create" className="ml-1 text-primary underline">
                                    Create one
                                </Link>
                            )}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )

    const headerActions = (
        <>
            {hasPermission('cargo-types.export') && (
                <Button variant="outline" onClick={handleExport}>
                    Export CSV
                </Button>
            )}
            {hasPermission('cargo-types.create') && (
                <Button asChild>
                    <Link href="/cargo-types/create">
                        <Plus className="mr-2 h-4 w-4" />
                        New Cargo Type
                    </Link>
                </Button>
            )}
        </>
    )

    return (
        <>
            <ListPageLayout
                headTitle="Cargo Types"
                title="Cargo Types"
                description={`Manage cargo configurations. Total: ${totalRecords.toLocaleString()}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Cargo Types"
                tableDescription="All registered cargo categories"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <InertiaPagination
                        className="mt-4"
                        links={cargoTypes.links}
                        from={cargoTypes.from}
                        to={cargoTypes.to}
                        total={cargoTypes.total}
                        currentPage={currentPage}
                        lastPage={lastPage}
                    />
                }
            >
                {tableContent}
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Cargo Type"
                description="Are you sure you want to delete this cargo type? This action cannot be undone."
                itemName={selectedType ? `${selectedType.name}` : ''}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    )
}
