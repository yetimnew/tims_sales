<?php

namespace App\Http\Controllers;

use App\Models\Truck;
use App\Models\Driver;
use App\Models\Performance;
use App\Models\Operation;
use App\Models\TruckFinancialRecord;
use App\Models\VehicleMaintenanceRecord;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Exception;

class ReportController extends Controller
{
    /**
     * Display truck reports.
     */
    public function trucks(): Response
    {
        try {
            $truckStats = [
                'total_trucks' => Truck::count(),
                'active_trucks' => Truck::where('status', 'active')->count(),
                'inactive_trucks' => Truck::where('status', 'inactive')->count(),
                'trucks_by_type' => Truck::with('vehicleType')
                    ->select('vehicletype_id', DB::raw('count(*) as count'))
                    ->groupBy('vehicletype_id')
                    ->get(),
                'average_purchase_price' => Truck::avg('purchasePrice'),
                'total_purchase_value' => Truck::sum('purchasePrice'),
            ];

            $trucks = Truck::with(['vehicleType', 'drivers'])
                ->paginate(15);

            return Inertia::render('Reports/Trucks', [
                'truckStats' => $truckStats,
                'trucks' => $trucks,
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate truck report.']);
        }
    }

    /**
     * Display driver reports.
     */
    public function drivers(): Response
    {
        try {
            $driverStats = [
                'total_drivers' => Driver::count(),
                'active_drivers' => Driver::where('status', 'active')->count(),
                'inactive_drivers' => Driver::where('status', 'inactive')->count(),
                'drivers_by_zone' => Driver::select('zone', DB::raw('count(*) as count'))
                    ->groupBy('zone')
                    ->get(),
                'average_age' => Driver::whereNotNull('birthdate')
                    ->selectRaw('AVG(YEAR(CURDATE()) - YEAR(birthdate)) as avg_age')
                    ->value('avg_age'),
            ];

            $drivers = Driver::with(['trucks'])
                ->paginate(15);

            return Inertia::render('Reports/Drivers', [
                'driverStats' => $driverStats,
                'drivers' => $drivers,
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate driver report.']);
        }
    }

    /**
     * Display performance reports.
     */
    public function performances(): Response
    {
        try {
            $performanceStats = [
                'total_performances' => Performance::count(),
                'returned_performances' => Performance::where('is_returned', true)->count(),
                'not_returned_performances' => Performance::where('is_returned', false)->count(),
                'total_tonnage' => Performance::sum('CargoVolumMT'),
                'average_tonnage_per_trip' => Performance::avg('CargoVolumMT'),
                'total_distance' => Performance::sum('DistanceWCargo'),
                'performances_by_month' => Performance::selectRaw('YEAR(DateDispach) as year, MONTH(DateDispach) as month, COUNT(*) as count')
                    ->groupBy('year', 'month')
                    ->orderBy('year', 'desc')
                    ->orderBy('month', 'desc')
                    ->limit(12)
                    ->get(),
            ];

            $performances = Performance::with(['operation.customer', 'driverTruck.driver', 'driverTruck.truck', 'origin', 'destination'])
                ->orderBy('DateDispach', 'desc')
                ->paginate(15);

            return Inertia::render('Reports/Performances', [
                'performanceStats' => $performanceStats,
                'performances' => $performances,
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate performance report.']);
        }
    }

    /**
     * Display operation reports.
     */
    public function operations(): Response
    {
        try {
            $operationStats = [
                'total_operations' => Operation::count(),
                'active_operations' => Operation::where('status', 'active')->count(),
                'inactive_operations' => Operation::where('status', 'inactive')->count(),
                'operations_by_customer' => Operation::with('customer')
                    ->select('customer_id', DB::raw('count(*) as count'))
                    ->groupBy('customer_id')
                    ->get(),
                'operations_with_performances' => Operation::has('performances')->count(),
            ];

            $operations = Operation::with(['customer', 'performances'])
                ->paginate(15);

            return Inertia::render('Reports/Operations', [
                'operationStats' => $operationStats,
                'operations' => $operations,
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate operation report.']);
        }
    }

    /**
     * Display financial reports.
     */
    public function financial(): Response
    {
        try {
            $financialStats = [
                'total_revenue' => TruckFinancialRecord::sum('revenue'),
                'total_costs' => TruckFinancialRecord::sum('fuel_cost') +
                               TruckFinancialRecord::sum('maintenance_cost') +
                               TruckFinancialRecord::sum('driver_salary') +
                               TruckFinancialRecord::sum('insurance_cost') +
                               TruckFinancialRecord::sum('depreciation') +
                               TruckFinancialRecord::sum('other_costs'),
                'total_profit' => TruckFinancialRecord::sum('net_profit'),
                'average_profit_margin' => TruckFinancialRecord::avg('net_profit'),
                'monthly_financials' => TruckFinancialRecord::selectRaw('YEAR(record_date) as year, MONTH(record_date) as month, SUM(revenue) as revenue, SUM(net_profit) as profit')
                    ->groupBy('year', 'month')
                    ->orderBy('year', 'desc')
                    ->orderBy('month', 'desc')
                    ->limit(12)
                    ->get(),
            ];

            $financialRecords = TruckFinancialRecord::with(['truck'])
                ->orderBy('record_date', 'desc')
                ->paginate(15);

            return Inertia::render('Reports/Financial', [
                'financialStats' => $financialStats,
                'financialRecords' => $financialRecords,
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate financial report.']);
        }
    }

    /**
     * Display maintenance reports.
     */
    public function maintenance(): Response
    {
        try {
            $maintenanceStats = [
                'total_maintenance_records' => VehicleMaintenanceRecord::count(),
                'scheduled_maintenance' => VehicleMaintenanceRecord::where('status', 'scheduled')->count(),
                'completed_maintenance' => VehicleMaintenanceRecord::where('status', 'completed')->count(),
                'overdue_maintenance' => VehicleMaintenanceRecord::where('status', 'scheduled')
                    ->where('scheduled_date', '<', now())->count(),
                'total_maintenance_cost' => VehicleMaintenanceRecord::sum('cost'),
                'average_maintenance_cost' => VehicleMaintenanceRecord::avg('cost'),
                'maintenance_by_type' => VehicleMaintenanceRecord::with('maintenanceType')
                    ->select('maintenance_type_id', DB::raw('count(*) as count'))
                    ->groupBy('maintenance_type_id')
                    ->get(),
            ];

            $maintenanceRecords = VehicleMaintenanceRecord::with(['truck', 'maintenanceType', 'assignedMechanic'])
                ->orderBy('scheduled_date', 'desc')
                ->paginate(15);

            return Inertia::render('Reports/Maintenance', [
                'maintenanceStats' => $maintenanceStats,
                'maintenanceRecords' => $maintenanceRecords,
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate maintenance report.']);
        }
    }
}

