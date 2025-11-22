<?php

namespace App\Exports\Reports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class OperationalComparisonExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly Collection $rows) {}

    public function collection(): Collection
    {
        return $this->rows;
    }

    public function headings(): array
    {
        return [
            'Operation',
            'Customer',
            'Internal Trips',
            'Outsource Trips',
            'Total Trips',
            'Internal Tonnage (MT)',
            'Outsource Tonnage (MT)',
            'Total Tonnage (MT)',
            'Total Ton-KM',
            'Revenue',
            'Total Cost',
            'Profit',
            'Margin %',
            'Revenue / Ton-KM',
            'Cost / Ton-KM',
            'Profit / Ton-KM',
            'Revenue / Trip',
            'Cost / Trip',
            'Tonnage / Trip',
            'Average Km/Trip',
            'Total Distance (KM)',
            'Empty Distance %',
            'Cost per Km',
            'Internal Fuel / Km',
            'Outsource Cost / Km',
            'Outsource Trip Share %',
            'Outsource Tonnage Share %',
        ];
    }

    public function map($row): array
    {
        $formatDecimal = static fn ($value) => $value === null ? null : round((float) $value, 2);
        $formatPercent = static fn ($value) => $value === null ? null : round((float) $value, 2);

        return [
            $row['operation_code'],
            $row['customer_name'],
            $row['internal_trips'],
            $row['outsource_trips'],
            $row['total_trips'],
            $formatDecimal($row['internal_tonnage']),
            $formatDecimal($row['outsource_tonnage']),
            $formatDecimal($row['total_tonnage']),
            $formatDecimal($row['total_ton_km']),
            $formatDecimal($row['revenue']),
            $formatDecimal($row['total_cost']),
            $formatDecimal($row['profit']),
            $formatPercent($row['margin_percent']),
            $formatDecimal($row['revenue_per_ton_km']),
            $formatDecimal($row['cost_per_ton_km']),
            $formatDecimal($row['profit_per_ton_km']),
            $formatDecimal($row['revenue_per_trip']),
            $formatDecimal($row['cost_per_trip']),
            $formatDecimal($row['tonnage_per_trip']),
            $formatDecimal($row['average_km_per_trip']),
            $formatDecimal($row['total_distance']),
            $formatPercent($row['empty_distance_ratio_percent']),
            $formatDecimal($row['cost_per_km']),
            $formatDecimal($row['internal_fuel_cost_per_km']),
            $formatDecimal($row['outsource_cost_per_km']),
            $formatPercent($row['outsource_trip_share_percent']),
            $formatPercent($row['outsource_tonnage_share_percent']),
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet;
                $columnCount = count($this->headings());
                $lastColumn = Coordinate::stringFromColumnIndex($columnCount);
                $rowCount = $this->rows->count();
                $headerRange = "A1:{$lastColumn}1";
                $totalRowIndex = $rowCount + 1;
                $totalRange = "A{$totalRowIndex}:{$lastColumn}{$totalRowIndex}";

                $borderStyle = [
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['argb' => 'FFCBD5F5'],
                        ],
                    ],
                ];

                $sheet->getStyle($headerRange)->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FF0F172A']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['argb' => 'FFE2E8F0'],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
                $sheet->getStyle($headerRange)->applyFromArray($borderStyle);

                $sheet->getStyle($totalRange)->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FF0F172A']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['argb' => 'FFF8FAFC'],
                    ],
                ]);
                $sheet->getStyle($totalRange)->applyFromArray($borderStyle);

                if ($totalRowIndex > 1) {
                    $sheet->getStyle("C2:{$lastColumn}{$totalRowIndex}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                    $sheet->getStyle("A2:B{$totalRowIndex}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_LEFT);
                }

                if ($rowCount > 0) {
                    $dataStart = 2;
                    $dataEnd = $rowCount + 1;

                    $sheet->getStyle("C{$dataStart}:E{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0');
                    $sheet->getStyle("F{$dataStart}:Y{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0.00');
                    $sheet->getStyle("M{$dataStart}:M{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('0.00"%"');
                    $sheet->getStyle("V{$dataStart}:V{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('0.00"%"');
                    $sheet->getStyle("Z{$dataStart}:AA{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('0.00"%"');
                }
            },
        ];
    }
}
