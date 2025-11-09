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
import { ArrowUpDown, DollarSign, Droplet, Eye, Fuel, Gauge, Plus, Search, SquarePen, Trash2 } from 'lucide-react'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Fuel Records',
        href: '/fuel',
    },
]

interface FuelRecord {
    id: number
    truck_id: number
    driver_id: number
    fuel_date: string
    fuel_quantity_liters: number
    fuel_price_per_liter: number
    total_cost: number
    fuel_type: string
    fuel_station?: string | null
    truck?: { id: number; plate: string } | null
    driver?: { id: number; name: string } | null
    receipt_number?: string | null
}

interface FuelIndexProps {
    fuelRecords: {
        data: FuelRecord[]
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
        total_liters: number
        total_cost: number
        average_price_per_liter: number
        diesel_count: number
        petrol_count: number
        gas_count: number
    }
    filters: {
        search?: string | null
        fuel_type?: string | null
        truck?: number | string | null
        driver?: number | string | null
        sort?: string | null
        direction?: 'asc' | 'desc' | null
        per_page?: number | null
    }
    fuelTypeOptions: Array<{ label: string; value: string }>
    truckOptions: Array<{ id: number; plate: string }>
    driverOptions: Array<{ id: number; name: string }>
    perPageOptions: number[]
}

const columns: Array<{ key: string; label: string; sortable?: boolean; sortKey?: string }> = [
    { key: 'fuel_date', label: 'Date', sortable: true, sortKey: 'fuel_date' },
    { key: 'truck', label: 'Truck' },
    { key: 'driver', label: 'Driver' },
    { key: 'fuel_type', label: 'Type', sortable: true, sortKey: 'fuel_type' },
    { key: 'fuel_quantity_liters', label: 'Quantity (L)', sortable: true, sortKey: 'fuel_quantity_liters' },
    { key: 'fuel_price_per_liter', label: 'Price / L', sortable: true, sortKey: 'fuel_price_per_liter' },
    { key: 'total_cost', label: 'Total Cost', sortable: true, sortKey: 'total_cost' },
    { key: 'receipt_number', label: 'Receipt #' },
]

const formatNumber = (value: number | null | undefined) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '0.00'
    }

    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

const formatCurrency = (value: number | null | undefined) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return 'ETB 0.00'
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)
}

const formatDate = (value?: string | null) => {
    if (!value) {
        return '—'
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return '—'
    }

    return date.toLocaleDateString()
}

const getFuelTypeBadgeClass = (type: string) => {
    const normalized = type.toLowerCase()
    if (normalized === 'diesel') {
        return 'bg-blue-500 text-white hover:bg-blue-600'
    }
    if (normalized === 'petrol') {
        return 'bg-orange-500 text-white hover:bg-orange-600'
    }
    if (normalized === 'gas') {
        return 'bg-green-500 text-white hover:bg-green-600'
    }
    return 'bg-muted text-muted-foreground'
}

export default function FuelIndex({ fuelRecords, metrics, filters, fuelTypeOptions, truckOptions, driverOptions, perPageOptions }: FuelIndexProps) {
    const { hasPermission } = usePermissions()
    const { toast } = useToast()
    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '')
    const [selectedFuelType, setSelectedFuelType] = React.useState(filters?.fuel_type ?? 'all')
    const [selectedTruck, setSelectedTruck] = React.useState(filters?.truck ? String(filters.truck) : 'all')
    const [selectedDriver, setSelectedDriver] = React.useState(filters?.driver ? String(filters.driver) : 'all')
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'fuel_date')
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'desc')
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
    const [selectedRecord, setSelectedRecord] = React.useState<FuelRecord | null>(null)

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage))
    }, [resolvedPerPage])

    const fuelData = fuelRecords?.data ?? []
    const totalRecords = metrics?.total ?? fuelRecords?.total ?? 0
    const currentPage = fuelRecords?.current_page ?? 1
    const lastPage = fuelRecords?.last_page ?? 1

    const handleNavigate = React.useCallback((overrides: Partial<{ search?: string; fuel_type?: string; truck?: string | number; driver?: string | number; sort?: string; direction?: 'asc' | 'desc'; page?: number; per_page?: number }>) => {
        const perPageValue = overrides.per_page !== undefined ? overrides.per_page : Number(perPage)
        const params: Record<string, string | number | undefined> = {
            search: overrides.search !== undefined ? overrides.search : (searchTerm.trim() ? searchTerm.trim() : undefined),
            fuel_type: overrides.fuel_type !== undefined ? overrides.fuel_type : (selectedFuelType !== 'all' ? selectedFuelType : undefined),
            truck: overrides.truck !== undefined ? overrides.truck : (selectedTruck !== 'all' ? selectedTruck : undefined),
            driver: overrides.driver !== undefined ? overrides.driver : (selectedDriver !== 'all' ? selectedDriver : undefined),
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

        router.get('/fuel', params, { preserveState: true, replace: false })
    }, [searchTerm, selectedFuelType, selectedTruck, selectedDriver, sortColumn, sortDirection, perPage])

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 })
    }

    const handleFuelTypeChange = (value: string) => {
        setSelectedFuelType(value)
        handleNavigate({ fuel_type: value !== 'all' ? value : undefined, page: 1 })
    }

    const handleTruckChange = (value: string) => {
        setSelectedTruck(value)
        handleNavigate({ truck: value !== 'all' ? value : undefined, page: 1 })
    }

    const handleDriverChange = (value: string) => {
        setSelectedDriver(value)
        handleNavigate({ driver: value !== 'all' ? value : undefined, page: 1 })
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

    const handleExport = React.useCallback(() => {
        const params = new URLSearchParams()
        if (searchTerm.trim()) {
            params.set('search', searchTerm.trim())
        }
        if (selectedFuelType !== 'all') {
            params.set('fuel_type', selectedFuelType)
        }
        if (selectedTruck !== 'all') {
            params.set('truck', selectedTruck)
        }
        if (selectedDriver !== 'all') {
            params.set('driver', selectedDriver)
        }
        params.set('sort', sortColumn)
        params.set('direction', sortDirection)

        const queryString = params.toString()
        window.location.href = queryString ? `/fuel/export?${queryString}` : '/fuel/export'
    }, [searchTerm, selectedFuelType, selectedTruck, selectedDriver, sortColumn, sortDirection])

    const handleDeleteClick = (record: FuelRecord) => {
        setSelectedRecord(record)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = () => {
        if (!selectedRecord) {
            return
        }

        router.delete(`/fuel/${selectedRecord.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false)
                setSelectedRecord(null)
                toast({
                    title: 'Fuel record removed',
                    description: 'The fuel record was deleted successfully.',
                })
            },
            onError: (errors) => {
                const errorMessages = errors && typeof errors === 'object'
                    ? Object.values(errors as Record<string, unknown>)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter((value): value is string => typeof value === 'string')
                        .join('\n')
                    : 'Failed to delete fuel record.'
                toast({
                    title: 'Delete failed',
                    description: errorMessages,
                    variant: 'destructive',
                })
            },
        })
    }

    const statsCards = [
        {
            title: 'Fuel Records',
            value: formatNumber(metrics?.total ?? 0),
            description: `${formatNumber(metrics?.diesel_count ?? 0)} diesel entries`,
            icon: <Fuel className="h-3.5 w-3.5 text-blue-600" />,
            valueClassName: 'text-blue-600',
        },
        {
            title: 'Total Liters',
            value: formatNumber(metrics?.total_liters ?? 0),
            description: `${formatNumber(metrics?.petrol_count ?? 0)} petrol records`,
            icon: <Droplet className="h-3.5 w-3.5 text-emerald-600" />,
            valueClassName: 'text-emerald-600',
        },
        {
            title: 'Total Cost',
            value: formatCurrency(metrics?.total_cost ?? 0),
            description: `${formatNumber(metrics?.gas_count ?? 0)} gas entries`,
            icon: <DollarSign className="h-3.5 w-3.5 text-purple-600" />,
            valueClassName: 'text-purple-600',
        },
        {
            title: 'Avg Price / L',
            value: formatCurrency(metrics?.average_price_per_liter ?? 0),
            description: 'Across filtered records',
            icon: <Gauge className="h-3.5 w-3.5 text-amber-600" />,
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
                    placeholder="Search fuel records..."
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="pl-10"
                />
            </div>
            <Select value={selectedFuelType} onValueChange={handleFuelTypeChange}>
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Fuel type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All fuel types</SelectItem>
                    {fuelTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedTruck} onValueChange={handleTruckChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Truck" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All trucks</SelectItem>
                    {truckOptions.map((truck) => (
                        <SelectItem key={truck.id} value={String(truck.id)}>
                            {truck.plate}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedDriver} onValueChange={handleDriverChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Driver" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All drivers</SelectItem>
                    {driverOptions.map((driver) => (
                        <SelectItem key={driver.id} value={String(driver.id)}>
                            {driver.name}
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

    const tableContent = (
        <Table>
            <TableHeader className="[&_tr]:sticky [&_tr]:top-0 [&_tr]:z-20 [&_tr]:bg-background [&_tr]:shadow-sm">
                <TableRow className="border-b bg-background">
                    {columns.map((column) => renderHeaderCell(column))}
                    <TableHead className="sticky top-0 z-20 bg-background text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {fuelData.length > 0 ? (
                    fuelData.map((record) => (
                        <TableRow key={record.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{formatDate(record.fuel_date)}</TableCell>
                            <TableCell className="text-muted-foreground">{record.truck?.plate || '—'}</TableCell>
                            <TableCell className="text-muted-foreground">{record.driver?.name || '—'}</TableCell>
                            <TableCell>
                                <Badge className={getFuelTypeBadgeClass(record.fuel_type)}>
                                    {record.fuel_type}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{formatNumber(record.fuel_quantity_liters)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatCurrency(record.fuel_price_per_liter)}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(record.total_cost)}</TableCell>
                            <TableCell className="text-muted-foreground">{record.receipt_number || '—'}</TableCell>
                            <TableCell className="text-center">
                                <div className="flex justify-center gap-2">
                                    {hasPermission('fuel.show') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/fuel/${record.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('fuel.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/fuel/${record.id}/edit`}>
                                                <SquarePen className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('fuel.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteClick(record)}
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
                        <TableCell colSpan={columns.length + 1} className="py-8 text-center text-muted-foreground">
                            No fuel records found.
                            {hasPermission('fuel.create') && (
                                <Link href="/fuel/create" className="ml-1 text-primary underline">
                                    Create one
                                </Link>
                            )}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )

    return (
        <>
            <ListPageLayout
                headTitle="Fuel Records"
                title="Fuel Records"
                description={`Manage ${totalRecords} fuel record${totalRecords === 1 ? '' : 's'}`}
                breadcrumbs={breadcrumbs}
                actions={
                    <>
                        {hasPermission('fuel.export') && (
                            <Button variant="outline" onClick={handleExport}>
                                Export CSV
                            </Button>
                        )}
                        {hasPermission('fuel.create') && (
                            <Button asChild>
                                <Link href="/fuel/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Fuel Record
                                </Link>
                            </Button>
                        )}
                    </>
                }
                stats={statsSection}
                tableTitle="Fuel Transactions"
                tableDescription="Track refuelling activities across your fleet"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <InertiaPagination
                        className="mt-4"
                        links={fuelRecords.links}
                        from={fuelRecords.from}
                        to={fuelRecords.to}
                        total={fuelRecords.total}
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
                title="Delete Fuel Record"
                description="Are you sure you want to delete this fuel record? This action cannot be undone."
                itemName={selectedRecord ? `${selectedRecord.truck?.plate || 'Fuel'} – ${formatDate(selectedRecord.fuel_date)}` : ''}
                onConfirm={handleDeleteConfirm}
                isLoading={false}
            />
        </>
    )
}

