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

class RouteProfitabilityExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly Collection $rows) {}

    public function collection(): Collection
    {
        return $this->rows;
    }

    public function headings(): array
    {
        return [
            'Route',
            'Trips',
            'Tonnage (MT)',
            'Ton-KM',
            'Distance With Cargo (KM)',
            'Distance Without Cargo (KM)',
            'Total Distance (KM)',
            'Average Distance (KM)',
            'Average Tonnage (MT)',
            'Revenue',
            'Expense',
            'Profit',
            'Margin %',
            'Revenue per KM',
            'Cost per KM',
            'Profit per KM',
        ];
    }

    public function map($row): array
    {
        $formatDecimal = static fn ($value) => $value === null ? null : round((float) $value, 2);
        $routeKey = $row['route_key'] ?? null;
        $routeLabel = $routeKey === 'totals'
            ? 'TOTALS'
            : sprintf('%s -> %s', $row['origin_name'] ?? 'Unknown', $row['destination_name'] ?? 'Unknown');

        return [
            $routeLabel,
            $row['trips'],
            $formatDecimal($row['tonnage'] ?? null),
            $formatDecimal($row['ton_km'] ?? null),
            $formatDecimal($row['distance_wc'] ?? null),
            $formatDecimal($row['distance_wo'] ?? null),
            $formatDecimal($row['distance_total'] ?? null),
            $formatDecimal($row['avg_distance'] ?? null),
            $formatDecimal($row['avg_tonnage'] ?? null),
            $formatDecimal($row['revenue'] ?? null),
            $formatDecimal($row['expense'] ?? null),
            $formatDecimal($row['profit'] ?? null),
            $row['margin_percent'] === null ? null : round((float) $row['margin_percent'], 2),
            $formatDecimal($row['revenue_per_km'] ?? null),
            $formatDecimal($row['cost_per_km'] ?? null),
            $formatDecimal($row['profit_per_km'] ?? null),
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
                    $sheet->getStyle("B2:{$lastColumn}{$totalRowIndex}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                    $sheet->getStyle("A2:A{$totalRowIndex}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_LEFT);
                }

                if ($rowCount > 0) {
                    $dataStart = 2;
                    $dataEnd = $rowCount + 1;

                    $sheet->getStyle("B{$dataStart}:B{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0');
                    $sheet->getStyle("C{$dataStart}:P{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0.00');
                    $sheet->getStyle("M{$dataStart}:M{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('0.00"%"');
                }
            },
        ];
    }
}
