import { useCallback, useMemo, useState } from 'react'
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
import { ArrowUpDown, GaugeCircle, Globe2, MapPin, Navigation2, Route, ShieldAlert, Trash2, TrendingDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Distances',
        href: '/distances',
    },
]

interface RegionSummary {
    name?: string | null
}

interface ZoneSummary {
    name?: string | null
    region?: RegionSummary | null
}

interface WoredaSummary {
    name?: string | null
    zone?: ZoneSummary | null
}

interface PlaceSummary {
    id: number
    name: string
    woreda?: WoredaSummary | null
}

interface DistanceRecord {
    id: number
    status: 'active' | 'inactive'
    distance_km: number | string
    estimated_time_hours: number | string
    route_type: 'primary' | 'secondary' | 'alternative' | null
    toll_road?: boolean
    restricted_for_heavy_vehicles?: boolean
    average_speed_kmph?: number | string | null
    road_quality_index?: number | string | null
    from_place?: PlaceSummary | null
    to_place?: PlaceSummary | null
    created_at?: string
}

interface DistancesIndexProps {
    distances: {
        data: DistanceRecord[]
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
        averageSpeed?: number
        averageRoadQuality?: number
        seasonalConstraintCount?: number
    }
    filters?: {
        search?: string | null
        routeType?: string | null
        tollRoad?: string | null
        heavyVehicleRestricted?: string | null
        distanceMin?: string | null
        distanceMax?: string | null
        timeMin?: string | null
        timeMax?: string | null
        region?: string | null
        sort?: string | null
        direction?: 'asc' | 'desc' | null
    }
}

type ColumnKey =
    | 'route'
    | 'status'
    | 'distance_km'
    | 'estimated_time_hours'
    | 'route_type'
    | 'average_speed_kmph'
    | 'road_quality_index'
    | 'toll_road'
    | 'restricted_for_heavy_vehicles'
    | 'created_at'

interface ColumnConfig {
    key: ColumnKey
    label: string
    sortable?: boolean
    sortKey?: string
}

const columns: ColumnConfig[] = [
    { key: 'route', label: 'Route' },
    { key: 'status', label: 'Status' },
    { key: 'distance_km', label: 'Distance (km)', sortable: true },
    { key: 'estimated_time_hours', label: 'Time (hrs)', sortable: true },
    { key: 'route_type', label: 'Route Type', sortable: true },
    { key: 'average_speed_kmph', label: 'Avg Speed', sortable: true },
    { key: 'road_quality_index', label: 'Road Quality', sortable: true },
    { key: 'toll_road', label: 'Toll Road', sortable: false },
    { key: 'restricted_for_heavy_vehicles', label: 'Heavy Vehicle', sortable: false },
    { key: 'created_at', label: 'Created', sortable: true },
]

const routeTypeOptions = [
    { label: 'All routes', value: 'all' },
    { label: 'Primary', value: 'primary' },
    { label: 'Secondary', value: 'secondary' },
    { label: 'Alternative', value: 'alternative' },
]

const booleanOptions = [
    { label: 'All', value: 'all' },
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' },
]

const numberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
})

export default function DistancesIndex({ distances, metrics, filters }: DistancesIndexProps) {
    const { hasPermission } = usePermissions()
    const { toast } = useToast()

    const [search, setSearch] = useState(filters?.search ?? '')
    const [routeType, setRouteType] = useState(filters?.routeType ?? 'all')
    const [tollRoad, setTollRoad] = useState(filters?.tollRoad ?? 'all')
    const [heavyVehicleRestricted, setHeavyVehicleRestricted] = useState(filters?.heavyVehicleRestricted ?? 'all')
    const [distanceMin, setDistanceMin] = useState(filters?.distanceMin ?? '')
    const [distanceMax, setDistanceMax] = useState(filters?.distanceMax ?? '')
    const [timeMin, setTimeMin] = useState(filters?.timeMin ?? '')
    const [timeMax, setTimeMax] = useState(filters?.timeMax ?? '')
    const [regionQuery, setRegionQuery] = useState(filters?.region ?? '')
    const [sortColumn, setSortColumn] = useState(filters?.sort ?? 'distance_km')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(filters?.direction ?? 'asc')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedDistance, setSelectedDistance] = useState<DistanceRecord | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const totalRecords = distances?.total ?? 0
    const currentPage = distances?.current_page ?? 1
    const lastPage = distances?.last_page ?? 1

    const statsCards = useMemo(() => ([
        {
            title: 'Tracked Routes',
            value: numberFormatter.format(totalRecords),
            description: 'Total active distance records',
            icon: <Route className="h-3.5 w-3.5 text-rose-600" />,
            valueClasses: 'text-rose-600',
        },
        {
            title: 'Avg Speed (km/h)',
            value: numberFormatter.format(metrics?.averageSpeed ?? 0),
            description: 'Mean velocity across logged routes',
            icon: <GaugeCircle className="h-3.5 w-3.5 text-indigo-600" />,
            valueClasses: 'text-indigo-600',
        },
        {
            title: 'Road Quality',
            value: numberFormatter.format(metrics?.averageRoadQuality ?? 0),
            description: 'Average infrastructure score',
            icon: <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />,
            valueClasses: 'text-emerald-600',
        },
        {
            title: 'Seasonal Alerts',
            value: numberFormatter.format(metrics?.seasonalConstraintCount ?? 0),
            description: 'Routes flagged with seasonal risks',
            icon: <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />,
            valueClasses: 'text-amber-600',
        },
    ]), [metrics?.averageRoadQuality, metrics?.averageSpeed, metrics?.seasonalConstraintCount, totalRecords])

    const buildParamsObject = useCallback((overrides: Partial<Record<string, string | number | undefined>>) => {
        const params: Record<string, string | number> = {}

        const nextSearch = overrides.search ?? search
        if (nextSearch) params.search = nextSearch

        const nextRouteType = overrides.routeType ?? routeType
        if (nextRouteType && nextRouteType !== 'all') params.routeType = nextRouteType

        const nextTollRoad = overrides.tollRoad ?? tollRoad
        if (nextTollRoad && nextTollRoad !== 'all') params.tollRoad = nextTollRoad

        const nextHeavy = overrides.heavyVehicleRestricted ?? heavyVehicleRestricted
        if (nextHeavy && nextHeavy !== 'all') params.heavyVehicleRestricted = nextHeavy

        const nextDistanceMin = overrides.distanceMin ?? distanceMin
        if (nextDistanceMin) params.distanceMin = nextDistanceMin

        const nextDistanceMax = overrides.distanceMax ?? distanceMax
        if (nextDistanceMax) params.distanceMax = nextDistanceMax

        const nextTimeMin = overrides.timeMin ?? timeMin
        if (nextTimeMin) params.timeMin = nextTimeMin

        const nextTimeMax = overrides.timeMax ?? timeMax
        if (nextTimeMax) params.timeMax = nextTimeMax

        const nextRegion = overrides.region ?? regionQuery
        if (nextRegion) params.region = nextRegion

        const nextSort = overrides.sort ?? sortColumn
        if (nextSort) params.sort = nextSort

        const nextDirection = overrides.direction ?? sortDirection
        if (nextDirection) params.direction = nextDirection

        if (overrides.page) params.page = overrides.page

        return params
    }, [distanceMax, distanceMin, heavyVehicleRestricted, regionQuery, routeType, search, sortColumn, sortDirection, timeMax, timeMin, tollRoad])

    const handleNavigate = useCallback((overrides: Partial<Record<string, string | number | undefined>>) => {
        const params = buildParamsObject(overrides)
        router.get('/distances', params, {
            preserveState: true,
            preserveScroll: true,
            replace: false,
        })
    }, [buildParamsObject])

    const handleSort = (column: ColumnConfig) => {
        if (column.sortable === false) return
        const sortKey = column.sortKey ?? column.key
        const nextDirection: 'asc' | 'desc' = sortColumn === sortKey && sortDirection === 'asc' ? 'desc' : 'asc'
        setSortColumn(sortKey)
        setSortDirection(nextDirection)
        handleNavigate({ sort: sortKey, direction: nextDirection })
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

    const getStatusBadge = (status: string) => {
        if (status === 'active') {
            return (
                <Badge className="w-fit border-emerald-200 bg-emerald-100 text-xs text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-200">
                    Active
                </Badge>
            )
        }

        return (
            <Badge className="w-fit border-slate-200 bg-slate-100 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                Inactive
            </Badge>
        )
    }

    const renderTableCell = (distance: DistanceRecord, column: ColumnKey) => {
        switch (column) {
            case 'route':
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {distance.from_place?.name ?? 'Unknown'}
                            <span className="mx-1 text-xs text-muted-foreground">→</span>
                            {distance.to_place?.name ?? 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {distance.from_place?.woreda?.zone?.region?.name ?? '—'} • {distance.to_place?.woreda?.zone?.region?.name ?? '—'}
                        </span>
                    </div>
                )
            case 'status':
                return getStatusBadge(distance.status)
            case 'distance_km':
                return numberFormatter.format(Number(distance.distance_km ?? 0))
            case 'estimated_time_hours':
                return numberFormatter.format(Number(distance.estimated_time_hours ?? 0))
            case 'route_type':
                return distance.route_type ? (
                    <Badge className="w-fit bg-blue-100 text-xs capitalize text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                        {distance.route_type}
                    </Badge>
                ) : '—'
            case 'average_speed_kmph':
                return distance.average_speed_kmph ? numberFormatter.format(Number(distance.average_speed_kmph)) : '—'
            case 'road_quality_index':
                return distance.road_quality_index ? numberFormatter.format(Number(distance.road_quality_index)) : '—'
            case 'toll_road':
                return distance.toll_road ? 'Yes' : 'No'
            case 'restricted_for_heavy_vehicles':
                return distance.restricted_for_heavy_vehicles ? 'Restricted' : 'Allowed'
            case 'created_at':
                return distance.created_at ? dateFormatter.format(new Date(distance.created_at)) : '—'
            default:
                return null
        }
    }

    const headerActions = hasPermission('distances.create') ? (
        <Button asChild>
            <Link href="/distances/create">
                <Navigation2 className="mr-2 h-4 w-4" />
                Add Distance
            </Link>
        </Button>
    ) : null

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
                        <div className={`text-sm font-semibold sm:text-base ${card.valueClasses}`}>{card.value}</div>
                        <p className="text-[11px] text-muted-foreground">{card.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )

    const tableHeaderExtras = (
        <div className="flex flex-wrap items-center gap-2">
            <Input
                className="w-56"
                placeholder="Search routes or notes"
                value={search}
                onChange={event => {
                    const value = event.target.value
                    setSearch(value)
                    handleNavigate({ search: value, page: 1 })
                }}
            />
            <Select
                value={routeType}
                onValueChange={value => {
                    setRouteType(value)
                    handleNavigate({ routeType: value, page: 1 })
                }}
            >
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Route type" />
                </SelectTrigger>
                <SelectContent>
                    {routeTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select
                value={tollRoad}
                onValueChange={value => {
                    setTollRoad(value)
                    handleNavigate({ tollRoad: value, page: 1 })
                }}
            >
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Toll" />
                </SelectTrigger>
                <SelectContent>
                    {booleanOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select
                value={heavyVehicleRestricted}
                onValueChange={value => {
                    setHeavyVehicleRestricted(value)
                    handleNavigate({ heavyVehicleRestricted: value, page: 1 })
                }}
            >
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Heavy vehicle" />
                </SelectTrigger>
                <SelectContent>
                    {booleanOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input
                className="w-28"
                type="number"
                inputMode="decimal"
                placeholder="Min km"
                value={distanceMin}
                onChange={event => {
                    const value = event.target.value
                    setDistanceMin(value)
                    handleNavigate({ distanceMin: value, page: 1 })
                }}
            />
            <Input
                className="w-28"
                type="number"
                inputMode="decimal"
                placeholder="Max km"
                value={distanceMax}
                onChange={event => {
                    const value = event.target.value
                    setDistanceMax(value)
                    handleNavigate({ distanceMax: value, page: 1 })
                }}
            />
            <Input
                className="w-28"
                type="number"
                inputMode="decimal"
                placeholder="Min hrs"
                value={timeMin}
                onChange={event => {
                    const value = event.target.value
                    setTimeMin(value)
                    handleNavigate({ timeMin: value, page: 1 })
                }}
            />
            <Input
                className="w-28"
                type="number"
                inputMode="decimal"
                placeholder="Max hrs"
                value={timeMax}
                onChange={event => {
                    const value = event.target.value
                    setTimeMax(value)
                    handleNavigate({ timeMax: value, page: 1 })
                }}
            />
            <Input
                className="w-40"
                placeholder="Filter by region"
                value={regionQuery}
                onChange={event => {
                    const value = event.target.value
                    setRegionQuery(value)
                    handleNavigate({ region: value, page: 1 })
                }}
            />
        </div>
    )

    const tableContent = (
        <Table>
            <TableHeader className="[&_tr]:sticky [&_tr]:top-0 [&_tr]:z-20 [&_tr]:bg-background [&_tr]:shadow-sm">
                <TableRow className="border-b bg-background">
                    {columns.map(column => renderHeaderCell(column))}
                    <TableHead className="sticky top-0 z-20 bg-background text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {distances.data.length > 0 ? (
                    distances.data.map(distance => (
                        <TableRow key={distance.id} className="hover:bg-muted/50">
                            {columns.map(column => (
                                <TableCell key={column.key}>{renderTableCell(distance, column.key)}</TableCell>
                            ))}
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {hasPermission('distances.show') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/distances/${distance.id}`}>
                                                <Globe2 className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('distances.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/distances/${distance.id}/edit`}>
                                                <MapPin className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('distances.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                                setSelectedDistance(distance)
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
                            No distances found.
                            {hasPermission('distances.create') && (
                                <Link href="/distances/create" className="ml-1 text-primary underline">
                                    Create one
                                </Link>
                            )}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )

    const handleDeleteConfirm = () => {
        if (!selectedDistance) return

        setIsDeleting(true)
        router.delete(`/distances/${selectedDistance.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: 'Distance deleted',
                    description: 'The route has been removed from the matrix.',
                })
                setDeleteDialogOpen(false)
                setSelectedDistance(null)
            },
            onError: () => {
                toast({
                    title: 'Unable to delete distance',
                    description: 'Please try again or contact support if the issue persists.',
                    variant: 'destructive',
                })
            },
            onFinish: () => setIsDeleting(false),
        })
    }

    return (
        <>
            <ListPageLayout
                headTitle="Distances"
                title="Route Distances"
                description="Monitor corridor readiness, travel times, and seasonal risks across logistics routes."
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Distance Matrix"
                tableDescription="Analyse route performance and infrastructure indicators"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <InertiaPagination
                        from={distances.from}
                        to={distances.to}
                        total={distances.total}
                        links={distances.links}
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
                title="Delete Distance"
                description="Are you sure you want to delete this distance? This action cannot be undone."
                itemName={selectedDistance ? `${selectedDistance.from_place?.name ?? 'Unknown'} → ${selectedDistance.to_place?.name ?? 'Unknown'}` : undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    )
}
