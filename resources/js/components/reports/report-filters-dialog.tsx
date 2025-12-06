import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ReportMultiSelectFilter } from './report-multi-select-filter';
import { ReportDateRangePicker } from './report-date-range-picker';
import type { ReportSelectionOption } from './types';
import { ChevronDown, ChevronUp, Filter, MapPin, PackageCheck, Truck, User } from 'lucide-react';

interface ReportFiltersDialogProps {
    open: boolean;
    onOpenChange: (value: boolean) => void;
    activeFilterCount: number;
    from: string;
    to: string;
    onDateChange: (field: 'from' | 'to', value: string) => void;
    limit: number;
    onLimitChange: (value: number) => void;
    onReset: () => void;
    onApply: () => void;
    driverOptions: ReportSelectionOption[];
    truckOptions: ReportSelectionOption[];
    operationOptions: ReportSelectionOption[];
    destinationOptions: ReportSelectionOption[];
    selectedDrivers: number[];
    selectedTrucks: number[];
    selectedOperations: number[];
    selectedDestinations: number[];
    onDriversChange: (ids: number[]) => void;
    onTrucksChange: (ids: number[]) => void;
    onOperationsChange: (ids: number[]) => void;
    onDestinationsChange: (ids: number[]) => void;
    dateError?: string | null;
}

export function ReportFiltersDialog({
    open,
    onOpenChange,
    activeFilterCount,
    from,
    to,
    onDateChange,
    limit,
    onLimitChange,
    onReset,
    onApply,
    driverOptions,
    truckOptions,
    operationOptions,
    destinationOptions,
    selectedDrivers,
    selectedTrucks,
    selectedOperations,
    selectedDestinations,
    onDriversChange,
    onTrucksChange,
    onOperationsChange,
    onDestinationsChange,
    dateError,
}: ReportFiltersDialogProps) {
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
                    <DialogTitle>Filter report data</DialogTitle>
                    <DialogDescription>Adjust the date window, asset selections, and other filters before regenerating the report.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6">
                    <div className="grid gap-8 rounded-xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-wrap items-start gap-6">
                            <ReportDateRangePicker from={from} to={to} onChange={onDateChange} error={dateError} description="Select the inclusive reporting window." />
                            <div className="flex min-w-[220px] flex-col gap-3">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Result limit</span>
                                <Input
                                    type="number"
                                    min={50}
                                    max={5000}
                                    step={50}
                                    value={Number.isNaN(limit) ? '' : limit}
                                    onChange={(event) => onLimitChange(Number(event.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">Dispatch cap for results.</p>
                            </div>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                            <ReportMultiSelectFilter
                                label="Drivers"
                                icon={User}
                                triggerLabelWhenAll="All drivers"
                                summaryLabelWhenAll="All drivers included"
                                heading="Drivers"
                                searchPlaceholder="Search driver..."
                                emptyMessage="No drivers found."
                                options={driverOptions}
                                selectedIds={selectedDrivers}
                                onChange={onDriversChange}
                            />
                            <ReportMultiSelectFilter
                                label="Trucks"
                                icon={Truck}
                                triggerLabelWhenAll="All trucks"
                                summaryLabelWhenAll="All trucks included"
                                heading="Trucks"
                                searchPlaceholder="Search truck..."
                                emptyMessage="No trucks found."
                                options={truckOptions}
                                selectedIds={selectedTrucks}
                                onChange={onTrucksChange}
                            />
                            <ReportMultiSelectFilter
                                label="Operations"
                                icon={PackageCheck}
                                triggerLabelWhenAll="All operations"
                                summaryLabelWhenAll="All operations included"
                                heading="Operations"
                                searchPlaceholder="Search operation..."
                                emptyMessage="No operations found."
                                options={operationOptions}
                                selectedIds={selectedOperations}
                                onChange={onOperationsChange}
                            />
                            <ReportMultiSelectFilter
                                label="Destinations"
                                icon={MapPin}
                                triggerLabelWhenAll="All destinations"
                                summaryLabelWhenAll="All destinations included"
                                heading="Destinations"
                                searchPlaceholder="Search destination..."
                                emptyMessage="No destinations found."
                                options={destinationOptions}
                                selectedIds={selectedDestinations}
                                onChange={onDestinationsChange}
                            />
                        </div>
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
