<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Cost Per Kilometer Analysis</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #1e293b; font-size: 12px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p { margin: 2px 0 12px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        thead { background-color: #e2e8f0; }
        th, td { border: 1px solid #cbd5f5; padding: 6px 8px; text-align: right; }
        th:first-child, td:first-child { text-align: left; }
        tfoot td { font-weight: 600; background-color: #f8fafc; border-top: 2px solid #94a3b8; }
        .summary { margin-bottom: 16px; }
        .summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
    </style>
</head>
<body>
    <h1>Cost Per Kilometer Analysis</h1>
    <p>Reporting window: <?php echo e($from); ?> to <?php echo e($to); ?></p>

    <div class="summary">
        <div class="summary-row"><strong>Total Trips:</strong> <?php echo e(number_format($summary['total_trips'])); ?></div>
        <div class="summary-row"><strong>Total Distance:</strong> <?php echo e(number_format($summary['total_distance'], 2)); ?> KM</div>
        <div class="summary-row"><strong>Total Cost:</strong> <?php echo e(number_format($summary['total_cost'], 2)); ?></div>
        <div class="summary-row"><strong>Overall CPK:</strong> <?php echo e(number_format($summary['overall_cpk'], 2)); ?></div>
        <div class="summary-row"><strong>Fuel CPK:</strong> <?php echo e(number_format($summary['overall_fuel_cpk'], 2)); ?></div>
        <div class="summary-row"><strong>Perdiem CPK:</strong> <?php echo e(number_format($summary['overall_perdiem_cpk'], 2)); ?></div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Label</th>
                <th>Trips</th>
                <th>Distance (KM)</th>
                <th>Fuel Cost</th>
                <th>Perdiem</th>
                <th>Work Ongoing</th>
                <th>Other Cost</th>
                <th>Total Cost</th>
                <th>Total CPK</th>
                <th>Fuel CPK</th>
                <th>Perdiem CPK</th>
            </tr>
        </thead>
        <tbody>
            <?php $__currentLoopData = $rows; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <tr>
                <td><?php echo e($row['label']); ?></td>
                <td><?php echo e(number_format($row['trips'])); ?></td>
                <td><?php echo e(number_format($row['distance_total'], 2)); ?></td>
                <td><?php echo e(number_format($row['fuel_cost'], 2)); ?></td>
                <td><?php echo e(number_format($row['perdiem'], 2)); ?></td>
                <td><?php echo e(number_format($row['work_on_going'], 2)); ?></td>
                <td><?php echo e(number_format($row['other_cost'], 2)); ?></td>
                <td><?php echo e(number_format($row['total_cost'], 2)); ?></td>
                <td><?php echo e(number_format($row['total_cpk'], 2)); ?></td>
                <td><?php echo e(number_format($row['fuel_cpk'], 2)); ?></td>
                <td><?php echo e(number_format($row['perdiem_cpk'], 2)); ?></td>
            </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
        </tbody>
    </table>
</body>
</html>

<?php /**PATH C:\laragon\www\react-starter-kit\resources\views\reports\cost_per_kilometer_pdf.blade.php ENDPATH**/ ?>