import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import {
    Activity,
    ArrowUpDown,
    CheckCircle,
    Edit,
    Eye,
    Plus,
    Search,
    Trash2,
    XCircle,
} from 'lucide-react'
import { InertiaPagination } from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import * as React from 'react'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Performances',
        href: '/performances',
    },
]

type ColumnKey =
    | 'foNumber'
    | 'dispatchDate'
    | 'loadPhase'
    | 'loadCompletion'
    | 'status'
    | 'distanceWithCargo'
    | 'fuelCost'

interface ColumnConfig {
    key: ColumnKey
    label: string
    sortable?: boolean
    sortKey?: string
}

const columns: ColumnConfig[] = [
    { key: 'foNumber', label: 'FO Number', sortable: true, sortKey: 'FOnumber' },
    { key: 'dispatchDate', label: 'Dispatch Date', sortable: true, sortKey: 'DateDispach' },
    { key: 'loadPhase', label: 'Load Phase', sortable: true, sortKey: 'load_phase' },
    { key: 'loadCompletion', label: 'Load Completion', sortable: true, sortKey: 'load_completion' },
    { key: 'status', label: 'Status', sortable: true, sortKey: 'satus' },
    { key: 'distanceWithCargo', label: 'Distance (KM)', sortable: true, sortKey: 'DistanceWCargo' },
    { key: 'fuelCost', label: 'Fuel Cost (Birr)', sortable: true, sortKey: 'fuelInBirr' },
]

interface PerformanceData {
    id: number
    foNumber: string
    dispatchDate?: string | null
    loadPhase?: string | null
    loadCompletion?: string | null
    status?: string | null
    distanceWithCargo?: number | null
    fuelCost?: number | null
    distanceWithoutCargo?: number | null
    tonnage?: number | null
    fuelInLitter?: number | null
}

interface PerformancesIndexProps {
    performances: {
        data: PerformanceData[]
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
        completed: number
        failed: number
    }
    filters: {
        search?: string | null
        status?: string | null
        load_phase?: string | null
        sort?: string | null
        direction?: 'asc' | 'desc' | null
        per_page?: number | null
    }
    statusOptions: Array<{ label: string; value: string }>
    loadPhaseOptions: Array<{ label: string; value: string }>
    perPageOptions: number[]
    totalCount?: number
}

const formatNumberValue = (value?: number | null, fractionDigits = 2) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '—'
    }

    return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    })
}

const formatDateValue = (value?: string | null) => {
    if (!value) {
        return '—'
    }

    const date = new Date(value)
    if (Number.isNaN(Number(date))) {
        return '—'
    }

    return date.toLocaleDateString()
}

const getStatusBadge = (status?: string | null) => {
    if (!status) {
        return <Badge variant="outline">Unknown</Badge>
    }

    switch (status.toLowerCase()) {
        case 'completed':
            return <Badge variant="default">Completed</Badge>
        case 'active':
            return <Badge variant="secondary">Active</Badge>
        case 'failed':
            return <Badge variant="destructive">Failed</Badge>
        default:
            return <Badge variant="outline">{status}</Badge>
    }
}

export default function PerformancesIndex({
    performances,
    metrics,
    filters,
    statusOptions,
    loadPhaseOptions,
    perPageOptions,
    totalCount,
}: PerformancesIndexProps) {
    const { hasPermission } = usePermissions()
    const { toast } = useToast()

    const initialStatus = filters?.status ? String(filters.status) : 'all'
    const initialLoadPhase = filters?.load_phase ? String(filters.load_phase) : 'all'
    const initialDirection = filters?.direction === 'asc' || filters?.direction === 'desc' ? filters.direction : 'desc'

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '')
    const [selectedStatus, setSelectedStatus] = React.useState(initialStatus === '' ? 'all' : initialStatus)
    const [selectedLoadPhase, setSelectedLoadPhase] = React.useState(initialLoadPhase === '' ? 'all' : initialLoadPhase)
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'DateDispach')
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(initialDirection ?? 'desc')

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
    const [selectedPerformance, setSelectedPerformance] = React.useState<PerformanceData | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage))
    }, [resolvedPerPage])

    const performanceData = performances?.data ?? []
    const startIndex = typeof performances?.from === 'number' ? performances.from : 1
    const totalRecords = totalCount ?? metrics?.total ?? performances?.total ?? 0
    const currentPage = performances?.current_page ?? 1
    const lastPage = performances?.last_page ?? 1

    const handleNavigate = React.useCallback(
        (overrides: Partial<{
            search?: string
            status?: string
            load_phase?: string
            sort?: string
            direction?: 'asc' | 'desc'
            page?: number
            per_page?: number
        }>) => {
            const nextSearch = overrides.search !== undefined ? overrides.search : searchTerm.trim()
            const nextStatus = overrides.status !== undefined ? overrides.status : selectedStatus
            const nextLoadPhase = overrides.load_phase !== undefined ? overrides.load_phase : selectedLoadPhase
            const nextSort = overrides.sort ?? sortColumn
            const nextDirection = overrides.direction ?? sortDirection
            const perPageValue = overrides.per_page !== undefined ? overrides.per_page : Number(perPage)

            const params: Record<string, string | number | undefined> = {
                search: nextSearch ? nextSearch : undefined,
                status: nextStatus !== 'all' ? nextStatus : undefined,
                load_phase: nextLoadPhase !== 'all' ? nextLoadPhase : undefined,
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

            router.get('/performances', params, { preserveState: true, preserveScroll: true, replace: false })
        },
        [searchTerm, selectedStatus, selectedLoadPhase, sortColumn, sortDirection, perPage]
    )

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        handleNavigate({ search: value.trim(), page: 1 })
    }

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value)
        handleNavigate({ status: value, page: 1 })
    }

    const handleLoadPhaseChange = (value: string) => {
        setSelectedLoadPhase(value)
        handleNavigate({ load_phase: value, page: 1 })
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
                        <ArrowUpDown size={14} className={isActive ? 'text-primary' : 'text-muted-foreground opacity-50'} />
                    )}
                </div>
            </TableHead>
        )
    }

    const renderCell = (performance: PerformanceData, column: ColumnKey): React.ReactNode => {
        switch (column) {
            case 'foNumber':
                return performance.foNumber || '—'
            case 'dispatchDate':
                return formatDateValue(performance.dispatchDate)
            case 'loadPhase':
                return performance.loadPhase ? (
                    <Badge variant="secondary" className="capitalize">
                        {performance.loadPhase}
                    </Badge>
                ) : (
                    '—'
                )
            case 'loadCompletion':
                return performance.loadCompletion ? (
                    <Badge variant="secondary" className="capitalize">
                        {performance.loadCompletion}
                    </Badge>
                ) : (
                    '—'
                )
            case 'status':
                return getStatusBadge(performance.status)
            case 'distanceWithCargo':
                return performance.distanceWithCargo !== null && performance.distanceWithCargo !== undefined
                    ? `${formatNumberValue(performance.distanceWithCargo)} km`
                    : '—'
            case 'fuelCost':
                return performance.fuelCost !== null && performance.fuelCost !== undefined
                    ? `${formatNumberValue(performance.fuelCost)} ETB`
                    : '—'
            default:
                return null
        }
    }

    const headerActions = (
        <>
            {hasPermission('performances.create') && (
                <Button asChild>
                    <Link href="/performances/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Performance
                    </Link>
                </Button>
            )}
        </>
    )

    const statsCards = [
        {
            title: 'Active Movements',
            value: (metrics?.active ?? 0).toLocaleString(),
            description: 'Currently active',
            icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />,
            valueClassName: 'text-emerald-600',
        },
        {
            title: 'Completed Movements',
            value: (metrics?.completed ?? 0).toLocaleString(),
            description: 'Closed records',
            icon: <Eye className="h-3.5 w-3.5 text-blue-600" />,
            valueClassName: 'text-blue-600',
        },
        {
            title: 'Flagged Movements',
            value: (metrics?.failed ?? 0).toLocaleString(),
            description: 'Flagged records',
            icon: <XCircle className="h-3.5 w-3.5 text-destructive" />,
            valueClassName: 'text-destructive',
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
                    placeholder="Search performances..."
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="pl-10"
                />
            </div>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[160px]">
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
            <Select value={selectedLoadPhase} onValueChange={handleLoadPhaseChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Load phase" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                    <SelectItem value="all">All phases</SelectItem>
                    {loadPhaseOptions.map((option) => (
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
            <TableHeader>
                <TableRow className="sticky top-0 z-50 border-b bg-background">
                    <TableHead className="w-16 bg-background text-center">No</TableHead>
                    {columns.map((column) => renderHeaderCell(column))}
                    <TableHead className="bg-background text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {performanceData.length > 0 ? (
                    performanceData.map((performance, index) => (
                        <TableRow key={performance.id} className="hover:bg-muted/50">
                            <TableCell className="text-center font-medium text-muted-foreground">
                                {startIndex + index}
                            </TableCell>
                            {columns.map(({ key }) => (
                                <TableCell key={key}>{renderCell(performance, key)}</TableCell>
                            ))}
                            <TableCell className="text-center">
                                <div className="flex justify-center gap-2">
                                    <Button asChild size="sm" variant="ghost">
                                        <Link href={`/performances/${performance.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    {hasPermission('performances.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/performances/${performance.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('performances.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => {
                                                setSelectedPerformance(performance)
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
                            No performances found.
                            {hasPermission('performances.create') && (
                                <Link href="/performances/create" className="ml-1 text-primary underline">
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
        if (!selectedPerformance) {
            return
        }

        setIsDeleting(true)
        router.delete(`/performances/${selectedPerformance.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: 'Performance deleted',
                    description: selectedPerformance.foNumber
                        ? `Performance ${selectedPerformance.foNumber} was removed successfully.`
                        : 'The performance record was removed successfully.',
                })
                setDeleteDialogOpen(false)
                setSelectedPerformance(null)
            },
            onError: () => {
                toast({
                    title: 'Unable to delete performance',
                    description: 'Please try again or contact support if the issue persists.',
                    variant: 'destructive',
                })
            },
            onFinish: () => {
                setIsDeleting(false)
            },
        })
    }, [selectedPerformance, toast])

    return (
        <>
            <ListPageLayout
                headTitle="Performances"
                title="Performances"
                description={`Manage your fleet performance (${totalRecords.toLocaleString()})`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Performance Records"
                tableDescription="Track every performance entry"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <InertiaPagination
                        className="mt-4"
                        links={performances.links}
                        from={performances.from}
                        to={performances.to}
                        total={performances.total}
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
                title="Delete Performance"
                description="Are you sure you want to delete this performance? This action cannot be undone."
                itemName={selectedPerformance ? selectedPerformance.foNumber : ''}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    )
}
