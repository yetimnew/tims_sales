import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
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
import { Truck, Search, MessageSquare, Info, Filter, User, Wrench, Tag } from 'lucide-react';
import * as React from 'react';
import { DndContext, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable, closestCorners, DragOverEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

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
    id: number | null;
    name: string;
    legacy_id?: string | null;
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

interface PendingMove {
    fromStatusId: number;
    fromIndex: number;
    originalTruck: TruckCard;
    outstandingStatusId: number;
    inFlightStatusId: number | null;
}

interface StatusUpdateResponse {
    truck_id: number;
    status_id: number | null;
    notes: string | null;
    changed_at: string | null;
    changed_by: string | null;
}

const resolveCsrfToken = (): string | undefined => {
    if (typeof document === 'undefined') {
        return undefined;
    }

    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;

    return meta?.content;
};

const cloneBoardData = (source: TrucksByStatus): TrucksByStatus => {
    const clone: TrucksByStatus = {};

    Object.entries(source).forEach(([key, value]) => {
        clone[Number(key)] = {
            status: value.status,
            trucks: value.trucks.map((truck) => ({
                ...truck,
                driver: truck.driver ? { ...truck.driver } : null,
            })),
        };
    });

    return clone;
};

// Truck Card Component (compact)
function TruckCardComponent({
    truck,
    onCommentClick,
    onViewDetails,
    isSyncing = false,
}: {
    truck: TruckCard;
    onCommentClick: (truck: TruckCard) => void;
    onViewDetails: (truck: TruckCard) => void;
    isSyncing?: boolean;
}) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language || 'en-US';
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
            <Card
                role="button"
                tabIndex={0}
                onClick={() => {
                    if (!isDragging) {
                        onViewDetails(truck);
                    }
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onViewDetails(truck);
                    }
                }}
                className={`mb-2 cursor-move border border-slate-200/80 shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
                    isDragging ? 'opacity-75 ring-2 ring-blue-400 shadow-lg' : 'bg-white'
                }`}
            >
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
                                        {t('truckStatusBoard.card.notes')}
                                    </Badge>
                                )}
                                {isSyncing && (
                                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-600 text-[10px] uppercase tracking-wide">
                                        {t('truckStatusBoard.card.syncing')}
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
                                        <span>{t('truckStatusBoard.card.driver', { name: truck.driver.name })}</span>
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
                                {hasNotes ? t('truckStatusBoard.card.notesTooltipUpdate') : t('truckStatusBoard.card.notesTooltipAdd')}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                        {truck.changed_at && (
                            <span className="flex items-center gap-1">
                                ⏰
                                {new Date(truck.changed_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        {truck.changed_by && (
                            <span className="truncate">{t('truckStatusBoard.card.changedBy', { name: truck.changed_by })}</span>
                        )}
                        <Link
                            href={`/truck-status-board/trucks/${truck.id}`}
                            className="ml-auto text-xs font-medium text-blue-600 hover:text-blue-700"
                            onClick={(event) => {
                                event.stopPropagation();
                            }}
                            onKeyDown={(event) => {
                                event.stopPropagation();
                            }}
                        >
                            {t('truckStatusBoard.card.viewDetails')}
                        </Link>
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
    onViewDetails,
    highlight,
    accent,
    isFiltered,
    pendingTruckIds,
}: {
    status: Status;
    trucks: TruckCard[];
    onCommentClick: (truck: TruckCard) => void;
    onViewDetails: (truck: TruckCard) => void;
    highlight: boolean;
    accent: string;
    isFiltered: boolean;
    pendingTruckIds: Set<number>;
}) {
    const { t } = useTranslation();
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
                            <TruckCardComponent
                                key={truck.id}
                                truck={truck}
                                onCommentClick={onCommentClick}
                                onViewDetails={onViewDetails}
                                isSyncing={pendingTruckIds.has(truck.id)}
                            />
                        ))
                    ) : (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 py-10 text-center text-sm text-slate-400">
                            {isFiltered ? t('truckStatusBoard.column.noMatches') : t('truckStatusBoard.column.dropHere')}
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
}

export default function TruckStatusBoard({ trucksByStatus, statuses, selectedDate }: TruckStatusBoardProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [, setActiveId] = React.useState<string | null>(null);
    const [overStatusId, setOverStatusId] = React.useState<number | null>(null);
    const [selectedTruck, setSelectedTruck] = React.useState<TruckCard | null>(null);
    const [commentText, setCommentText] = React.useState('');
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [selectedDrivers, setSelectedDrivers] = React.useState<string[]>([]);
    const [selectedEquipment, setSelectedEquipment] = React.useState<string[]>([]);
    const [selectedPlates, setSelectedPlates] = React.useState<string[]>([]);
    const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);
    const [boardData, setBoardData] = React.useState<TrucksByStatus>(() => cloneBoardData(trucksByStatus));
    const [pendingTruckIds, setPendingTruckIds] = React.useState<Set<number>>(new Set());
    const pendingMovesRef = React.useRef(new Map<number, PendingMove>());
    const csrfToken = React.useMemo(() => resolveCsrfToken(), []);

    React.useEffect(() => {
        setBoardData(cloneBoardData(trucksByStatus));
        setPendingTruckIds(() => new Set());
        pendingMovesRef.current.clear();
    }, [trucksByStatus]);

    const submitStatusUpdate = React.useCallback(async (truckId: number, statusId: number): Promise<StatusUpdateResponse> => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        };

        if (csrfToken) {
            headers['X-CSRF-TOKEN'] = csrfToken;
        }

        const response = await fetch('/truck-status-board', {
            method: 'POST',
            credentials: 'same-origin',
            headers,
            body: JSON.stringify({
                truck_id: truckId,
                status_id: statusId,
                status_date: selectedDate,
            }),
        });

        if (response.ok) {
            return response.json() as Promise<StatusUpdateResponse>;
        }

        let message = 'Failed to update truck status.';

        try {
            const errorBody = (await response.json()) as { message?: string };
            if (typeof errorBody.message === 'string' && errorBody.message.trim() !== '') {
                message = errorBody.message;
            }
        } catch {
            // ignore malformed payloads
        }

        throw new Error(message);
    }, [csrfToken, selectedDate]);

    const processPendingMove = React.useCallback((truckId: number) => {
        const pendingMove = pendingMovesRef.current.get(truckId);

        if (!pendingMove) {
            return;
        }

        if (pendingMove.inFlightStatusId !== null) {
            return;
        }

        const statusToSync = pendingMove.outstandingStatusId;
        pendingMove.inFlightStatusId = statusToSync;

        setPendingTruckIds((current) => {
            if (current.has(truckId)) {
                return current;
            }

            const next = new Set(current);
            next.add(truckId);
            return next;
        });

        (async () => {
            try {
                const payload = await submitStatusUpdate(truckId, statusToSync);

                const activeMove = pendingMovesRef.current.get(truckId);
                if (!activeMove) {
                    return;
                }

                setBoardData((current) => {
                    const next = cloneBoardData(current);

                    let updatedIndex = -1;

                    const resolvedStatusId = payload.status_id ?? statusToSync;
                    const destination = next[resolvedStatusId];

                    if (destination) {
                        const locatedIndex = destination.trucks.findIndex((entry) => entry.id === truckId);

                        if (locatedIndex !== -1) {
                            destination.trucks[locatedIndex] = {
                                ...destination.trucks[locatedIndex],
                                status_id: resolvedStatusId,
                                notes: payload.notes,
                                changed_at: payload.changed_at,
                                changed_by: payload.changed_by ?? destination.trucks[locatedIndex].changed_by,
                            };

                            updatedIndex = locatedIndex;
                        }
                    }

                    if (updatedIndex !== -1 && destination) {
                        const snapshot = destination.trucks[updatedIndex];

                        activeMove.originalTruck = {
                            ...snapshot,
                            driver: snapshot.driver ? { ...snapshot.driver } : null,
                        };
                        activeMove.fromStatusId = resolvedStatusId;
                        activeMove.fromIndex = updatedIndex;
                    }

                    return next;
                });

                const refreshedMove = pendingMovesRef.current.get(truckId);

                if (!refreshedMove) {
                    return;
                }

                if (refreshedMove.outstandingStatusId !== statusToSync) {
                    refreshedMove.inFlightStatusId = null;
                    processPendingMove(truckId);
                    return;
                }

                pendingMovesRef.current.delete(truckId);
            } catch (error) {
                const failedMove = pendingMovesRef.current.get(truckId);

                if (failedMove) {
                    setBoardData((current) => {
                        const next = cloneBoardData(current);

                        for (const column of Object.values(next)) {
                            const index = column.trucks.findIndex((entry) => entry.id === truckId);
                            if (index !== -1) {
                                column.trucks.splice(index, 1);
                                break;
                            }
                        }

                        const sourceColumn = next[failedMove.fromStatusId];

                        if (sourceColumn) {
                            sourceColumn.trucks.splice(failedMove.fromIndex, 0, {
                                ...failedMove.originalTruck,
                                driver: failedMove.originalTruck.driver ? { ...failedMove.originalTruck.driver } : null,
                            });
                        }

                        return next;
                    });

                    pendingMovesRef.current.delete(truckId);
                }

                toast({
                    title: t('truckStatusBoard.toast.updateFailedTitle'),
                    description: error instanceof Error ? error.message : t('truckStatusBoard.toast.updateFailedDescription'),
                    variant: 'destructive',
                });
            } finally {
                if (!pendingMovesRef.current.has(truckId)) {
                    setPendingTruckIds((current) => {
                        if (!current.has(truckId)) {
                            return current;
                        }

                        const next = new Set(current);
                        next.delete(truckId);
                        return next;
                    });
                }
            }
        })();
    }, [submitStatusUpdate, toast]);

    const clearFilterSelections = React.useCallback(() => {
        setSelectedDrivers([]);
        setSelectedEquipment([]);
        setSelectedPlates([]);
    }, []);

    const handleClearFilters = React.useCallback(() => {
        setSearchTerm('');
        clearFilterSelections();
    }, [clearFilterSelections]);

    const handleViewTruck = React.useCallback((truck: TruckCard) => {
        router.visit(`/truck-status-board/trucks/${truck.id}`);
    }, []);

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

        Object.values(boardData).forEach((statusData) => {
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
    }, [boardData]);

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

        const activeIdStr = String(active.id);
        const truckId = activeIdStr.startsWith('truck-') ? parseInt(activeIdStr.replace('truck-', '')) : parseInt(activeIdStr);

        const overId = String(over.id);
        let newStatusId = 0;
        let overTruckId: number | null = null;

        if (overId.startsWith('status-')) {
            newStatusId = parseInt(overId.replace('status-', ''));
        } else if (overId.startsWith('truck-')) {
            overTruckId = parseInt(overId.replace('truck-', ''));

            for (const statusData of Object.values(boardData)) {
                if (statusData.trucks.some((entry) => entry.id === overTruckId)) {
                    newStatusId = statusData.status.id;
                    break;
                }
            }
        } else {
            newStatusId = parseInt(overId);
        }

        if (!Number.isFinite(newStatusId) || !boardData[newStatusId]) {
            return;
        }

        let truck: TruckCard | null = null;
        let currentStatusId: number | null = null;
        let fromIndex = -1;

        for (const statusData of Object.values(boardData)) {
            const locatedIndex = statusData.trucks.findIndex((entry) => entry.id === truckId);

            if (locatedIndex !== -1) {
                truck = statusData.trucks[locatedIndex];
                currentStatusId = statusData.status.id;
                fromIndex = locatedIndex;
                break;
            }
        }

        if (!truck || currentStatusId === newStatusId) return;

        setBoardData((current) => {
            const next = cloneBoardData(current);

            const sourceColumn = next[currentStatusId!];
            const destinationColumn = next[newStatusId];

            if (!sourceColumn || !destinationColumn) {
                return current;
            }

            const sourceIndex = sourceColumn.trucks.findIndex((entry) => entry.id === truckId);
            if (sourceIndex === -1) {
                return current;
            }

            const [movedTruck] = sourceColumn.trucks.splice(sourceIndex, 1);
            const updatedTruck: TruckCard = {
                ...movedTruck,
                status_id: newStatusId,
            };

            let insertIndex = 0;
            if (overTruckId !== null && overTruckId !== truckId) {
                const targetIndex = destinationColumn.trucks.findIndex((entry) => entry.id === overTruckId);
                insertIndex = targetIndex === -1 ? 0 : targetIndex;
            }

            destinationColumn.trucks.splice(insertIndex, 0, updatedTruck);

            return next;
        });

        const existingMove = pendingMovesRef.current.get(truckId);

        if (existingMove) {
            existingMove.outstandingStatusId = newStatusId;
        } else {
            const originalTruck: TruckCard = {
                ...truck,
                driver: truck.driver ? { ...truck.driver } : null,
            };

            pendingMovesRef.current.set(truckId, {
                fromStatusId: currentStatusId!,
                fromIndex,
                originalTruck,
                outstandingStatusId: newStatusId,
                inFlightStatusId: null,
            });
        }

        processPendingMove(truckId);
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
            for (const statusData of Object.values(boardData)) {
                if (statusData.trucks.some((entry) => entry.id === overTruckId)) {
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

        Object.values(boardData).forEach((statusData) => {
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
    }, [searchTerm, selectedDrivers, selectedEquipment, selectedPlates, boardData]);

    // Calculate total trucks
    const totalTrucks = Object.values(boardData).reduce((sum, statusData) => sum + statusData.trucks.length, 0);

    const appliedFilterCount = React.useMemo(() => {
        let count = 0;

        if (selectedDrivers.length > 0) count += 1;
        if (selectedEquipment.length > 0) count += 1;
        if (selectedPlates.length > 0) count += 1;

        return count;
    }, [selectedDrivers, selectedEquipment, selectedPlates]);

    const hasActiveFilters = searchTerm.trim() !== '' || appliedFilterCount > 0;
    const hasFilteredResults = React.useMemo(
        () => Object.values(filteredTrucksByStatus).some((statusData) => statusData.trucks.length > 0),
        [filteredTrucksByStatus],
    );

    const breadcrumbs = React.useMemo<BreadcrumbItem[]>(
        () => [
            {
                title: t('truckStatusBoard.title'),
                href: '/truck-status-board',
            },
        ],
        [t],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('truckStatusBoard.title')} />

            <TooltipProvider delayDuration={150}>
                <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="min-w-[220px] flex-1 md:flex-none">
                        <h1 className="text-3xl font-bold">{t('truckStatusBoard.title')}</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {t('truckStatusBoard.header.description', {
                                count: totalTrucks,
                                suffix: totalTrucks !== 1 ? 's' : '',
                            })}
                        </p>
                    </div>
                    <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
                        <div className="flex items-center gap-2">
                            <DatePicker
                                className="h-10 w-40 justify-start text-left"
                                value={selectedDate}
                                showClearButton={false}
                                onChange={(next) => {
                                    router.get('/truck-status-board', { date: next ?? '' });
                                }}
                            />
                        </div>
                        <div className="relative flex-1 min-w-[220px] max-w-lg">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                            <Input
                                type="text"
                                placeholder={t('truckStatusBoard.filters.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={() => setIsFiltersOpen(true)}
                        >
                            <Filter className="h-4 w-4" />
                            {t('truckStatusBoard.filters.button')}
                            {appliedFilterCount > 0 ? (
                                <Badge variant="secondary" className="ml-1 h-5 min-w-[1.75rem] justify-center px-1 text-xs">
                                    {appliedFilterCount}
                                </Badge>
                            ) : null}
                        </Button>
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearFilters}
                            >
                                {t('truckStatusBoard.filters.clear')}
                            </Button>
                        )}
                    </div>
                </div>

                    <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader className="text-left">
                                <DialogTitle>{t('truckStatusBoard.filters.dialogTitle')}</DialogTitle>
                                <DialogDescription>
                                    {t('truckStatusBoard.filters.dialogDescription')}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4">
                                <ReportMultiSelectFilter
                                    label={t('truckStatusBoard.filters.drivers.label')}
                                    icon={User}
                                    triggerLabelWhenAll={t('truckStatusBoard.filters.drivers.triggerAll')}
                                    summaryLabelWhenAll={t('truckStatusBoard.filters.drivers.summaryAll')}
                                    heading={t('truckStatusBoard.filters.drivers.heading')}
                                    searchPlaceholder={t('truckStatusBoard.filters.drivers.searchPlaceholder')}
                                    emptyMessage={t('truckStatusBoard.filters.drivers.empty')}
                                    options={driverFilterOptions}
                                    selectedIds={selectedDrivers}
                                    onChange={(ids) => setSelectedDrivers(ids.map((value) => String(value)))}
                                />
                                <ReportMultiSelectFilter
                                    label={t('truckStatusBoard.filters.equipment.label')}
                                    icon={Wrench}
                                    triggerLabelWhenAll={t('truckStatusBoard.filters.equipment.triggerAll')}
                                    summaryLabelWhenAll={t('truckStatusBoard.filters.equipment.summaryAll')}
                                    heading={t('truckStatusBoard.filters.equipment.heading')}
                                    searchPlaceholder={t('truckStatusBoard.filters.equipment.searchPlaceholder')}
                                    emptyMessage={t('truckStatusBoard.filters.equipment.empty')}
                                    options={equipmentFilterOptions}
                                    selectedIds={selectedEquipment}
                                    onChange={(ids) => setSelectedEquipment(ids.map((value) => String(value)))}
                                />
                                <ReportMultiSelectFilter
                                    label={t('truckStatusBoard.filters.plates.label')}
                                    icon={Tag}
                                    triggerLabelWhenAll={t('truckStatusBoard.filters.plates.triggerAll')}
                                    summaryLabelWhenAll={t('truckStatusBoard.filters.plates.summaryAll')}
                                    heading={t('truckStatusBoard.filters.plates.heading')}
                                    searchPlaceholder={t('truckStatusBoard.filters.plates.searchPlaceholder')}
                                    emptyMessage={t('truckStatusBoard.filters.plates.empty')}
                                    options={plateFilterOptions}
                                    selectedIds={selectedPlates}
                                    onChange={(ids) => setSelectedPlates(ids.map((value) => String(value)))}
                                />
                            </div>
                            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <Button type="button" variant="ghost" onClick={clearFilterSelections}>
                                    {t('truckStatusBoard.filters.clearSelections')}
                                </Button>
                                <Button type="button" onClick={() => setIsFiltersOpen(false)}>
                                    {t('truckStatusBoard.filters.close')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                {/* Kanban Board - Full Height Scrollable */}
                <Card className="flex flex-1 flex-col overflow-hidden">
                    <CardHeader>
                        <CardTitle>{t('truckStatusBoard.board.title')}</CardTitle>
                        <CardDescription>
                            {t('truckStatusBoard.board.description')}
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
                                                onViewDetails={handleViewTruck}
                                                highlight={overStatusId === status.id}
                                                accent={getStatusAccent(status.id)}
                                                isFiltered={hasActiveFilters}
                                                pendingTruckIds={pendingTruckIds}
                                            />
                                        );
                                    })}
                            </div>
                        </DndContext>
                            {!hasFilteredResults && hasActiveFilters && (
                                <div className="mt-4 flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-sm text-slate-500">
                                    {t('truckStatusBoard.board.noResults')}
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
                        <DialogTitle>{t('truckStatusBoard.comment.title', { plate: selectedTruck?.plate ?? '' })}</DialogTitle>
                        <DialogDescription>
                            {t('truckStatusBoard.comment.description')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder={t('truckStatusBoard.comment.placeholder')}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            {t('truckStatusBoard.comment.cancel')}
                        </Button>
                        <Button onClick={handleSaveComment}>
                            {t('truckStatusBoard.comment.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
