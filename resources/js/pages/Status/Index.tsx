import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type BreadcrumbItem } from '@/types';
import { Truck, Calendar, Search, MessageSquare } from 'lucide-react';
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
    description: string;
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

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card className={`mb-1 cursor-move hover:shadow-sm transition-all border-l-2 ${
                isDragging ? 'opacity-50 shadow-lg' : 'border-l-blue-500'
            }`}>
                <CardContent className="p-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <Truck className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                            <span className="font-semibold text-xs truncate">{truck.plate}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onCommentClick(truck);
                            }}
                        >
                            <MessageSquare className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
                        <span className="truncate">{truck.vehicleType}</span>
                        {truck.driver && <span className="truncate ml-2">👤 {truck.driver.name}</span>}
                    </div>
                    {truck.changed_at && (
                        <div className="text-[10px] text-gray-400 mt-0.5">
                            ⏰ {new Date(truck.changed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Status Column Component
function StatusColumn({ status, trucks, onCommentClick, highlight }: { status: Status; trucks: TruckCard[]; onCommentClick: (truck: TruckCard) => void; highlight: boolean }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `status-${status.id}`,
        data: { statusId: status.id },
    });

    return (
        <div
            ref={setNodeRef}
            className={`flex-shrink-0 w-72 bg-gray-50 rounded-lg p-3 border-2 transition-colors ${
                (isOver || highlight) ? 'border-blue-500 bg-blue-50' : 'border-transparent'
            }`}
        >
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{status.name}</h3>
                <Badge variant="secondary" className="bg-blue-500 text-white">{trucks.length}</Badge>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                {/* Include a hidden anchor at top so dropping at header still works */}
                <div className="h-1" />
                <SortableContext items={trucks.map(t => `truck-${t.id}`)} strategy={verticalListSortingStrategy}>
                    {trucks.length > 0 ? (
                        trucks.map((truck) => (
                            <TruckCardComponent key={truck.id} truck={truck} onCommentClick={onCommentClick} />
                        ))
                    ) : (
                        <div className="text-center text-gray-400 py-8 text-sm">
                            Drop trucks here
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
}

export default function TruckStatusBoard({ trucksByStatus, statuses, selectedDate }: TruckStatusBoardProps) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [activeId, setActiveId] = React.useState<string | null>(null);
    const [overStatusId, setOverStatusId] = React.useState<number | null>(null);
    const [selectedTruck, setSelectedTruck] = React.useState<TruckCard | null>(null);
    const [commentText, setCommentText] = React.useState('');
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
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

    // Filter trucks based on search
    const filteredTrucksByStatus = React.useMemo(() => {
        if (!searchTerm) return trucksByStatus;

        const filtered: TrucksByStatus = {};
        Object.keys(trucksByStatus).forEach(key => {
            const statusData = trucksByStatus[parseInt(key)];
            const filteredTrucks = statusData.trucks.filter(truck =>
                truck.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                truck.vehicleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                truck.driver?.name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (filteredTrucks.length > 0) {
                filtered[parseInt(key)] = {
                    status: statusData.status,
                    trucks: filteredTrucks,
                };
            }
        });
        return filtered;
    }, [trucksByStatus, searchTerm]);

    // Calculate total trucks
    const totalTrucks = Object.values(trucksByStatus).reduce((sum, statusData) => sum + statusData.trucks.length, 0);

    // Calculate trucks with drivers
    const trucksWithDrivers = Object.values(trucksByStatus).reduce((sum, statusData) =>
        sum + statusData.trucks.filter(t => t.driver).length, 0
    , 0);

    // Calculate trucks with notes
    const trucksWithNotes = Object.values(trucksByStatus).reduce((sum, statusData) =>
        sum + statusData.trucks.filter(t => t.notes).length, 0
    , 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Truck Status Board" />

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
                                className="w-40"
                                fieldClassName="h-10"
                                value={selectedDate}
                                onChange={(next) => {
                                    router.get('/truck-status-board', { date: next ?? '' });
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* (KPI cards removed) */}

                {/* Search Bar */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search trucks by plate, type, or driver..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
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
                                    const statusData = filteredTrucksByStatus[status.id];
                                    if (!statusData) return null;

                                    return (
                                        <StatusColumn
                                            key={status.id}
                                            status={statusData.status}
                                            trucks={statusData.trucks}
                                            onCommentClick={handleCommentClick}
                                            highlight={overStatusId === status.id}
                                        />
                                    );
                                })}
                            </div>
                        </DndContext>
                    </CardContent>
                </Card>
            </div>

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
