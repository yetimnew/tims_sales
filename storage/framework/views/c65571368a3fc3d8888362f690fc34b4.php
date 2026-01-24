<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Operation Profitability Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #1e293b; font-size: 12px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p { margin: 2px 0 12px 0; }
        table { width: 100%; border-collapse: collapse; }
        thead { background-color: #e2e8f0; }
        th, td { border: 1px solid #cbd5f5; padding: 6px 8px; text-align: right; }
        th:first-child, td:first-child,
        th:nth-child(2), td:nth-child(2),
        th:nth-child(3), td:nth-child(3) { text-align: left; }
        tfoot td { font-weight: 600; background-color: #f8fafc; border-top: 2px solid #94a3b8; }
    </style>
</head>
<body>
    <h1>Operation Profitability Report</h1>
    <p>Reporting window: <?php echo e($from); ?> to <?php echo e($to); ?></p>

    <table>
        <thead>
            <tr>
                <th>Operation</th>
                <th>Customer</th>
                <th>Region</th>
                <th>Revenue</th>
                <th>Cost</th>
                <th>Profit</th>
                <th>Margin %</th>
                <th>Trips</th>
                <th>Tonnage (MT)</th>
                <th>Avg Km/Trip</th>
                <th>Cost/Km</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $rows; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <tr>
                    <td><?php echo e($row['code']); ?></td>
                    <td><?php echo e($row['customer_name'] ?? '—'); ?></td>
                    <td><?php echo e($row['region_name'] ?? '—'); ?></td>
                    <td><?php echo e(number_format((float) $row['revenue'], 2)); ?></td>
                    <td><?php echo e(number_format((float) $row['cost'], 2)); ?></td>
                    <td><?php echo e(number_format((float) $row['profit'], 2)); ?></td>
                    <td><?php echo e($row['margin_percent'] === null ? '—' : number_format((float) $row['margin_percent'], 2)); ?></td>
                    <td><?php echo e($row['trips']); ?></td>
                    <td><?php echo e(number_format((float) $row['tonnage'], 2)); ?></td>
                    <td><?php echo e(number_format((float) $row['avg_km_per_trip'], 2)); ?></td>
                    <td><?php echo e($row['cost_per_km'] === null ? '—' : number_format((float) $row['cost_per_km'], 2)); ?></td>
                </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <tr>
                    <td colspan="11">No data available for the selected filters.</td>
                </tr>
            <?php endif; ?>
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3">Totals</td>
                <td><?php echo e(number_format((float) ($totals['revenue'] ?? 0), 2)); ?></td>
                <td><?php echo e(number_format((float) ($totals['cost'] ?? 0), 2)); ?></td>
                <td><?php echo e(number_format((float) ($totals['profit'] ?? 0), 2)); ?></td>
                <td><?php echo e(($totals['margin_percent'] ?? null) === null ? '—' : number_format((float) $totals['margin_percent'], 2)); ?></td>
                <td><?php echo e(number_format((float) ($totals['trips'] ?? 0), 0)); ?></td>
                <td><?php echo e(number_format((float) ($totals['tonnage'] ?? 0), 2)); ?></td>
                <td><?php echo e(($totals['avg_km_per_trip'] ?? null) === null ? '—' : number_format((float) $totals['avg_km_per_trip'], 2)); ?></td>
                <td><?php echo e(($totals['cost_per_km'] ?? null) === null ? '—' : number_format((float) $totals['cost_per_km'], 2)); ?></td>
            </tr>
        </tfoot>
    </table>
</body>
</html>
<?php /**PATH C:\laragon\www\react-starter-kit\resources\views\reports\operation_profitability_pdf.blade.php ENDPATH**/ ?>