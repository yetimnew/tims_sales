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

class NetworkOptimizationExport implements WithMultipleSheets
{
    public function __construct(private readonly array $data) {}

    public function sheets(): array
    {
        return [
            new NetworkOverviewSheet($this->data),
            new LaneAnalysisSheet($this->data['lane_analysis'] ?? []),
            new BackhaulOpportunitiesSheet($this->data['backhaul_opportunities'] ?? []),
            new RouteBalanceSheet($this->data['route_balance'] ?? []),
            new RecommendationsSheet($this->data['recommendations'] ?? []),
        ];
    }
}

class NetworkOverviewSheet implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly array $data) {}

    public function collection(): Collection
    {
        $emptyMiles = $this->data['empty_miles_analysis'] ?? [];
        $deadhead = $this->data['deadhead_cost_analysis'] ?? [];
        $backhaul = $this->data['backhaul_revenue_opportunity'] ?? [];

        return collect([
            // Empty Miles Analysis
            ['category' => 'EMPTY MILES', 'metric' => 'Total Miles', 'value' => $emptyMiles['total_miles'] ?? 0, 'unit' => 'km'],
            ['category' => 'EMPTY MILES', 'metric' => 'Loaded Miles', 'value' => $emptyMiles['total_loaded_miles'] ?? 0, 'unit' => 'km'],
            ['category' => 'EMPTY MILES', 'metric' => 'Empty Miles', 'value' => $emptyMiles['total_empty_miles'] ?? 0, 'unit' => 'km'],
            ['category' => 'EMPTY MILES', 'metric' => 'Empty Miles Ratio', 'value' => $emptyMiles['empty_miles_ratio'] ?? 0, 'unit' => '%'],
            ['category' => 'EMPTY MILES', 'metric' => 'Industry Benchmark', 'value' => $emptyMiles['industry_benchmark'] ?? 20, 'unit' => '%'],
            ['category' => 'EMPTY MILES', 'metric' => 'Performance vs Benchmark', 'value' => $emptyMiles['performance_vs_benchmark'] ?? 0, 'unit' => '%'],
            ['category' => 'EMPTY MILES', 'metric' => 'Total Trips', 'value' => $emptyMiles['total_trips'] ?? 0, 'unit' => 'trips'],
            ['category' => 'EMPTY MILES', 'metric' => 'Trips with Empty Miles', 'value' => $emptyMiles['trips_with_empty_miles'] ?? 0, 'unit' => 'trips'],
            ['category' => 'EMPTY MILES', 'metric' => 'Avg Empty Miles per Trip', 'value' => $emptyMiles['avg_empty_miles_per_trip'] ?? 0, 'unit' => 'km'],
            
            // Deadhead Cost Analysis
            ['category' => 'DEADHEAD COSTS', 'metric' => 'Fuel Cost', 'value' => $deadhead['deadhead_fuel_cost'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'DEADHEAD COSTS', 'metric' => 'Maintenance Cost', 'value' => $deadhead['deadhead_maintenance_cost'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'DEADHEAD COSTS', 'metric' => 'Total Deadhead Cost', 'value' => $deadhead['total_deadhead_cost'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'DEADHEAD COSTS', 'metric' => 'Avg Cost per Trip', 'value' => $deadhead['avg_deadhead_cost_per_trip'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'DEADHEAD COSTS', 'metric' => 'Cost per KM', 'value' => $deadhead['cost_per_km'] ?? 0, 'unit' => 'ETB'],
            
            // Backhaul Revenue Opportunity
            ['category' => 'BACKHAUL OPPORTUNITY', 'metric' => 'Avg Revenue per Loaded KM', 'value' => $backhaul['avg_revenue_per_loaded_km'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'BACKHAUL OPPORTUNITY', 'metric' => 'Convertible Empty Miles', 'value' => $backhaul['convertible_empty_miles'] ?? 0, 'unit' => 'km'],
            ['category' => 'BACKHAUL OPPORTUNITY', 'metric' => 'Potential Backhaul Revenue', 'value' => $backhaul['potential_backhaul_revenue'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'BACKHAUL OPPORTUNITY', 'metric' => 'Revenue from Top Lanes', 'value' => $backhaul['potential_revenue_from_top_lanes'] ?? 0, 'unit' => 'ETB'],
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

class LaneAnalysisSheet implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly array $laneAnalysis) {}

    public function collection(): Collection
    {
        return collect($this->laneAnalysis);
    }

    public function headings(): array
    {
        return [
            'Origin',
            'Destination',
            'Trips',
            'Reverse Trips',
            'Total Distance (KM)',
            'Loaded Distance (KM)',
            'Empty Distance (KM)',
            'Empty Ratio %',
            'Lane Balance %',
            'Tonnage (MT)',
        ];
    }

    public function map($row): array
    {
        $formatDecimal = static fn ($value) => $value === null ? null : round((float) $value, 2);

        return [
            $row['origin_name'] ?? '—',
            $row['destination_name'] ?? '—',
            $row['trip_count'] ?? 0,
            $row['reverse_trip_count'] ?? 0,
            $formatDecimal($row['total_distance'] ?? null),
            $formatDecimal($row['loaded_distance'] ?? null),
            $formatDecimal($row['empty_distance'] ?? null),
            $formatDecimal($row['empty_ratio'] ?? null),
            $formatDecimal($row['lane_balance'] ?? null),
            $formatDecimal($row['tonnage'] ?? null),
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet;
                
                $sheet->getStyle('A1:J1')->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['argb' => 'FF10B981'],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
                
                $rowCount = count($this->laneAnalysis) + 1;
                if ($rowCount > 1) {
                    $sheet->getStyle("C2:J{$rowCount}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0.00');
                }
            },
        ];
    }
}

class BackhaulOpportunitiesSheet implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly array $backhaulData) {}

    public function collection(): Collection
    {
        return collect($backhaulData['opportunities'] ?? []);
    }

    public function headings(): array
    {
        return [
            'Destination',
            'Outbound Trips',
            'Backhaul Trips',
            'Backhaul Utilization %',
            'Backhaul Gap',
            'Total Empty Miles',
            'Avg Empty Miles',
        ];
    }

    public function map($row): array
    {
        $formatDecimal = static fn ($value) => $value === null ? null : round((float) $value, 2);

        return [
            $row['destination_name'] ?? '—',
            $row['outbound_trips'] ?? 0,
            $row['backhaul_trips'] ?? 0,
            $formatDecimal($row['backhaul_utilization'] ?? null),
            $row['backhaul_gap'] ?? 0,
            $formatDecimal($row['total_empty_miles'] ?? null),
            $formatDecimal($row['avg_empty_miles'] ?? null),
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet;
                
                $sheet->getStyle('A1:G1')->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['argb' => 'FFF59E0B'],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
                
                $rowCount = count($this->backhaulData['opportunities'] ?? []) + 1;
                if ($rowCount > 1) {
                    $sheet->getStyle("B2:G{$rowCount}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0.00');
                }
            },
        ];
    }
}

class RouteBalanceSheet implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly array $routeBalance) {}

    public function collection(): Collection
    {
        return collect($this->routeBalance);
    }

    public function headings(): array
    {
        return [
            'Location',
            'Outbound Trips',
            'Inbound Trips',
            'Total Trips',
            'Net Flow',
            'Balance Ratio %',
            'Flow Type',
        ];
    }

    public function map($row): array
    {
        $formatDecimal = static fn ($value) => $value === null ? null : round((float) $value, 2);

        return [
            $row['location_name'] ?? '—',
            $row['outbound_trips'] ?? 0,
            $row['inbound_trips'] ?? 0,
            $row['total_trips'] ?? 0,
            $row['net_flow'] ?? 0,
            $formatDecimal($row['balance_ratio'] ?? null),
            ucfirst($row['flow_type'] ?? '—'),
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet;
                
                $sheet->getStyle('A1:G1')->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['argb' => 'FF3B82F6'],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
                
                $rowCount = count($this->routeBalance) + 1;
                if ($rowCount > 1) {
                    $sheet->getStyle("B2:F{$rowCount}")
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
                        'color' => ['argb' => 'FFEF4444'],
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

