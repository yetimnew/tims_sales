<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Outsource Performance Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #1e293b; font-size: 12px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p { margin: 2px 0 12px 0; }
        table { width: 100%; border-collapse: collapse; }
        thead { background-color: #e2e8f0; }
        th, td { border: 1px solid #cbd5f5; padding: 6px 8px; text-align: right; }
        th:first-child, td:first-child,
        th:nth-child(2), td:nth-child(2),
        th:nth-child(3), td:nth-child(3),
        th:nth-child(4), td:nth-child(4),
        th:nth-child(5), td:nth-child(5),
        th:nth-child(6), td:nth-child(6),
        th:nth-child(7), td:nth-child(7),
        th:nth-child(8), td:nth-child(8) { text-align: left; }
        tfoot td { font-weight: 600; background-color: #f8fafc; border-top: 2px solid #94a3b8; }
    </style>
</head>
<body>
    <h1>Outsource Performance Report</h1>
    <p>Reporting window: <?php echo e($from); ?> to <?php echo e($to); ?></p>

    <table>
        <thead>
            <tr>
                <th>Trip Number</th>
                <th>Dispatch Date</th>
                <th>Vendor</th>
                <th>Vendor Status</th>
                <th>Operation</th>
                <th>Customer</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Tonnage (MT)</th>
                <th>Ton-KM</th>
                <th>Distance (KM)</th>
                <th>Vendor Cost</th>
                <th>Revenue</th>
                <th>Profit</th>
                <th>Margin %</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $rows; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <tr>
                    <td><?php echo e($row['fo_number']); ?></td>
                    <td><?php echo e($row['dispatch_date'] ?? '—'); ?></td>
                    <td><?php echo e($row['driver_name']); ?></td>
                    <td><?php echo e($row['truck_plate'] ?? '—'); ?></td>
                    <td><?php echo e($row['operation_code']); ?></td>
                    <td><?php echo e($row['customer_name'] ?? '—'); ?></td>
                    <td><?php echo e($row['origin_name']); ?></td>
                    <td><?php echo e($row['destination_name']); ?></td>
                    <td><?php echo e(number_format($row['tonnage'], 2)); ?></td>
                    <td><?php echo e(number_format($row['ton_km'], 2)); ?></td>
                    <td><?php echo e(number_format($row['distance_total'], 2)); ?></td>
                    <td><?php echo e(number_format($row['expense'], 2)); ?></td>
                    <td><?php echo e(number_format($row['revenue'], 2)); ?></td>
                    <td><?php echo e(number_format($row['profit'], 2)); ?></td>
                    <td><?php echo e($row['margin_percent'] === null ? '—' : number_format($row['margin_percent'], 2)); ?></td>
                </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <tr>
                    <td colspan="15">No data available for the selected filters.</td>
                </tr>
            <?php endif; ?>
        </tbody>
        <tfoot>
            <tr>
                <td colspan="8">Totals</td>
                <td><?php echo e(number_format($summary['tonnage'], 2)); ?></td>
                <td><?php echo e(number_format($summary['ton_km'], 2)); ?></td>
                <td><?php echo e(number_format($summary['distance_total'], 2)); ?></td>
                <td><?php echo e(number_format($summary['expense'], 2)); ?></td>
                <td><?php echo e(number_format($summary['revenue'], 2)); ?></td>
                <td><?php echo e(number_format($summary['profit'], 2)); ?></td>
                <td><?php echo e($summary['margin_percent'] === null ? '—' : number_format($summary['margin_percent'], 2)); ?></td>
            </tr>
        </tfoot>
    </table>
</body>
</html>
<?php /**PATH C:\laragon\www\react-starter-kit\resources\views\reports\outsource_performance_pdf.blade.php ENDPATH**/ ?>