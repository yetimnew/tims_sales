<?php

namespace App\Http\Controllers;

use App\Enums\CargoServiceType;
use App\Enums\OperationDestinationScope;
use App\Exports\Reports\CapacityPlanningExport;
use App\Exports\Reports\CustomerProfitabilityExport;
use App\Exports\Reports\DailyStatusExport;
use App\Exports\Reports\DriverPerformanceExport;
use App\Exports\Reports\FleetFinancialExport;
use App\Exports\Reports\FuelEfficiencyExport;
use App\Exports\Reports\GeographyHeatmapsExport;
use App\Exports\Reports\MaintenanceExport;
use App\Exports\Reports\NetworkOptimizationExport;
use App\Exports\Reports\OperationProfitabilityExport;
use App\Exports\Reports\OutsourcePerformanceExport;
use App\Exports\Reports\PerformanceAllExport;
use App\Exports\Reports\RouteProfitabilityExport;
use App\Exports\Reports\TruckPerformanceExport;
use App\Http\Requests\Reports\CapacityPlanningRequest;
use App\Http\Requests\Reports\CostPerKilometerRequest;
use App\Http\Requests\Reports\CustomerProfitabilityRequest;
use App\Http\Requests\Reports\DailyStatusReportRequest;
use App\Http\Requests\Reports\DriverSafetyReportRequest;
use App\Http\Requests\Reports\FleetFinancialRequest;
use App\Http\Requests\Reports\FuelEfficiencyRequest;
use App\Http\Requests\Reports\LoadFactorUtilizationRequest;
use App\Http\Requests\Reports\MaintenancePerformanceRequest;
use App\Http\Requests\Reports\NetworkOptimizationRequest;
use App\Http\Requests\Reports\OutsourcePerformanceRequest;
use App\Http\Requests\Reports\PerformanceAllRequest;
use App\Http\Requests\Reports\PerformanceByDriverRequest;
use App\Http\Requests\Reports\PerformanceByStatusRequest;
use App\Http\Requests\Reports\PerformanceByTruckRequest;
use App\Http\Requests\Reports\RouteProfitabilityRequest;
use App\Http\Requests\Reports\TruckGradingReportRequest;
use App\Models\Customer;
use App\Models\Driver;
use App\Models\MaintenanceType;
use App\Models\Operation;
use App\Models\Outsource;
use App\Models\OutsourcePerformance;
use App\Models\Performance;
use App\Models\Place;
use App\Models\Region;
use App\Models\Status;
use App\Models\Truck;
use App\Models\VehicleMaintenanceRecord;
use App\Models\VehicleType;
use App\Models\Woreda;
use App\Models\Zone;
use App\Services\Reports\CapacityPlanningReport;
use App\Services\Reports\CostPerKilometerReport;
use App\Services\Reports\CustomerProfitabilityReport;
use App\Services\Reports\DailyStatusReport;
use App\Services\Reports\DriverSafetyReport;
use App\Services\Reports\DriverTruckGradingReport;
use App\Services\Reports\FleetFinancialReport;
use App\Services\Reports\FuelEfficiencyReport;
use App\Services\Reports\LoadFactorUtilizationReport;
use App\Services\Reports\MaintenancePerformanceReport;
use App\Services\Reports\NetworkOptimizationReport;
use App\Services\Reports\OutsourcePerformanceReport;
use App\Services\Reports\PerformanceAllReport;
use App\Services\Reports\PerformanceByStatusReport;
use App\Services\Reports\RouteProfitabilityReport;
use App\Services\Reports\TruckGradingReport;
use App\Services\Reports\TruckPerformanceReport;
use App\Services\TruckAssignmentService;
use Dompdf\Dompdf;
use Dompdf\Options;
use Exception;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function __construct(
        private readonly PerformanceAllReport $performanceAllReport,
        private readonly PerformanceByStatusReport $performanceByStatusReport,
        private readonly DailyStatusReport $dailyStatusReport,
        private readonly TruckPerformanceReport $truckPerformanceReport,
        private readonly CustomerProfitabilityReport $customerProfitabilityReport,
        private readonly FleetFinancialReport $fleetFinancialReport,
        private readonly CapacityPlanningReport $capacityPlanningReport,
        private readonly NetworkOptimizationReport $networkOptimizationReport,
        private readonly FuelEfficiencyReport $fuelEfficiencyReport,
        private readonly OutsourcePerformanceReport $outsourcePerformanceReport,
        private readonly MaintenancePerformanceReport $maintenancePerformanceReport,
        private readonly TruckGradingReport $truckGradingReport,
        private readonly \App\Services\Reports\DriverGradingReport $driverGradingReport,
        private readonly DriverTruckGradingReport $driverTruckGradingReport,
        private readonly DriverSafetyReport $driverSafetyReport,
        private readonly RouteProfitabilityReport $routeProfitabilityReport,
        private readonly LoadFactorUtilizationReport $loadFactorUtilizationReport,
        private readonly CostPerKilometerReport $costPerKilometerReport,
        private readonly TruckAssignmentService $truckAssignmentService,
    ) {}

    private array $regionNameCache = [];

    private array $zoneRegionNameCache = [];

    private array $woredaRegionNameCache = [];

    private array $placeRegionNameCache = [];

    /**
     * Display maintenance reports.
     */
    public function maintenance(MaintenancePerformanceRequest $request): Response|RedirectResponse
    {
        try {
            $validated = $request->validated();
            $result = $this->maintenancePerformanceReport->build($validated);

            // Cache truck options (1 hour) - changes when trucks are added/removed
            $truckOptions = Cache::remember('reports.maintenance.truck_options', 3600, function () {
                return Truck::query()
                    ->select('id', 'plate', 'status')
                    ->orderBy('plate')
                    ->get()
                    ->map(static fn (Truck $truck) => [
                        'id' => $truck->id,
                        'plate' => $truck->plate ?? 'Truck #'.$truck->id,
                        'status' => $truck->status,
                    ])
                    ->values();
            });

            // Cache maintenance type options (1 hour) - changes when types are added/removed
            $maintenanceTypeOptions = Cache::remember('reports.maintenance.maintenance_type_options', 3600, function () {
                return MaintenanceType::query()
                    ->select('id', 'name', 'category')
                    ->orderBy('name')
                    ->get()
                    ->map(static fn (MaintenanceType $type) => [
                        'id' => $type->id,
                        'name' => $type->name,
                        'category' => $type->category,
                    ])
                    ->values();
            });

            // Cache status options (1 hour) - rarely changes
            $statusOptions = Cache::remember('reports.maintenance.status_options', 3600, function () {
                return VehicleMaintenanceRecord::query()
                    ->select('status')
                    ->whereNotNull('status')
                    ->distinct()
                    ->orderBy('status')
                    ->pluck('status')
                    ->filter()
                    ->values();
            });

            // Cache service provider options (1 hour) - rarely changes
            $serviceProviderOptions = Cache::remember('reports.maintenance.service_provider_options', 3600, function () {
                return VehicleMaintenanceRecord::query()
                    ->select('service_provider')
                    ->whereNotNull('service_provider')
                    ->distinct()
                    ->orderBy('service_provider')
                    ->pluck('service_provider')
                    ->filter()
                    ->values();
            });

            return Inertia::render('Reports/Maintenance', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'truck_ids' => $result['truck_ids'],
                    'maintenance_type_ids' => $result['maintenance_type_ids'],
                    'statuses' => $result['statuses'],
                    'service_providers' => $result['service_providers'],
                    'per_page' => $result['per_page'],
                ],
                'totals' => $result['totals'],
                'summary' => $result['summary'],
                'breakdown' => $result['breakdown'],
                'breakdown_paginator' => $result['breakdown_paginator'],
                'per_page_options' => $result['per_page_options'],
                'type_breakdown' => $result['type_breakdown'],
                'trend' => $result['trend'],
                'upcoming' => $result['upcoming'],
                'highlights' => $result['highlights'],
                'options' => [
                    'trucks' => $truckOptions,
                    'maintenance_types' => $maintenanceTypeOptions,
                    'statuses' => $statusOptions,
                    'service_providers' => $serviceProviderOptions,
                ],
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to generate maintenance report.']);
        }
    }

    public function maintenanceExport(MaintenancePerformanceRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        $validated = array_merge($request->validated(), ['format' => $format]);

        try {
            $result = $this->maintenancePerformanceReport->build($validated);

            $rows = collect($result['breakdown_all'] ?? $result['breakdown'] ?? []);
            $totals = $result['totals'] ?? [];
            $summary = $result['summary'] ?? [];
            $from = $result['resolved_from'] ?? now()->toDateString();
            $to = $result['resolved_to'] ?? now()->toDateString();
            $filename = 'maintenance_'.now()->format('Y-m-d_H-i-s');

            return match ($format) {
                'csv' => $this->exportMaintenanceCsv($rows, $totals, $summary, $from, $to, $filename.'.csv'),
                'xlsx' => $this->exportMaintenanceExcel($rows, $totals, $summary, $filename.'.xlsx'),
                'pdf' => $this->exportMaintenancePdf($rows, $totals, $summary, $from, $to, $filename.'.pdf'),
                default => abort(404),
            };
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to export maintenance report.']);
        }
    }

    /**
     * Display fuel efficiency and cost report.
     */
    public function fuelEfficiency(FuelEfficiencyRequest $request): Response|RedirectResponse
    {
        try {
            $result = $this->fuelEfficiencyReport->build($request->validated());

            // Cache truck options (1 hour) - changes when trucks are added/removed
            $trucks = Cache::remember('reports.fuel_efficiency.truck_options', 3600, function () {
                return Truck::query()
                    ->select('id', 'plate', 'status')
                    ->orderBy('plate')
                    ->get()
                    ->map(static fn (Truck $truck) => [
                        'id' => $truck->id,
                        'plate' => $truck->plate ?? 'Truck #'.$truck->id,
                        'status' => $truck->status,
                    ])
                    ->values();
            });

            return Inertia::render('Reports/FuelEfficiency', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'truck_ids' => $result['truck_ids'],
                    'per_page' => $result['per_page'] ?? null,
                    'page' => $result['breakdown_paginator']['meta']['current_page'] ?? 1,
                ],
                'totals' => $result['totals'],
                'summary' => $result['summary'],
                'breakdown' => $result['breakdown'],
                'breakdown_paginator' => $result['breakdown_paginator'] ?? null,
                'per_page_options' => $result['per_page_options'] ?? [],
                'trend' => $result['trend'],
                'highlights' => $result['highlights'],
                'trucks' => $trucks,
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to generate fuel efficiency report.']);
        }
    }

    public function fuelEfficiencyExport(FuelEfficiencyRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        $validated = array_merge($request->validated(), ['format' => $format]);

        try {
            $result = $this->fuelEfficiencyReport->build($validated);

            $rows = collect($result['breakdown_all'] ?? $result['breakdown'] ?? []);
            $totals = $result['totals'] ?? [];
            $summary = $result['summary'] ?? [];
            $from = $result['resolved_from'] ?? now()->toDateString();
            $to = $result['resolved_to'] ?? now()->toDateString();
            $filename = 'fuel_efficiency_'.now()->format('Y-m-d_H-i-s');

            return match ($format) {
                'csv' => $this->exportFuelEfficiencyCsv($rows, $totals, $summary, $from, $to, $filename.'.csv'),
                'xlsx' => $this->exportFuelEfficiencyExcel($rows, $totals, $summary, $filename.'.xlsx'),
                'pdf' => $this->exportFuelEfficiencyPdf($rows, $totals, $summary, $from, $to, $filename.'.pdf'),
                default => abort(404),
            };
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to export fuel efficiency report.']);
        }
    }

    /**
     * Display customer profitability report (revenue, cost, margin per customer; lanes; trend).
     */
    public function customerProfitability(CustomerProfitabilityRequest $request): Response|RedirectResponse
    {
        try {
            $validated = $request->validated();
            $result = $this->customerProfitabilityReport->build($validated);

            // Cache customer options (1 hour) - changes when customers are added/removed
            $customerOptions = Cache::remember('reports.customer_profitability.customer_options', 3600, function () {
                return Customer::query()
                    ->select('id', 'name')
                    ->orderBy('name')
                    ->get()
                    ->map(static fn (Customer $customer) => [
                        'id' => $customer->id,
                        'name' => $customer->name,
                    ]);
            });

            return Inertia::render('Reports/CustomerProfitability', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'customer_ids' => $result['customer_ids'],
                ],
                'rows' => $result['rows'],
                'summary' => $result['summary'],
                'trend' => $result['trend'],
                'customers' => $customerOptions,
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to generate customer profitability report.']);
        }
    }

    public function customerProfitabilityExport(CustomerProfitabilityRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        $validated = array_merge($request->validated(), ['format' => $format]);

        try {
            $result = $this->customerProfitabilityReport->build($validated);

            $rows = collect($result['rows'] ?? []);
            $summary = $result['summary'] ?? [];
            $from = $result['resolved_from'] ?? now()->toDateString();
            $to = $result['resolved_to'] ?? now()->toDateString();
            $filename = 'customer_profitability_'.now()->format('Y-m-d_H-i-s');

            return match ($format) {
                'csv' => $this->exportCustomerProfitabilityCsv($rows, $summary, $from, $to, $filename.'.csv'),
                'xlsx' => $this->exportCustomerProfitabilityExcel($rows, $summary, $filename.'.xlsx'),
                'pdf' => $this->exportCustomerProfitabilityPdf($rows, $summary, $from, $to, $filename.'.pdf'),
                default => abort(404),
            };
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to export customer profitability report.']);
        }
    }

    public function fleetFinancial(FleetFinancialRequest $request): Response|RedirectResponse
    {
        try {
            $result = $this->fleetFinancialReport->build($request->validated());

            return Inertia::render('Reports/FleetFinancial', [
                ...$result,
                'filters' => [
                    'from' => $result['resolved_from'] ?? null,
                    'to' => $result['resolved_to'] ?? null,
                ],
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to load fleet financial dashboard.']);
        }
    }

    public function fleetFinancialExport(FleetFinancialRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx'], true)) {
            abort(404);
        }

        try {
            $result = $this->fleetFinancialReport->build($request->validated());
            $filename = 'fleet_financial_dashboard_'.now()->format('Y-m-d_H-i-s');

            $export = new FleetFinancialExport($result);

            return match ($format) {
                'xlsx' => Excel::download($export, $filename.'.xlsx'),
                'csv' => Excel::download($export, $filename.'.csv', \Maatwebsite\Excel\Excel::CSV),
                default => abort(404),
            };
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to export fleet financial dashboard.']);
        }
    }

    public function capacityPlanning(CapacityPlanningRequest $request): Response|RedirectResponse
    {
        try {
            $result = $this->capacityPlanningReport->build($request->validated());

            return Inertia::render('Reports/CapacityPlanning', [
                ...$result,
                'filters' => [
                    'from' => $result['resolved_from'] ?? null,
                    'to' => $result['resolved_to'] ?? null,
                ],
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to load capacity planning report.']);
        }
    }

    public function capacityPlanningExport(CapacityPlanningRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx'], true)) {
            abort(404);
        }

        try {
            $result = $this->capacityPlanningReport->build($request->validated());
            $filename = 'capacity_planning_'.now()->format('Y-m-d_H-i-s');

            $export = new CapacityPlanningExport($result);

            return match ($format) {
                'xlsx' => Excel::download($export, $filename.'.xlsx'),
                'csv' => Excel::download($export, $filename.'.csv', \Maatwebsite\Excel\Excel::CSV),
                default => abort(404),
            };
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to export capacity planning report.']);
        }
    }

    public function networkOptimization(NetworkOptimizationRequest $request): Response|RedirectResponse
    {
        try {
            $result = $this->networkOptimizationReport->build($request->validated());

            return Inertia::render('Reports/NetworkOptimization', [
                ...$result,
                'filters' => [
                    'from' => $result['resolved_from'] ?? null,
                    'to' => $result['resolved_to'] ?? null,
                ],
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to load network optimization report.']);
        }
    }

    public function networkOptimizationExport(NetworkOptimizationRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx'], true)) {
            abort(404);
        }

        try {
            $result = $this->networkOptimizationReport->build($request->validated());
            $filename = 'network_optimization_'.now()->format('Y-m-d_H-i-s');

            $export = new NetworkOptimizationExport($result);

            return match ($format) {
                'xlsx' => Excel::download($export, $filename.'.xlsx'),
                'csv' => Excel::download($export, $filename.'.csv', \Maatwebsite\Excel\Excel::CSV),
                default => abort(404),
            };
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to export network optimization report.']);
        }
    }

    private function fuelEfficiencyRowsWithTotals(Collection $rows, array $totals, array $summary): Collection
    {
        $data = $rows->map(static fn ($row) => $row)->values();

        $data->push([
            'plate' => 'TOTALS',
            'status' => null,
            'trip_count' => $totals['trip_count'] ?? 0,
            'total_liters' => $totals['total_liters'] ?? 0.0,
            'total_cost' => $totals['total_cost'] ?? 0.0,
            'distance_loaded_km' => $totals['total_loaded_distance_km'] ?? 0.0,
            'distance_empty_km' => $totals['total_empty_distance_km'] ?? 0.0,
            'distance_total_km' => $totals['total_distance_km'] ?? 0.0,
            'efficiency_km_per_liter' => $summary['fleet_efficiency_km_per_liter'] ?? null,
            'cost_per_km' => $summary['fleet_cost_per_km'] ?? null,
            'cost_per_liter' => $summary['average_cost_per_liter'] ?? null,
            'avg_liters_per_trip' => $summary['average_liters_per_trip'] ?? null,
            'avg_cost_per_trip' => $summary['average_cost_per_trip'] ?? null,
            'first_activity_on' => null,
            'last_activity_on' => null,
            'driver_names' => [],
            'loaded_distance_share_percent' => $summary['loaded_distance_share_percent'] ?? null,
            'empty_distance_share_percent' => $summary['empty_distance_share_percent'] ?? null,
        ]);

        return $data->values();
    }

    private function exportFuelEfficiencyCsv(Collection $rows, array $totals, array $summary, string $from, string $to, string $filename)
    {
        $headings = [
            'Truck',
            'Status',
            'Trips',
            'Total Liters',
            'Total Cost',
            'Loaded Distance (km)',
            'Empty Distance (km)',
            'Total Distance (km)',
            'Efficiency (km/L)',
            'Cost/km',
            'Cost/L',
            'Avg Liters/Trip',
            'Avg Cost/Trip',
            'First Activity',
            'Last Activity',
            'Drivers',
            'Loaded Distance %',
            'Empty Distance %',
        ];

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $exportRows = $this->fuelEfficiencyRowsWithTotals($rows, $totals, $summary);

        return HttpResponse::streamDownload(static function () use ($exportRows, $headings, $summary, $from, $to) {
            $handle = fopen('php://output', 'w');

            $formatDecimal = static fn ($value) => $value === null ? '—' : number_format((float) $value, 2, '.', '');
            $formatPercent = static fn ($value) => $value === null ? '—' : number_format((float) $value, 2, '.', '');

            fputcsv($handle, ['Fuel Efficiency & Cost Report']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, [
                sprintf(
                    'Fleet efficiency: %s km/L · Fleet cost/km: %s · Avg cost/trip: %s',
                    $formatDecimal($summary['fleet_efficiency_km_per_liter'] ?? null),
                    $formatDecimal($summary['fleet_cost_per_km'] ?? null),
                    $formatDecimal($summary['average_cost_per_trip'] ?? null)
                ),
            ]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($exportRows as $row) {
                $drivers = $row['driver_names'] ?? [];

                if (is_array($drivers)) {
                    $drivers = implode(', ', $drivers);
                }

                fputcsv($handle, [
                    $row['plate'] ?? '—',
                    $row['status'] ?? '—',
                    $row['trip_count'] ?? 0,
                    $formatDecimal($row['total_liters'] ?? null),
                    $formatDecimal($row['total_cost'] ?? null),
                    $formatDecimal($row['distance_loaded_km'] ?? null),
                    $formatDecimal($row['distance_empty_km'] ?? null),
                    $formatDecimal($row['distance_total_km'] ?? null),
                    $formatDecimal($row['efficiency_km_per_liter'] ?? null),
                    $formatDecimal($row['cost_per_km'] ?? null),
                    $formatDecimal($row['cost_per_liter'] ?? null),
                    $formatDecimal($row['avg_liters_per_trip'] ?? null),
                    $formatDecimal($row['avg_cost_per_trip'] ?? null),
                    $row['first_activity_on'] ?? '—',
                    $row['last_activity_on'] ?? '—',
                    $drivers ?: '—',
                    $formatPercent($row['loaded_distance_share_percent'] ?? null),
                    $formatPercent($row['empty_distance_share_percent'] ?? null),
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportFuelEfficiencyExcel(Collection $rows, array $totals, array $summary, string $filename)
    {
        return Excel::download(new FuelEfficiencyExport($this->fuelEfficiencyRowsWithTotals($rows, $totals, $summary)), $filename);
    }

    private function exportFuelEfficiencyPdf(Collection $rows, array $totals, array $summary, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.fuel_efficiency_pdf', [
            'rows' => $rows->values()->all(),
            'totals' => $totals,
            'summary' => $summary,
            'from' => $from,
            'to' => $to,
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return HttpResponse::make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function customerProfitabilityRowsWithTotals(Collection $rows, array $summary): Collection
    {
        $data = $rows->map(static fn ($row) => $row)->values();

        $data->push([
            'customer_id' => null,
            'customer_name' => 'TOTALS',
            'operations' => $summary['operations'] ?? $rows->sum('operations'),
            'lanes_used' => (int) $rows->sum('lanes_used'),
            'internal_trips' => $summary['internal_trips'] ?? $rows->sum('internal_trips'),
            'outsource_trips' => $summary['outsource_trips'] ?? $rows->sum('outsource_trips'),
            'total_trips' => $summary['total_trips'] ?? $rows->sum('total_trips'),
            'total_tonnage' => $summary['total_tonnage'] ?? $rows->sum('total_tonnage'),
            'revenue' => $summary['revenue'] ?? $rows->sum('revenue'),
            'total_cost' => $summary['total_cost'] ?? $rows->sum('total_cost'),
            'profit' => $summary['profit'] ?? $rows->sum('profit'),
            'margin_percent' => $summary['margin_percent'] ?? null,
            'revenue_per_trip' => $summary['revenue_per_trip'] ?? null,
            'cost_per_trip' => $summary['cost_per_trip'] ?? null,
            'cost_per_km' => $summary['cost_per_km'] ?? null,
            'outsource_trip_share_percent' => $summary['outsource_trip_share_percent'] ?? null,
            'outsource_tonnage_share_percent' => $summary['outsource_tonnage_share_percent'] ?? null,
        ]);

        return $data->values();
    }

    private function exportCustomerProfitabilityCsv(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $headings = [
            'Customer',
            'Operations',
            'Lanes',
            'Internal Trips',
            'Outsource Trips',
            'Total Trips',
            'Total Tonnage (MT)',
            'Revenue',
            'Total Cost',
            'Profit',
            'Margin %',
            'Revenue / Trip',
            'Cost / Trip',
            'Cost / Km',
            'Outsource Trip Share %',
            'Outsource Tonnage Share %',
        ];

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $exportRows = $this->customerProfitabilityRowsWithTotals($rows, $summary);

        return HttpResponse::streamDownload(static function () use ($exportRows, $headings, $summary, $from, $to) {
            $handle = fopen('php://output', 'w');

            $formatDecimal = static fn ($value) => $value === null ? '—' : number_format((float) $value, 2, '.', '');
            $formatPercent = static fn ($value) => $value === null ? '—' : number_format((float) $value, 2, '.', '');

            fputcsv($handle, ['Customer Profitability Report']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, [
                sprintf(
                    'Customers: %s · Margin: %s%% · Revenue: %s',
                    $summary['customer_count'] ?? '—',
                    $formatPercent($summary['margin_percent'] ?? null),
                    $formatDecimal($summary['revenue'] ?? null)
                ),
            ]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($exportRows as $row) {
                fputcsv($handle, [
                    $row['customer_name'] ?? '—',
                    $row['operations'] ?? 0,
                    $row['lanes_used'] ?? 0,
                    $row['internal_trips'] ?? 0,
                    $row['outsource_trips'] ?? 0,
                    $row['total_trips'] ?? 0,
                    $formatDecimal($row['total_tonnage'] ?? null),
                    $formatDecimal($row['revenue'] ?? null),
                    $formatDecimal($row['total_cost'] ?? null),
                    $formatDecimal($row['profit'] ?? null),
                    $formatPercent($row['margin_percent'] ?? null),
                    $formatDecimal($row['revenue_per_trip'] ?? null),
                    $formatDecimal($row['cost_per_trip'] ?? null),
                    $formatDecimal($row['cost_per_km'] ?? null),
                    $formatPercent($row['outsource_trip_share_percent'] ?? null),
                    $formatPercent($row['outsource_tonnage_share_percent'] ?? null),
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportCustomerProfitabilityExcel(Collection $rows, array $summary, string $filename)
    {
        return Excel::download(new CustomerProfitabilityExport($this->customerProfitabilityRowsWithTotals($rows, $summary)), $filename);
    }

    private function exportCustomerProfitabilityPdf(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.customer_profitability_pdf', [
            'rows' => $rows->values()->all(),
            'summary' => $summary,
            'from' => $from,
            'to' => $to,
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return HttpResponse::make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function maintenanceRowsWithTotals(Collection $rows, array $totals, array $summary): Collection
    {
        $data = $rows->map(static fn ($row) => $row)->values();

        $data->push([
            'truck_id' => null,
            'plate' => 'TOTALS',
            'status' => null,
            'records' => $totals['records'] ?? 0,
            'completed' => $totals['completed'] ?? 0,
            'scheduled' => $totals['scheduled'] ?? 0,
            'in_progress' => $totals['in_progress'] ?? 0,
            'overdue' => $totals['overdue'] ?? 0,
            'completion_rate_pct' => $summary['completion_rate_pct'] ?? null,
            'overdue_rate_pct' => $summary['overdue_rate_pct'] ?? null,
            'total_cost' => $totals['total_cost'] ?? 0.0,
            'completed_cost' => $totals['completed_cost'] ?? 0.0,
            'open_cost' => $totals['open_cost'] ?? 0.0,
            'average_cost' => $summary['average_cost_per_record'] ?? null,
            'average_completion_days' => $summary['average_completion_days'] ?? null,
            'last_completed_at' => null,
            'next_scheduled_at' => null,
            'max_overdue_days' => null,
        ]);

        return $data->values();
    }

    private function exportMaintenanceCsv(Collection $rows, array $totals, array $summary, string $from, string $to, string $filename)
    {
        $headings = [
            'Truck',
            'Status',
            'Records',
            'Completed',
            'Scheduled',
            'In Progress',
            'Overdue',
            'Completion Rate %',
            'Overdue Rate %',
            'Total Cost',
            'Completed Cost',
            'Open Cost',
            'Average Cost',
            'Avg Completion Days',
            'Last Completed',
            'Next Scheduled',
            'Max Overdue Days',
        ];

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $exportRows = $this->maintenanceRowsWithTotals($rows, $totals, $summary);

        return HttpResponse::streamDownload(static function () use ($exportRows, $headings, $summary, $from, $to) {
            $handle = fopen('php://output', 'w');

            $formatDecimal = static fn ($value) => $value === null ? '—' : number_format((float) $value, 2, '.', '');
            $formatPercent = static fn ($value) => $value === null ? '—' : number_format((float) $value, 2, '.', '');

            fputcsv($handle, ['Maintenance Performance Report']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, [
                sprintf(
                    'Completion rate: %s%% · Overdue rate: %s%% · Avg cost/record: %s',
                    $formatPercent($summary['completion_rate_pct'] ?? null),
                    $formatPercent($summary['overdue_rate_pct'] ?? null),
                    $formatDecimal($summary['average_cost_per_record'] ?? null)
                ),
            ]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($exportRows as $row) {
                fputcsv($handle, [
                    $row['plate'] ?? '—',
                    $row['status'] ?? '—',
                    $row['records'] ?? 0,
                    $row['completed'] ?? 0,
                    $row['scheduled'] ?? 0,
                    $row['in_progress'] ?? 0,
                    $row['overdue'] ?? 0,
                    $formatPercent($row['completion_rate_pct'] ?? null),
                    $formatPercent($row['overdue_rate_pct'] ?? null),
                    $formatDecimal($row['total_cost'] ?? null),
                    $formatDecimal($row['completed_cost'] ?? null),
                    $formatDecimal($row['open_cost'] ?? null),
                    $formatDecimal($row['average_cost'] ?? null),
                    $formatDecimal($row['average_completion_days'] ?? null),
                    $row['last_completed_at'] ?? '—',
                    $row['next_scheduled_at'] ?? '—',
                    $formatDecimal($row['max_overdue_days'] ?? null),
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportMaintenanceExcel(Collection $rows, array $totals, array $summary, string $filename)
    {
        return Excel::download(new MaintenanceExport($this->maintenanceRowsWithTotals($rows, $totals, $summary)), $filename);
    }

    private function exportMaintenancePdf(Collection $rows, array $totals, array $summary, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.maintenance_pdf', [
            'rows' => $rows->values()->all(),
            'totals' => $totals,
            'summary' => $summary,
            'from' => $from,
            'to' => $to,
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return HttpResponse::make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Display truck grading leaderboard report.
     */
    public function truckGrading(TruckGradingReportRequest $request): Response|RedirectResponse
    {
        try {
            $result = $this->truckGradingReport->build($request->validated());

            return Inertia::render('Reports/TruckGrading', [
                'filters' => $result['filters'],
                'filterOptions' => $result['filter_options'],
                'paginator' => $result['paginator'],
                'latestCalculation' => $result['latest_calculation'],
                'perPageOptions' => $result['per_page_options'],
                'can' => [
                    'recalculate' => $request->user()?->can('trucks.update') ?? false,
                ],
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to generate truck grading report.']);
        }
    }

    /**
     * Display driver grading leaderboard report.
     */
    public function driverGrading(\App\Http\Requests\Reports\DriverGradingReportRequest $request): Response|RedirectResponse
    {
        try {
            $result = $this->driverGradingReport->build($request->validated());

            return Inertia::render('Reports/DriverGrading', [
                'filters' => $result['filters'],
                'filterOptions' => $result['filter_options'],
                'paginator' => $result['paginator'],
                'latestCalculation' => $result['latest_calculation'],
                'perPageOptions' => $result['per_page_options'],
                'can' => [
                    'recalculate' => $request->user()?->can('drivers.update') ?? false,
                ],
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to generate driver grading report.']);
        }
    }

    /**
     * Display driver-truck grading leaderboard report.
     */
    public function driverTruckGrading(\App\Http\Requests\Reports\DriverTruckGradingReportRequest $request): Response|RedirectResponse
    {
        try {
            $result = $this->driverTruckGradingReport->build($request->validated());

            return Inertia::render('Reports/DriverTruckGrading', [
                'filters' => $result['filters'],
                'filterOptions' => $result['filter_options'],
                'paginator' => $result['paginator'],
                'latestCalculation' => $result['latest_calculation'],
                'perPageOptions' => $result['per_page_options'],
                'can' => [
                    'recalculate' => $request->user()?->can('driver-trucks.update') ?? false,
                ],
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to generate driver-truck grading report.']);
        }
    }

    public function driverSafety(DriverSafetyReportRequest $request): Response|RedirectResponse
    {
        try {
            $payload = $this->driverSafetyReport->build($request->validated());

            return Inertia::render('Reports/DriverSafety', [
                'filters' => $payload['filters'],
                'summary' => $payload['summary'],
                'severityBreakdown' => $payload['severity_breakdown'],
                'incidentTypeBreakdown' => $payload['incident_type_breakdown'],
                'driverLeaderboard' => $payload['driver_leaderboard'],
                'trend' => $payload['trend'],
                'recentIncidents' => $payload['recent_incidents'],
                'options' => $payload['options'],
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to generate driver safety report.']);
        }
    }

    /**
     * Display outsource vendor performance report (on-time %, cost differential, quality rate).
     */
    public function outsourcePerformanceReport(OutsourcePerformanceRequest $request): Response|RedirectResponse
    {
        try {
            $payload = $this->outsourcePerformanceReport->build($request->validated());

            // Cache vendor options (1 hour) - changes when outsources are added/removed
            $vendorOptions = Cache::remember('reports.outsource_performance.vendor_options', 3600, function () {
                return Outsource::query()
                    ->select(['id', 'name', 'status'])
                    ->orderBy('name')
                    ->get()
                    ->map(static fn (Outsource $outsource) => [
                        'id' => $outsource->id,
                        'name' => $outsource->name,
                        'status' => $outsource->status,
                    ])
                    ->values()
                    ->all();
            });

            // Cache status options (1 hour) - rarely changes
            $statusOptions = Cache::remember('reports.outsource_performance.status_options', 3600, function () {
                return OutsourcePerformance::query()
                    ->select('status')
                    ->whereNotNull('status')
                    ->distinct()
                    ->orderBy('status')
                    ->pluck('status')
                    ->filter()
                    ->map(static fn (string $status) => [
                        'value' => $status,
                        'label' => ucwords(str_replace(['_', '-'], ' ', $status)),
                    ])
                    ->values()
                    ->all();
            });

            // Cache operations (1 hour) - changes when operations are added/removed
            $operations = Cache::remember('reports.outsource_performance.operations', 3600, function () {
                return Operation::query()
                    ->select('id', 'operationid', 'status', 'customer_id')
                    ->with('customer:id,name')
                    ->orderBy('operationid')
                    ->limit(300)
                    ->get()
                    ->map(static fn (Operation $operation) => [
                        'id' => $operation->id,
                        'code' => $operation->operationid ?? 'OP-'.$operation->id,
                        'status' => $operation->status,
                        'customer' => $operation->customer?->name,
                    ])
                    ->values();
            });

            // Cache destinations (1 hour) - changes when places are added/removed
            $destinations = Cache::remember('reports.outsource_performance.destinations', 3600, function () {
                return Place::query()
                    ->select('id', 'name', 'status')
                    ->orderBy('name')
                    ->limit(300)
                    ->get()
                    ->map(static fn (Place $place) => [
                        'id' => $place->id,
                        'name' => $place->name,
                        'status' => $place->status,
                    ])
                    ->values();
            });

            $rows = $payload['rows'] instanceof Collection
                ? $payload['rows']->values()->all()
                : collect($payload['rows'])->values()->all();

            return Inertia::render('Reports/OutsourcePerformance', [
                'filters' => [
                    'from' => $payload['resolved_from'],
                    'to' => $payload['resolved_to'],
                    'outsource_ids' => $payload['filters']['outsource_ids'],
                    'operation_ids' => $payload['filters']['operation_ids'],
                    'destination_ids' => $payload['filters']['destination_ids'],
                    'statuses' => $payload['filters']['statuses'],
                    'limit' => $payload['filters']['limit'],
                ],
                'rows' => $rows,
                'summary' => $payload['summary'],
                'highlights' => $payload['highlights'],
                'options' => [
                    'vendors' => $vendorOptions,
                    'operations' => $operations,
                    'destinations' => $destinations,
                    'statuses' => $statusOptions,
                ],
            ]);

        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to generate outsource performance report.']);
        }
    }

    public function outsourcePerformanceExport(OutsourcePerformanceRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        $validated = array_merge($request->validated(), ['format' => $format]);
        $result = $this->outsourcePerformanceReport->build($validated);

        $rows = $result['rows'] instanceof Collection
            ? $result['rows']
            : collect($result['rows']);

        $filename = 'outsource_performance_'.now()->format('Y-m-d_H-i-s');

        return match ($format) {
            'csv' => $this->exportOutsourceCsv(
                $this->performanceAllRowsWithTotals($rows, $result['summary']),
                $result['resolved_from'],
                $result['resolved_to'],
                $filename.'.csv'
            ),
            'xlsx' => $this->exportOutsourceExcel(
                $this->performanceAllRowsWithTotals($rows, $result['summary']),
                $filename.'.xlsx'
            ),
            'pdf' => $this->exportOutsourcePdf(
                $rows,
                $result['summary'],
                $result['resolved_from'],
                $result['resolved_to'],
                $filename.'.pdf'
            ),
            default => abort(404),
        };
    }

    /**
     * Display operation profitability report (how profitable each operation is).
     */
    public function operationProfitability(Request $request): Response|RedirectResponse
    {
        try {
            $payload = $this->buildOperationProfitability($request->all());

            $customerOptions = Cache::remember('reports.operation_profitability.customer_options', 3600, function () {
                return Customer::query()
                    ->select(['id', 'name', 'status'])
                    ->orderBy('name')
                    ->get()
                    ->map(static fn (Customer $customer) => [
                        'id' => $customer->id,
                        'name' => $customer->name,
                        'status' => $customer->status,
                    ])
                    ->values()
                    ->all();
            });

            $regionOptions = Cache::remember('reports.operation_profitability.region_options', 3600, function () {
                return Region::query()
                    ->select(['id', 'name'])
                    ->orderBy('name')
                    ->get()
                    ->map(static fn (Region $region) => [
                        'id' => $region->id,
                        'name' => $region->name,
                    ])
                    ->values()
                    ->all();
            });

            return Inertia::render('Reports/OperationProfitability', [
                'filters' => [
                    'from' => $payload['resolved_from'],
                    'to' => $payload['resolved_to'],
                    'customer_ids' => $payload['filters']['customer_ids'],
                    'region_ids' => $payload['filters']['region_ids'],
                    'service_types' => $payload['filters']['service_types'],
                ],
                'totals' => $payload['totals'],
                'operations' => $payload['rows']->all(),
                'options' => [
                    'customers' => $customerOptions,
                    'regions' => $regionOptions,
                    'service_types' => CargoServiceType::options(),
                ],
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate operation profitability report.']);
        }
    }

    public function operationProfitabilityExport(Request $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        try {
            $payload = $this->buildOperationProfitability($request->all());

            $rows = $payload['rows'] instanceof Collection
                ? $payload['rows']
                : collect($payload['rows']);

            $totals = $payload['totals'];
            $from = $payload['resolved_from'];
            $to = $payload['resolved_to'];
            $filename = 'operation_profitability_'.now()->format('Y-m-d_H-i-s');

            return match ($format) {
                'csv' => $this->exportOperationProfitabilityCsv(
                    $this->operationProfitabilityRowsWithTotals($rows, $totals),
                    $from,
                    $to,
                    $filename.'.csv'
                ),
                'xlsx' => $this->exportOperationProfitabilityExcel(
                    $this->operationProfitabilityRowsWithTotals($rows, $totals),
                    $filename.'.xlsx'
                ),
                'pdf' => $this->exportOperationProfitabilityPdf(
                    $rows,
                    $totals,
                    $from,
                    $to,
                    $filename.'.pdf'
                ),
                default => abort(404),
            };
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to export operation profitability report.']);
        }
    }

    private function buildOperationProfitability(array $input): array
    {
        $defaultFrom = now()->subMonths(6)->toDateString();
        $defaultTo = now()->toDateString();

        $from = $input['from'] ?? $defaultFrom;
        $to = $input['to'] ?? $defaultTo;

        $customerIds = collect(Arr::wrap($input['customer_ids'] ?? []))
            ->merge(Arr::wrap($input['customer_id'] ?? []))
            ->map(static fn ($value) => (int) $value)
            ->filter(static fn (int $value) => $value > 0)
            ->unique()
            ->values();

        $regionIds = collect(Arr::wrap($input['region_ids'] ?? []))
            ->merge(Arr::wrap($input['region_id'] ?? []))
            ->map(static fn ($value) => (int) $value)
            ->filter(static fn (int $value) => $value > 0)
            ->unique()
            ->values();

        $serviceTypes = collect(Arr::wrap($input['service_types'] ?? []))
            ->merge(Arr::wrap($input['service_type'] ?? []))
            ->map(static function ($value) {
                if ($value instanceof CargoServiceType) {
                    return $value;
                }

                if (is_string($value) || is_numeric($value)) {
                    return CargoServiceType::tryFrom((string) $value);
                }

                return null;
            })
            ->filter()
            ->map(static fn (CargoServiceType $type) => $type->value)
            ->unique()
            ->values();

        if (Carbon::parse($from)->gt(Carbon::parse($to))) {
            [$from, $to] = [$to, $from];
        }

        $performancesQuery = Performance::query()
            ->with([
                'operation.customer',
                'operation.destinationReference' => function (MorphTo $morphTo) {
                    $morphTo->morphWith([
                        Region::class => [],
                        Zone::class => ['region'],
                        Woreda::class => ['zone.region'],
                        Place::class => ['woreda.zone.region'],
                    ]);
                },
            ])
            ->whereBetween('DateDispach', [$from, $to]);

        if ($customerIds->isNotEmpty()) {
            $performancesQuery->whereHas('operation', function (Builder $operationQuery) use ($customerIds) {
                $operationQuery->whereIn('customer_id', $customerIds);
            });
        }

        if ($regionIds->isNotEmpty()) {
            $performancesQuery->whereHas('operation', function (Builder $operationQuery) use ($regionIds) {
                $operationQuery->where(function (Builder $regionFilter) use ($regionIds) {
                    $regionFilter
                        ->where(function (Builder $directRegion) use ($regionIds) {
                            $directRegion
                                ->where('destination_scope', OperationDestinationScope::Region->value)
                                ->where('destination_reference_type', Region::class)
                                ->whereIn('destination_reference_id', $regionIds);
                        })
                        ->orWhereHasMorph(
                            'destinationReference',
                            [Zone::class, Woreda::class, Place::class],
                            function (Builder $destinationQuery, string $type) use ($regionIds) {
                                if ($type === Zone::class) {
                                    $destinationQuery->whereIn('region_id', $regionIds);

                                    return;
                                }

                                if ($type === Woreda::class) {
                                    $destinationQuery->whereHas('zone', function (Builder $zoneQuery) use ($regionIds) {
                                        $zoneQuery->whereIn('region_id', $regionIds);
                                    });

                                    return;
                                }

                                if ($type === Place::class) {
                                    $destinationQuery->whereHas('woreda.zone', function (Builder $zoneQuery) use ($regionIds) {
                                        $zoneQuery->whereIn('region_id', $regionIds);
                                    });
                                }
                            }
                        );
                });
            });
        }

        if ($serviceTypes->isNotEmpty()) {
            $performancesQuery->whereHas('operation', function (Builder $operationQuery) use ($serviceTypes) {
                $operationQuery->whereIn('cargo_service_type', $serviceTypes);
            });
        }

        $performances = $performancesQuery->get();

        $rowsCollection = $performances
            ->groupBy('operation_id')
            ->map(function (Collection $group) {
                /** @var Performance|null $first */
                $first = $group->first();
                $operation = $first?->operation;

                if ($operation === null) {
                    return null;
                }

                $revenue = 0.0;
                $cost = 0.0;
                $tonnage = 0.0;
                $totalKm = 0.0;

                foreach ($group as $performance) {
                    $volume = (float) ($performance->CargoVolumMT ?? 0);
                    $revenue += (float) ($operation->tariff ?? 0) * $volume;
                    $cost += (float) ($performance->fuelInBirr ?? 0)
                        + (float) ($performance->perdiem ?? 0)
                        + (float) ($performance->other ?? 0);
                    $tonnage += $volume;
                    $totalKm += (float) ($performance->DistanceWCargo ?? 0)
                        + (float) ($performance->DistanceWOCargo ?? 0);
                }

                $trips = $group->count();
                $profit = $revenue - $cost;
                $margin = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : null;
                $avgKmPerTrip = $trips > 0 ? $totalKm / $trips : 0.0;
                $costPerKm = $totalKm > 0 ? round($cost / $totalKm, 2) : null;

                return [
                    'operation_id' => $operation->getKey(),
                    'code' => $operation->operationid ?? (string) $operation->getKey(),
                    'customer_name' => $operation->customer->name ?? 'N/A',
                    'region_name' => $this->resolveOperationRegionName($operation),
                    'revenue' => round($revenue, 2),
                    'cost' => round($cost, 2),
                    'profit' => round($profit, 2),
                    'margin_percent' => $margin,
                    'trips' => $trips,
                    'tonnage' => round($tonnage, 2),
                    'avg_km_per_trip' => round($avgKmPerTrip, 2),
                    'cost_per_km' => $costPerKm,
                    'total_km' => round($totalKm, 2),
                ];
            })
            ->filter()
            ->sortByDesc('profit')
            ->values();

        $sumRevenue = $rowsCollection->sum('revenue');
        $sumCost = $rowsCollection->sum('cost');
        $sumProfit = $rowsCollection->sum('profit');
        $sumTrips = (int) $rowsCollection->sum('trips');
        $sumTonnage = $rowsCollection->sum('tonnage');
        $sumTotalKm = $rowsCollection->sum('total_km');

        $totals = [
            'revenue' => round($sumRevenue, 2),
            'cost' => round($sumCost, 2),
            'profit' => round($sumProfit, 2),
            'operations' => $rowsCollection->count(),
            'trips' => $sumTrips,
            'tonnage' => round($sumTonnage, 2),
            'distance' => round($sumTotalKm, 2),
            'margin_percent' => $sumRevenue > 0
                ? round(($sumProfit / $sumRevenue) * 100, 2)
                : null,
            'avg_km_per_trip' => $sumTrips > 0 ? round($sumTotalKm / $sumTrips, 2) : null,
            'cost_per_km' => $sumTotalKm > 0 ? round($sumCost / $sumTotalKm, 2) : null,
        ];

        return [
            'rows' => $rowsCollection,
            'totals' => $totals,
            'resolved_from' => $from,
            'resolved_to' => $to,
            'filters' => [
                'customer_ids' => $customerIds->all(),
                'region_ids' => $regionIds->all(),
                'service_types' => $serviceTypes->all(),
            ],
        ];
    }

    private function operationProfitabilityRowsWithTotals(Collection $rows, array $totals): Collection
    {
        $data = collect($rows->all());

        $data->push([
            'operation_id' => null,
            'code' => 'TOTALS',
            'customer_name' => null,
            'region_name' => null,
            'revenue' => $totals['revenue'],
            'cost' => $totals['cost'],
            'profit' => $totals['profit'],
            'margin_percent' => $totals['margin_percent'],
            'trips' => $totals['trips'],
            'tonnage' => $totals['tonnage'],
            'avg_km_per_trip' => $totals['avg_km_per_trip'],
            'cost_per_km' => $totals['cost_per_km'],
            'total_km' => $totals['distance'],
        ]);

        return $data->values();
    }

    private function exportOperationProfitabilityCsv(Collection $rows, string $from, string $to, string $filename)
    {
        $headings = [
            'Operation',
            'Customer',
            'Region',
            'Revenue',
            'Cost',
            'Profit',
            'Margin %',
            'Trips',
            'Tonnage (MT)',
            'Avg Km/Trip',
            'Cost/Km',
        ];

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return HttpResponse::streamDownload(static function () use ($rows, $headings, $from, $to) {
            $handle = fopen('php://output', 'w');

            $formatDecimal = static fn ($value) => $value === null ? null : number_format((float) $value, 2, '.', '');
            $formatPercent = static fn ($value) => $value === null ? null : number_format((float) $value, 2, '.', '');

            fputcsv($handle, ['Operation Profitability Report']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['code'],
                    $row['customer_name'] ?? '—',
                    $row['region_name'] ?? '—',
                    $formatDecimal($row['revenue']),
                    $formatDecimal($row['cost']),
                    $formatDecimal($row['profit']),
                    $formatPercent($row['margin_percent']),
                    $row['trips'],
                    $formatDecimal($row['tonnage']),
                    $formatDecimal($row['avg_km_per_trip']),
                    $formatDecimal($row['cost_per_km']),
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportOperationProfitabilityExcel(Collection $rows, string $filename)
    {
        return Excel::download(new OperationProfitabilityExport($rows), $filename);
    }

    private function exportOperationProfitabilityPdf(Collection $rows, array $totals, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.operation_profitability_pdf', [
            'rows' => $rows->all(),
            'totals' => $totals,
            'from' => $from,
            'to' => $to,
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return HttpResponse::make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function resolveOperationRegionName(Operation $operation): string
    {
        $destination = $operation->destinationReference;

        if ($destination instanceof Region) {
            return $destination->name;
        }

        if ($destination instanceof Zone) {
            return $destination->region->name ?? 'N/A';
        }

        if ($destination instanceof Woreda) {
            return $destination->zone?->region?->name ?? 'N/A';
        }

        if ($destination instanceof Place) {
            return $destination->woreda?->zone?->region?->name ?? 'N/A';
        }

        $scope = $operation->destination_scope instanceof OperationDestinationScope
            ? $operation->destination_scope
            : OperationDestinationScope::tryFrom((string) $operation->destination_scope);

        if ($scope === null || $operation->destination_reference_id === null) {
            return $operation->destination_name ?? 'N/A';
        }

        return match ($scope) {
            OperationDestinationScope::Region => $this->lookupRegionName($operation->destination_reference_id) ?? ($operation->destination_name ?? 'N/A'),
            OperationDestinationScope::Zone => $this->lookupZoneRegionName($operation->destination_reference_id) ?? ($operation->destination_name ?? 'N/A'),
            OperationDestinationScope::Woreda => $this->lookupWoredaRegionName($operation->destination_reference_id) ?? ($operation->destination_name ?? 'N/A'),
            OperationDestinationScope::Place => $this->lookupPlaceRegionName($operation->destination_reference_id) ?? ($operation->destination_name ?? 'N/A'),
        };
    }

    private function lookupRegionName(int $regionId): ?string
    {
        if (! array_key_exists($regionId, $this->regionNameCache)) {
            $this->regionNameCache[$regionId] = Region::withTrashed()->find($regionId)?->name;
        }

        return $this->regionNameCache[$regionId];
    }

    private function lookupZoneRegionName(int $zoneId): ?string
    {
        if (! array_key_exists($zoneId, $this->zoneRegionNameCache)) {
            $this->zoneRegionNameCache[$zoneId] = Zone::withTrashed()->with('region')->find($zoneId)?->region?->name;
        }

        return $this->zoneRegionNameCache[$zoneId];
    }

    private function lookupWoredaRegionName(int $woredaId): ?string
    {
        if (! array_key_exists($woredaId, $this->woredaRegionNameCache)) {
            $this->woredaRegionNameCache[$woredaId] = Woreda::withTrashed()->with('zone.region')->find($woredaId)?->zone?->region?->name;
        }

        return $this->woredaRegionNameCache[$woredaId];
    }

    private function lookupPlaceRegionName(int $placeId): ?string
    {
        if (! array_key_exists($placeId, $this->placeRegionNameCache)) {
            $this->placeRegionNameCache[$placeId] = Place::withTrashed()->with('woreda.zone.region')->find($placeId)?->woreda?->zone?->region?->name;
        }

        return $this->placeRegionNameCache[$placeId];
    }

    /**
     * Display geographic heatmaps (trips/tonnage/revenue by geography).
     */
    public function geographyHeatmaps(Request $request): Response|RedirectResponse
    {
        try {
            $from = $request->input('from', now()->subMonths(6)->toDateString());
            $to = $request->input('to', now()->toDateString());

            if (Carbon::parse($from)->gt(Carbon::parse($to))) {
                [$from, $to] = [$to, $from];
            }

            $report = $this->buildGeographyHeatmapsReport($from, $to);

            return Inertia::render('Reports/GeographyHeatmaps', [
                'filters' => ['from' => $from, 'to' => $to],
                'regions' => $report['regions'],
                'zones' => $report['zones'],
                'woredas' => $report['woredas'],
                'places' => $report['places'],
                'regionTrends' => $report['regionTrends'],
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate geographic heatmaps report.']);
        }
    }

    public function geographyHeatmapsExport(Request $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        $from = $request->input('from', now()->subMonths(6)->toDateString());
        $to = $request->input('to', now()->toDateString());

        if (Carbon::parse($from)->gt(Carbon::parse($to))) {
            [$from, $to] = [$to, $from];
        }

        $report = $this->buildGeographyHeatmapsReport($from, $to);
        $rows = $this->geographyRowsWithTotals($report);

        $filename = 'geography_heatmaps_'.now()->format('Y-m-d_H-i-s');

        return match ($format) {
            'csv' => $this->exportGeographyCsv($rows, $from, $to, $filename.'.csv'),
            'xlsx' => $this->exportGeographyExcel($rows, $filename.'.xlsx'),
            'pdf' => $this->exportGeographyPdf($rows, $report['totals'], $from, $to, $filename.'.pdf'),
            default => abort(404),
        };
    }

    /**
     * Legacy-style: list recent performances with joins.
     */
    public function performanceAll(PerformanceAllRequest $request): Response|RedirectResponse
    {
        try {
            $result = $this->performanceAllReport->build($request->validated());

            $paginator = $result['paginator'];
            $summary = $result['summary'];
            $highlights = $result['highlights'];

            // Cache driver options (1 hour) - changes when drivers are added/removed
            $drivers = Cache::remember('reports.performance_all.driver_options', 3600, function () {
                return Driver::query()
                    ->select('id', 'name', 'status')
                    ->orderBy('name')
                    ->get()
                    ->map(static fn (Driver $driver) => [
                        'id' => $driver->id,
                        'name' => $driver->name ?? 'Unassigned',
                        'status' => $driver->status,
                    ])
                    ->values();
            });

            // Cache truck options (1 hour) - changes when trucks are added/removed
            $trucks = Cache::remember('reports.performance_all.truck_options', 3600, function () {
                return Truck::query()
                    ->select('id', 'plate', 'status')
                    ->orderBy('plate')
                    ->get()
                    ->map(static fn (Truck $truck) => [
                        'id' => $truck->id,
                        'name' => $truck->plate ?? '—',
                        'plate' => $truck->plate ?? '—',
                        'status' => $truck->status,
                    ])
                    ->values();
            });

            // Cache operations (1 hour) - changes when operations are added/removed
            $operations = Cache::remember('reports.performance_all.operations', 3600, function () {
                return Operation::query()
                    ->select('id', 'operationid', 'status', 'customer_id')
                    ->with('customer:id,name')
                    ->orderBy('operationid')
                    ->limit(300)
                    ->get()
                    ->map(static fn (Operation $operation) => [
                        'id' => $operation->id,
                        'code' => $operation->operationid ?? 'OP-'.$operation->id,
                        'status' => $operation->status,
                        'customer' => $operation->customer?->name,
                    ])
                    ->values();
            });

            $loadPhases = collect([
                ['id' => 'main', 'label' => 'Main trip'],
                ['id' => 'return', 'label' => 'Return trip'],
            ])->values();

            return Inertia::render('Reports/PerformanceAll', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'driver_ids' => $result['filters']['driver_ids'],
                    'truck_ids' => $result['filters']['truck_ids'],
                    'operation_ids' => $result['filters']['operation_ids'],
                    'load_phase' => $result['filters']['load_phase'],
                    'per_page' => $result['filters']['per_page'],
                ],
                'performances' => $paginator, // Inertia will automatically convert this
                'summary' => $summary,
                'highlights' => $highlights,
                'perPageOptions' => [10, 25, 50, 100, 200],
                'options' => [
                    'drivers' => $drivers,
                    'trucks' => $trucks,
                    'operations' => $operations,
                    'loadPhases' => $loadPhases,
                ],
            ]);
        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to load performances.']);
        }
    }

    public function performanceAllExport(PerformanceAllRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        $validated = array_merge($request->validated(), [
            'format' => $format,
        ]);

        $result = $this->performanceAllReport->build($validated);

        $paginator = $result['paginator'];
        $rows = $paginator instanceof \Illuminate\Pagination\LengthAwarePaginator
            ? $paginator->getCollection()
            : collect($paginator);

        $filename = 'performance_all_'.now()->format('Y-m-d_H-i-s');

        return match ($format) {
            'csv' => $this->exportAllCsv(
                $this->performanceAllRowsWithTotals($rows, $result['summary']),
                $result['resolved_from'],
                $result['resolved_to'],
                $filename.'.csv'
            ),
            'xlsx' => $this->exportAllExcel(
                $this->performanceAllRowsWithTotals($rows, $result['summary']),
                $filename.'.xlsx'
            ),
            'pdf' => $this->exportAllPdf(
                $rows,
                $result['summary'],
                $result['resolved_from'],
                $result['resolved_to'],
                $filename.'.pdf'
            ),
            default => abort(404),
        };
    }

    public function performanceByDriver(PerformanceByDriverRequest $request): Response|RedirectResponse
    {
        try {
            $validated = $request->validated();
            $result = $this->buildDriverPerformance($validated);

            // Cache driver options (1 hour) - changes when drivers are added/removed
            $drivers = Cache::remember('reports.performance_by_driver.driver_options', 3600, function () {
                return Driver::query()
                    ->select('id', 'name')
                    ->orderBy('name')
                    ->get()
                    ->map(static fn (Driver $driver) => [
                        'id' => $driver->id,
                        'name' => $driver->name ?? 'Unassigned',
                    ]);
            });

            return Inertia::render('Reports/PerformanceByDriver', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'driver_ids' => $result['driver_ids'],
                ],
                'rows' => $result['rows'],
                'summary' => $result['summary'],
                'drivers' => $drivers,
            ]);
        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate driver performance report.']);
        }
    }

    public function performanceByDriverExport(PerformanceByDriverRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        $validated = array_merge($request->validated(), ['format' => $format]);
        $result = $this->buildDriverPerformance($validated);

        $rows = $result['rows'] instanceof Collection
            ? $result['rows']
            : collect($result['rows']);

        $filename = 'driver_performance_'.now()->format('Y-m-d_H-i-s');

        return match ($format) {
            'csv' => $this->exportDriverCsv(
                $this->driverRowsWithTotals($rows, $result['summary']),
                $result['resolved_from'],
                $result['resolved_to'],
                $filename.'.csv'
            ),
            'xlsx' => $this->exportDriverExcel(
                $this->driverRowsWithTotals($rows, $result['summary']),
                $filename.'.xlsx'
            ),
            'pdf' => $this->exportDriverPdf(
                $rows,
                $result['summary'],
                $result['resolved_from'],
                $result['resolved_to'],
                $filename.'.pdf'
            ),
            default => abort(404),
        };
    }

    /**
     * Build the driver performance dataset shared across web and export flows.
     */
    private function buildDriverPerformance(array $validated): array
    {
        $from = $validated['from'] ?? now()->subMonths(1)->toDateString();
        $to = $validated['to'] ?? now()->toDateString();
        $driverIds = $validated['driver_ids'] ?? [];

        $query = DB::table('performances')
            ->select(
                'driver_truck.driver_id as driver_id',
                DB::raw('MAX(drivers.name) as driver_name'),
                DB::raw('COUNT(performances.FOnumber) as trips'),
                DB::raw('SUM(performances.CargoVolumMT) as tonnage'),
                DB::raw('SUM(performances.DistanceWCargo) as distance_wcargo'),
                DB::raw('SUM(performances.DistanceWOCargo) as distance_wocargo'),
                DB::raw('SUM(performances.tonkm) as tonkm'),
                DB::raw('SUM(performances.fuelInBirr) as fuel_cost'),
                DB::raw('SUM(performances.perdiem) as perdiem'),
                DB::raw('SUM(performances.other) as other_cost'),
                DB::raw('SUM(performances.tonkm * operations.tariff) as revenue')
            )
            ->leftJoin('driver_truck', 'driver_truck.id', '=', 'performances.driver_truck_id')
            ->leftJoin('drivers', 'drivers.id', '=', 'driver_truck.driver_id')
            ->leftJoin('operations', 'operations.id', '=', 'performances.operation_id')
            ->whereBetween('performances.DateDispach', [$from, $to])
            ->groupBy('driver_truck.driver_id');

        if (! empty($driverIds)) {
            $query->whereIn('driver_truck.driver_id', $driverIds);
        }

        $rows = collect($query->orderByDesc('trips')->get())
            ->map(static function ($row) {
                $distanceWithCargo = (float) $row->distance_wcargo;
                $distanceWithoutCargo = (float) $row->distance_wocargo;
                $distanceTotal = $distanceWithCargo + $distanceWithoutCargo;
                $fuelCost = (float) $row->fuel_cost;
                $perdiem = (float) $row->perdiem;
                $otherCost = (float) $row->other_cost;
                $expense = $fuelCost + $perdiem + $otherCost;
                $revenue = (float) $row->revenue;
                $profit = $revenue - $expense;
                $margin = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : null;

                return [
                    'driver_id' => $row->driver_id,
                    'driver_name' => $row->driver_name ?? 'Unassigned',
                    'trips' => (int) $row->trips,
                    'tonnage' => round((float) $row->tonnage, 2),
                    'ton_km' => round((float) $row->tonkm, 2),
                    'distance_wc' => round($distanceWithCargo, 2),
                    'distance_wo' => round($distanceWithoutCargo, 2),
                    'distance_total' => round($distanceTotal, 2),
                    'fuel_cost' => round($fuelCost, 2),
                    'perdiem' => round($perdiem, 2),
                    'other_cost' => round($otherCost, 2),
                    'expense' => round($expense, 2),
                    'revenue' => round($revenue, 2),
                    'profit' => round($profit, 2),
                    'margin_percent' => $margin,
                ];
            })
            ->values();

        $summaryRevenue = $rows->sum('revenue');

        $summary = [
            'trips' => $rows->sum('trips'),
            'tonnage' => round($rows->sum('tonnage'), 2),
            'ton_km' => round($rows->sum('ton_km'), 2),
            'distance_wc' => round($rows->sum('distance_wc'), 2),
            'distance_wo' => round($rows->sum('distance_wo'), 2),
            'distance_total' => round($rows->sum('distance_total'), 2),
            'fuel_cost' => round($rows->sum('fuel_cost'), 2),
            'perdiem' => round($rows->sum('perdiem'), 2),
            'other_cost' => round($rows->sum('other_cost'), 2),
            'expense' => round($rows->sum('expense'), 2),
            'revenue' => round($summaryRevenue, 2),
            'profit' => round($rows->sum('profit'), 2),
            'margin_percent' => $summaryRevenue > 0 ? round(($rows->sum('profit') / $summaryRevenue) * 100, 2) : null,
        ];

        return [
            'rows' => $rows,
            'summary' => $summary,
            'resolved_from' => $from,
            'resolved_to' => $to,
            'driver_ids' => $driverIds,
        ];
    }

    private function driverRowsWithTotals(Collection $rows, array $summary): Collection
    {
        $data = collect($rows->all());

        $data->push([
            'driver_id' => null,
            'driver_name' => 'TOTAL',
            'trips' => $summary['trips'],
            'tonnage' => $summary['tonnage'],
            'ton_km' => $summary['ton_km'],
            'distance_wc' => $summary['distance_wc'],
            'distance_wo' => $summary['distance_wo'],
            'distance_total' => $summary['distance_total'],
            'fuel_cost' => $summary['fuel_cost'],
            'perdiem' => $summary['perdiem'],
            'other_cost' => $summary['other_cost'],
            'expense' => $summary['expense'],
            'revenue' => $summary['revenue'],
            'profit' => $summary['profit'],
            'margin_percent' => $summary['margin_percent'],
        ]);

        return $data->values();
    }

    private function exportDriverCsv(Collection $rows, string $from, string $to, string $filename)
    {
        $headings = [
            'Driver',
            'Trips',
            'Tonnage (MT)',
            'Ton-KM',
            'Distance With Cargo (KM)',
            'Distance Without Cargo (KM)',
            'Total Distance (KM)',
            'Fuel Cost',
            'Perdiem',
            'Other Cost',
            'Total Expense',
            'Revenue',
            'Profit',
            'Margin %',
        ];

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return HttpResponse::streamDownload(static function () use ($rows, $headings, $from, $to) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Performance by Driver Report']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['driver_name'],
                    $row['trips'],
                    $row['tonnage'],
                    $row['ton_km'],
                    $row['distance_wc'],
                    $row['distance_wo'],
                    $row['distance_total'],
                    $row['fuel_cost'],
                    $row['perdiem'],
                    $row['other_cost'],
                    $row['expense'],
                    $row['revenue'],
                    $row['profit'],
                    $row['margin_percent'],
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportDriverExcel(Collection $rows, string $filename)
    {
        return Excel::download(new DriverPerformanceExport($rows), $filename);
    }

    private function exportDriverPdf(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.performance_by_driver_pdf', [
            'rows' => $rows->all(),
            'summary' => $summary,
            'from' => $from,
            'to' => $to,
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return HttpResponse::make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function buildGeographyHeatmapsReport(string $from, string $to): array
    {
        $performances = Performance::with(['operation.customer', 'origin.woreda.zone.region'])
            ->whereBetween('DateDispach', [$from, $to])
            ->get();

        $byRegion = [];
        $byZone = [];
        $byWoreda = [];
        $byPlace = [];
        $trend = [];
        $totals = [
            'trips' => 0,
            'tonnage' => 0.0,
            'revenue' => 0.0,
        ];

        foreach ($performances as $performance) {
            $origin = $performance->origin;
            $regionName = $origin?->woreda?->zone?->region?->name ?? 'Unknown';
            $zoneName = $origin?->woreda?->zone?->name ?? 'Unknown';
            $woredaName = $origin?->woreda?->name ?? 'Unknown';
            $placeName = $origin?->name ?? 'Unknown';
            $tonnage = (float) ($performance->CargoVolumMT ?? 0);
            $revenue = (float) ($performance->operation?->tariff ?? 0) * ($tonnage > 0 ? $tonnage : 1);

            $totals['trips'] += 1;
            $totals['tonnage'] += $tonnage;
            $totals['revenue'] += $revenue;

            if (! isset($byRegion[$regionName])) {
                $byRegion[$regionName] = ['name' => $regionName, 'trips' => 0, 'tonnage' => 0.0, 'revenue' => 0.0];
            }
            $byRegion[$regionName]['trips'] += 1;
            $byRegion[$regionName]['tonnage'] += $tonnage;
            $byRegion[$regionName]['revenue'] += $revenue;

            if (! isset($byZone[$zoneName])) {
                $byZone[$zoneName] = ['name' => $zoneName, 'trips' => 0, 'tonnage' => 0.0, 'revenue' => 0.0];
            }
            $byZone[$zoneName]['trips'] += 1;
            $byZone[$zoneName]['tonnage'] += $tonnage;
            $byZone[$zoneName]['revenue'] += $revenue;

            if (! isset($byWoreda[$woredaName])) {
                $byWoreda[$woredaName] = ['name' => $woredaName, 'trips' => 0, 'tonnage' => 0.0, 'revenue' => 0.0];
            }
            $byWoreda[$woredaName]['trips'] += 1;
            $byWoreda[$woredaName]['tonnage'] += $tonnage;
            $byWoreda[$woredaName]['revenue'] += $revenue;

            if (! isset($byPlace[$placeName])) {
                $byPlace[$placeName] = ['name' => $placeName, 'trips' => 0, 'tonnage' => 0.0, 'revenue' => 0.0];
            }
            $byPlace[$placeName]['trips'] += 1;
            $byPlace[$placeName]['tonnage'] += $tonnage;
            $byPlace[$placeName]['revenue'] += $revenue;

            $ym = $performance->DateDispach?->format('Y-m');
            if ($ym) {
                if (! isset($trend[$regionName])) {
                    $trend[$regionName] = [];
                }
                if (! isset($trend[$regionName][$ym])) {
                    $trend[$regionName][$ym] = 0.0;
                }

                $trend[$regionName][$ym] += (float) ($performance->operation?->tariff ?? 0) * ((float) ($performance->CargoVolumMT ?? 0) > 0 ? (float) $performance->CargoVolumMT : 1);
            }
        }

        $regions = array_values($byRegion);
        usort($regions, static fn (array $a, array $b) => $b['revenue'] <=> $a['revenue']);
        $zones = array_values($byZone);
        usort($zones, static fn (array $a, array $b) => $b['revenue'] <=> $a['revenue']);
        $woredas = array_values($byWoreda);
        usort($woredas, static fn (array $a, array $b) => $b['revenue'] <=> $a['revenue']);
        $places = array_values($byPlace);
        usort($places, static fn (array $a, array $b) => $b['revenue'] <=> $a['revenue']);

        $regionTrends = [];
        foreach ($trend as $region => $months) {
            krsort($months);
            $series = [];
            foreach ($months as $ym => $value) {
                $series[] = ['month' => $ym, 'revenue' => round($value, 2)];
            }
            $regionTrends[] = ['region' => $region, 'series' => $series];
        }

        return [
            'regions' => $regions,
            'zones' => $zones,
            'woredas' => $woredas,
            'places' => $places,
            'regionTrends' => $regionTrends,
            'totals' => [
                'trips' => (int) $totals['trips'],
                'tonnage' => round($totals['tonnage'], 2),
                'revenue' => round($totals['revenue'], 2),
            ],
        ];
    }

    private function geographyRowsWithTotals(array $report): Collection
    {
        $levels = [
            ['label' => 'Region', 'rows' => $report['regions']],
            ['label' => 'Zone', 'rows' => $report['zones']],
            ['label' => 'Woreda', 'rows' => $report['woredas']],
            ['label' => 'Place', 'rows' => $report['places']],
        ];

        return collect($levels)
            ->flatMap(static function (array $level) {
                $levelRows = collect($level['rows']);

                $rows = $levelRows->map(static function (array $row) use ($level) {
                    return [
                        'level' => $level['label'],
                        'name' => $row['name'],
                        'trips' => (int) ($row['trips'] ?? 0),
                        'tonnage' => round((float) ($row['tonnage'] ?? 0), 2),
                        'revenue' => round((float) ($row['revenue'] ?? 0), 2),
                        'is_total' => false,
                    ];
                });

                if ($rows->isEmpty()) {
                    return $rows;
                }

                $totals = [
                    'level' => $level['label'],
                    'name' => 'Totals',
                    'trips' => (int) $levelRows->sum(static fn (array $row) => (int) ($row['trips'] ?? 0)),
                    'tonnage' => round($levelRows->sum(static fn (array $row) => (float) ($row['tonnage'] ?? 0)), 2),
                    'revenue' => round($levelRows->sum(static fn (array $row) => (float) ($row['revenue'] ?? 0)), 2),
                    'is_total' => true,
                ];

                return $rows->push($totals);
            })
            ->values();
    }

    private function exportGeographyCsv(Collection $rows, string $from, string $to, string $filename)
    {
        $headings = ['Level', 'Name', 'Trips', 'Tonnage (MT)', 'Revenue'];

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return HttpResponse::streamDownload(static function () use ($rows, $headings, $from, $to) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Geographic Heatmaps Report']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['level'],
                    $row['name'],
                    $row['trips'],
                    number_format((float) $row['tonnage'], 2, '.', ''),
                    number_format((float) $row['revenue'], 2, '.', ''),
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportGeographyExcel(Collection $rows, string $filename)
    {
        return Excel::download(new GeographyHeatmapsExport($rows), $filename);
    }

    private function exportGeographyPdf(Collection $rows, array $totals, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.geography_heatmaps_pdf', [
            'rows' => $rows,
            'totals' => $totals,
            'from' => $from,
            'to' => $to,
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return HttpResponse::make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function performanceAllRowsWithTotals(Collection $rows, array $summary): Collection
    {
        $data = collect($rows->all());

        $data->push([
            'id' => null,
            'fo_number' => 'TOTAL',
            'dispatch_date' => null,
            'driver_name' => null,
            'truck_plate' => null,
            'vehicle_type' => null,
            'operation_code' => null,
            'customer_name' => null,
            'origin_name' => null,
            'destination_name' => null,
            'tonnage' => $summary['tonnage'],
            'ton_km' => $summary['ton_km'],
            'distance_wc' => $summary['distance_wc'],
            'distance_wo' => $summary['distance_wo'],
            'distance_total' => $summary['distance_total'],
            'fuel_litres' => $summary['fuel_litres'],
            'fuel_cost' => $summary['fuel_cost'],
            'perdiem' => $summary['perdiem'],
            'work_on_going' => $summary['work_on_going'],
            'other_cost' => $summary['other_cost'],
            'expense' => $summary['expense'],
            'revenue' => $summary['revenue'],
            'profit' => $summary['profit'],
            'margin_percent' => $summary['margin_percent'],
        ]);

        return $data->values();
    }

    private function routeProfitabilityRowsWithTotals(Collection $rows, array $summary): Collection
    {
        $data = collect($rows->all());
        $totalDistance = $summary['total_distance'];
        $totalTrips = $summary['total_trips'];

        $avgDistance = $totalTrips > 0 ? round($totalDistance / $totalTrips, 2) : null;
        $avgTonnage = $totalTrips > 0 ? round($summary['total_tonnage'] / $totalTrips, 2) : null;
        $revenuePerKm = $totalDistance > 0 ? round($summary['total_revenue'] / $totalDistance, 2) : null;
        $costPerKm = $totalDistance > 0 ? round($summary['total_expense'] / $totalDistance, 2) : null;
        $profitPerKm = $totalDistance > 0 ? round($summary['total_profit'] / $totalDistance, 2) : null;

        $data->push([
            'origin_name' => 'TOTALS',
            'destination_name' => null,
            'route_key' => 'totals',
            'trips' => $summary['total_trips'],
            'tonnage' => $summary['total_tonnage'],
            'ton_km' => $summary['total_ton_km'],
            'distance_wc' => $summary['total_distance_with_cargo'],
            'distance_wo' => $summary['total_distance_without_cargo'],
            'distance_total' => $summary['total_distance'],
            'avg_distance' => $avgDistance,
            'avg_tonnage' => $avgTonnage,
            'fuel_cost' => null,
            'perdiem' => null,
            'work_on_going' => null,
            'other_cost' => null,
            'expense' => $summary['total_expense'],
            'revenue' => $summary['total_revenue'],
            'profit' => $summary['total_profit'],
            'margin_percent' => $summary['overall_margin_percent'],
            'revenue_per_km' => $revenuePerKm,
            'cost_per_km' => $costPerKm,
            'profit_per_km' => $profitPerKm,
        ]);

        return $data->values();
    }

    private function exportAllCsv(Collection $rows, string $from, string $to, string $filename)
    {
        $headings = [
            'FO Number',
            'Dispatch Date',
            'Driver',
            'Truck Plate',
            'Vehicle Type',
            'Operation',
            'Customer',
            'Origin',
            'Destination',
            'Tonnage (MT)',
            'Ton-KM',
            'Distance With Cargo (KM)',
            'Distance Without Cargo (KM)',
            'Total Distance (KM)',
            'Fuel (L)',
            'Fuel Cost',
            'Perdiem',
            'Work Ongoing',
            'Other Cost',
            'Total Expense',
            'Revenue',
            'Profit',
            'Margin %',
        ];

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return HttpResponse::streamDownload(static function () use ($rows, $headings, $from, $to) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Performance Report (All)']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['fo_number'],
                    $row['dispatch_date'],
                    $row['driver_name'],
                    $row['truck_plate'],
                    $row['vehicle_type'],
                    $row['operation_code'],
                    $row['customer_name'],
                    $row['origin_name'],
                    $row['destination_name'],
                    $row['tonnage'],
                    $row['ton_km'],
                    $row['distance_wc'],
                    $row['distance_wo'],
                    $row['distance_total'],
                    $row['fuel_litres'],
                    $row['fuel_cost'],
                    $row['perdiem'],
                    $row['work_on_going'],
                    $row['other_cost'],
                    $row['expense'],
                    $row['revenue'],
                    $row['profit'],
                    $row['margin_percent'],
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportAllExcel(Collection $rows, string $filename)
    {
        return Excel::download(new PerformanceAllExport($rows), $filename);
    }

    private function exportAllPdf(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.performance_all_pdf', [
            'rows' => $rows->all(),
            'summary' => $summary,
            'from' => $from,
            'to' => $to,
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return HttpResponse::make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function exportRouteProfitabilityCsv(Collection $rows, string $from, string $to, string $filename)
    {
        $headings = [
            'Origin',
            'Destination',
            'Trips',
            'Tonnage (MT)',
            'Ton-KM',
            'Distance With Cargo (KM)',
            'Distance Without Cargo (KM)',
            'Total Distance (KM)',
            'Average Distance (KM)',
            'Revenue',
            'Expense',
            'Profit',
            'Margin %',
            'Revenue per KM',
            'Cost per KM',
            'Profit per KM',
        ];

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return HttpResponse::streamDownload(static function () use ($rows, $headings, $from, $to) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Route Profitability Report']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['origin_name'],
                    $row['destination_name'] ?? '—',
                    $row['trips'],
                    $row['tonnage'],
                    $row['ton_km'],
                    $row['distance_wc'],
                    $row['distance_wo'],
                    $row['distance_total'],
                    $row['avg_distance'] ?? null,
                    $row['revenue'],
                    $row['expense'],
                    $row['profit'],
                    $row['margin_percent'],
                    $row['revenue_per_km'],
                    $row['cost_per_km'],
                    $row['profit_per_km'],
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportRouteProfitabilityExcel(Collection $rows, string $filename)
    {
        return Excel::download(new RouteProfitabilityExport($rows), $filename);
    }

    private function exportRouteProfitabilityPdf(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.route_profitability_pdf', [
            'rows' => $rows->all(),
            'summary' => $summary,
            'from' => $from,
            'to' => $to,
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return HttpResponse::make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function exportOutsourceCsv(Collection $rows, string $from, string $to, string $filename)
    {
        $headings = [
            'Trip Number',
            'Dispatch Date',
            'Vendor',
            'Vendor Status',
            'Operation',
            'Customer',
            'Origin',
            'Destination',
            'Tonnage (MT)',
            'Ton-KM',
            'Distance (KM)',
            'Vendor Cost',
            'Revenue',
            'Profit',
            'Margin %',
        ];

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return HttpResponse::streamDownload(static function () use ($rows, $headings, $from, $to) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Outsource Performance Report']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['fo_number'],
                    $row['dispatch_date'],
                    $row['driver_name'],
                    $row['truck_plate'],
                    $row['operation_code'],
                    $row['customer_name'],
                    $row['origin_name'],
                    $row['destination_name'],
                    $row['tonnage'],
                    $row['ton_km'],
                    $row['distance_total'],
                    $row['expense'],
                    $row['revenue'],
                    $row['profit'],
                    $row['margin_percent'],
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportOutsourceExcel(Collection $rows, string $filename)
    {
        return Excel::download(new OutsourcePerformanceExport($rows), $filename);
    }

    private function exportOutsourcePdf(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.outsource_performance_pdf', [
            'rows' => $rows->all(),
            'summary' => $summary,
            'from' => $from,
            'to' => $to,
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return HttpResponse::make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Legacy-style: performance aggregated by truck with date filters.
     */
    public function performanceByTruck(PerformanceByTruckRequest $request): Response|RedirectResponse
    {
        try {
            $validated = $request->validated();
            $result = $this->truckPerformanceReport->build($validated);

            $rows = $result['rows'] instanceof Collection
                ? $result['rows']->values()
                : collect($result['rows'])->values();

            // Cache truck options (1 hour) - changes when trucks are added/removed
            $trucks = Cache::remember('reports.performance_by_truck.truck_options', 3600, function () {
                return Truck::query()
                    ->select('id', 'plate')
                    ->orderBy('plate')
                    ->get()
                    ->map(static fn (Truck $truck) => [
                        'id' => $truck->id,
                        'plate' => $truck->plate,
                    ])
                    ->values();
            });

            // Cache vehicle types (1 hour) - changes when vehicle types are added/removed
            $vehicleTypes = Cache::remember('reports.performance_by_truck.vehicle_types', 3600, function () {
                return VehicleType::query()
                    ->select('id', 'name')
                    ->orderBy('name')
                    ->get()
                    ->map(static fn (VehicleType $type) => [
                        'id' => $type->id,
                        'name' => $type->name,
                    ])
                    ->values();
            });

            // Cache statuses (1 hour) - rarely changes
            $statuses = Cache::remember('reports.performance_by_truck.statuses', 3600, function () {
                return Truck::query()
                    ->select('status')
                    ->whereNotNull('status')
                    ->distinct()
                    ->orderBy('status')
                    ->pluck('status')
                    ->filter(static fn ($status) => $status !== null && $status !== '')
                    ->values()
                    ->all();
            });

            return Inertia::render('Reports/PerformanceByTruck', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'truck_ids' => $validated['truck_ids'] ?? [],
                    'vehicle_type_ids' => $validated['vehicle_type_ids'] ?? [],
                    'statuses' => $validated['statuses'] ?? [],
                ],
                'rows' => $rows,
                'summary' => $result['summary'],
                'trucks' => $trucks,
                'vehicleTypes' => $vehicleTypes,
                'statuses' => $statuses,
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to generate truck performance report.']);
        }
    }

    public function performanceByTruckExport(PerformanceByTruckRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        $validated = array_merge($request->validated(), ['format' => $format]);
        $result = $this->truckPerformanceReport->build($validated);
        $rows = $result['rows'] instanceof Collection
            ? $result['rows']->values()
            : collect($result['rows'])->values();

        $filename = 'truck_performance_'.now()->format('Y-m-d_H-i-s');

        return match ($format) {
            'csv' => $this->exportCsv($rows, $result['summary'], $result['resolved_from'], $result['resolved_to'], $filename.'.csv'),
            'xlsx' => $this->exportExcel($rows, $result['summary'], $filename.'.xlsx'),
            'pdf' => $this->exportPdf($rows, $result['summary'], $result['resolved_from'], $result['resolved_to'], $filename.'.pdf'),
            default => abort(404),
        };
    }

    private function exportCsv(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $headings = [
            'Plate',
            'Trips',
            'Tonnage (MT)',
            'Ton-KM',
            'Distance With Cargo (KM)',
            'Distance Without Cargo (KM)',
            'Total Distance (KM)',
            'Fuel (Litres)',
            'Fuel Cost',
            'Perdiem',
            'Work Ongoing',
            'Other Cost',
            'Total Expense',
            'Revenue',
            'Profit',
            'Margin %',
        ];

        $data = $this->rowsWithTotals($rows, $summary);

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return HttpResponse::streamDownload(static function () use ($data, $headings, $from, $to) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Performance by Truck Report']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($data as $row) {
                fputcsv($handle, [
                    $row['plate'],
                    $row['trips'],
                    $row['tonnage'],
                    $row['ton_km'],
                    $row['distance_wc'],
                    $row['distance_wo'],
                    $row['distance_total'],
                    $row['fuel_litres'],
                    $row['fuel_cost'],
                    $row['perdiem'],
                    $row['work_on_going'],
                    $row['other_cost'],
                    $row['expense'],
                    $row['revenue'],
                    $row['profit'],
                    $row['margin_percent'],
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportExcel(Collection $rows, array $summary, string $filename)
    {
        $data = $this->rowsWithTotals($rows, $summary);

        return Excel::download(new TruckPerformanceExport($data), $filename);
    }

    private function exportPdf(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.performance_by_truck_pdf', [
            'rows' => $rows->all(),
            'summary' => $summary,
            'from' => $from,
            'to' => $to,
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return HttpResponse::make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function rowsWithTotals(Collection $rows, array $summary): Collection
    {
        $data = collect($rows->all());

        $data->push([
            'plate' => 'TOTAL',
            'trips' => $summary['trips'],
            'tonnage' => $summary['tonnage'],
            'ton_km' => $summary['ton_km'],
            'distance_wc' => $summary['distance_wc'],
            'distance_wo' => $summary['distance_wo'],
            'distance_total' => $summary['distance_total'],
            'fuel_litres' => $summary['fuel_litres'],
            'fuel_cost' => $summary['fuel_cost'],
            'perdiem' => $summary['perdiem'],
            'work_on_going' => $summary['work_on_going'],
            'other_cost' => $summary['other_cost'],
            'expense' => $summary['expense'],
            'revenue' => $summary['revenue'],
            'profit' => $summary['profit'],
            'margin_percent' => $summary['margin_percent'],
        ]);

        return $data->values();
    }

    /**
     * Legacy-style: status summary by date.
     */
    public function performanceByStatus(PerformanceByStatusRequest $request): Response|RedirectResponse
    {
        try {
            $result = $this->performanceByStatusReport->build($request->validated());

            return Inertia::render('Reports/PerformanceByStatus', [
                'filters' => $result['filters'],
                'summary' => $result['summary'],
                'latest' => $result['latest'],
                'metrics' => $result['metrics'],
                'options' => [
                    'statuses' => $result['statuses'],
                ],
            ]);
        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate status report.']);
        }
    }

    public function dailyStatus(DailyStatusReportRequest $request): Response|RedirectResponse
    {
        try {
            $payload = $this->dailyStatusReport->build($request->validated());

            $trucks = Cache::remember('reports.daily_status.truck_options', 900, static function () {
                return Truck::query()
                    ->select('id', 'plate', 'status')
                    ->orderBy('plate')
                    ->get()
                    ->map(static fn (Truck $truck) => [
                        'id' => $truck->id,
                        'plate' => $truck->plate ?? 'Truck #'.$truck->id,
                        'status' => $truck->status,
                    ])
                    ->values();
            });

            return Inertia::render('Reports/DailyStatus', [
                'filters' => $payload['filters'],
                'summary' => $payload['summary'],
                'statusSummary' => $payload['status_summary'],
                'daily' => $payload['daily'],
                'options' => [
                    'trucks' => $trucks,
                    'statuses' => $payload['status_options'],
                ],
                'meta' => [
                    'resolved_from' => $payload['resolved_from'],
                    'resolved_to' => $payload['resolved_to'],
                    'total_days' => $payload['total_days'],
                    'truncated' => $payload['truncated'],
                ],
                'can' => [
                    'export' => $request->user()?->can('reports.daily-status.export') ?? false,
                ],
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to generate the daily status report.']);
        }
    }

    public function dailyStatusExport(DailyStatusReportRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        $validated = array_merge($request->validated(), ['format' => $format]);
        $payload = $this->dailyStatusReport->build($validated, $request->boolean('refresh_cache'));

        $flattened = $this->flattenDailyRows($payload['daily']);
        $filename = 'daily_status_'.now()->format('Y-m-d_H-i-s');

        return match ($format) {
            'csv' => $this->exportDailyCsv($flattened, $payload['summary'], $payload['resolved_from'], $payload['resolved_to'], $filename.'.csv'),
            'xlsx' => $this->exportDailyExcel($flattened, $filename.'.xlsx'),
            'pdf' => $this->exportDailyPdf($flattened, $payload['summary'], $payload['status_summary'], $payload['resolved_from'], $payload['resolved_to'], $filename.'.pdf'),
            default => abort(404),
        };
    }

    /**
     * @param  \Illuminate\Pagination\LengthAwarePaginator  $paginator
     */
    private function flattenDailyRows($paginator): Collection
    {
        return collect($paginator->items())
            ->flatMap(static function (array $day) {
                return collect($day['entries'])
                    ->map(static function (array $entry) use ($day) {
                        return [
                            'date' => $day['date'],
                            'truck_plate' => $entry['plate'] ?? '—',
                            'truck_id' => $entry['truck_id'] ?? null,
                            'status_name' => $entry['status_name'] ?? '—',
                            'status_date' => $entry['status_date'] ?? null,
                            'registered_at' => $entry['registered_at'] ?? null,
                            'changed_by' => $entry['changed_by'] ?? null,
                            'notes' => $entry['notes'] ?? null,
                        ];
                    })
                    ->values();
            })
            ->values();
    }

    private function exportDailyCsv(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $headings = ['Date', 'Truck Plate', 'Truck ID', 'Status', 'Status Date', 'Recorded At', 'Changed By', 'Notes'];

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return HttpResponse::streamDownload(static function () use ($rows, $headings, $summary, $from, $to) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Daily Status Report']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, [
                "Total updates: {$summary['total_updates']} · Unique trucks: {$summary['unique_trucks']} · Unique statuses: {$summary['unique_statuses']}",
            ]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['date'],
                    $row['truck_plate'],
                    $row['truck_id'],
                    $row['status_name'],
                    $row['status_date'],
                    $row['registered_at'],
                    $row['changed_by'],
                    $row['notes'],
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportDailyExcel(Collection $rows, string $filename)
    {
        return Excel::download(new DailyStatusExport($rows), $filename);
    }

    private function exportDailyPdf(Collection $rows, array $summary, array $statusSummary, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.daily_status_pdf', [
            'rows' => $rows->all(),
            'summary' => $summary,
            'statusSummary' => $statusSummary,
            'from' => $from,
            'to' => $to,
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return HttpResponse::make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Legacy-style: driver-truck attach/detach listing.
     */
    public function driverTruckAttachDetach(Request $request): Response|RedirectResponse
    {
        try {
            $history = DB::table('driver_truck')
                ->select(
                    'driver_truck.id',
                    'drivers.name as driver_name',
                    'trucks.plate as truck_plate',
                    'driver_truck.assigned_date',
                    'driver_truck.unassigned_date',
                    'driver_truck.status as is_attached'
                )
                ->leftJoin('drivers', 'drivers.id', '=', 'driver_truck.driver_id')
                ->leftJoin('trucks', 'trucks.id', '=', 'driver_truck.truck_id')
                ->orderByDesc('driver_truck.created_at')
                ->get();

            $rows = $history->map(static function ($row) {
                $assignedDate = $row->assigned_date ? Carbon::parse($row->assigned_date) : null;
                $unassignedDate = $row->unassigned_date ? Carbon::parse($row->unassigned_date) : null;

                return [
                    'id' => (int) $row->id,
                    'driver_name' => $row->driver_name ?? '—',
                    'truck_plate' => $row->truck_plate ?? '—',
                    'assigned_date' => $assignedDate?->toIso8601String(),
                    'assigned_display' => $assignedDate?->format('M j, Y g:i A'),
                    'assigned_relative' => $assignedDate?->diffForHumans(),
                    'unassigned_date' => $unassignedDate?->toIso8601String(),
                    'unassigned_display' => $unassignedDate?->format('M j, Y g:i A'),
                    'unassigned_relative' => $unassignedDate?->diffForHumans(),
                    'is_attached' => (bool) $row->is_attached,
                ];
            });

            $currentAssignments = $this->truckAssignmentService
                ->getCurrentAssignments()
                ->map(static function (\App\Models\DriverTruck $assignment) {
                    $assigned = $assignment->assigned_date;

                    return [
                        'id' => $assignment->id,
                        'driver' => $assignment->driver ? [
                            'id' => $assignment->driver->id,
                            'name' => $assignment->driver->name,
                            'mobile' => $assignment->driver->mobile,
                        ] : null,
                        'truck' => $assignment->truck ? [
                            'id' => $assignment->truck->id,
                            'plate' => $assignment->truck->plate,
                            'status' => $assignment->truck->status,
                        ] : null,
                        'assignedDate' => $assigned?->toIso8601String(),
                        'assignedDisplay' => $assigned?->format('M j, Y'),
                        'assignedRelative' => $assigned?->diffForHumans(),
                        'daysActive' => $assigned?->diffInDays(now()),
                    ];
                })
                ->values();

            $availableDrivers = $this->truckAssignmentService
                ->getAvailableDrivers()
                ->map(static function (\App\Models\Driver $driver) {
                    $hired = $driver->hireddate;
                    $lastDetached = $driver->last_detached_at ? Carbon::parse($driver->last_detached_at) : null;

                    return [
                        'id' => $driver->id,
                        'name' => $driver->name,
                        'mobile' => $driver->mobile,
                        'hireDate' => $hired?->toDateString(),
                        'hireDisplay' => $hired?->format('M j, Y'),
                        'lastDetachedDate' => $lastDetached?->toIso8601String(),
                        'lastDetachedDisplay' => $lastDetached?->format('M j, Y g:i A'),
                        'lastDetachedRelative' => $lastDetached?->diffForHumans(),
                    ];
                })
                ->values();

            $availableTrucks = $this->truckAssignmentService
                ->getAvailableTrucks()
                ->map(static function (\App\Models\Truck $truck) {
                    $serviceStart = $truck->serviceStartDate;
                    $lastDetached = $truck->last_detached_at ? Carbon::parse($truck->last_detached_at) : null;

                    return [
                        'id' => $truck->id,
                        'plate' => $truck->plate,
                        'status' => $truck->status,
                        'serviceStartDate' => $serviceStart?->toDateString(),
                        'serviceStartDisplay' => $serviceStart?->format('M j, Y'),
                        'lastDetachedDate' => $lastDetached?->toIso8601String(),
                        'lastDetachedDisplay' => $lastDetached?->format('M j, Y g:i A'),
                        'lastDetachedRelative' => $lastDetached?->diffForHumans(),
                    ];
                })
                ->values();

            $summary = [
                'totalAssignments' => $rows->count(),
                'attached' => $rows->where('is_attached', true)->count(),
                'detached' => $rows->where('is_attached', false)->count(),
                'currentActive' => $currentAssignments->count(),
                'availableDrivers' => $availableDrivers->count(),
                'availableTrucks' => $availableTrucks->count(),
            ];

            return Inertia::render('Reports/DriverTruckAttachDetach', [
                'rows' => $rows->values()->all(),
                'summary' => $summary,
                'currentAssignments' => $currentAssignments->all(),
                'availableDrivers' => $availableDrivers->all(),
                'availableTrucks' => $availableTrucks->all(),
            ]);
        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to load attach/detach report.']);
        }
    }

    /**
     * Display route profitability matrix report.
     */
    public function routeProfitability(RouteProfitabilityRequest $request): Response|RedirectResponse
    {
        try {
            $result = $this->routeProfitabilityReport->build($request->validated());

            $rows = $result['rows'] instanceof Collection
                ? $result['rows']->values()->all()
                : collect($result['rows'])->values()->all();

            $summary = $result['summary'];
            $filters = $result['filters'];

            // Cache place options (1 hour) - changes when places are added/removed
            $places = Cache::remember('reports.route_profitability.place_options', 3600, function () {
                return Place::query()
                    ->select('id', 'name', 'code')
                    ->orderBy('name')
                    ->get()
                    ->map(static fn (Place $place) => [
                        'id' => $place->id,
                        'name' => $place->name ?? '—',
                        'code' => $place->code ?? '—',
                    ])
                    ->values();
            });

            // Cache customer options (1 hour) - changes when customers are added/removed
            $customers = Cache::remember('reports.route_profitability.customer_options', 3600, function () {
                return Customer::query()
                    ->select('id', 'name')
                    ->orderBy('name')
                    ->get()
                    ->map(static fn (Customer $customer) => [
                        'id' => $customer->id,
                        'name' => $customer->name ?? '—',
                    ])
                    ->values();
            });

            $sortOptions = collect([
                ['id' => 'profit_desc', 'label' => 'Profit (High to Low)'],
                ['id' => 'profit_asc', 'label' => 'Profit (Low to High)'],
                ['id' => 'margin_desc', 'label' => 'Margin % (High to Low)'],
                ['id' => 'margin_asc', 'label' => 'Margin % (Low to High)'],
                ['id' => 'trips_desc', 'label' => 'Trips (High to Low)'],
                ['id' => 'trips_asc', 'label' => 'Trips (Low to High)'],
                ['id' => 'revenue_desc', 'label' => 'Revenue (High to Low)'],
                ['id' => 'revenue_asc', 'label' => 'Revenue (Low to High)'],
                ['id' => 'profit_per_km_desc', 'label' => 'Profit per KM (High to Low)'],
                ['id' => 'profit_per_km_asc', 'label' => 'Profit per KM (Low to High)'],
                ['id' => 'distance_desc', 'label' => 'Distance (High to Low)'],
                ['id' => 'distance_asc', 'label' => 'Distance (Low to High)'],
            ])->values();

            return Inertia::render('Reports/RouteProfitability', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'origin_ids' => $filters['origin_ids'],
                    'destination_ids' => $filters['destination_ids'],
                    'customer_ids' => $filters['customer_ids'],
                    'min_trips' => $filters['min_trips'],
                    'min_margin_percent' => $filters['min_margin_percent'],
                    'min_profit_per_km' => $filters['min_profit_per_km'],
                    'sort' => $filters['sort'],
                ],
                'rows' => $rows,
                'summary' => $summary,
                'options' => [
                    'places' => $places,
                    'customers' => $customers,
                    'sorts' => $sortOptions,
                ],
            ]);
        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to load route profitability report.']);
        }
    }

    public function routeProfitabilityExport(RouteProfitabilityRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        $validated = $request->validated();
        if (! isset($validated['sort'])) {
            $validated['sort'] = $request->input('sort', 'profit_desc');
        }

        $result = $this->routeProfitabilityReport->build($validated);

        $rows = $result['rows'] instanceof Collection
            ? $result['rows']->values()
            : collect($result['rows'])->values();

        $summary = $result['summary'];
        $from = $result['resolved_from'];
        $to = $result['resolved_to'];
        $filename = 'route_profitability_'.now()->format('Y-m-d_H-i-s');

        return match ($format) {
            'csv' => $this->exportRouteProfitabilityCsv(
                $this->routeProfitabilityRowsWithTotals($rows, $summary),
                $from,
                $to,
                $filename.'.csv'
            ),
            'xlsx' => $this->exportRouteProfitabilityExcel(
                $this->routeProfitabilityRowsWithTotals($rows, $summary),
                $filename.'.xlsx'
            ),
            'pdf' => $this->exportRouteProfitabilityPdf(
                $rows,
                $summary,
                $from,
                $to,
                $filename.'.pdf'
            ),
            default => abort(404),
        };
    }

    /**
     * Display load factor and utilization analysis report.
     */
    public function loadFactorUtilization(LoadFactorUtilizationRequest $request): Response|RedirectResponse
    {
        try {
            $result = $this->loadFactorUtilizationReport->build($request->validated());

            $rows = $result['rows'] instanceof Collection
                ? $result['rows']->values()->all()
                : collect($result['rows'])->values()->all();

            $summary = $result['summary'];

            // Cache truck options (1 hour)
            $trucks = Cache::remember('reports.load_factor_utilization.truck_options', 3600, function () {
                return Truck::query()
                    ->select('id', 'plate', 'status')
                    ->orderBy('plate')
                    ->get()
                    ->map(static fn (Truck $truck) => [
                        'id' => $truck->id,
                        'name' => $truck->plate ?? '—',
                        'status' => $truck->status,
                    ])
                    ->values();
            });

            // Cache driver options (1 hour)
            $drivers = Cache::remember('reports.load_factor_utilization.driver_options', 3600, function () {
                return Driver::query()
                    ->select('id', 'name', 'status')
                    ->orderBy('name')
                    ->get()
                    ->map(static fn (Driver $driver) => [
                        'id' => $driver->id,
                        'name' => $driver->name ?? 'Unassigned',
                        'status' => $driver->status,
                    ])
                    ->values();
            });

            return Inertia::render('Reports/LoadFactorUtilization', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'truck_ids' => $result['filters']['truck_ids'],
                    'driver_ids' => $result['filters']['driver_ids'],
                    'group_by' => $result['group_by'],
                ],
                'rows' => $rows,
                'summary' => $summary,
                'options' => [
                    'trucks' => $trucks,
                    'drivers' => $drivers,
                ],
            ]);
        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to load load factor utilization report.']);
        }
    }

    /**
     * Display cost per kilometer analysis report.
     */
    public function costPerKilometer(CostPerKilometerRequest $request): Response|RedirectResponse
    {
        try {
            $result = $this->costPerKilometerReport->build($request->validated());

            $rows = $result['rows'] instanceof Collection
                ? $result['rows']->values()->all()
                : collect($result['rows'])->values()->all();

            $summary = $result['summary'];

            // Cache truck options (1 hour)
            $trucks = Cache::remember('reports.cost_per_kilometer.truck_options', 3600, function () {
                return Truck::query()
                    ->select('id', 'plate', 'status')
                    ->orderBy('plate')
                    ->get()
                    ->map(static fn (Truck $truck) => [
                        'id' => $truck->id,
                        'name' => $truck->plate ?? '—',
                        'status' => $truck->status,
                    ])
                    ->values();
            });

            // Cache driver options (1 hour)
            $drivers = Cache::remember('reports.cost_per_kilometer.driver_options', 3600, function () {
                return Driver::query()
                    ->select('id', 'name', 'status')
                    ->orderBy('name')
                    ->get()
                    ->map(static fn (Driver $driver) => [
                        'id' => $driver->id,
                        'name' => $driver->name ?? 'Unassigned',
                        'status' => $driver->status,
                    ])
                    ->values();
            });

            return Inertia::render('Reports/CostPerKilometer', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'truck_ids' => $result['filters']['truck_ids'],
                    'driver_ids' => $result['filters']['driver_ids'],
                    'group_by' => $result['group_by'],
                ],
                'rows' => $rows,
                'summary' => $summary,
                'options' => [
                    'trucks' => $trucks,
                    'drivers' => $drivers,
                ],
            ]);
        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to load cost per kilometer report.']);
        }
    }

    /**
     * Export load factor utilization report.
     */
    public function loadFactorUtilizationExport(LoadFactorUtilizationRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        $validated = array_merge($request->validated(), ['format' => $format]);
        $result = $this->loadFactorUtilizationReport->build($validated);

        $rows = $result['rows'] instanceof Collection
            ? $result['rows']
            : collect($result['rows']);

        $filename = 'load_factor_utilization_'.now()->format('Y-m-d_H-i-s');

        return match ($format) {
            'csv' => $this->exportLoadFactorCsv($rows, $result['summary'], $result['resolved_from'], $result['resolved_to'], $filename.'.csv'),
            'xlsx' => $this->exportLoadFactorExcel($rows, $result['summary'], $filename.'.xlsx'),
            'pdf' => $this->exportLoadFactorPdf($rows, $result['summary'], $result['resolved_from'], $result['resolved_to'], $filename.'.pdf'),
            default => abort(404),
        };
    }

    /**
     * Export cost per kilometer report.
     */
    public function costPerKilometerExport(CostPerKilometerRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        $validated = array_merge($request->validated(), ['format' => $format]);
        $result = $this->costPerKilometerReport->build($validated);

        $rows = $result['rows'] instanceof Collection
            ? $result['rows']
            : collect($result['rows']);

        $filename = 'cost_per_kilometer_'.now()->format('Y-m-d_H-i-s');

        return match ($format) {
            'csv' => $this->exportCostPerKmCsv($rows, $result['summary'], $result['resolved_from'], $result['resolved_to'], $filename.'.csv'),
            'xlsx' => $this->exportCostPerKmExcel($rows, $result['summary'], $filename.'.xlsx'),
            'pdf' => $this->exportCostPerKmPdf($rows, $result['summary'], $result['resolved_from'], $result['resolved_to'], $filename.'.pdf'),
            default => abort(404),
        };
    }

    private function exportLoadFactorCsv(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $headings = [
            'Label',
            'Trips',
            'Loaded Distance (KM)',
            'Empty Distance (KM)',
            'Total Distance (KM)',
            'Tonnage (MT)',
            'Ton-KM',
            'Load Factor %',
            'Empty Miles %',
            'Deadhead Ratio',
            'Utilization Rate %',
        ];

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return HttpResponse::streamDownload(static function () use ($rows, $headings, $from, $to, $summary) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Load Factor & Utilization Analysis']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, []);
            fputcsv($handle, ['Summary']);
            fputcsv($handle, ['Total Trips', $summary['total_trips']]);
            fputcsv($handle, ['Total Distance (KM)', $summary['total_distance']]);
            fputcsv($handle, ['Load Factor %', $summary['overall_load_factor_percent']]);
            fputcsv($handle, ['Empty Miles %', $summary['overall_empty_miles_percent']]);
            fputcsv($handle, ['Deadhead Ratio', $summary['overall_deadhead_ratio']]);
            fputcsv($handle, ['Utilization Rate %', $summary['overall_utilization_rate']]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['label'],
                    $row['trips'],
                    $row['distance_loaded'],
                    $row['distance_empty'],
                    $row['distance_total'],
                    $row['tonnage'],
                    $row['ton_km'],
                    $row['load_factor_percent'],
                    $row['empty_miles_percent'],
                    $row['deadhead_ratio'],
                    $row['utilization_rate'],
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportLoadFactorExcel(Collection $rows, array $summary, string $filename)
    {
        // For now, use CSV format for Excel - can be enhanced with proper Excel export class later
        return $this->exportLoadFactorCsv($rows, $summary, '', '', str_replace('.xlsx', '.csv', $filename));
    }

    private function exportLoadFactorPdf(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.load_factor_utilization_pdf', [
            'rows' => $rows->all(),
            'summary' => $summary,
            'from' => $from,
            'to' => $to,
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return HttpResponse::make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function exportCostPerKmCsv(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $headings = [
            'Label',
            'Trips',
            'Distance (KM)',
            'Fuel Cost',
            'Perdiem',
            'Work Ongoing',
            'Other Cost',
            'Total Cost',
            'Total CPK',
            'Fuel CPK',
            'Perdiem CPK',
            'Work Ongoing CPK',
            'Other CPK',
        ];

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return HttpResponse::streamDownload(static function () use ($rows, $headings, $from, $to, $summary) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Cost Per Kilometer Analysis']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, []);
            fputcsv($handle, ['Summary']);
            fputcsv($handle, ['Total Trips', $summary['total_trips']]);
            fputcsv($handle, ['Total Distance (KM)', $summary['total_distance']]);
            fputcsv($handle, ['Total Cost', $summary['total_cost']]);
            fputcsv($handle, ['Overall CPK', $summary['overall_cpk']]);
            fputcsv($handle, ['Fuel CPK', $summary['overall_fuel_cpk']]);
            fputcsv($handle, ['Perdiem CPK', $summary['overall_perdiem_cpk']]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['label'],
                    $row['trips'],
                    $row['distance_total'],
                    $row['fuel_cost'],
                    $row['perdiem'],
                    $row['work_on_going'],
                    $row['other_cost'],
                    $row['total_cost'],
                    $row['total_cpk'],
                    $row['fuel_cpk'],
                    $row['perdiem_cpk'],
                    $row['work_on_going_cpk'],
                    $row['other_cpk'],
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportCostPerKmExcel(Collection $rows, array $summary, string $filename)
    {
        // For now, use CSV format for Excel - can be enhanced with proper Excel export class later
        return $this->exportCostPerKmCsv($rows, $summary, '', '', str_replace('.xlsx', '.csv', $filename));
    }

    private function exportCostPerKmPdf(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.cost_per_kilometer_pdf', [
            'rows' => $rows->all(),
            'summary' => $summary,
            'from' => $from,
            'to' => $to,
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return HttpResponse::make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
