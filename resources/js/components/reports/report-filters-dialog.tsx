import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ReportMultiSelectFilter } from './report-multi-select-filter';
import { ReportDateRangePicker } from './report-date-range-picker';
import type { ReportSelectionOption } from './types';
import { ChevronDown, ChevronUp, Filter, MapPin, PackageCheck, Truck, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface FilterTextOverrides {
    label?: string;
    triggerLabelWhenAll?: string;
    summaryLabelWhenAll?: string;
    heading?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    icon?: LucideIcon;
}

interface ReportFiltersDialogProps {
    open: boolean;
    onOpenChange: (value: boolean) => void;
    activeFilterCount: number;
    from: string;
    to: string;
    onDateChange: (field: 'from' | 'to', value: string) => void;
    onReset: () => void;
    onApply: () => void;
    title?: string;
    description?: string;
    limit?: number;
    onLimitChange?: (value: number) => void;
    showLimit?: boolean;
    limitLabel?: string;
    limitDescription?: string;
    driverOptions?: ReportSelectionOption[];
    truckOptions?: ReportSelectionOption[];
    operationOptions?: ReportSelectionOption[];
    destinationOptions?: ReportSelectionOption[];
    statusOptions?: ReportSelectionOption[];
    selectedDrivers?: number[];
    selectedTrucks?: number[];
    selectedOperations?: number[];
    selectedDestinations?: number[];
    selectedStatuses?: Array<number | string>;
    onDriversChange?: (ids: number[]) => void;
    onTrucksChange?: (ids: number[]) => void;
    onOperationsChange?: (ids: number[]) => void;
    onDestinationsChange?: (ids: number[]) => void;
    onStatusesChange?: (ids: Array<number | string>) => void;
    showDriverFilter?: boolean;
    showTruckFilter?: boolean;
    showOperationFilter?: boolean;
    showDestinationFilter?: boolean;
    showStatusFilter?: boolean;
    dateError?: string | null;
    driverFilterText?: FilterTextOverrides;
    truckFilterText?: FilterTextOverrides;
    operationFilterText?: FilterTextOverrides;
    destinationFilterText?: FilterTextOverrides;
    statusFilterText?: FilterTextOverrides;
}

export function ReportFiltersDialog({
    open,
    onOpenChange,
    activeFilterCount,
    from,
    to,
    onDateChange,
    onReset,
    onApply,
    title = 'Filter report data',
    description = 'Adjust the date window, asset selections, and other filters before regenerating the report.',
    limit,
    onLimitChange,
    showLimit,
    limitLabel = 'Result limit',
    limitDescription = 'Dispatch cap for results.',
    driverOptions,
    truckOptions,
    operationOptions,
    destinationOptions,
    statusOptions,
    selectedDrivers,
    selectedTrucks,
    selectedOperations,
    selectedDestinations,
    selectedStatuses,
    onDriversChange,
    onTrucksChange,
    onOperationsChange,
    onDestinationsChange,
    onStatusesChange,
    showDriverFilter,
    showTruckFilter,
    showOperationFilter,
    showDestinationFilter,
    showStatusFilter,
    dateError,
    driverFilterText,
    truckFilterText,
    operationFilterText,
    destinationFilterText,
    statusFilterText,
}: ReportFiltersDialogProps) {
    const driverOptionsList = driverOptions ?? [];
    const truckOptionsList = truckOptions ?? [];
    const operationOptionsList = operationOptions ?? [];
    const destinationOptionsList = destinationOptions ?? [];
    const statusOptionsList = statusOptions ?? [];

    const selectedDriverIds = selectedDrivers ?? [];
    const selectedTruckIds = selectedTrucks ?? [];
    const selectedOperationIds = selectedOperations ?? [];
    const selectedDestinationIds = selectedDestinations ?? [];
    const selectedStatusIds = selectedStatuses ?? [];

    const handleDriversChange = (ids: Array<number | string>) => {
        onDriversChange?.(ids.map((value) => Number(value)));
    };

    const handleTrucksChange = (ids: Array<number | string>) => {
        onTrucksChange?.(ids.map((value) => Number(value)));
    };

    const handleOperationsChange = (ids: Array<number | string>) => {
        onOperationsChange?.(ids.map((value) => Number(value)));
    };

    const handleDestinationsChange = (ids: Array<number | string>) => {
        onDestinationsChange?.(ids.map((value) => Number(value)));
    };

    const handleStatusesChange = (ids: Array<number | string>) => {
        onStatusesChange?.(ids);
    };

    const shouldShowLimit = showLimit ?? (typeof limit !== 'undefined' && typeof onLimitChange === 'function');
    const shouldShowDriver = showDriverFilter ?? driverOptionsList.length > 0;
    const shouldShowTruck = showTruckFilter ?? truckOptionsList.length > 0;
    const shouldShowOperation = showOperationFilter ?? operationOptionsList.length > 0;
    const shouldShowDestination = showDestinationFilter ?? destinationOptionsList.length > 0;
    const shouldShowStatus = showStatusFilter ?? statusOptionsList.length > 0;

    const driverText = {
        label: 'Drivers',
        triggerLabelWhenAll: 'All drivers',
        summaryLabelWhenAll: 'All drivers included',
        heading: 'Drivers',
        searchPlaceholder: 'Search driver...',
        emptyMessage: 'No drivers found.',
        icon: User,
        ...(driverFilterText ?? {}),
    };

    const truckText = {
        label: 'Trucks',
        triggerLabelWhenAll: 'All trucks',
        summaryLabelWhenAll: 'All trucks included',
        heading: 'Trucks',
        searchPlaceholder: 'Search truck...',
        emptyMessage: 'No trucks found.',
        icon: Truck,
        ...(truckFilterText ?? {}),
    };

    const operationText = {
        label: 'Operations',
        triggerLabelWhenAll: 'All operations',
        summaryLabelWhenAll: 'All operations included',
        heading: 'Operations',
        searchPlaceholder: 'Search operation...',
        emptyMessage: 'No operations found.',
        icon: PackageCheck,
        ...(operationFilterText ?? {}),
    };

    const destinationText = {
        label: 'Destinations',
        triggerLabelWhenAll: 'All destinations',
        summaryLabelWhenAll: 'All destinations included',
        heading: 'Destinations',
        searchPlaceholder: 'Search destination...',
        emptyMessage: 'No destinations found.',
        icon: MapPin,
        ...(destinationFilterText ?? {}),
    };

    const statusText = {
        label: 'Statuses',
        triggerLabelWhenAll: 'All statuses',
        summaryLabelWhenAll: 'All statuses included',
        heading: 'Statuses',
        searchPlaceholder: 'Search status...',
        emptyMessage: 'No statuses found.',
        icon: Filter,
        ...(statusFilterText ?? {}),
    };

    const filterSections = [
        shouldShowDriver ? (
            <ReportMultiSelectFilter
                key="drivers"
                label={driverText.label ?? 'Drivers'}
                icon={driverText.icon ?? User}
                triggerLabelWhenAll={driverText.triggerLabelWhenAll ?? 'All drivers'}
                summaryLabelWhenAll={driverText.summaryLabelWhenAll ?? 'All drivers included'}
                heading={driverText.heading ?? 'Drivers'}
                searchPlaceholder={driverText.searchPlaceholder ?? 'Search driver...'}
                emptyMessage={driverText.emptyMessage ?? 'No drivers found.'}
                options={driverOptionsList}
                selectedIds={selectedDriverIds as Array<number | string>}
                onChange={handleDriversChange}
            />
        ) : null,
        shouldShowTruck ? (
            <ReportMultiSelectFilter
                key="trucks"
                label={truckText.label ?? 'Trucks'}
                icon={truckText.icon ?? Truck}
                triggerLabelWhenAll={truckText.triggerLabelWhenAll ?? 'All trucks'}
                summaryLabelWhenAll={truckText.summaryLabelWhenAll ?? 'All trucks included'}
                heading={truckText.heading ?? 'Trucks'}
                searchPlaceholder={truckText.searchPlaceholder ?? 'Search truck...'}
                emptyMessage={truckText.emptyMessage ?? 'No trucks found.'}
                options={truckOptionsList}
                selectedIds={selectedTruckIds as Array<number | string>}
                onChange={handleTrucksChange}
            />
        ) : null,
        shouldShowOperation ? (
            <ReportMultiSelectFilter
                key="operations"
                label={operationText.label ?? 'Operations'}
                icon={operationText.icon ?? PackageCheck}
                triggerLabelWhenAll={operationText.triggerLabelWhenAll ?? 'All operations'}
                summaryLabelWhenAll={operationText.summaryLabelWhenAll ?? 'All operations included'}
                heading={operationText.heading ?? 'Operations'}
                searchPlaceholder={operationText.searchPlaceholder ?? 'Search operation...'}
                emptyMessage={operationText.emptyMessage ?? 'No operations found.'}
                options={operationOptionsList}
                selectedIds={selectedOperationIds as Array<number | string>}
                onChange={handleOperationsChange}
            />
        ) : null,
        shouldShowDestination ? (
            <ReportMultiSelectFilter
                key="destinations"
                label={destinationText.label ?? 'Destinations'}
                icon={destinationText.icon ?? MapPin}
                triggerLabelWhenAll={destinationText.triggerLabelWhenAll ?? 'All destinations'}
                summaryLabelWhenAll={destinationText.summaryLabelWhenAll ?? 'All destinations included'}
                heading={destinationText.heading ?? 'Destinations'}
                searchPlaceholder={destinationText.searchPlaceholder ?? 'Search destination...'}
                emptyMessage={destinationText.emptyMessage ?? 'No destinations found.'}
                options={destinationOptionsList}
                selectedIds={selectedDestinationIds as Array<number | string>}
                onChange={handleDestinationsChange}
            />
        ) : null,
        shouldShowStatus ? (
            <ReportMultiSelectFilter
                key="statuses"
                label={statusText.label ?? 'Statuses'}
                icon={statusText.icon ?? Filter}
                triggerLabelWhenAll={statusText.triggerLabelWhenAll ?? 'All statuses'}
                summaryLabelWhenAll={statusText.summaryLabelWhenAll ?? 'All statuses included'}
                heading={statusText.heading ?? 'Statuses'}
                searchPlaceholder={statusText.searchPlaceholder ?? 'Search status...'}
                emptyMessage={statusText.emptyMessage ?? 'No statuses found.'}
                options={statusOptionsList}
                selectedIds={selectedStatusIds}
                onChange={handleStatusesChange}
            />
        ) : null,
    ].filter(Boolean);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 ? (
                        <Badge variant="secondary" className="h-5 min-w-[2rem] justify-center px-2 text-xs font-semibold">
                            {activeFilterCount}
                        </Badge>
                    ) : null}
                    {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </DialogTrigger>
            <DialogContent className="w-full sm:max-w-6xl lg:max-w-7xl sm:rounded-2xl">
                <DialogHeader className="text-left">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6">
                    <div className="grid gap-8 rounded-xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-wrap items-start gap-6">
                            <ReportDateRangePicker from={from} to={to} onChange={onDateChange} error={dateError} description="Select the inclusive reporting window." />
                            {shouldShowLimit ? (
                                <div className="flex min-w-[220px] flex-col gap-3">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{limitLabel}</span>
                                    <Input
                                        type="number"
                                        min={50}
                                        max={5000}
                                        step={50}
                                        value={typeof limit === 'number' ? limit : ''}
                                        onChange={(event) => onLimitChange?.(Number(event.target.value))}
                                    />
                                    <p className="text-xs text-muted-foreground">{limitDescription}</p>
                                </div>
                            ) : null}
                        </div>
                        {filterSections.length > 0 ? <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">{filterSections}</div> : null}
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onReset}>
                        Reset
                    </Button>
                    <Button type="button" onClick={onApply}>
                        Generate report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
