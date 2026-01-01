<?php

namespace App\Exports\Reports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class CapacityPlanningExport implements WithMultipleSheets
{
    public function __construct(private readonly array $data) {}

    public function sheets(): array
    {
        return [
            new CapacityOverviewSheet($this->data),
            new TruckPerformanceSheet($this->data['truck_performance'] ?? []),
            new RecommendationsSheet($this->data['recommendations'] ?? []),
            new MonthlyTrendSheet($this->data['monthly_trend'] ?? []),
        ];
    }
}

class CapacityOverviewSheet implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly array $data) {}

    public function collection(): Collection
    {
        $fleetOverview = $this->data['fleet_overview'] ?? [];
        $utilization = $this->data['utilization_analysis'] ?? [];
        $demand = $this->data['demand_analysis'] ?? [];
        $productivity = $this->data['productivity_metrics'] ?? [];
        $idleCapacity = $this->data['idle_capacity'] ?? [];

        return collect([
            // Fleet Overview
            ['category' => 'FLEET OVERVIEW', 'metric' => 'Total Trucks', 'value' => $fleetOverview['total_trucks'] ?? 0, 'unit' => 'trucks'],
            ['category' => 'FLEET OVERVIEW', 'metric' => 'Active Trucks', 'value' => $fleetOverview['active_trucks'] ?? 0, 'unit' => 'trucks'],
            ['category' => 'FLEET OVERVIEW', 'metric' => 'Maintenance Trucks', 'value' => $fleetOverview['maintenance_trucks'] ?? 0, 'unit' => 'trucks'],
            ['category' => 'FLEET OVERVIEW', 'metric' => 'Fleet Utilization Rate', 'value' => $fleetOverview['utilization_rate'] ?? 0, 'unit' => '%'],
            ['category' => 'FLEET OVERVIEW', 'metric' => 'Total Trips', 'value' => $fleetOverview['total_trips'] ?? 0, 'unit' => 'trips'],
            ['category' => 'FLEET OVERVIEW', 'metric' => 'Total Revenue', 'value' => $fleetOverview['total_revenue'] ?? 0, 'unit' => 'ETB'],
            
            // Utilization Analysis
            ['category' => 'UTILIZATION', 'metric' => 'Average Utilization', 'value' => $utilization['average_utilization'] ?? 0, 'unit' => '%'],
            ['category' => 'UTILIZATION', 'metric' => 'High Utilization (>80%)', 'value' => $utilization['high_utilization_count'] ?? 0, 'unit' => 'trucks'],
            ['category' => 'UTILIZATION', 'metric' => 'Optimal Utilization (60-80%)', 'value' => $utilization['optimal_utilization_count'] ?? 0, 'unit' => 'trucks'],
            ['category' => 'UTILIZATION', 'metric' => 'Underutilized (<60%)', 'value' => $utilization['underutilized_count'] ?? 0, 'unit' => 'trucks'],
            ['category' => 'UTILIZATION', 'metric' => 'Unused (0%)', 'value' => $utilization['unused_count'] ?? 0, 'unit' => 'trucks'],
            
            // Demand Analysis
            ['category' => 'DEMAND', 'metric' => 'Total Trips', 'value' => $demand['total_trips'] ?? 0, 'unit' => 'trips'],
            ['category' => 'DEMAND', 'metric' => 'Internal Trips', 'value' => $demand['internal_trips'] ?? 0, 'unit' => 'trips'],
            ['category' => 'DEMAND', 'metric' => 'Outsource Trips', 'value' => $demand['outsource_trips'] ?? 0, 'unit' => 'trips'],
            ['category' => 'DEMAND', 'metric' => 'Outsource Rate', 'value' => $demand['outsource_rate'] ?? 0, 'unit' => '%'],
            ['category' => 'DEMAND', 'metric' => 'Avg Trips per Day', 'value' => $demand['avg_trips_per_day'] ?? 0, 'unit' => 'trips/day'],
            ['category' => 'DEMAND', 'metric' => 'Peak Daily Trips', 'value' => $demand['peak_daily_trips'] ?? 0, 'unit' => 'trips'],
            ['category' => 'DEMAND', 'metric' => 'Demand Variability', 'value' => $demand['demand_variability'] ?? 0, 'unit' => '%'],
            
            // Productivity
            ['category' => 'PRODUCTIVITY', 'metric' => 'Trips per Truck per Day', 'value' => $productivity['trips_per_truck_per_day'] ?? 0, 'unit' => 'trips'],
            ['category' => 'PRODUCTIVITY', 'metric' => 'Distance per Truck per Day', 'value' => $productivity['distance_per_truck_per_day'] ?? 0, 'unit' => 'km'],
            ['category' => 'PRODUCTIVITY', 'metric' => 'Revenue per Truck per Day', 'value' => $productivity['revenue_per_truck_per_day'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'PRODUCTIVITY', 'metric' => 'Avg Distance per Trip', 'value' => $productivity['avg_distance_per_trip'] ?? 0, 'unit' => 'km'],
            
            // Idle Capacity
            ['category' => 'IDLE CAPACITY', 'metric' => 'Idle Truck Days', 'value' => $idleCapacity['idle_truck_days'] ?? 0, 'unit' => 'days'],
            ['category' => 'IDLE CAPACITY', 'metric' => 'Idle Rate', 'value' => $idleCapacity['idle_rate'] ?? 0, 'unit' => '%'],
            ['category' => 'IDLE CAPACITY', 'metric' => 'Total Idle Cost', 'value' => $idleCapacity['total_idle_cost'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'IDLE CAPACITY', 'metric' => 'Potential Revenue from Idle', 'value' => $idleCapacity['potential_revenue_from_idle'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'IDLE CAPACITY', 'metric' => 'Total Opportunity Cost', 'value' => $idleCapacity['total_opportunity_cost'] ?? 0, 'unit' => 'ETB'],
        ]);
    }

    public function headings(): array
    {
        return ['Category', 'Metric', 'Value', 'Unit'];
    }

    public function map($row): array
    {
        $formatDecimal = static fn ($value) => $value === null ? null : round((float) $value, 2);

        return [
            $row['category'] ?? '—',
            $row['metric'] ?? '—',
            $formatDecimal($row['value'] ?? null),
            $row['unit'] ?? '—',
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet;
                
                $sheet->getStyle('A1:D1')->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['argb' => 'FF6366F1'],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
                
                $rowCount = $this->collection()->count() + 1;
                $sheet->getStyle("A1:D{$rowCount}")->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['argb' => 'FFCBD5F5'],
                        ],
                    ],
                ]);
                
                $sheet->getStyle("C2:C{$rowCount}")
                    ->getNumberFormat()
                    ->setFormatCode('#,##0.00');
            },
        ];
    }
}

class TruckPerformanceSheet implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly array $truckPerformance) {}

    public function collection(): Collection
    {
        return collect($this->truckPerformance);
    }

    public function headings(): array
    {
        return [
            'Plate',
            'Vehicle Type',
            'Active Days',
            'Idle Days',
            'Utilization %',
            'Trips',
            'Distance (KM)',
            'Tonnage (MT)',
            'Revenue',
            'Trips/Day',
            'Revenue/Day',
        ];
    }

    public function map($row): array
    {
        $formatDecimal = static fn ($value) => $value === null ? null : round((float) $value, 2);

        return [
            $row['plate'] ?? '—',
            $row['vehicle_type'] ?? '—',
            $row['active_days'] ?? 0,
            $row['idle_days'] ?? 0,
            $formatDecimal($row['utilization'] ?? null),
            $row['trips'] ?? 0,
            $formatDecimal($row['distance_km'] ?? null),
            $formatDecimal($row['tonnage'] ?? null),
            $formatDecimal($row['revenue'] ?? null),
            $formatDecimal($row['trips_per_day'] ?? null),
            $formatDecimal($row['revenue_per_day'] ?? null),
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet;
                
                $sheet->getStyle('A1:K1')->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['argb' => 'FF10B981'],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
                
                $rowCount = count($this->truckPerformance) + 1;
                if ($rowCount > 1) {
                    $sheet->getStyle("C2:K{$rowCount}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0.00');
                }
            },
        ];
    }
}

class RecommendationsSheet implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly array $recommendations) {}

    public function collection(): Collection
    {
        return collect($this->recommendations);
    }

    public function headings(): array
    {
        return [
            'Priority',
            'Category',
            'Title',
            'Description',
            'Potential Savings',
            'Potential Revenue',
        ];
    }

    public function map($row): array
    {
        $formatDecimal = static fn ($value) => $value === null ? null : round((float) $value, 2);

        return [
            strtoupper($row['priority'] ?? '—'),
            ucwords(str_replace('_', ' ', $row['category'] ?? '—')),
            $row['title'] ?? '—',
            $row['description'] ?? '—',
            $formatDecimal($row['potential_savings'] ?? null),
            $formatDecimal($row['potential_revenue'] ?? null),
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet;
                
                $sheet->getStyle('A1:F1')->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['argb' => 'FFF59E0B'],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
                
                $rowCount = count($this->recommendations) + 1;
                if ($rowCount > 1) {
                    $sheet->getStyle("E2:F{$rowCount}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0.00');
                    
                    // Wrap text in description column
                    $sheet->getStyle("D2:D{$rowCount}")
                        ->getAlignment()
                        ->setWrapText(true);
                }
            },
        ];
    }
}

class MonthlyTrendSheet implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly array $monthlyTrend) {}

    public function collection(): Collection
    {
        return collect($this->monthlyTrend);
    }

    public function headings(): array
    {
        return [
            'Month',
            'Utilization %',
            'Active Truck Days',
            'Total Possible Days',
            'Trips',
            'Avg Trips/Day',
        ];
    }

    public function map($row): array
    {
        $formatDecimal = static fn ($value) => $value === null ? null : round((float) $value, 2);

        return [
            $row['month'] ?? '—',
            $formatDecimal($row['utilization'] ?? null),
            $row['active_truck_days'] ?? 0,
            $row['total_possible_truck_days'] ?? 0,
            $row['trips'] ?? 0,
            $formatDecimal($row['avg_trips_per_day'] ?? null),
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet;
                
                $sheet->getStyle('A1:F1')->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['argb' => 'FF3B82F6'],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
                
                $rowCount = count($this->monthlyTrend) + 1;
                if ($rowCount > 1) {
                    $sheet->getStyle("B2:F{$rowCount}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0.00');
                }
            },
        ];
    }
}

