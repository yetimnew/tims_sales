<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Geographic Heatmaps Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #1e293b; font-size: 12px; }
        h1 { font-size: 20px; margin-bottom: 6px; }
        h2 { font-size: 14px; margin: 18px 0 6px 0; }
        p { margin: 0 0 12px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        thead { background-color: #e2e8f0; }
        th, td { border: 1px solid #cbd5f5; padding: 6px 8px; text-align: right; }
        th:first-child, td:first-child { text-align: left; }
        .total { font-weight: 600; background-color: #f8fafc; }
        .overall { margin-top: 24px; }
    </style>
</head>
<body>
    <h1>Geographic Heatmaps Report</h1>
    <p>Reporting window: <?php echo e($from); ?> to <?php echo e($to); ?></p>

    <?php ($grouped = collect($rows)->groupBy('level')); ?>

    <?php $__currentLoopData = $grouped; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $level => $groupRows): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
        <h2><?php echo e($level); ?> Summary</h2>
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Trips</th>
                    <th>Tonnage (MT)</th>
                    <th>Revenue</th>
                </tr>
            </thead>
            <tbody>
                <?php $__empty_1 = true; $__currentLoopData = $groupRows; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                    <tr class="<?php echo e(!empty($row['is_total']) ? 'total' : ''); ?>">
                        <td><?php echo e($row['name']); ?></td>
                        <td><?php echo e(number_format($row['trips'])); ?></td>
                        <td><?php echo e(number_format((float) $row['tonnage'], 2)); ?></td>
                        <td><?php echo e(number_format((float) $row['revenue'], 2)); ?></td>
                    </tr>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                    <tr>
                        <td colspan="4">No data available for this section.</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>

    <div class="overall">
        <h2>Overall Totals</h2>
        <table>
            <thead>
                <tr>
                    <th>Trips</th>
                    <th>Tonnage (MT)</th>
                    <th>Revenue</th>
                </tr>
            </thead>
            <tbody>
                <tr class="total">
                    <td><?php echo e(number_format($totals['trips'] ?? 0)); ?></td>
                    <td><?php echo e(number_format((float) ($totals['tonnage'] ?? 0), 2)); ?></td>
                    <td><?php echo e(number_format((float) ($totals['revenue'] ?? 0), 2)); ?></td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
<?php /**PATH C:\laragon\www\react-starter-kit\resources\views\reports\geography_heatmaps_pdf.blade.php ENDPATH**/ ?>