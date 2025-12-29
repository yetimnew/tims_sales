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

class FuelEfficiencyExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping
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
            'Trips',
            'Total Liters',
            'Total Cost',
            'Loaded Distance (km)',
            'Empty Distance (km)',
            'Total Distance (km)',
            'Efficiency (km/L)',
            'Cost per Km',
            'Cost per Liter',
            'Avg Liters per Trip',
            'Avg Cost per Trip',
            'First Activity',
            'Last Activity',
            'Drivers',
            'Loaded Distance %',
            'Empty Distance %',
        ];
    }

    public function map($row): array
    {
        $formatDecimal = static fn ($value) => $value === null ? null : round((float) $value, 2);
        $formatPercent = static fn ($value) => $value === null ? null : round((float) $value, 2);

        $driverNames = $row['driver_names'] ?? [];

        if (is_array($driverNames)) {
            $driverNames = implode(', ', $driverNames);
        }

        return [
            $row['plate'] ?? '—',
            $row['status'] ?? '—',
            $row['trip_count'] ?? null,
            $formatDecimal($row['total_liters'] ?? null),
            $formatDecimal($row['total_cost'] ?? null),
            $formatDecimal($row['distance_loaded_km'] ?? null),
            $formatDecimal($row['distance_empty_km'] ?? null),
            $formatDecimal($row['distance_total_km'] ?? null),
            $formatDecimal($row['efficiency_km_per_liter'] ?? null),
            $formatDecimal($row['cost_per_km'] ?? null),
            $formatDecimal($row['cost_per_liter'] ?? null),
            $formatDecimal($row['avg_liters_per_trip'] ?? null),
            $formatDecimal($row['avg_cost_per_trip'] ?? null),
            $row['first_activity_on'] ?? null,
            $row['last_activity_on'] ?? null,
            $driverNames ?: '—',
            $formatPercent($row['loaded_distance_share_percent'] ?? null),
            $formatPercent($row['empty_distance_share_percent'] ?? null),
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

                    $sheet->getStyle("C{$dataStart}:N{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0.00');
                    $sheet->getStyle("Q{$dataStart}:R{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('0.00"%"');
                }
            },
        ];
    }
}
