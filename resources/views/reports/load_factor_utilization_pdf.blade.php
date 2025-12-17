<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Load Factor & Utilization Analysis</title>
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
    <h1>Load Factor & Utilization Analysis</h1>
    <p>Reporting window: {{ $from }} to {{ $to }}</p>

    <div class="summary">
        <div class="summary-row"><strong>Total Trips:</strong> {{ number_format($summary['total_trips']) }}</div>
        <div class="summary-row"><strong>Total Distance:</strong> {{ number_format($summary['total_distance'], 2) }} KM</div>
        <div class="summary-row"><strong>Load Factor:</strong> {{ number_format($summary['overall_load_factor_percent'], 2) }}%</div>
        <div class="summary-row"><strong>Empty Miles:</strong> {{ number_format($summary['overall_empty_miles_percent'], 2) }}%</div>
        <div class="summary-row"><strong>Deadhead Ratio:</strong> {{ number_format($summary['overall_deadhead_ratio'], 2) }}</div>
        <div class="summary-row"><strong>Utilization Rate:</strong> {{ number_format($summary['overall_utilization_rate'], 2) }}%</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Label</th>
                <th>Trips</th>
                <th>Loaded (KM)</th>
                <th>Empty (KM)</th>
                <th>Total (KM)</th>
                <th>Tonnage</th>
                <th>Load Factor %</th>
                <th>Empty Miles %</th>
                <th>Deadhead Ratio</th>
                <th>Utilization Rate</th>
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $row)
            <tr>
                <td>{{ $row['label'] }}</td>
                <td>{{ number_format($row['trips']) }}</td>
                <td>{{ number_format($row['distance_loaded'], 2) }}</td>
                <td>{{ number_format($row['distance_empty'], 2) }}</td>
                <td>{{ number_format($row['distance_total'], 2) }}</td>
                <td>{{ number_format($row['tonnage'], 2) }}</td>
                <td>{{ number_format($row['load_factor_percent'], 2) }}</td>
                <td>{{ number_format($row['empty_miles_percent'], 2) }}</td>
                <td>{{ number_format($row['deadhead_ratio'], 2) }}</td>
                <td>{{ number_format($row['utilization_rate'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>

