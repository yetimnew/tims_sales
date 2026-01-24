<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Performance by Driver Report</title>
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
    <h1>Performance by Driver</h1>
    <p>Reporting window: <?php echo e($from); ?> to <?php echo e($to); ?></p>

    <table>
        <thead>
            <tr>
                <th>Driver</th>
                <th>Trips</th>
                <th>Tonnage (MT)</th>
                <th>Ton-KM</th>
                <th>Distance With Cargo (KM)</th>
                <th>Distance Without Cargo (KM)</th>
                <th>Total Distance (KM)</th>
                <th>Fuel Cost</th>
                <th>Perdiem</th>
                <th>Other Cost</th>
                <th>Total Expense</th>
                <th>Revenue</th>
                <th>Profit</th>
                <th>Margin %</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $rows; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <tr>
                    <td><?php echo e($row['driver_name']); ?></td>
                    <td><?php echo e(number_format($row['trips'])); ?></td>
                    <td><?php echo e(number_format($row['tonnage'], 2)); ?></td>
                    <td><?php echo e(number_format($row['ton_km'], 2)); ?></td>
                    <td><?php echo e(number_format($row['distance_wc'], 2)); ?></td>
                    <td><?php echo e(number_format($row['distance_wo'], 2)); ?></td>
                    <td><?php echo e(number_format($row['distance_total'], 2)); ?></td>
                    <td><?php echo e(number_format($row['fuel_cost'], 2)); ?></td>
                    <td><?php echo e(number_format($row['perdiem'], 2)); ?></td>
                    <td><?php echo e(number_format($row['other_cost'], 2)); ?></td>
                    <td><?php echo e(number_format($row['expense'], 2)); ?></td>
                    <td><?php echo e(number_format($row['revenue'], 2)); ?></td>
                    <td><?php echo e(number_format($row['profit'], 2)); ?></td>
                    <td><?php echo e($row['margin_percent'] === null ? '—' : number_format($row['margin_percent'], 2)); ?></td>
                </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <tr>
                    <td colspan="14">No data available for the selected filters.</td>
                </tr>
            <?php endif; ?>
        </tbody>
        <tfoot>
            <tr>
                <td>Totals</td>
                <td><?php echo e(number_format($summary['trips'])); ?></td>
                <td><?php echo e(number_format($summary['tonnage'], 2)); ?></td>
                <td><?php echo e(number_format($summary['ton_km'], 2)); ?></td>
                <td><?php echo e(number_format($summary['distance_wc'], 2)); ?></td>
                <td><?php echo e(number_format($summary['distance_wo'], 2)); ?></td>
                <td><?php echo e(number_format($summary['distance_total'], 2)); ?></td>
                <td><?php echo e(number_format($summary['fuel_cost'], 2)); ?></td>
                <td><?php echo e(number_format($summary['perdiem'], 2)); ?></td>
                <td><?php echo e(number_format($summary['other_cost'], 2)); ?></td>
                <td><?php echo e(number_format($summary['expense'], 2)); ?></td>
                <td><?php echo e(number_format($summary['revenue'], 2)); ?></td>
                <td><?php echo e(number_format($summary['profit'], 2)); ?></td>
                <td><?php echo e($summary['margin_percent'] === null ? '—' : number_format($summary['margin_percent'], 2)); ?></td>
            </tr>
        </tfoot>
    </table>
</body>
</html>
<?php /**PATH C:\laragon\www\react-starter-kit\resources\views\reports\performance_by_driver_pdf.blade.php ENDPATH**/ ?>