import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ReportMultiSelectFilter } from '@/components/reports/report-multi-select-filter';
import type { ReportSelectionOption } from '@/components/reports/types';
import { type BreadcrumbItem } from '@/types';
import { Truck, Calendar, Search, MessageSquare, Info, Filter, Users, StickyNote, User, Wrench, Tag } from 'lucide-react';
import * as React from 'react';
import { DndContext, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable, closestCorners, DragOverEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Truck Status Board',
        href: '/truck-status-board',
    },
];

const STATUS_COLOR_PALETTE = [
    'from-sky-500 to-sky-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-amber-600',
    'from-indigo-500 to-indigo-600',
    'from-rose-500 to-rose-600',
    'from-fuchsia-500 to-fuchsia-600',
] as const;

const getStatusAccent = (statusId: number): string => {
    const paletteIndex = Math.abs(statusId) % STATUS_COLOR_PALETTE.length;

    return STATUS_COLOR_PALETTE[paletteIndex];
};

interface Driver {
    id: number;
    name: string;
}

interface TruckCard {
    id: number;
    plate: string;
    vehicleType: string;
    equipmentType: string;
    driver: Driver | null;
    status_id: number | null;
    notes: string | null;
    changed_at: string | null;
    changed_by: string | null;
}

interface Status {
    id: number;
    name: string;
    description: string | null;
}

interface TrucksByStatus {
    [key: number]: {
        status: Status;
        trucks: TruckCard[];
    };
}

interface TruckStatusBoardProps {
    trucksByStatus: TrucksByStatus;
    statuses: Status[];
    selectedDate: string;
}

// Truck Card Component (compact)
function TruckCardComponent({ truck, onCommentClick }: { truck: TruckCard; onCommentClick: (truck: TruckCard) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `truck-${truck.id}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const hasNotes = typeof truck.notes === 'string' && truck.notes.trim() !== '';
    const equipmentLabel = truck.equipmentType ?? truck.vehicleType;

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card className={`mb-2 cursor-move border border-slate-200/80 shadow-sm transition-all hover:shadow-md ${
                isDragging ? 'opacity-75 ring-2 ring-blue-400 shadow-lg' : 'bg-white'
            }`}>
                <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                                    <Truck className="h-3.5 w-3.5" />
                                </div>
                                <span className="font-semibold text-sm truncate text-slate-900">{truck.plate}</span>
                                {hasNotes && (
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                                        Notes
                                    </Badge>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                                {equipmentLabel && <span className="truncate">{equipmentLabel}</span>}
                                {truck.vehicleType && truck.vehicleType !== equipmentLabel && (
                                    <span className="truncate text-slate-500">• {truck.vehicleType}</span>
                                )}
                                {truck.driver && (
                                    <span className="flex items-center gap-1 truncate">
                                        <span className="text-slate-400">•</span>
                                        <span>Driver: {truck.driver.name}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={hasNotes ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className={`h-7 w-7 rounded-full p-0 ${hasNotes ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCommentClick(truck);
                                    }}
                                >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs font-medium">
                                {hasNotes ? 'View or update notes' : 'Add a quick note'}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                        {truck.changed_at && (
                            <span className="flex items-center gap-1">
                                ⏰
                                {new Date(truck.changed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        {truck.changed_by && (
                            <span className="truncate">By {truck.changed_by}</span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Status Column Component
function StatusColumn({
    status,
    trucks,
    onCommentClick,
    highlight,
    accent,
    isFiltered,
}: {
    status: Status;
    trucks: TruckCard[];
    onCommentClick: (truck: TruckCard) => void;
    highlight: boolean;
    accent: string;
    isFiltered: boolean;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: `status-${status.id}`,
        data: { statusId: status.id },
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex w-80 flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur transition-all ${
                isOver || highlight ? 'ring-2 ring-offset-2 ring-blue-400' : 'shadow-sm'
            }`}
        >
            <div className={`sticky top-0 z-10 -mx-0.5 -mt-0.5 rounded-t-2xl bg-gradient-to-r ${accent} px-4 pb-4 pt-5 text-white shadow-sm`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col">
                        <h3 className="text-base font-semibold leading-tight drop-shadow-sm">{status.name}</h3>
                        {status.description && (
                            <p className="mt-1 text-xs text-white/80 line-clamp-2">
                                {status.description}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                            {trucks.length}
                        </Badge>
                        {status.description && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        className="rounded-full border border-white/40 bg-white/20 p-1 text-white/80 transition hover:bg-white/30"
                                    >
                                        <Info className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs text-xs">
                                    {status.description}
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                <div className="h-2" />
                <SortableContext items={trucks.map(t => `truck-${t.id}`)} strategy={verticalListSortingStrategy}>
                    {trucks.length > 0 ? (
                        trucks.map((truck) => (
                            <TruckCardComponent key={truck.id} truck={truck} onCommentClick={onCommentClick} />
                        ))
                    ) : (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 py-10 text-center text-sm text-slate-400">
                            {isFiltered ? 'No trucks match the current filters' : 'Drop trucks here'}
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
}

export default function TruckStatusBoard({ trucksByStatus, statuses, selectedDate }: TruckStatusBoardProps) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [, setActiveId] = React.useState<string | null>(null);
    const [overStatusId, setOverStatusId] = React.useState<number | null>(null);
    const [selectedTruck, setSelectedTruck] = React.useState<TruckCard | null>(null);
    const [commentText, setCommentText] = React.useState('');
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [selectedDrivers, setSelectedDrivers] = React.useState<string[]>([]);
    const [selectedEquipment, setSelectedEquipment] = React.useState<string[]>([]);
    const [selectedPlates, setSelectedPlates] = React.useState<string[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const { driverValues, equipmentValues, plateValues } = React.useMemo(() => {
        const driverSet = new Set<string>();
        const equipmentSet = new Set<string>();
        const plateSet = new Set<string>();

        Object.values(trucksByStatus).forEach((statusData) => {
            statusData.trucks.forEach((truck) => {
                const driverName = truck.driver?.name?.trim();
                if (driverName) {
                    driverSet.add(driverName);
                }

                const equipmentName = (truck.equipmentType ?? truck.vehicleType ?? '').trim();
                if (equipmentName !== '') {
                    equipmentSet.add(equipmentName);
                }

                const plate = truck.plate.trim();
                if (plate !== '') {
                    plateSet.add(plate);
                }
            });
        });

        const toValues = (values: Set<string>): string[] =>
            Array.from(values).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

        return {
            driverValues: toValues(driverSet),
            equipmentValues: toValues(equipmentSet),
            plateValues: toValues(plateSet),
        };
    }, [trucksByStatus]);

    const driverFilterOptions = React.useMemo<ReportSelectionOption[]>(
        () => driverValues.map((value) => ({ id: value, label: value })),
        [driverValues],
    );

    const equipmentFilterOptions = React.useMemo<ReportSelectionOption[]>(
        () => equipmentValues.map((value) => ({ id: value, label: value })),
        [equipmentValues],
    );

    const plateFilterOptions = React.useMemo<ReportSelectionOption[]>(
        () => plateValues.map((value) => ({ id: value, label: value })),
        [plateValues],
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setOverStatusId(null);

        if (!over) return;

        // Resolve active truck id from sortable id format truck-<id>
        const activeIdStr = String(active.id);
        const truckId = activeIdStr.startsWith('truck-') ? parseInt(activeIdStr.replace('truck-', '')) : parseInt(activeIdStr);
        // Support droppable id format: status-<id>
        const overId = String(over.id);
        let newStatusId = 0;
        if (overId.startsWith('status-')) {
            newStatusId = parseInt(overId.replace('status-', ''));
        } else if (overId.startsWith('truck-')) {
            const overTruckId = parseInt(overId.replace('truck-', ''));
            // Find which status column currently contains the truck being hovered
            for (const statusData of Object.values(trucksByStatus)) {
                if (statusData.trucks.some(t => t.id === overTruckId)) {
                    newStatusId = statusData.status.id;
                    break;
                }
            }
        } else {
            // Fallback if ids are numeric (legacy case)
            newStatusId = parseInt(overId);
        }

        // Find the truck
        let truck: TruckCard | null = null;
        let currentStatusId: number | null = null;

        for (const statusData of Object.values(trucksByStatus)) {
            const foundTruck = statusData.trucks.find(t => t.id === truckId);
            if (foundTruck) {
                truck = foundTruck;
                currentStatusId = statusData.status.id;
                break;
            }
        }

        if (!truck || currentStatusId === newStatusId) return;

        // Update truck status
        router.post('/truck-status-board', {
            truck_id: truckId,
            status_id: newStatusId,
            status_date: selectedDate,
        }, {
            preserveState: false,
            preserveScroll: true,
        });
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        if (!over) {
            setOverStatusId(null);
            return;
        }
        const overId = String(over.id);
        if (overId.startsWith('status-')) {
            setOverStatusId(parseInt(overId.replace('status-', '')));
            return;
        }
        if (overId.startsWith('truck-')) {
            const overTruckId = parseInt(overId.replace('truck-', ''));
            for (const statusData of Object.values(trucksByStatus)) {
                if (statusData.trucks.some(t => t.id === overTruckId)) {
                    setOverStatusId(statusData.status.id);
                    return;
                }
            }
        }
        setOverStatusId(null);
    };

    const handleCommentClick = (truck: TruckCard) => {
        setSelectedTruck(truck);
        setCommentText(truck.notes || '');
        setIsDialogOpen(true);
    };

    const handleSaveComment = () => {
        if (!selectedTruck) return;

        router.post('/truck-status-board', {
            truck_id: selectedTruck.id,
            status_id: selectedTruck.status_id,
            status_date: selectedDate,
            notes: commentText,
        }, {
            preserveState: false,
            preserveScroll: true,
            onSuccess: () => {
                setIsDialogOpen(false);
                setSelectedTruck(null);
                setCommentText('');
            },
        });
    };

    // Filter trucks based on search and quick filters
    const filteredTrucksByStatus = React.useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const filtered: TrucksByStatus = {};

        Object.values(trucksByStatus).forEach((statusData) => {
            const filteredTrucks = statusData.trucks.filter((truck) => {
                const plate = truck.plate.trim();
                const vehicleType = truck.vehicleType?.trim() ?? '';
                const equipmentName = (truck.equipmentType ?? truck.vehicleType ?? '').trim();
                const driverName = truck.driver?.name?.trim() ?? '';
                const notes = truck.notes ?? '';

                const matchesSearch =
                    normalizedSearch === '' ||
                    plate.toLowerCase().includes(normalizedSearch) ||
                    vehicleType.toLowerCase().includes(normalizedSearch) ||
                    driverName.toLowerCase().includes(normalizedSearch) ||
                    equipmentName.toLowerCase().includes(normalizedSearch) ||
                    notes.toLowerCase().includes(normalizedSearch);

                const matchesDriver =
                    selectedDrivers.length === 0 ||
                    (driverName !== '' && selectedDrivers.includes(driverName));

                const matchesEquipment =
                    selectedEquipment.length === 0 ||
                    (equipmentName !== '' && selectedEquipment.includes(equipmentName));

                const matchesPlate =
                    selectedPlates.length === 0 ||
                    selectedPlates.includes(plate);

                return matchesSearch && matchesDriver && matchesEquipment && matchesPlate;
            });

            filtered[statusData.status.id] = {
                status: statusData.status,
                trucks: filteredTrucks,
            };
        });

        return filtered;
    }, [searchTerm, selectedDrivers, selectedEquipment, selectedPlates, trucksByStatus]);

    // Calculate total trucks
    const totalTrucks = Object.values(trucksByStatus).reduce((sum, statusData) => sum + statusData.trucks.length, 0);

    // Calculate trucks with drivers
    const trucksWithDrivers = Object.values(trucksByStatus).reduce(
        (sum, statusData) => sum + statusData.trucks.filter((t) => t.driver).length,
        0,
    );

    // Calculate trucks with notes
    const trucksWithNotes = Object.values(trucksByStatus).reduce(
        (sum, statusData) => sum + statusData.trucks.filter((t) => t.notes).length,
        0,
    );

    const hasActiveFilters =
        searchTerm.trim() !== '' ||
        selectedDrivers.length > 0 ||
        selectedEquipment.length > 0 ||
        selectedPlates.length > 0;
    const hasFilteredResults = React.useMemo(
        () => Object.values(filteredTrucksByStatus).some((statusData) => statusData.trucks.length > 0),
        [filteredTrucksByStatus],
    );

    const summaryStats = React.useMemo(
        () => [
            {
                id: 'total-trucks',
                label: 'Total Trucks',
                value: totalTrucks.toLocaleString(),
                description: 'Tracked today',
                icon: <Truck className="h-4 w-4 text-blue-500" />,
            },
            {
                id: 'assigned-drivers',
                label: 'With Drivers',
                value: trucksWithDrivers.toLocaleString(),
                description: 'Assigned operators',
                icon: <Users className="h-4 w-4 text-emerald-500" />,
            },
            {
                id: 'notes-present',
                label: 'With Notes',
                value: trucksWithNotes.toLocaleString(),
                description: 'Awaiting review',
                icon: <StickyNote className="h-4 w-4 text-amber-500" />,
            },
        ],
        [totalTrucks, trucksWithDrivers, trucksWithNotes],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Truck Status Board" />

            <TooltipProvider delayDuration={150}>
                <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Truck Status Board</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage daily truck operational status - {totalTrucks} truck{totalTrucks !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-gray-600" />
                            <DatePicker
                                className="w-40 h-10 justify-start text-left"
                                value={selectedDate}
                                onChange={(next) => {
                                    router.get('/truck-status-board', { date: next ?? '' });
                                }}
                            />
                        </div>
                    </div>
                </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {summaryStats.map((stat) => (
                            <Card key={stat.id} className="border-none bg-gradient-to-br from-slate-50 to-white shadow-sm">
                                <CardContent className="flex items-center gap-4 p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-inner">
                                        {stat.icon}
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                        <p className="text-lg font-semibold text-slate-900">{stat.value}</p>
                                        <p className="text-xs text-slate-400">{stat.description}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                {/* Search Bar */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[220px] max-w-md">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search trucks by plate, type, or driver..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            <Filter className="h-3.5 w-3.5" /> Filters
                        </div>
                        <div className="flex w-full flex-wrap gap-3 md:w-auto">
                            <div className="min-w-[220px] flex-1 md:flex-none md:max-w-xs">
                                <ReportMultiSelectFilter
                                    label="Drivers"
                                    icon={User}
                                    triggerLabelWhenAll="All drivers"
                                    summaryLabelWhenAll="All drivers shown"
                                    heading="Drivers"
                                    searchPlaceholder="Search driver..."
                                    emptyMessage="No drivers found."
                                    options={driverFilterOptions}
                                    selectedIds={selectedDrivers}
                                    onChange={(ids) => setSelectedDrivers(ids.map((value) => String(value)))}
                                />
                            </div>
                            <div className="min-w-[220px] flex-1 md:flex-none md:max-w-xs">
                                <ReportMultiSelectFilter
                                    label="Equipment"
                                    icon={Wrench}
                                    triggerLabelWhenAll="All equipment"
                                    summaryLabelWhenAll="All equipment shown"
                                    heading="Equipment"
                                    searchPlaceholder="Search equipment..."
                                    emptyMessage="No equipment found."
                                    options={equipmentFilterOptions}
                                    selectedIds={selectedEquipment}
                                    onChange={(ids) => setSelectedEquipment(ids.map((value) => String(value)))}
                                />
                            </div>
                            <div className="min-w-[220px] flex-1 md:flex-none md:max-w-xs">
                                <ReportMultiSelectFilter
                                    label="Plates"
                                    icon={Tag}
                                    triggerLabelWhenAll="All plates"
                                    summaryLabelWhenAll="All plates shown"
                                    heading="Plates"
                                    searchPlaceholder="Search plate..."
                                    emptyMessage="No plates found."
                                    options={plateFilterOptions}
                                    selectedIds={selectedPlates}
                                    onChange={(ids) => setSelectedPlates(ids.map((value) => String(value)))}
                                />
                            </div>
                        </div>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedDrivers([]);
                                    setSelectedEquipment([]);
                                    setSelectedPlates([]);
                                }}
                            >
                                Clear filters
                            </Button>
                        )}
                    </div>

                {/* Kanban Board - Full Height Scrollable */}
                <Card className="flex flex-1 flex-col overflow-hidden">
                    <CardHeader>
                        <CardTitle>Status Overview</CardTitle>
                        <CardDescription>
                            Drag and drop trucks between columns to update their status
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 flex flex-col overflow-hidden">
                        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver} autoScroll collisionDetection={closestCorners}>
                            <div className="flex gap-4 overflow-x-auto flex-1 pb-4">
                                    {statuses.map((status) => {
                                        const statusData = filteredTrucksByStatus[status.id] ?? {
                                            status,
                                            trucks: [],
                                        };

                                        return (
                                            <StatusColumn
                                                key={status.id}
                                                status={statusData.status}
                                                trucks={statusData.trucks}
                                                onCommentClick={handleCommentClick}
                                                highlight={overStatusId === status.id}
                                                accent={getStatusAccent(status.id)}
                                                isFiltered={hasActiveFilters}
                                            />
                                        );
                                    })}
                            </div>
                        </DndContext>
                            {!hasFilteredResults && hasActiveFilters && (
                                <div className="mt-4 flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-sm text-slate-500">
                                    No trucks found for the current filters.
                                </div>
                            )}
                    </CardContent>
                </Card>
                </div>
            </TooltipProvider>

            {/* Comment Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Comment for {selectedTruck?.plate}</DialogTitle>
                        <DialogDescription>
                            Add notes or comments about this truck's status
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Enter your comment here..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveComment}>
                            Save Comment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
