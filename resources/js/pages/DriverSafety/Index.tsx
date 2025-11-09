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
import { AlertTriangle, ArrowUpDown, DollarSign, Eye, Megaphone, Plus, Search, ShieldAlert, SquarePen, Trash2 } from 'lucide-react'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Driver Safety',
        href: '/driver-safety',
    },
]

interface DriverSummary {
    id: number
    name: string
}

interface SafetyRecord {
    id: number
    driver_id: number
    incident_date: string
    incident_type: string
    severity: string
    description: string
    damage_cost?: number | null
    location?: string | null
    driver?: DriverSummary | null
}

interface DriverSafetyIndexProps {
    safetyRecords: {
        data: SafetyRecord[]
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
        accidents: number
        violations: number
        warnings: number
        critical: number
        major: number
        minor: number
        total_damage_cost: number
        average_damage_cost: number
    }
    filters: {
        search?: string | null
        incident_type?: string | null
        severity?: string | null
        driver?: number | string | null
        sort?: string | null
        direction?: 'asc' | 'desc' | null
        per_page?: number | null
    }
    incidentTypeOptions: Array<{ label: string; value: string }>
    severityOptions: Array<{ label: string; value: string }>
    driverOptions: DriverSummary[]
    perPageOptions: number[]
}

const columns: Array<{ key: string; label: string; sortable?: boolean; sortKey?: string }> = [
    { key: 'incident_date', label: 'Date', sortable: true, sortKey: 'incident_date' },
    { key: 'driver', label: 'Driver' },
    { key: 'incident_type', label: 'Type', sortable: true, sortKey: 'incident_type' },
    { key: 'severity', label: 'Severity', sortable: true, sortKey: 'severity' },
    { key: 'description', label: 'Description' },
    { key: 'damage_cost', label: 'Damage Cost', sortable: true, sortKey: 'damage_cost' },
]

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

const formatCurrency = (value?: number | null) => {
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

const getSeverityBadgeClass = (severity: string) => {
    const normalized = severity.toLowerCase()
    if (normalized === 'critical') {
        return 'bg-red-500 text-white hover:bg-red-600'
    }
    if (normalized === 'major') {
        return 'bg-orange-500 text-white hover:bg-orange-600'
    }
    if (normalized === 'minor') {
        return 'bg-amber-500 text-white hover:bg-amber-600'
    }
    return 'bg-muted text-muted-foreground'
}

const getIncidentTypeBadgeClass = (incidentType: string) => {
    const normalized = incidentType.toLowerCase()
    if (normalized === 'accident') {
        return 'bg-rose-500 text-white hover:bg-rose-600'
    }
    if (normalized === 'violation') {
        return 'bg-indigo-500 text-white hover:bg-indigo-600'
    }
    if (normalized === 'warning') {
        return 'bg-blue-500 text-white hover:bg-blue-600'
    }
    return 'bg-muted text-muted-foreground'
}

export default function DriverSafetyIndex({
    safetyRecords,
    metrics,
    filters,
    incidentTypeOptions,
    severityOptions,
    driverOptions,
    perPageOptions,
}: DriverSafetyIndexProps) {
    const { hasPermission } = usePermissions()
    const { toast } = useToast()
    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '')
    const [selectedIncidentType, setSelectedIncidentType] = React.useState(filters?.incident_type ?? 'all')
    const [selectedSeverity, setSelectedSeverity] = React.useState(filters?.severity ?? 'all')
    const [selectedDriver, setSelectedDriver] = React.useState(filters?.driver ? String(filters.driver) : 'all')
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'incident_date')
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
    const [selectedRecord, setSelectedRecord] = React.useState<SafetyRecord | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage))
    }, [resolvedPerPage])

    const totalRecords = metrics?.total ?? safetyRecords?.total ?? 0
    const currentPage = safetyRecords?.current_page ?? 1
    const lastPage = safetyRecords?.last_page ?? 1
    const safetyData = safetyRecords?.data ?? []

    const handleNavigate = React.useCallback((overrides: Partial<{
        search?: string
        incident_type?: string
        severity?: string
        driver?: string | number
        sort?: string
        direction?: 'asc' | 'desc'
        page?: number
        per_page?: number
    }>) => {
        const perPageValue = overrides.per_page !== undefined ? overrides.per_page : Number(perPage)
        const params: Record<string, string | number | undefined> = {
            search: overrides.search !== undefined ? overrides.search : (searchTerm.trim() ? searchTerm.trim() : undefined),
            incident_type: overrides.incident_type !== undefined ? overrides.incident_type : (selectedIncidentType !== 'all' ? selectedIncidentType : undefined),
            severity: overrides.severity !== undefined ? overrides.severity : (selectedSeverity !== 'all' ? selectedSeverity : undefined),
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

        router.get('/driver-safety', params, { preserveState: true, replace: false })
    }, [searchTerm, selectedIncidentType, selectedSeverity, selectedDriver, sortColumn, sortDirection, perPage])

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 })
    }

    const handleIncidentTypeChange = (value: string) => {
        setSelectedIncidentType(value)
        handleNavigate({ incident_type: value !== 'all' ? value : undefined, page: 1 })
    }

    const handleSeverityChange = (value: string) => {
        setSelectedSeverity(value)
        handleNavigate({ severity: value !== 'all' ? value : undefined, page: 1 })
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

    const handleDeleteClick = (record: SafetyRecord) => {
        setSelectedRecord(record)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = () => {
        if (!selectedRecord) {
            return
        }

        setIsDeleting(true)
        router.delete(`/driver-safety/${selectedRecord.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleting(false)
                setDeleteDialogOpen(false)
                setSelectedRecord(null)
                toast({
                    title: 'Safety record deleted',
                    description: 'The driver safety record was removed successfully.',
                })
            },
            onError: (errors) => {
                setIsDeleting(false)
                const errorMessages = errors && typeof errors === 'object'
                    ? Object.values(errors as Record<string, unknown>)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter((value): value is string => typeof value === 'string')
                        .join('\n')
                    : 'Failed to delete safety record.'
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
            title: 'Total Records',
            value: metrics ? metrics.total.toLocaleString() : '0',
            description: `${metrics?.critical?.toLocaleString() ?? 0} critical incidents`,
            icon: <ShieldAlert className="h-3.5 w-3.5 text-blue-600" />,
            valueClassName: 'text-blue-600',
        },
        {
            title: 'Accidents',
            value: metrics ? metrics.accidents.toLocaleString() : '0',
            description: `${metrics?.violations?.toLocaleString() ?? 0} violations`,
            icon: <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />,
            valueClassName: 'text-rose-600',
        },
        {
            title: 'Warnings',
            value: metrics ? metrics.warnings.toLocaleString() : '0',
            description: `${metrics?.minor?.toLocaleString() ?? 0} minor cases`,
            icon: <Megaphone className="h-3.5 w-3.5 text-amber-600" />,
            valueClassName: 'text-amber-600',
        },
        {
            title: 'Damage Cost',
            value: formatCurrency(metrics?.total_damage_cost ?? 0),
            description: `Avg ${formatCurrency(metrics?.average_damage_cost ?? 0)}`,
            icon: <DollarSign className="h-3.5 w-3.5 text-purple-600" />,
            valueClassName: 'text-purple-600',
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
                    placeholder="Search safety records..."
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="pl-10"
                />
            </div>
            <Select value={selectedIncidentType} onValueChange={handleIncidentTypeChange}>
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Incident type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All incident types</SelectItem>
                    {incidentTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedSeverity} onValueChange={handleSeverityChange}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All severities</SelectItem>
                    {severityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedDriver} onValueChange={handleDriverChange}>
                <SelectTrigger className="w-[200px]">
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
                onClick={() => handleSort(columnKey ?? column.key)}
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
                {safetyData.length > 0 ? (
                    safetyData.map((record) => (
                        <TableRow key={record.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{formatDate(record.incident_date)}</TableCell>
                            <TableCell className="text-muted-foreground">{record.driver?.name || '—'}</TableCell>
                            <TableCell>
                                <Badge className={getIncidentTypeBadgeClass(record.incident_type)}>
                                    {record.incident_type}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge className={getSeverityBadgeClass(record.severity)}>
                                    {record.severity}
                                </Badge>
                            </TableCell>
                            <TableCell className="max-w-sm truncate text-muted-foreground" title={record.description}>
                                {record.description || '—'}
                            </TableCell>
                            <TableCell className="font-semibold">{formatCurrency(record.damage_cost ?? 0)}</TableCell>
                            <TableCell className="text-center">
                                <div className="flex justify-center gap-2">
                                    {hasPermission('driver-safety.show') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/driver-safety/${record.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('driver-safety.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/driver-safety/${record.id}/edit`}>
                                                <SquarePen className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('driver-safety.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteClick(record)}
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
                            No safety records found.
                            {hasPermission('driver-safety.create') && (
                                <Link href="/driver-safety/create" className="ml-1 text-primary underline">
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
            {hasPermission('driver-safety.create') && (
                <Button asChild>
                    <Link href="/driver-safety/create">
                        <Plus className="mr-2 h-4 w-4" />
                        New Safety Record
                    </Link>
                </Button>
            )}
        </>
    )

    return (
        <>
            <ListPageLayout
                headTitle="Driver Safety"
                title="Driver Safety"
                description={`Monitor incidents across the fleet. Total: ${totalRecords.toLocaleString()}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Safety Records"
                tableDescription="Track incidents, severity, and impact"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <InertiaPagination
                        className="mt-4"
                        links={safetyRecords.links}
                        from={safetyRecords.from}
                        to={safetyRecords.to}
                        total={safetyRecords.total}
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
                title="Delete Safety Record"
                description="Are you sure you want to delete this safety record? This action cannot be undone."
                itemName={selectedRecord ? `${selectedRecord.driver?.name || 'Driver'} – ${formatDate(selectedRecord.incident_date)}` : ''}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    )
}

