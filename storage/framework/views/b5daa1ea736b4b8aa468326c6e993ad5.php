<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Daily Status Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #1e293b; font-size: 12px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        h2 { font-size: 16px; margin: 18px 0 8px 0; }
        p { margin: 2px 0 12px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
        thead { background-color: #e2e8f0; }
        th, td { border: 1px solid #cbd5f5; padding: 6px 8px; text-align: left; }
        th.num, td.num { text-align: right; }
        tbody tr:nth-child(even) { background-color: #f8fafc; }
    </style>
</head>
<body>
    <h1>Daily Status Report</h1>
    <p>Reporting window: <?php echo e($from); ?> to <?php echo e($to); ?></p>
    <p>
        Total updates: <strong><?php echo e($summary['total_updates'] ?? 0); ?></strong> ·
        Unique trucks: <strong><?php echo e($summary['unique_trucks'] ?? 0); ?></strong> ·
        Unique statuses: <strong><?php echo e($summary['unique_statuses'] ?? 0); ?></strong> ·
        Days with activity: <strong><?php echo e($summary['days_with_activity'] ?? 0); ?></strong>
    </p>

    <h2>Status distribution</h2>
    <table>
        <thead>
            <tr>
                <th>Status</th>
                <th class="num">Count</th>
                <th class="num">Share (%)</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $statusSummary; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <tr>
                    <td><?php echo e($row['status_name']); ?></td>
                    <td class="num"><?php echo e($row['count']); ?></td>
                    <td class="num"><?php echo e(number_format($row['share'], 2)); ?></td>
                </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <tr>
                    <td colspan="3">No status activity recorded.</td>
                </tr>
            <?php endif; ?>
        </tbody>
    </table>

    <h2>Daily entries</h2>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Truck Plate</th>
                <th>Status</th>
                <th>Status Date</th>
                <th>Recorded At</th>
                <th>Changed By</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $rows; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <tr>
                    <td><?php echo e($row['date'] ?? '—'); ?></td>
                    <td><?php echo e($row['truck_plate'] ?? '—'); ?></td>
                    <td><?php echo e($row['status_name'] ?? '—'); ?></td>
                    <td><?php echo e($row['status_date'] ?? '—'); ?></td>
                    <td><?php echo e($row['registered_at'] ?? '—'); ?></td>
                    <td><?php echo e($row['changed_by'] ?? '—'); ?></td>
                    <td><?php echo e($row['notes'] ?? '—'); ?></td>
                </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <tr>
                    <td colspan="7">No records for the selected filters.</td>
                </tr>
            <?php endif; ?>
        </tbody>
    </table>
</body>
</html>
<?php /**PATH C:\laragon\www\react-starter-kit\resources\views\reports\daily_status_pdf.blade.php ENDPATH**/ ?>