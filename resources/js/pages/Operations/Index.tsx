import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ListPageLayout from '@/components/layouts/list-page-layout'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InertiaPagination } from '@/components/ui/pagination'
import { usePermissions } from '@/hooks/use-permissions'
import { useToast } from '@/hooks/use-toast'
import { Link, router } from '@inertiajs/react'
import { type BreadcrumbItem } from '@/types'
import {
    ArrowUpDown,
    CheckCircle,
    Eye,
    FileDown,
    Gauge,
    Plus,
    Search,
    Square,
    SquarePen,
    Trash2,
    XCircle,
} from 'lucide-react'
import * as React from 'react'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Operations',
        href: '/operations',
    },
]

interface OperationData {
    id: number
    operationid: string
    customer?: { id: number; name: string } | null
    description?: string | null
    status: string
    volume?: number | null
    km?: number | null
    startdate?: string | null
    enddate?: string | null
    closed?: boolean | null
    created_at?: string | null
    deliveredVolume?: number | null
    remainingVolume?: number | null
    volumeCompletion?: number | null
}

interface OperationsIndexProps {
    operations: {
        data: OperationData[]
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
        active: number
        inactive: number
        closed: number
        open: number
    }
    filters: {
        search?: string | null
        status?: string | null
        customer?: string | number | null
        sort?: string | null
        direction?: 'asc' | 'desc' | null
        per_page?: number | null
    }
    statusOptions: Array<{ label: string; value: string }>
    customerOptions: Array<{ id: number; name: string }>
    perPageOptions: number[]
    totalCount?: number
}

type ColumnKey = 'operationid' | 'customer' | 'status' | 'startdate' | 'volume' | 'km' | 'tonnageProgress'

interface ColumnConfig {
    key: ColumnKey
    label: string
    sortable?: boolean
    sortKey?: string
}

const columns: ColumnConfig[] = [
    { key: 'operationid', label: 'Operation ID', sortable: true, sortKey: 'operationid' },
    { key: 'customer', label: 'Customer', sortable: false },
    { key: 'status', label: 'Status', sortable: true, sortKey: 'status' },
    { key: 'startdate', label: 'Start Date', sortable: true, sortKey: 'startdate' },
    { key: 'volume', label: 'Volume (MT)', sortable: true, sortKey: 'volume' },
    { key: 'km', label: 'Distance (KM)', sortable: true, sortKey: 'km' },
    { key: 'tonnageProgress', label: 'Uplift Progress', sortable: false },
]

const formatNumberValue = (value?: number | null, fractionDigits = 2) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '—'
    }

    return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    })
}

const clampPercentage = (value: number) => Math.max(0, Math.min(value, 100))

const renderTonnageProgress = (operation: OperationData) => {
    const planned = operation.volume ?? null
    const delivered = operation.deliveredVolume ?? null
    const remaining = operation.remainingVolume ?? null
    const completion = operation.volumeCompletion ?? null
    const progressWidth = completion !== null ? `${clampPercentage(completion)}%` : '0%'

    if ((planned === null || planned === 0) && (delivered === null || delivered === 0)) {
        return <span className="text-muted-foreground">—</span>
    }

    return (
        <div className="min-w-[200px] space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Delivered</span>
                <span className="font-medium text-foreground">
                    {delivered !== null ? `${formatNumberValue(delivered)} MT` : 'N/A'}
                </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary transition-all" style={{ width: progressWidth }} />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completion !== null ? `${completion.toFixed(1)}%` : 'No plan set'}</span>
                {planned !== null && remaining !== null ? (
                    <span>Remaining {formatNumberValue(Math.max(remaining, 0))} MT</span>
                ) : (
                    <span className="invisible">placeholder</span>
                )}
            </div>
        </div>
    )
}

export default function OperationsIndex({
    operations,
    metrics,
    filters,
    statusOptions,
    customerOptions,
    perPageOptions,
    totalCount,
}: OperationsIndexProps) {
    const { hasPermission } = usePermissions()
    const { toast } = useToast()
    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '')
    const [selectedStatus, setSelectedStatus] = React.useState(filters?.status ?? 'all')
    const [selectedCustomer, setSelectedCustomer] = React.useState(() =>
        filters?.customer ? String(filters.customer) : 'all'
    )
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'operationid')
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'asc')
    const availablePerPageOptions = React.useMemo(
        () => (perPageOptions?.length ? perPageOptions : [15, 25, 50, 100]),
        [perPageOptions]
    )
    const resolvedPerPage = React.useMemo(() => {
        const candidate = filters?.per_page
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate
        }

        return availablePerPageOptions[0] ?? 15
    }, [filters?.per_page, availablePerPageOptions])
    const [perPage, setPerPage] = React.useState<string>(() => String(resolvedPerPage))
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
    const [selectedOperation, setSelectedOperation] = React.useState<OperationData | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage))
    }, [resolvedPerPage])

    const operationData = operations?.data ?? []
    const totalRecords = totalCount ?? metrics?.total ?? operations?.total ?? 0
    const currentPage = operations?.current_page ?? 1
    const lastPage = operations?.last_page ?? 1

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="default">Active</Badge>
            case 'inactive':
                return <Badge variant="secondary">Inactive</Badge>
            case 'closed':
                return <Badge variant="outline">Closed</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const handleNavigate = React.useCallback(
        (overrides: Partial<{
            search?: string
            status?: string
            customer?: string
            sort?: string
            direction?: 'asc' | 'desc'
            page?: number
            per_page?: number
        }>) => {
            const nextSearch = overrides.search !== undefined ? overrides.search : searchTerm.trim()
            const nextStatus = overrides.status !== undefined ? overrides.status : selectedStatus
            const nextCustomer = overrides.customer !== undefined ? overrides.customer : selectedCustomer
            const nextSort = overrides.sort ?? sortColumn
            const nextDirection = overrides.direction ?? sortDirection
            const perPageValue = overrides.per_page !== undefined ? overrides.per_page : Number(perPage)

            const params: Record<string, string | number | undefined> = {
                search: nextSearch ? nextSearch : undefined,
                status: nextStatus !== 'all' ? nextStatus : undefined,
                customer: nextCustomer !== 'all' ? nextCustomer : undefined,
                sort: nextSort,
                direction: nextDirection,
                page: overrides.page,
                per_page: perPageValue,
            }

            Object.keys(params).forEach((key) => {
                const value = params[key]
                if (
                    value === undefined ||
                    value === null ||
                    value === '' ||
                    (key === 'per_page' && (typeof value !== 'number' || Number.isNaN(value) || value <= 0))
                ) {
                    delete params[key]
                }
            })

            router.get('/operations', params, { preserveState: true, preserveScroll: true, replace: false })
        },
    [searchTerm, selectedStatus, selectedCustomer, sortColumn, sortDirection, perPage]
    )

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        handleNavigate({ search: value.trim(), page: 1 })
    }

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value)
        handleNavigate({ status: value, page: 1 })
    }

    const handleCustomerChange = (value: string) => {
        setSelectedCustomer(value)
        handleNavigate({ customer: value, page: 1 })
    }

    const handlePerPageChange = (value: string) => {
        setPerPage(value)
        const numericValue = Number(value)
        handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 })
    }

    const handleSort = (column: ColumnConfig) => {
        if (column.sortable === false) {
            return
        }

        const sortKey = column.sortKey ?? column.key
        const newDirection: 'asc' | 'desc' = sortColumn === sortKey && sortDirection === 'asc' ? 'desc' : 'asc'
        setSortColumn(sortKey)
        setSortDirection(newDirection)
        handleNavigate({ sort: sortKey, direction: newDirection })
    }

    const renderHeaderCell = (column: ColumnConfig) => {
        const sortKey = column.sortKey ?? column.key
        const isActive = sortColumn === sortKey

        return (
            <TableHead
                key={column.key}
                className={`select-none bg-background ${column.sortable !== false ? 'cursor-pointer transition-colors hover:bg-muted/70' : ''}`}
                onClick={column.sortable !== false ? () => handleSort(column) : undefined}
            >
                <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable !== false && (
                        <ArrowUpDown
                            size={14}
                            className={isActive ? 'text-primary' : 'text-muted-foreground opacity-50'}
                        />
                    )}
                </div>
            </TableHead>
        )
    }

    const renderCell = (operation: OperationData, column: ColumnKey): React.ReactNode => {
        switch (column) {
            case 'operationid':
                return <span className="font-medium">{operation.operationid}</span>
            case 'customer':
                return operation.customer?.name || '—'
            case 'status':
                return getStatusBadge(operation.status)
            case 'startdate':
                return operation.startdate ? new Date(operation.startdate).toLocaleDateString() : '—'
            case 'volume':
                return formatNumberValue(operation.volume)
            case 'km':
                return formatNumberValue(operation.km)
            case 'tonnageProgress':
                return renderTonnageProgress(operation)
            default:
                return null
        }
    }

    const handleExport = React.useCallback(() => {
        const params = new URLSearchParams()
        if (searchTerm.trim()) {
            params.set('search', searchTerm.trim())
        }
        if (selectedStatus !== 'all') {
            params.set('status', selectedStatus)
        }
        if (selectedCustomer !== 'all') {
            params.set('customer', selectedCustomer)
        }
        params.set('sort', sortColumn)
        params.set('direction', sortDirection)

        const queryString = params.toString()
        window.location.href = queryString ? `/operations/export/csv?${queryString}` : '/operations/export/csv'
    }, [searchTerm, selectedStatus, selectedCustomer, sortColumn, sortDirection])

    const headerActions = (
        <>
            {hasPermission('operations.export') && (
                <Button variant="outline" onClick={handleExport}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            )}
            {hasPermission('operations.create') && (
                <Button asChild>
                    <Link href="/operations/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Operation
                    </Link>
                </Button>
            )}
        </>
    )

    const statsCards = [
        {
            title: 'Total Operations',
            value: totalRecords.toLocaleString(),
            description: `${(metrics?.open ?? 0).toLocaleString()} currently open`,
            icon: <Square className="h-3.5 w-3.5 text-muted-foreground" />,
            valueClassName: 'text-foreground',
        },
        {
            title: 'Active',
            value: (metrics?.active ?? 0).toLocaleString(),
            description: 'Operations in motion',
            icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />,
            valueClassName: 'text-emerald-600',
        },
        {
            title: 'Inactive',
            value: (metrics?.inactive ?? 0).toLocaleString(),
            description: 'Temporarily paused',
            icon: <XCircle className="h-3.5 w-3.5 text-rose-500" />,
            valueClassName: 'text-rose-500',
        },
        {
            title: 'Closed',
            value: (metrics?.closed ?? 0).toLocaleString(),
            description: 'Completed and archived',
            icon: <Gauge className="h-3.5 w-3.5 text-slate-500" />,
            valueClassName: 'text-slate-600',
        },
    ]

    const statsSection = (
        <div className="hidden gap-2 md:grid md:grid-cols-2 xl:grid-cols-4">
            {statsCards.map((card) => (
                <Card key={card.title} className="gap-2 border border-slate-200 py-2 shadow-sm sm:py-3">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-1.5 sm:p-2">
                        <CardTitle className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {card.title}
                        </CardTitle>
                        {card.icon}
                    </CardHeader>
                    <CardContent className="px-2 pb-2 pt-0 sm:px-3 sm:pb-2">
                        <div className={`text-sm font-semibold sm:text-base ${card.valueClassName}`}>{card.value}</div>
                        <p className="text-[11px] text-muted-foreground">{card.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )

    const tableHeaderExtras = (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-[260px] max-w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search operations..."
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="pl-10"
                />
            </div>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedCustomer} onValueChange={handleCustomerChange}>
                <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Customer" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                    <SelectItem value="all">All customers</SelectItem>
                    {customerOptions.map((customer) => (
                        <SelectItem key={customer.id} value={String(customer.id)}>
                            {customer.name}
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
            <TableHeader>
                <TableRow className="sticky top-0 z-50 border-b bg-background">
                    {columns.map((column) => renderHeaderCell(column))}
                    <TableHead className="bg-background text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {operationData.length > 0 ? (
                    operationData.map((operation) => (
                        <TableRow key={operation.id} className="hover:bg-muted/50">
                            {columns.map(({ key }) => (
                                <TableCell key={key}>{renderCell(operation, key)}</TableCell>
                            ))}
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button asChild size="sm" variant="ghost">
                                        <Link href={`/operations/${operation.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    {hasPermission('operations.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/operations/${operation.id}/edit`}>
                                                <SquarePen className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('operations.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setSelectedOperation(operation)
                                                setDeleteDialogOpen(true)
                                            }}
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
                            No operations found.
                            {hasPermission('operations.create') && (
                                <Link href="/operations/create" className="ml-1 text-primary underline">
                                    Create one
                                </Link>
                            )}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )

    const handleDeleteConfirm = React.useCallback(() => {
        if (!selectedOperation) {
            return
        }

        setIsDeleting(true)
        router.delete(`/operations/${selectedOperation.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast({ title: 'Operation deleted', description: 'The operation was removed successfully.' })
                setDeleteDialogOpen(false)
                setSelectedOperation(null)
            },
            onError: () => {
                toast({
                    title: 'Unable to delete operation',
                    description: 'Please try again or contact support if the issue persists.',
                    variant: 'destructive',
                })
            },
            onFinish: () => {
                setIsDeleting(false)
            },
        })
    }, [selectedOperation, toast])

    return (
        <>
            <ListPageLayout
                headTitle="Operations"
                title="Operations"
                description={`Manage your operations (${totalRecords.toLocaleString()})`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Operations Directory"
                tableDescription="Complete list of all operations"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <InertiaPagination
                        className="mt-4"
                        links={operations.links}
                        from={operations.from}
                        to={operations.to}
                        total={operations.total}
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
                title="Delete Operation"
                description="Are you sure you want to delete this operation? This action cannot be undone."
                itemName={selectedOperation ? selectedOperation.operationid : ''}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    )
}
