import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { ReportMultiSelectFilter } from './report-multi-select-filter';
import { ReportDateRangePicker } from './report-date-range-picker';
import type { ReportSelectionOption } from './types';
import { BarChart3, Building2, ChevronDown, ChevronUp, Filter, MapPin, PackageCheck, RefreshCcw, Truck, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    from?: string;
    to?: string;
    onDateChange?: (field: 'from' | 'to', value: string) => void;
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
    originOptions?: ReportSelectionOption[];
    destinationOptions?: ReportSelectionOption[];
    statusOptions?: ReportSelectionOption[];
    providerOptions?: ReportSelectionOption[];
    customerOptions?: ReportSelectionOption[];
    loadPhaseOptions?: ReportSelectionOption[];
    selectedDrivers?: number[];
    selectedTrucks?: number[];
    selectedOperations?: number[];
    selectedOrigins?: number[];
    selectedDestinations?: number[];
    selectedCustomers?: number[];
    selectedLoadPhase?: string | null;
    selectedStatuses?: Array<number | string>;
    selectedProviders?: Array<number | string>;
    onDriversChange?: (ids: number[]) => void;
    onTrucksChange?: (ids: number[]) => void;
    onOperationsChange?: (ids: number[]) => void;
    onOriginsChange?: (ids: number[]) => void;
    onDestinationsChange?: (ids: number[]) => void;
    onCustomersChange?: (ids: number[]) => void;
    onLoadPhaseChange?: (id: string | null) => void;
    onStatusesChange?: (ids: Array<number | string>) => void;
    onProvidersChange?: (ids: Array<number | string>) => void;
    showDriverFilter?: boolean;
    showTruckFilter?: boolean;
    showOperationFilter?: boolean;
    showOriginFilter?: boolean;
    showDestinationFilter?: boolean;
    showCustomerFilter?: boolean;
    showLoadPhaseFilter?: boolean;
    showStatusFilter?: boolean;
    showProviderFilter?: boolean;
    dateError?: string | null;
    driverFilterText?: FilterTextOverrides;
    truckFilterText?: FilterTextOverrides;
    operationFilterText?: FilterTextOverrides;
    originFilterText?: FilterTextOverrides;
    destinationFilterText?: FilterTextOverrides;
    customerFilterText?: FilterTextOverrides;
    loadPhaseFilterText?: FilterTextOverrides;
    statusFilterText?: FilterTextOverrides;
    providerFilterText?: FilterTextOverrides;
    showDateRange?: boolean;
    dateRangeDescription?: string;
    showSingleDate?: boolean;
    singleDate?: string;
    onSingleDateChange?: (value: string) => void;
    singleDateLabel?: string;
    singleDateDescription?: string;
    extraFilters?: ReactNode;
}

export function ReportFiltersDialog({
    open,
    onOpenChange,
    activeFilterCount,
    from = '',
    to = '',
    onDateChange,
    onReset,
    onApply,
    title = 'Filter report data',
    description = 'Adjust the selections and filters before regenerating the report.',
    limit,
    onLimitChange,
    showLimit,
    limitLabel = 'Result limit',
    limitDescription = 'Dispatch cap for results.',
    driverOptions,
    truckOptions,
    operationOptions,
    originOptions,
    destinationOptions,
    statusOptions,
    providerOptions,
    customerOptions,
    loadPhaseOptions,
    selectedDrivers,
    selectedTrucks,
    selectedOperations,
    selectedOrigins,
    selectedDestinations,
    selectedCustomers,
    selectedLoadPhase,
    selectedStatuses,
    selectedProviders,
    onDriversChange,
    onTrucksChange,
    onOperationsChange,
    onOriginsChange,
    onDestinationsChange,
    onCustomersChange,
    onLoadPhaseChange,
    onStatusesChange,
    onProvidersChange,
    showDriverFilter,
    showTruckFilter,
    showOperationFilter,
    showOriginFilter,
    showDestinationFilter,
    showCustomerFilter,
    showLoadPhaseFilter,
    showStatusFilter,
    showProviderFilter,
    dateError,
    driverFilterText,
    truckFilterText,
    operationFilterText,
    originFilterText,
    destinationFilterText,
    customerFilterText,
    loadPhaseFilterText,
    statusFilterText,
    providerFilterText,
    showDateRange = true,
    dateRangeDescription = 'Select the inclusive reporting window.',
    showSingleDate,
    singleDate = '',
    onSingleDateChange,
    singleDateLabel = 'Reporting date',
    singleDateDescription,
    extraFilters,
}: ReportFiltersDialogProps) {
    const driverOptionsList = driverOptions ?? [];
    const truckOptionsList = truckOptions ?? [];
    const operationOptionsList = operationOptions ?? [];
    const originOptionsList = originOptions ?? [];
    const destinationOptionsList = destinationOptions ?? [];
    const statusOptionsList = statusOptions ?? [];
    const providerOptionsList = providerOptions ?? [];
    const customerOptionsList = customerOptions ?? [];
    const loadPhaseOptionsList = loadPhaseOptions ?? [];

    const selectedDriverIds = selectedDrivers ?? [];
    const selectedTruckIds = selectedTrucks ?? [];
    const selectedOperationIds = selectedOperations ?? [];
    const selectedOriginIds = selectedOrigins ?? [];
    const selectedDestinationIds = selectedDestinations ?? [];
    const selectedCustomerIds = selectedCustomers ?? [];
    const selectedLoadPhaseId = selectedLoadPhase ?? 'all';
    const selectedStatusIds = selectedStatuses ?? [];
    const selectedProviderIds = selectedProviders ?? [];

    const handleDriversChange = (ids: Array<number | string>) => {
        onDriversChange?.(ids.map((value) => Number(value)));
    };

    const handleTrucksChange = (ids: Array<number | string>) => {
        onTrucksChange?.(ids.map((value) => Number(value)));
    };

    const handleOperationsChange = (ids: Array<number | string>) => {
        onOperationsChange?.(ids.map((value) => Number(value)));
    };

    const handleOriginsChange = (ids: Array<number | string>) => {
        onOriginsChange?.(ids.map((value) => Number(value)));
    };

    const handleDestinationsChange = (ids: Array<number | string>) => {
        onDestinationsChange?.(ids.map((value) => Number(value)));
    };

    const handleCustomersChange = (ids: Array<number | string>) => {
        onCustomersChange?.(ids.map((value) => Number(value)));
    };

    const handleLoadPhaseChange = (value: string) => {
        if (value === 'all') {
            onLoadPhaseChange?.(null);
            return;
        }

        onLoadPhaseChange?.(value);
    };

    const handleStatusesChange = (ids: Array<number | string>) => {
        onStatusesChange?.(ids);
    };

    const handleProvidersChange = (ids: Array<number | string>) => {
        onProvidersChange?.(ids);
    };

    const shouldShowLimit = showLimit ?? (typeof limit !== 'undefined' && typeof onLimitChange === 'function');
    const shouldShowDateRange = (showDateRange ?? true) && typeof onDateChange === 'function';
    const shouldShowSingleDate = (showSingleDate ?? false) && typeof onSingleDateChange === 'function';
    const shouldShowDriver = showDriverFilter ?? driverOptionsList.length > 0;
    const shouldShowTruck = showTruckFilter ?? truckOptionsList.length > 0;
    const shouldShowOperation = showOperationFilter ?? operationOptionsList.length > 0;
    const shouldShowOrigin = showOriginFilter ?? originOptionsList.length > 0;
    const shouldShowDestination = showDestinationFilter ?? destinationOptionsList.length > 0;
    const shouldShowCustomer = showCustomerFilter ?? customerOptionsList.length > 0;
    const shouldShowLoadPhase = showLoadPhaseFilter ?? loadPhaseOptionsList.length > 0;
    const shouldShowStatus = showStatusFilter ?? statusOptionsList.length > 0;
    const shouldShowProvider = showProviderFilter ?? providerOptionsList.length > 0;

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

    const originText = {
        label: 'Origins',
        triggerLabelWhenAll: 'All origins',
        summaryLabelWhenAll: 'All origins included',
        heading: 'Origins',
        searchPlaceholder: 'Search origin...',
        emptyMessage: 'No origins found.',
        icon: MapPin,
        ...(originFilterText ?? {}),
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

    const customerText = {
        label: 'Customers',
        triggerLabelWhenAll: 'All customers',
        summaryLabelWhenAll: 'All customers included',
        heading: 'Customers',
        searchPlaceholder: 'Search customer...',
        emptyMessage: 'No customers found.',
        icon: Building2,
        ...(customerFilterText ?? {}),
    };

    const loadPhaseText = {
        label: 'Load phase',
        triggerLabelWhenAll: 'All load phases',
        summaryLabelWhenAll: 'All load phases included',
        heading: 'Load phase',
        searchPlaceholder: 'Search load phase...',
        emptyMessage: 'No phases found.',
        icon: MapPin,
        ...(loadPhaseFilterText ?? {}),
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

    const providerText = {
        label: 'Service providers',
        triggerLabelWhenAll: 'All providers',
        summaryLabelWhenAll: 'All providers included',
        heading: 'Service providers',
        searchPlaceholder: 'Search provider...',
        emptyMessage: 'No providers found.',
        icon: Building2,
        ...(providerFilterText ?? {}),
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
        shouldShowOrigin ? (
            <ReportMultiSelectFilter
                key="origins"
                label={originText.label ?? 'Origins'}
                icon={originText.icon ?? MapPin}
                triggerLabelWhenAll={originText.triggerLabelWhenAll ?? 'All origins'}
                summaryLabelWhenAll={originText.summaryLabelWhenAll ?? 'All origins included'}
                heading={originText.heading ?? 'Origins'}
                searchPlaceholder={originText.searchPlaceholder ?? 'Search origin...'}
                emptyMessage={originText.emptyMessage ?? 'No origins found.'}
                options={originOptionsList}
                selectedIds={selectedOriginIds as Array<number | string>}
                onChange={handleOriginsChange}
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
        shouldShowCustomer ? (
            <ReportMultiSelectFilter
                key="customers"
                label={customerText.label ?? 'Customers'}
                icon={customerText.icon ?? Building2}
                triggerLabelWhenAll={customerText.triggerLabelWhenAll ?? 'All customers'}
                summaryLabelWhenAll={customerText.summaryLabelWhenAll ?? 'All customers included'}
                heading={customerText.heading ?? 'Customers'}
                searchPlaceholder={customerText.searchPlaceholder ?? 'Search customer...'}
                emptyMessage={customerText.emptyMessage ?? 'No customers found.'}
                options={customerOptionsList}
                selectedIds={selectedCustomerIds as Array<number | string>}
                onChange={handleCustomersChange}
            />
        ) : null,
        shouldShowLoadPhase ? (
            <div key="load-phase" className="flex flex-col gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{loadPhaseText.label ?? 'Load phase'}</span>
                <Select value={selectedLoadPhaseId} onValueChange={handleLoadPhaseChange}>
                    <SelectTrigger className="w-full justify-between">
                        <SelectValue placeholder={loadPhaseText.triggerLabelWhenAll ?? 'All load phases'} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{loadPhaseText.triggerLabelWhenAll ?? 'All load phases'}</SelectItem>
                        {loadPhaseOptionsList.map((option) => (
                            <SelectItem key={option.id} value={String(option.id)}>{option.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                    {selectedLoadPhaseId === 'all' ? (
                        <Badge variant="outline" className="border-dashed text-muted-foreground">
                            {loadPhaseText.summaryLabelWhenAll ?? 'All load phases included'}
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                            {loadPhaseOptionsList.find((option) => option.id === selectedLoadPhaseId)?.label ?? selectedLoadPhaseId}
                        </Badge>
                    )}
                </div>
            </div>
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
        shouldShowProvider ? (
            <ReportMultiSelectFilter
                key="providers"
                label={providerText.label ?? 'Service providers'}
                icon={providerText.icon ?? Building2}
                triggerLabelWhenAll={providerText.triggerLabelWhenAll ?? 'All providers'}
                summaryLabelWhenAll={providerText.summaryLabelWhenAll ?? 'All providers included'}
                heading={providerText.heading ?? 'Service providers'}
                searchPlaceholder={providerText.searchPlaceholder ?? 'Search provider...'}
                emptyMessage={providerText.emptyMessage ?? 'No providers found.'}
                options={providerOptionsList}
                selectedIds={selectedProviderIds}
                onChange={handleProvidersChange}
            />
        ) : null,
    ].filter(Boolean);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" className="gap-2 shadow-sm hover:shadow-md transition-all duration-200">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">Filters</span>
                    {activeFilterCount > 0 ? (
                        <Badge variant="secondary" className="h-5 min-w-[1.25rem] justify-center px-1.5 text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {activeFilterCount}
                        </Badge>
                    ) : null}
                    {open ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-[95vw] sm:max-w-6xl lg:max-w-7xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="text-left pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Filter className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</DialogTitle>
                            <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                    <div className="grid gap-8 rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 shadow-md dark:border-slate-800/70 dark:from-slate-900/50 dark:to-slate-900/30">
                        {/* Date Range / Date / Limit Section */}
                        {(shouldShowDateRange || shouldShowSingleDate || shouldShowLimit) && (
                            <div className="flex flex-wrap items-start gap-6">
                                {shouldShowDateRange ? (
                                    <div className="flex-1 min-w-[280px]">
                                        <ReportDateRangePicker
                                            from={from}
                                            to={to}
                                            onChange={(field, value) => {
                                                onDateChange?.(field, value);
                                            }}
                                            error={dateError}
                                            description={dateRangeDescription}
                                        />
                                    </div>
                                ) : null}
                                {shouldShowSingleDate ? (
                                    <div className="flex min-w-[240px] flex-col gap-3">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{singleDateLabel}</span>
                                        <DatePicker
                                            value={singleDate || ''}
                                            onChange={(value) => onSingleDateChange?.(value ?? '')}
                                            placeholder="Select date"
                                            className="min-w-[240px] justify-start text-left bg-white dark:bg-slate-950 shadow-sm"
                                        />
                                        {singleDateDescription ? <p className="text-xs text-slate-500 dark:text-slate-400">{singleDateDescription}</p> : null}
                                    </div>
                                ) : null}
                                {shouldShowLimit ? (
                                    <div className="flex min-w-[240px] flex-col gap-3">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{limitLabel}</span>
                                        <Input
                                            type="number"
                                            min={50}
                                            max={5000}
                                            step={50}
                                            value={typeof limit === 'number' ? limit : ''}
                                            onChange={(event) => onLimitChange?.(Number(event.target.value))}
                                            className="bg-white dark:bg-slate-950 shadow-sm"
                                        />
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{limitDescription}</p>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {/* Filters Section */}
                        {filterSections.length > 0 ? (
                            <div>
                                {(shouldShowDateRange || shouldShowSingleDate || shouldShowLimit) && (
                                    <div className="mb-6 border-t border-slate-200/60 dark:border-slate-700/60 pt-6">
                                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                            <span className="h-1 w-1 rounded-full bg-blue-500"></span>
                                            Filter Criteria
                                        </h3>
                                    </div>
                                )}
                                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                                      {filterSections}
                                  </div>
                                  {extraFilters ? (
                                      <div className="mt-6 border-t border-slate-200/60 pt-6 dark:border-slate-700/60">
                                          {extraFilters}
                                      </div>
                                  ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
                <DialogFooter className="flex items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 sm:justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onReset}
                        className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Reset All
                    </Button>
                    <Button
                        type="button"
                        onClick={onApply}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-w-[160px]"
                    >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Generate Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
