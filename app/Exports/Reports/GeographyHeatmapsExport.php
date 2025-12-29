<?php

namespace App\Exports\Reports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class GeographyHeatmapsExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly Collection $rows) {}

    public function collection(): Collection
    {
        return $this->rows;
    }

    public function headings(): array
    {
        return ['Level', 'Name', 'Trips', 'Tonnage (MT)', 'Revenue'];
    }

    public function map($row): array
    {
        return [
            $row['level'],
            $row['name'],
            $row['trips'],
            $row['tonnage'],
            $row['revenue'],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet;
                $rowCount = $this->rows->count();
                $headerRange = 'A1:E1';
                $dataRange = 'A2:E'.($rowCount + 1);

                $sheet->getStyle($headerRange)->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FF0F172A']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['argb' => 'FFE2E8F0'],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);

                if ($rowCount > 0) {
                    $sheet->getStyle($dataRange)->applyFromArray([
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color' => ['argb' => 'FFCBD5F5'],
                            ],
                        ],
                    ]);

                    $sheet->getStyle('A2:B'.($rowCount + 1))
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_LEFT);
                    $sheet->getStyle('C2:E'.($rowCount + 1))
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                    $sheet->getStyle('D2:E'.($rowCount + 1))
                        ->getNumberFormat()
                        ->setFormatCode('#,##0.00');

                    foreach ($this->rows as $index => $row) {
                        if (! empty($row['is_total'])) {
                            $excelRow = $index + 2;
                            $sheet->getStyle('A'.$excelRow.':E'.$excelRow)->applyFromArray([
                                'font' => ['bold' => true],
                                'fill' => [
                                    'fillType' => Fill::FILL_SOLID,
                                    'color' => ['argb' => 'FFF8FAFC'],
                                ],
                            ]);
                        }
                    }
                }
            },
        ];
    }
}
