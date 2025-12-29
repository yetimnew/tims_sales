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

class MaintenanceExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
{
    public function __construct(private readonly Collection $rows) {}

    public function collection(): Collection
    {
        return $this->rows;
    }

    public function headings(): array
    {
        return [
            'Truck',
            'Status',
            'Records',
            'Completed',
            'Scheduled',
            'In Progress',
            'Overdue',
            'Completion Rate %',
            'Overdue Rate %',
            'Total Cost',
            'Completed Cost',
            'Open Cost',
            'Average Cost',
            'Avg Completion Days',
            'Last Completed At',
            'Next Scheduled At',
            'Max Overdue Days',
        ];
    }

    public function map($row): array
    {
        $formatDecimal = static fn ($value) => $value === null ? null : round((float) $value, 2);
        $formatPercent = static fn ($value) => $value === null ? null : round((float) $value, 2);

        return [
            $row['plate'] ?? '—',
            $row['status'] ?? '—',
            $row['records'] ?? null,
            $row['completed'] ?? null,
            $row['scheduled'] ?? null,
            $row['in_progress'] ?? null,
            $row['overdue'] ?? null,
            $formatPercent($row['completion_rate_pct'] ?? null),
            $formatPercent($row['overdue_rate_pct'] ?? null),
            $formatDecimal($row['total_cost'] ?? null),
            $formatDecimal($row['completed_cost'] ?? null),
            $formatDecimal($row['open_cost'] ?? null),
            $formatDecimal($row['average_cost'] ?? null),
            $formatDecimal($row['average_completion_days'] ?? null),
            $row['last_completed_at'] ?? null,
            $row['next_scheduled_at'] ?? null,
            $formatDecimal($row['max_overdue_days'] ?? null),
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
                    $sheet->getStyle("C2:{$lastColumn}{$totalRowIndex}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                    $sheet->getStyle("A2:B{$totalRowIndex}")
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

                    $sheet->getStyle("C{$dataStart}:Q{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0.00');
                    $sheet->getStyle("H{$dataStart}:I{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('0.00"%"');
                }
            },
        ];
    }
}
