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

class FleetFinancialExport implements WithMultipleSheets
{
    public function __construct(private readonly array $data) {}

    public function sheets(): array
    {
        return [
            new FleetFinancialSummarySheet($this->data),
            new FleetFinancialBreakdownSheet($this->data['breakdown'] ?? []),
            new FleetFinancialTrendsSheet($this->data['trends'] ?? []),
        ];
    }
}

class FleetFinancialSummarySheet implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly array $data) {}

    public function collection(): Collection
    {
        $profitability = $this->data['profitability'] ?? [];
        $revenue = $this->data['revenue'] ?? [];
        $costs = $this->data['costs'] ?? [];
        $cashFlow = $this->data['cash_flow'] ?? [];
        $capitalEfficiency = $this->data['capital_efficiency'] ?? [];

        return collect([
            // Profitability metrics
            ['category' => 'PROFITABILITY', 'metric' => 'Total Revenue', 'value' => $profitability['total_revenue'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'PROFITABILITY', 'metric' => 'Total Cost', 'value' => $profitability['total_cost'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'PROFITABILITY', 'metric' => 'Gross Profit', 'value' => $profitability['gross_profit'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'PROFITABILITY', 'metric' => 'Gross Profit Margin', 'value' => $profitability['gross_profit_margin'] ?? null, 'unit' => '%'],
            ['category' => 'PROFITABILITY', 'metric' => 'EBITDA', 'value' => $profitability['ebitda'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'PROFITABILITY', 'metric' => 'EBITDA Margin', 'value' => $profitability['ebitda_margin'] ?? null, 'unit' => '%'],
            ['category' => 'PROFITABILITY', 'metric' => 'EBIT (Operating Profit)', 'value' => $profitability['ebit'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'PROFITABILITY', 'metric' => 'EBIT Margin', 'value' => $profitability['ebit_margin'] ?? null, 'unit' => '%'],
            ['category' => 'PROFITABILITY', 'metric' => 'Net Profit', 'value' => $profitability['net_profit'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'PROFITABILITY', 'metric' => 'Net Profit Margin', 'value' => $profitability['net_profit_margin'] ?? null, 'unit' => '%'],
            ['category' => 'PROFITABILITY', 'metric' => 'ROI', 'value' => $profitability['roi'] ?? null, 'unit' => '%'],
            ['category' => 'PROFITABILITY', 'metric' => 'ROIC', 'value' => $profitability['roic'] ?? null, 'unit' => '%'],
            
            // Revenue metrics
            ['category' => 'REVENUE', 'metric' => 'Revenue per Truck per Month', 'value' => $revenue['revenue_per_truck_per_month'] ?? null, 'unit' => 'ETB'],
            ['category' => 'REVENUE', 'metric' => 'Revenue per KM', 'value' => $revenue['revenue_per_km'] ?? null, 'unit' => 'ETB'],
            ['category' => 'REVENUE', 'metric' => 'Revenue per Ton-KM', 'value' => $revenue['revenue_per_ton_km'] ?? null, 'unit' => 'ETB'],
            ['category' => 'REVENUE', 'metric' => 'Revenue Growth Rate', 'value' => $revenue['revenue_growth_rate'] ?? null, 'unit' => '%'],
            ['category' => 'REVENUE', 'metric' => 'Internal Revenue', 'value' => $revenue['internal_revenue'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'REVENUE', 'metric' => 'Outsource Revenue', 'value' => $revenue['outsource_revenue'] ?? 0, 'unit' => 'ETB'],
            
            // Cost structure
            ['category' => 'COSTS', 'metric' => 'Fuel Cost', 'value' => $costs['fuel_cost'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'COSTS', 'metric' => 'Labor Cost', 'value' => $costs['labor_cost'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'COSTS', 'metric' => 'Maintenance Cost', 'value' => $costs['maintenance_cost'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'COSTS', 'metric' => 'Admin Cost', 'value' => $costs['admin_cost'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'COSTS', 'metric' => 'Variable Cost', 'value' => $costs['variable_cost'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'COSTS', 'metric' => 'Fixed Cost', 'value' => $costs['fixed_cost'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'COSTS', 'metric' => 'Fuel Cost %', 'value' => $costs['fuel_cost_percent'] ?? null, 'unit' => '%'],
            ['category' => 'COSTS', 'metric' => 'Labor Cost %', 'value' => $costs['labor_cost_percent'] ?? null, 'unit' => '%'],
            ['category' => 'COSTS', 'metric' => 'Variable Cost %', 'value' => $costs['variable_percent'] ?? null, 'unit' => '%'],
            ['category' => 'COSTS', 'metric' => 'Fixed Cost %', 'value' => $costs['fixed_percent'] ?? null, 'unit' => '%'],
            
            // Cash flow
            ['category' => 'CASH FLOW', 'metric' => 'Operating Cash Flow', 'value' => $cashFlow['operating_cash_flow'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'CASH FLOW', 'metric' => 'Free Cash Flow', 'value' => $cashFlow['free_cash_flow'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'CASH FLOW', 'metric' => 'Working Capital Needs', 'value' => $cashFlow['working_capital_needs'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'CASH FLOW', 'metric' => 'Days Sales Outstanding', 'value' => $cashFlow['days_sales_outstanding'] ?? null, 'unit' => 'days'],
            ['category' => 'CASH FLOW', 'metric' => 'Cash Conversion Cycle', 'value' => $cashFlow['cash_conversion_cycle'] ?? null, 'unit' => 'days'],
            
            // Capital efficiency
            ['category' => 'CAPITAL', 'metric' => 'Fleet Value', 'value' => $capitalEfficiency['fleet_value'] ?? 0, 'unit' => 'ETB'],
            ['category' => 'CAPITAL', 'metric' => 'Active Truck Count', 'value' => $capitalEfficiency['active_truck_count'] ?? 0, 'unit' => 'trucks'],
            ['category' => 'CAPITAL', 'metric' => 'Fleet Utilization', 'value' => $capitalEfficiency['fleet_utilization'] ?? null, 'unit' => '%'],
            ['category' => 'CAPITAL', 'metric' => 'Asset Turnover Ratio', 'value' => $capitalEfficiency['asset_turnover_ratio'] ?? null, 'unit' => 'ratio'],
        ]);
    }

    public function headings(): array
    {
        return [
            'Category',
            'Metric',
            'Value',
            'Unit',
        ];
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
                
                // Style header row
                $sheet->getStyle('A1:D1')->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['argb' => 'FF4F46E5'],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
                
                // Apply borders
                $rowCount = $this->collection()->count() + 1;
                $sheet->getStyle("A1:D{$rowCount}")->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['argb' => 'FFCBD5F5'],
                        ],
                    ],
                ]);
                
                // Number formatting
                $sheet->getStyle("C2:C{$rowCount}")
                    ->getNumberFormat()
                    ->setFormatCode('#,##0.00');
            },
        ];
    }
}

class FleetFinancialBreakdownSheet implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly array $breakdown) {}

    public function collection(): Collection
    {
        return collect($this->breakdown);
    }

    public function headings(): array
    {
        return [
            'Month',
            'Revenue',
            'Cost',
            'Profit',
            'Margin %',
            'Trips',
            'Distance (KM)',
            'Revenue per KM',
            'Cost per KM',
        ];
    }

    public function map($row): array
    {
        $formatDecimal = static fn ($value) => $value === null ? null : round((float) $value, 2);

        return [
            $row['month'] ?? '—',
            $formatDecimal($row['revenue'] ?? null),
            $formatDecimal($row['cost'] ?? null),
            $formatDecimal($row['profit'] ?? null),
            $formatDecimal($row['margin'] ?? null),
            $row['trips'] ?? 0,
            $formatDecimal($row['distance_km'] ?? null),
            $formatDecimal($row['revenue_per_km'] ?? null),
            $formatDecimal($row['cost_per_km'] ?? null),
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet;
                
                $sheet->getStyle('A1:I1')->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['argb' => 'FF10B981'],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
                
                $rowCount = count($this->breakdown) + 1;
                $sheet->getStyle("B2:I{$rowCount}")
                    ->getNumberFormat()
                    ->setFormatCode('#,##0.00');
            },
        ];
    }
}

class FleetFinancialTrendsSheet implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly array $trends) {}

    public function collection(): Collection
    {
        return collect($this->trends);
    }

    public function headings(): array
    {
        return [
            'Month',
            'Revenue',
            'Cost',
            'Profit',
            'Margin %',
        ];
    }

    public function map($row): array
    {
        $formatDecimal = static fn ($value) => $value === null ? null : round((float) $value, 2);

        return [
            $row['month'] ?? '—',
            $formatDecimal($row['revenue'] ?? null),
            $formatDecimal($row['cost'] ?? null),
            $formatDecimal($row['profit'] ?? null),
            $formatDecimal($row['margin'] ?? null),
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet;
                
                $sheet->getStyle('A1:E1')->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['argb' => 'FF3B82F6'],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
                
                $rowCount = count($this->trends) + 1;
                $sheet->getStyle("B2:E{$rowCount}")
                    ->getNumberFormat()
                    ->setFormatCode('#,##0.00');
            },
        ];
    }
}

