import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { type BreadcrumbItem } from '@/types'
import { usePermissions } from '@/hooks/use-permissions'
import ListPageLayout from '@/components/layouts/list-page-layout'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { InertiaPagination } from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    ArrowUpDown,
    BadgeCheck,
    Building2,
    CheckCircle,
    Compass,
    FileDown,
    Filter,
    MapPin,
    Navigation,
    Pencil,
    Plus,
    Satellite,
    Search,
    Target,
    Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Places',
        href: '/places',
    },
]

interface RegionSummary {
    id: number
    name: string
}

interface ZoneSummary {
    id: number
    name: string
    region?: RegionSummary | null
}

interface WoredaSummary {
    id: number
    name: string
    zone?: ZoneSummary | null
}

interface PlaceData {
    id: number
    name: string
    code?: string | null
    status: 'active' | 'inactive'
    latitude?: number | string | null
    longitude?: number | string | null
    elevation_m?: number | string | null
    population?: number | string | null
    is_logistics_hub?: boolean
    accessibility_score?: number | string | null
    origin_performances_count?: number
    destination_performances_count?: number
    woreda?: WoredaSummary | null
    created_at?: string
}

interface PlacesIndexProps {
    places: {
        data: PlaceData[]
        current_page: number
        last_page: number
        per_page: number
        total: number
        from: number
        to: number
        links: Array<{
            url: string | null
            label: string
            active: boolean
        }>
    }
    metrics?: {
        hubCount?: number
        totalPopulation?: number
        averageAccessibility?: number
    }
    filters?: {
        search?: string | null
        status?: string | null
        sort?: string | null
        direction?: 'asc' | 'desc' | null
        per_page?: number | null
    }
    statusOptions?: Array<{ label: string; value: string }>
    perPageOptions?: number[]
}

const perPageFallback = [10, 15, 25, 50]

type ColumnKey =
    | 'name'
    | 'code'
    | 'status'
    | 'location'
    | 'coordinates'
    | 'population'
    | 'accessibility_score'
    | 'is_logistics_hub'
    | 'origin_performances_count'
    | 'destination_performances_count'
    | 'created_at'

interface ColumnConfig {
    key: ColumnKey
    label: string
    sortable?: boolean
    sortKey?: string
}

const columns: ColumnConfig[] = [
    { key: 'name', label: 'Place', sortable: true },
    { key: 'code', label: 'Code', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'location', label: 'Location', sortable: false },
    { key: 'coordinates', label: 'Coordinates', sortable: false },
    { key: 'population', label: 'Population', sortable: true },
    { key: 'accessibility_score', label: 'Accessibility', sortable: true },
    { key: 'is_logistics_hub', label: 'Logistics Hub', sortable: true, sortKey: 'is_logistics_hub' },
    { key: 'origin_performances_count', label: 'Origin Perf.', sortable: true },
    { key: 'destination_performances_count', label: 'Destination Perf.', sortable: true },
    { key: 'created_at', label: 'Created', sortable: true },
]

const formatNumberValue = (value?: number | string | null, fractionDigits = 0) => {
    if (value === null || value === undefined || value === '') {
        return '—'
    }

    const numeric = Number(value)
    if (!Number.isFinite(numeric)) {
        return '—'
    }

    return numeric.toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    })
}

const formatCoordinate = (value?: number | string | null) => {
    if (value === null || value === undefined || value === '') {
        return undefined
    }

    const numeric = Number(value)
    if (!Number.isFinite(numeric)) {
        return undefined
    }

    return numeric.toFixed(4)
}

const formatDate = (value?: string | null) => {
    if (!value) {
        return '—'
    }

    try {
        return new Date(value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    } catch {
        return value
    }
}

export default function PlacesIndex({ places, metrics, filters, statusOptions, perPageOptions }: PlacesIndexProps) {
    const { hasPermission } = usePermissions()
    const { toast } = useToast()

    const [searchTerm, setSearchTerm] = useState(filters?.search ?? '')
    const [selectedStatus, setSelectedStatus] = useState(filters?.status ?? 'all')
    const [sortColumn, setSortColumn] = useState(filters?.sort ?? 'name')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(filters?.direction ?? 'asc')
    const availablePerPageOptions = useMemo(
        () => (perPageOptions?.length ? perPageOptions : perPageFallback),
        [perPageOptions]
    )
    const resolvedPerPage = useMemo(() => {
        const candidate = filters?.per_page
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate
        }

        return availablePerPageOptions[0] ?? 15
    }, [filters?.per_page, availablePerPageOptions])
    const [perPage, setPerPage] = useState<string>(() => String(resolvedPerPage))

    useEffect(() => {
        setPerPage(String(resolvedPerPage))
    }, [resolvedPerPage])

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedPlace, setSelectedPlace] = useState<PlaceData | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const placeData = places?.data ?? []
    const totalRecords = places?.total ?? 0
    const currentPage = places?.current_page ?? 1
    const lastPage = places?.last_page ?? 1
    const perPageCountRaw = typeof places?.per_page === 'number' ? places.per_page : Number(perPage)
    const perPageCount = Number.isFinite(perPageCountRaw) && perPageCountRaw > 0
        ? perPageCountRaw
        : placeData.length || 1
    const rowOffset = (currentPage - 1) * perPageCount

    const statusFilterOptions = useMemo(() => {
        if (statusOptions?.length) {
            return statusOptions
        }

        return [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
        ]
    }, [statusOptions])

    const getStatusBadge = (status: string) => {
        const baseClasses =
            'flex w-fit items-center gap-1 border text-xs font-medium px-2 py-0.5 rounded-full transition-colors'

        if (status === 'active') {
            return (
                <Badge className={`${baseClasses} border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-200`}>
                    <CheckCircle className="h-3 w-3" />
                    Active
                </Badge>
            )
        }

        return (
            <Badge className={`${baseClasses} border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200`}>
                Inactive
            </Badge>
        )
    }

    const getHubBadge = (flag?: boolean) => {
        if (!flag) {
            return (
                <Badge className="w-fit border-slate-200 bg-slate-100 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                    Standard
                </Badge>
            )
        }

        return (
            <Badge className="w-fit border-amber-200 bg-amber-100 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-200">
                <BadgeCheck className="mr-1 h-3 w-3" />Hub
            </Badge>
        )
    }

    const handleNavigate = useCallback(
        (overrides: Partial<{
            search?: string
            status?: string
            sort?: string
            direction?: 'asc' | 'desc'
            page?: number
            per_page?: number
        }>) => {
            const nextSearch = overrides.search !== undefined ? overrides.search : searchTerm.trim()
            const nextStatus = overrides.status !== undefined ? overrides.status : selectedStatus
            const nextSort = overrides.sort ?? sortColumn
            const nextDirection = overrides.direction ?? sortDirection
            const perPageValue = overrides.per_page !== undefined ? overrides.per_page : Number(perPage)

            const params: Record<string, string | number | undefined> = {
                search: nextSearch ? nextSearch : undefined,
                status: nextStatus !== 'all' ? nextStatus : undefined,
                sort: nextSort,
                direction: nextDirection,
                page: overrides.page,
                per_page: perPageValue,
            }

            Object.keys(params).forEach(key => {
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

            router.get('/places', params, { preserveState: true, preserveScroll: true, replace: false })
        },
        [searchTerm, selectedStatus, sortColumn, sortDirection, perPage]
    )

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        handleNavigate({ search: value.trim(), page: 1 })
    }

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value)
        handleNavigate({ status: value, page: 1 })
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

        if (column.sortable === false) {
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
                onClick={() => handleSort(column)}
            >
                <div className="flex items-center gap-2">
                    {column.label}
                    <ArrowUpDown
                        size={14}
                        className={isActive ? 'text-primary' : 'text-muted-foreground opacity-50'}
                    />
                </div>
            </TableHead>
        )
    }

    const renderCell = (place: PlaceData, column: ColumnKey) => {
        switch (column) {
            case 'name':
                return (
                    <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-rose-500" />
                        <span className="font-medium">{place.name}</span>
                    </div>
                )
            case 'code':
                return place.code || '—'
            case 'status':
                return getStatusBadge(place.status)
            case 'location':
                return (
                    <div className="flex flex-col text-sm leading-tight">
                        <span className="font-medium">{place.woreda?.name ?? '—'}</span>
                        {place.woreda?.zone && (
                            <span className="text-xs text-muted-foreground">
                                {place.woreda.zone.name}
                                {place.woreda.zone.region && `, ${place.woreda.zone.region.name}`}
                            </span>
                        )}
                    </div>
                )
            case 'coordinates': {
                const lat = formatCoordinate(place.latitude)
                const lng = formatCoordinate(place.longitude)
                return lat && lng ? `${lat}, ${lng}` : '—'
            }
            case 'population':
                return formatNumberValue(place.population)
            case 'accessibility_score':
                return place.accessibility_score !== null && place.accessibility_score !== undefined
                    ? formatNumberValue(place.accessibility_score, 1)
                    : '—'
            case 'is_logistics_hub':
                return getHubBadge(place.is_logistics_hub)
            case 'origin_performances_count':
                return formatNumberValue(place.origin_performances_count ?? 0)
            case 'destination_performances_count':
                return formatNumberValue(place.destination_performances_count ?? 0)
            case 'created_at':
                return formatDate(place.created_at)
            default:
                return null
        }
    }

    const handleExport = useCallback(() => {
        const params = new URLSearchParams()
        if (searchTerm.trim()) {
            params.set('search', searchTerm.trim())
        }
        if (selectedStatus !== 'all') {
            params.set('status', selectedStatus)
        }
        params.set('sort', sortColumn)
        params.set('direction', sortDirection)

        const queryString = params.toString()
        window.location.href = queryString ? `/places/export?${queryString}` : '/places/export'
    }, [searchTerm, selectedStatus, sortColumn, sortDirection])

    const headerActions = (
        <>
            {hasPermission('places.export') && (
                <Button variant="outline" onClick={handleExport}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            )}
            {hasPermission('places.create') && (
                <Button asChild>
                    <Link href="/places/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Place
                    </Link>
                </Button>
            )}
        </>
    )

    const statsCards = [
        {
            title: 'Total Places',
            value: formatNumberValue(totalRecords),
            description: 'Locations tracked for routing & coverage',
            icon: <MapPin className="h-3.5 w-3.5 text-rose-500" />,
            valueClassName: 'text-rose-500',
        },
        {
            title: 'Logistics Hubs',
            value: formatNumberValue(metrics?.hubCount ?? 0),
            description: 'Strategic consolidation or dispatch hubs',
            icon: <Building2 className="h-3.5 w-3.5 text-emerald-600" />,
            valueClassName: 'text-emerald-600',
        },
        {
            title: 'Population Served',
            value: formatNumberValue(metrics?.totalPopulation ?? 0),
            description: 'Residents covered across all places',
            icon: <Satellite className="h-3.5 w-3.5 text-indigo-500" />,
            valueClassName: 'text-indigo-600',
        },
        {
            title: 'Accessibility Score',
            value: formatNumberValue(metrics?.averageAccessibility ?? 0, 1),
            description: 'Average infrastructure readiness index',
            icon: <Target className="h-3.5 w-3.5 text-amber-600" />,
            valueClassName: 'text-amber-600',
        },
    ]

    const statsSection = (
        <div className="hidden gap-2 md:grid md:grid-cols-2 xl:grid-cols-4">
            {statsCards.map(card => (
                <Card key={card.title} className="gap-2 border border-slate-200 py-2 shadow-sm dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 px-2 pb-1">
                        <CardTitle className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {card.title}
                        </CardTitle>
                        {card.icon}
                    </CardHeader>
                    <CardContent className="px-2 pb-2 pt-0">
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
                    placeholder="Search places..."
                    value={searchTerm}
                    onChange={event => handleSearchChange(event.target.value)}
                    className="pl-10"
                />
            </div>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            All statuses
                        </div>
                    </SelectItem>
                    {statusFilterOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="hidden sm:inline">Rows</span>
                <Select value={perPage} onValueChange={handlePerPageChange}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Per page" />
                    </SelectTrigger>
                    <SelectContent>
                        {availablePerPageOptions.map(option => (
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
                    <TableHead className="sticky top-0 z-20 w-12 bg-background text-center">#</TableHead>
                    {columns.map(column => renderHeaderCell(column))}
                    <TableHead className="sticky top-0 z-20 bg-background text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {placeData.length > 0 ? (
                    placeData.map((place, index) => (
                        <TableRow key={place.id} className="hover:bg-muted/50">
                            <TableCell className="text-center font-medium">
                                {rowOffset + index + 1}
                            </TableCell>
                            {columns.map(({ key }) => (
                                <TableCell key={key}>{renderCell(place, key)}</TableCell>
                            ))}
                            <TableCell className="text-center">
                                <div className="flex justify-center gap-2">
                                    {hasPermission('places.show') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/places/${place.id}`}>
                                                <Compass className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('places.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/places/${place.id}/edit`}>
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('places.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => {
                                                setSelectedPlace(place)
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
                        <TableCell colSpan={columns.length + 2} className="py-8 text-center text-muted-foreground">
                            No places found.
                            {hasPermission('places.create') && (
                                <Link href="/places/create" className="ml-1 text-primary underline">
                                    Create one
                                </Link>
                            )}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )

    const handleDeleteConfirm = useCallback(() => {
        if (!selectedPlace) {
            return
        }

        setIsDeleting(true)
        router.delete(`/places/${selectedPlace.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast({ title: 'Place deleted', description: `${selectedPlace.name} has been removed.` })
                setDeleteDialogOpen(false)
                setSelectedPlace(null)
            },
            onError: () => {
                toast({
                    title: 'Unable to delete place',
                    description: 'Please try again or contact support if the issue persists.',
                    variant: 'destructive',
                })
            },
            onFinish: () => {
                setIsDeleting(false)
            },
        })
    }, [selectedPlace, toast])

    return (
        <>
            <ListPageLayout
                headTitle="Places"
                title="Places"
                description={`Monitor ${formatNumberValue(totalRecords)} locations and their logistics readiness.`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Place Inventory"
                tableDescription="Track locations, hub capabilities, and route performance signals"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <InertiaPagination
                        from={places.from}
                        to={places.to}
                        total={places.total}
                        links={places.links}
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
                title="Delete Place"
                description="Are you sure you want to delete this place? This action cannot be undone."
                itemName={selectedPlace?.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    )
}
