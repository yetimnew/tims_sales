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

class CustomerProfitabilityExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly Collection $rows) {}

    public function collection(): Collection
    {
        return $this->rows;
    }

    public function headings(): array
    {
        return [
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
            'Revenue per Trip',
            'Cost per Trip',
            'Cost per Km',
            'Outsource Trip Share %',
            'Outsource Tonnage Share %',
        ];
    }

    public function map($row): array
    {
        $formatDecimal = static fn ($value) => $value === null ? null : round((float) $value, 2);
        $formatPercent = static fn ($value) => $value === null ? null : round((float) $value, 2);

        return [
            $row['customer_name'] ?? '—',
            $row['operations'] ?? null,
            $row['lanes_used'] ?? null,
            $row['internal_trips'] ?? null,
            $row['outsource_trips'] ?? null,
            $row['total_trips'] ?? null,
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

                if ($rowCount > 0) {
                    $sheet->getStyle("A2:{$lastColumn}{$totalRowIndex}")->applyFromArray($borderStyle);
                    $sheet->getStyle("D2:{$lastColumn}{$totalRowIndex}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                    $sheet->getStyle("A2:C{$totalRowIndex}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_LEFT);
                }

                if ($totalRowIndex > 1) {
                    $sheet->getStyle($totalRange)->applyFromArray([
                        'font' => ['bold' => true, 'color' => ['argb' => 'FF0F172A']],
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'color' => ['argb' => 'FFF8FAFC'],
                        ],
                    ]);
                }

                if ($rowCount > 0) {
                    $dataStart = 2;
                    $dataEnd = $rowCount + 1;

                    $sheet->getStyle("D{$dataStart}:Q{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0.00');
                    $sheet->getStyle("K{$dataStart}:P{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('0.00"%"');
                }
            },
        ];
    }
}
