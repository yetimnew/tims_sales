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

class TruckPerformanceExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly Collection $rows) {}

    public function collection(): Collection
    {
        return $this->rows;
    }

    public function headings(): array
    {
        return [
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
    }

    public function map($row): array
    {
        $formatDecimal = static fn ($value) => $value === null ? null : round((float) $value, 2);

        return [
            $row['plate'],
            $row['trips'],
            $formatDecimal($row['tonnage']),
            $formatDecimal($row['ton_km']),
            $formatDecimal($row['distance_wc']),
            $formatDecimal($row['distance_wo']),
            $formatDecimal($row['distance_total']),
            $formatDecimal($row['fuel_litres']),
            $formatDecimal($row['fuel_cost']),
            $formatDecimal($row['perdiem']),
            $formatDecimal($row['work_on_going']),
            $formatDecimal($row['other_cost']),
            $formatDecimal($row['expense']),
            $formatDecimal($row['revenue']),
            $formatDecimal($row['profit']),
            $row['margin_percent'] === null ? null : round((float) $row['margin_percent'], 2),
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
                $totalRowIndex = $rowCount + 1; // account for heading row
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
                    $sheet->getStyle("B2:{$lastColumn}{$totalRowIndex}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                    $sheet->getStyle("A2:A{$totalRowIndex}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                }

                if ($rowCount > 0) {
                    $dataStart = 2;
                    $dataEnd = $rowCount + 1;

                    $sheet->getStyle("B{$dataStart}:B{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0');
                    $sheet->getStyle("C{$dataStart}:H{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0.00');
                    $sheet->getStyle("I{$dataStart}:O{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0.00');
                    $sheet->getStyle("P{$dataStart}:P{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('0.00"%"');
                }
            },
        ];
    }
}
