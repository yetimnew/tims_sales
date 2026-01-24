<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Fuel Efficiency &amp; Cost Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #1e293b; font-size: 12px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p { margin: 2px 0 12px 0; }
        table { width: 100%; border-collapse: collapse; }
        thead { background-color: #e2e8f0; }
        th, td { border: 1px solid #cbd5f5; padding: 6px 8px; text-align: right; }
        th:first-child, td:first-child,
        th:nth-child(2), td:nth-child(2),
        th:nth-child(16), td:nth-child(16) { text-align: left; }
        tfoot td { font-weight: 600; background-color: #f8fafc; border-top: 2px solid #94a3b8; }
    </style>
</head>
<body>
    <h1>Fuel Efficiency &amp; Cost Report</h1>
    <p>Reporting window: <?php echo e($from); ?> to <?php echo e($to); ?></p>

    <table>
        <thead>
            <tr>
                <th>Truck</th>
                <th>Status</th>
                <th>Trips</th>
                <th>Total Liters</th>
                <th>Total Cost</th>
                <th>Loaded Distance (km)</th>
                <th>Empty Distance (km)</th>
                <th>Total Distance (km)</th>
                <th>Efficiency (km/L)</th>
                <th>Cost/km</th>
                <th>Cost/L</th>
                <th>Avg Liters/Trip</th>
                <th>Avg Cost/Trip</th>
                <th>First Activity</th>
                <th>Last Activity</th>
                <th>Drivers</th>
                <th>Loaded Distance %</th>
                <th>Empty Distance %</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $rows; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                <tr>
                    <td><?php echo e($row['plate'] ?? '—'); ?></td>
                    <td><?php echo e($row['status'] ?? '—'); ?></td>
                    <td><?php echo e($row['trip_count'] ?? 0); ?></td>
                    <td><?php echo e(number_format((float) ($row['total_liters'] ?? 0), 2)); ?></td>
                    <td><?php echo e(number_format((float) ($row['total_cost'] ?? 0), 2)); ?></td>
                    <td><?php echo e(number_format((float) ($row['distance_loaded_km'] ?? 0), 2)); ?></td>
                    <td><?php echo e(number_format((float) ($row['distance_empty_km'] ?? 0), 2)); ?></td>
                    <td><?php echo e(number_format((float) ($row['distance_total_km'] ?? 0), 2)); ?></td>
                    <td><?php echo e($row['efficiency_km_per_liter'] === null ? '—' : number_format((float) $row['efficiency_km_per_liter'], 2)); ?></td>
                    <td><?php echo e($row['cost_per_km'] === null ? '—' : number_format((float) $row['cost_per_km'], 2)); ?></td>
                    <td><?php echo e($row['cost_per_liter'] === null ? '—' : number_format((float) $row['cost_per_liter'], 2)); ?></td>
                    <td><?php echo e($row['avg_liters_per_trip'] === null ? '—' : number_format((float) $row['avg_liters_per_trip'], 2)); ?></td>
                    <td><?php echo e($row['avg_cost_per_trip'] === null ? '—' : number_format((float) $row['avg_cost_per_trip'], 2)); ?></td>
                    <td><?php echo e($row['first_activity_on'] ?? '—'); ?></td>
                    <td><?php echo e($row['last_activity_on'] ?? '—'); ?></td>
                    <td><?php echo e(empty($row['driver_names'] ?? []) ? '—' : implode(', ', $row['driver_names'])); ?></td>
                    <td><?php echo e($row['loaded_distance_share_percent'] === null ? '—' : number_format((float) $row['loaded_distance_share_percent'], 2)); ?></td>
                    <td><?php echo e($row['empty_distance_share_percent'] === null ? '—' : number_format((float) $row['empty_distance_share_percent'], 2)); ?></td>
                </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                <tr>
                    <td colspan="18">No data available for the selected filters.</td>
                </tr>
            <?php endif; ?>
        </tbody>
        <tfoot>
            <tr>
                <td colspan="2">Totals (<?php echo e($totals['truck_count'] ?? 0); ?> trucks)</td>
                <td><?php echo e(number_format((float) ($totals['trip_count'] ?? 0), 0)); ?></td>
                <td><?php echo e(number_format((float) ($totals['total_liters'] ?? 0), 2)); ?></td>
                <td><?php echo e(number_format((float) ($totals['total_cost'] ?? 0), 2)); ?></td>
                <td><?php echo e(number_format((float) ($totals['total_loaded_distance_km'] ?? 0), 2)); ?></td>
                <td><?php echo e(number_format((float) ($totals['total_empty_distance_km'] ?? 0), 2)); ?></td>
                <td><?php echo e(number_format((float) ($totals['total_distance_km'] ?? 0), 2)); ?></td>
                <td><?php echo e($summary['fleet_efficiency_km_per_liter'] === null ? '—' : number_format((float) $summary['fleet_efficiency_km_per_liter'], 2)); ?></td>
                <td><?php echo e($summary['fleet_cost_per_km'] === null ? '—' : number_format((float) $summary['fleet_cost_per_km'], 2)); ?></td>
                <td><?php echo e($summary['average_cost_per_liter'] === null ? '—' : number_format((float) $summary['average_cost_per_liter'], 2)); ?></td>
                <td><?php echo e($summary['average_liters_per_trip'] === null ? '—' : number_format((float) $summary['average_liters_per_trip'], 2)); ?></td>
                <td><?php echo e($summary['average_cost_per_trip'] === null ? '—' : number_format((float) $summary['average_cost_per_trip'], 2)); ?></td>
                <td colspan="3">&nbsp;</td>
                <td><?php echo e($summary['loaded_distance_share_percent'] === null ? '—' : number_format((float) $summary['loaded_distance_share_percent'], 2)); ?></td>
                <td><?php echo e($summary['empty_distance_share_percent'] === null ? '—' : number_format((float) $summary['empty_distance_share_percent'], 2)); ?></td>
            </tr>
        </tfoot>
    </table>
</body>
</html>
<?php /**PATH C:\laragon\www\react-starter-kit\resources\views\reports\fuel_efficiency_pdf.blade.php ENDPATH**/ ?>