<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Maintenance Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #1e293b; font-size: 12px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p { margin: 2px 0 12px 0; }
        table { width: 100%; border-collapse: collapse; }
        thead { background-color: #e2e8f0; }
        th, td { border: 1px solid #cbd5f5; padding: 6px 8px; text-align: right; }
        th:first-child, td:first-child,
        th:nth-child(2), td:nth-child(2) { text-align: left; }
        tfoot td { font-weight: 600; background-color: #f8fafc; border-top: 2px solid #94a3b8; }
    </style>
</head>
<body>
    <h1>Maintenance Performance Report</h1>
    <p>Reporting window: {{ $from }} to {{ $to }}</p>

    <table>
        <thead>
            <tr>
                <th>Truck</th>
                <th>Status</th>
                <th>Records</th>
                <th>Completed</th>
                <th>Scheduled</th>
                <th>In Progress</th>
                <th>Overdue</th>
                <th>Completion Rate %</th>
                <th>Overdue Rate %</th>
                <th>Total Cost</th>
                <th>Completed Cost</th>
                <th>Open Cost</th>
                <th>Average Cost</th>
                <th>Avg Completion Days</th>
                <th>Last Completed</th>
                <th>Next Scheduled</th>
                <th>Max Overdue Days</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
                <tr>
                    <td>{{ $row['plate'] ?? '—' }}</td>
                    <td>{{ $row['status'] ?? '—' }}</td>
                    <td>{{ $row['records'] ?? 0 }}</td>
                    <td>{{ $row['completed'] ?? 0 }}</td>
                    <td>{{ $row['scheduled'] ?? 0 }}</td>
                    <td>{{ $row['in_progress'] ?? 0 }}</td>
                    <td>{{ $row['overdue'] ?? 0 }}</td>
                    <td>{{ $row['completion_rate_pct'] === null ? '—' : number_format((float) $row['completion_rate_pct'], 2) }}</td>
                    <td>{{ $row['overdue_rate_pct'] === null ? '—' : number_format((float) $row['overdue_rate_pct'], 2) }}</td>
                    <td>{{ number_format((float) ($row['total_cost'] ?? 0), 2) }}</td>
                    <td>{{ number_format((float) ($row['completed_cost'] ?? 0), 2) }}</td>
                    <td>{{ number_format((float) ($row['open_cost'] ?? 0), 2) }}</td>
                    <td>{{ $row['average_cost'] === null ? '—' : number_format((float) $row['average_cost'], 2) }}</td>
                    <td>{{ $row['average_completion_days'] === null ? '—' : number_format((float) $row['average_completion_days'], 2) }}</td>
                    <td>{{ $row['last_completed_at'] ?? '—' }}</td>
                    <td>{{ $row['next_scheduled_at'] ?? '—' }}</td>
                    <td>{{ $row['max_overdue_days'] === null ? '—' : number_format((float) $row['max_overdue_days'], 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="17">No data available for the selected filters.</td>
                </tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td colspan="2">Totals ({{ $totals['truck_count'] ?? 0 }} trucks)</td>
                <td>{{ number_format((float) ($totals['records'] ?? 0), 0) }}</td>
                <td>{{ number_format((float) ($totals['completed'] ?? 0), 0) }}</td>
                <td>{{ number_format((float) ($totals['scheduled'] ?? 0), 0) }}</td>
                <td>{{ number_format((float) ($totals['in_progress'] ?? 0), 0) }}</td>
                <td>{{ number_format((float) ($totals['overdue'] ?? 0), 0) }}</td>
                <td>{{ $summary['completion_rate_pct'] === null ? '—' : number_format((float) $summary['completion_rate_pct'], 2) }}</td>
                <td>{{ $summary['overdue_rate_pct'] === null ? '—' : number_format((float) $summary['overdue_rate_pct'], 2) }}</td>
                <td>{{ number_format((float) ($totals['total_cost'] ?? 0), 2) }}</td>
                <td>{{ number_format((float) ($totals['completed_cost'] ?? 0), 2) }}</td>
                <td>{{ number_format((float) ($totals['open_cost'] ?? 0), 2) }}</td>
                <td>{{ $summary['average_cost_per_record'] === null ? '—' : number_format((float) $summary['average_cost_per_record'], 2) }}</td>
                <td>{{ $summary['average_completion_days'] === null ? '—' : number_format((float) $summary['average_completion_days'], 2) }}</td>
                <td colspan="3">&nbsp;</td>
            </tr>
        </tfoot>
    </table>
</body>
</html>
