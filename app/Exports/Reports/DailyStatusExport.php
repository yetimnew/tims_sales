<?php

declare(strict_types=1);

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

class DailyStatusExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly Collection $rows) {}

    public function collection(): Collection
    {
        return $this->rows;
    }

    public function headings(): array
    {
        return [
            'Date',
            'Truck Plate',
            'Truck ID',
            'Status',
            'Status Date',
            'Recorded At',
            'Changed By',
            'Notes',
        ];
    }

    public function map($row): array
    {
        return [
            $row['date'] ?? null,
            $row['truck_plate'] ?? null,
            $row['truck_id'] ?? null,
            $row['status_name'] ?? null,
            $row['status_date'] ?? null,
            $row['registered_at'] ?? null,
            $row['changed_by'] ?? null,
            $row['notes'] ?? null,
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
                $dataRange = $rowCount > 0 ? "A2:{$lastColumn}".($rowCount + 1) : null;

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
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
                ]);
                $sheet->getStyle($headerRange)->applyFromArray($borderStyle);

                if ($dataRange !== null) {
                    $sheet->getStyle($dataRange)->applyFromArray($borderStyle);
                    $sheet->getStyle($dataRange)
                        ->getAlignment()
                        ->setVertical(Alignment::VERTICAL_TOP);
                }
            },
        ];
    }
}
