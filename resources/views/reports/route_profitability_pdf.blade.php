<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Route Profitability Report</title>
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
    <h1>Route Profitability Report</h1>
    <p>Reporting window: {{ $from }} to {{ $to }}</p>

    @php
        $routeRows = collect($rows ?? []);
        $dataRows = $routeRows->reject(fn ($row) => ($row['route_key'] ?? null) === 'totals');
    @endphp

    <table>
        <thead>
            <tr>
                <th>Route</th>
                <th>Trips</th>
                <th>Tonnage (MT)</th>
                <th>Ton-KM</th>
                <th>Distance With Cargo (KM)</th>
                <th>Distance Without Cargo (KM)</th>
                <th>Total Distance (KM)</th>
                <th>Average Distance (KM)</th>
                <th>Average Tonnage (MT)</th>
                <th>Revenue</th>
                <th>Expense</th>
                <th>Profit</th>
                <th>Margin %</th>
                <th>Revenue per KM</th>
                <th>Cost per KM</th>
                <th>Profit per KM</th>
            </tr>
        </thead>
        <tbody>
            @forelse($dataRows as $row)
                <tr>
                    <td>{{ ($row['origin_name'] ?? 'Unknown').' -> '.($row['destination_name'] ?? 'Unknown') }}</td>
                    <td>{{ number_format($row['trips'] ?? 0) }}</td>
                    <td>{{ number_format($row['tonnage'] ?? 0, 2) }}</td>
                    <td>{{ number_format($row['ton_km'] ?? 0, 2) }}</td>
                    <td>{{ number_format($row['distance_wc'] ?? 0, 2) }}</td>
                    <td>{{ number_format($row['distance_wo'] ?? 0, 2) }}</td>
                    <td>{{ number_format($row['distance_total'] ?? 0, 2) }}</td>
                    <td>{{ number_format($row['avg_distance'] ?? 0, 2) }}</td>
                    <td>{{ number_format($row['avg_tonnage'] ?? 0, 2) }}</td>
                    <td>{{ number_format($row['revenue'] ?? 0, 2) }}</td>
                    <td>{{ number_format($row['expense'] ?? 0, 2) }}</td>
                    <td>{{ number_format($row['profit'] ?? 0, 2) }}</td>
                    <td>{{ isset($row['margin_percent']) ? number_format($row['margin_percent'], 2).'%' : '—' }}</td>
                    <td>{{ number_format($row['revenue_per_km'] ?? 0, 2) }}</td>
                    <td>{{ number_format($row['cost_per_km'] ?? 0, 2) }}</td>
                    <td>{{ number_format($row['profit_per_km'] ?? 0, 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="16">No data available for the selected filters.</td>
                </tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td>Totals</td>
                <td>{{ number_format($summary['total_trips'] ?? 0) }}</td>
                <td>{{ number_format($summary['total_tonnage'] ?? 0, 2) }}</td>
                <td>{{ number_format($summary['total_ton_km'] ?? 0, 2) }}</td>
                <td>{{ number_format($summary['total_distance_with_cargo'] ?? 0, 2) }}</td>
                <td>{{ number_format($summary['total_distance_without_cargo'] ?? 0, 2) }}</td>
                <td>{{ number_format($summary['total_distance'] ?? 0, 2) }}</td>
                <td>{{ $summary['total_trips'] > 0 ? number_format(($summary['total_distance'] ?? 0) / $summary['total_trips'], 2) : '—' }}</td>
                <td>{{ $summary['total_trips'] > 0 ? number_format(($summary['total_tonnage'] ?? 0) / $summary['total_trips'], 2) : '—' }}</td>
                <td>{{ number_format($summary['total_revenue'] ?? 0, 2) }}</td>
                <td>{{ number_format($summary['total_expense'] ?? 0, 2) }}</td>
                <td>{{ number_format($summary['total_profit'] ?? 0, 2) }}</td>
                <td>{{ isset($summary['overall_margin_percent']) ? number_format($summary['overall_margin_percent'], 2).'%' : '—' }}</td>
                <td>{{ ($summary['total_distance'] ?? 0) > 0 ? number_format(($summary['total_revenue'] ?? 0) / $summary['total_distance'], 2) : '—' }}</td>
                <td>{{ ($summary['total_distance'] ?? 0) > 0 ? number_format(($summary['total_expense'] ?? 0) / $summary['total_distance'], 2) : '—' }}</td>
                <td>{{ ($summary['total_distance'] ?? 0) > 0 ? number_format(($summary['total_profit'] ?? 0) / $summary['total_distance'], 2) : '—' }}</td>
            </tr>
        </tfoot>
    </table>
</body>
</html>
