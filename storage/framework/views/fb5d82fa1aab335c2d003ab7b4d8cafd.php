<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Customer Profitability Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #1e293b; font-size: 12px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p { margin: 2px 0 12px 0; }
        table { width: 100%; border-collapse: collapse; }
        thead { background-color: #e2e8f0; }
        th, td { border: 1px solid #cbd5f5; padding: 6px 8px; text-align: right; }
        th:first-child, td:first-child { text-align: left; }
        tfoot td { font-weight: 600; background-color: #f8fafc; border-top: 2px solid #94a3b8; }
    </style>
</head>
<body>
    <h1>Customer Profitability Report</h1>
    <p>Reporting window: <?php echo e($from); ?> to <?php echo e($to); ?></p>

    <?php ($rowCollection = collect($rows)); ?>

    <table>
        <thead>
            <tr>
                <th>Customer</th>
                <th>Operations</th>
                <th>Lanes</th>
                <th>Internal Trips</th>
                <th>Outsource Trips</th>
                <th>Total Trips</th>
                <th>Total Tonnage (MT)</th>
                <th>Revenue</th>
                <th>Total Cost</th>
                <th>Profit</th>
                <th>Margin %</th>
                <th>Revenue / Trip</th>
                <th>Cost / Trip</th>
                <th>Cost / Km</th>
                <th>Outsource Trip Share %</th>
                <th>Outsource Tonnage Share %</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $rowCollection; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <tr>
                    <td><?php echo e($row['customer_name'] ?? '—'); ?></td>
                    <td><?php echo e($row['operations'] ?? 0); ?></td>
                    <td><?php echo e($row['lanes_used'] ?? 0); ?></td>
                    <td><?php echo e($row['internal_trips'] ?? 0); ?></td>
                    <td><?php echo e($row['outsource_trips'] ?? 0); ?></td>
                    <td><?php echo e($row['total_trips'] ?? 0); ?></td>
                    <td><?php echo e(number_format((float) ($row['total_tonnage'] ?? 0), 2)); ?></td>
                    <td><?php echo e(number_format((float) ($row['revenue'] ?? 0), 2)); ?></td>
                    <td><?php echo e(number_format((float) ($row['total_cost'] ?? 0), 2)); ?></td>
                    <td><?php echo e(number_format((float) ($row['profit'] ?? 0), 2)); ?></td>
                    <td><?php echo e($row['margin_percent'] === null ? '—' : number_format((float) $row['margin_percent'], 2)); ?></td>
                    <td><?php echo e($row['revenue_per_trip'] === null ? '—' : number_format((float) $row['revenue_per_trip'], 2)); ?></td>
                    <td><?php echo e($row['cost_per_trip'] === null ? '—' : number_format((float) $row['cost_per_trip'], 2)); ?></td>
                    <td><?php echo e($row['cost_per_km'] === null ? '—' : number_format((float) $row['cost_per_km'], 2)); ?></td>
                    <td><?php echo e($row['outsource_trip_share_percent'] === null ? '—' : number_format((float) $row['outsource_trip_share_percent'], 2)); ?></td>
                    <td><?php echo e($row['outsource_tonnage_share_percent'] === null ? '—' : number_format((float) $row['outsource_tonnage_share_percent'], 2)); ?></td>
                </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <tr>
                    <td colspan="16">No data available for the selected filters.</td>
                </tr>
            <?php endif; ?>
        </tbody>
        <tfoot>
            <tr>
                <td>Totals (<?php echo e($summary['customer_count'] ?? 0); ?> customers)</td>
                <td><?php echo e(number_format((float) ($summary['operations'] ?? 0), 0)); ?></td>
                <td><?php echo e(number_format((float) $rowCollection->sum('lanes_used'), 0)); ?></td>
                <td><?php echo e(number_format((float) ($summary['internal_trips'] ?? 0), 0)); ?></td>
                <td><?php echo e(number_format((float) ($summary['outsource_trips'] ?? 0), 0)); ?></td>
                <td><?php echo e(number_format((float) ($summary['total_trips'] ?? 0), 0)); ?></td>
                <td><?php echo e(number_format((float) ($summary['total_tonnage'] ?? 0), 2)); ?></td>
                <td><?php echo e(number_format((float) ($summary['revenue'] ?? 0), 2)); ?></td>
                <td><?php echo e(number_format((float) ($summary['total_cost'] ?? 0), 2)); ?></td>
                <td><?php echo e(number_format((float) ($summary['profit'] ?? 0), 2)); ?></td>
                <td><?php echo e($summary['margin_percent'] === null ? '—' : number_format((float) $summary['margin_percent'], 2)); ?></td>
                <td><?php echo e($summary['revenue_per_trip'] === null ? '—' : number_format((float) $summary['revenue_per_trip'], 2)); ?></td>
                <td><?php echo e($summary['cost_per_trip'] === null ? '—' : number_format((float) $summary['cost_per_trip'], 2)); ?></td>
                <td><?php echo e($summary['cost_per_km'] === null ? '—' : number_format((float) $summary['cost_per_km'], 2)); ?></td>
                <td><?php echo e($summary['outsource_trip_share_percent'] === null ? '—' : number_format((float) $summary['outsource_trip_share_percent'], 2)); ?></td>
                <td><?php echo e($summary['outsource_tonnage_share_percent'] === null ? '—' : number_format((float) $summary['outsource_tonnage_share_percent'], 2)); ?></td>
            </tr>
        </tfoot>
    </table>
</body>
</html>
<?php /**PATH C:\laragon\www\react-starter-kit\resources\views\reports\customer_profitability_pdf.blade.php ENDPATH**/ ?>