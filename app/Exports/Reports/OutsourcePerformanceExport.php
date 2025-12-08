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

class OutsourcePerformanceExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly Collection $rows) {}

    public function collection(): Collection
    {
        return $this->rows;
    }

    public function headings(): array
    {
        return [
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
    }

    public function map($row): array
    {
        $formatDecimal = static fn ($value) => $value === null ? null : round((float) $value, 2);

        return [
            $row['fo_number'],
            $row['dispatch_date'],
            $row['driver_name'],
            $row['truck_plate'],
            $row['operation_code'],
            $row['customer_name'],
            $row['origin_name'],
            $row['destination_name'],
            $formatDecimal($row['tonnage']),
            $formatDecimal($row['ton_km']),
            $formatDecimal($row['distance_total']),
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

                    $sheet->getStyle("I{$dataStart}:K{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0.00');
                    $sheet->getStyle("L{$dataStart}:N{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0.00');
                    $sheet->getStyle("O{$dataStart}:O{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('0.00"%"');
                }
            },
        ];
    }
}
