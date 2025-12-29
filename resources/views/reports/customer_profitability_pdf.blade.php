<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Customer Profitability Report</title>
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
    <h1>Customer Profitability Report</h1>
    <p>Reporting window: {{ $from }} to {{ $to }}</p>

    @php($rowCollection = collect($rows))

    <table>
        <thead>
            <tr>
                <th>Customer</th>
                <th>Operations</th>
                <th>Lanes</th>
                <th>Internal Trips</th>
                <th>Outsource Trips</th>
                <th>Total Trips</th>
                <th>Total Tonnage (MT)</th>
                <th>Revenue</th>
                <th>Total Cost</th>
                <th>Profit</th>
                <th>Margin %</th>
                <th>Revenue / Trip</th>
                <th>Cost / Trip</th>
                <th>Cost / Km</th>
                <th>Outsource Trip Share %</th>
                <th>Outsource Tonnage Share %</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rowCollection as $row)
                <tr>
                    <td>{{ $row['customer_name'] ?? '—' }}</td>
                    <td>{{ $row['operations'] ?? 0 }}</td>
                    <td>{{ $row['lanes_used'] ?? 0 }}</td>
                    <td>{{ $row['internal_trips'] ?? 0 }}</td>
                    <td>{{ $row['outsource_trips'] ?? 0 }}</td>
                    <td>{{ $row['total_trips'] ?? 0 }}</td>
                    <td>{{ number_format((float) ($row['total_tonnage'] ?? 0), 2) }}</td>
                    <td>{{ number_format((float) ($row['revenue'] ?? 0), 2) }}</td>
                    <td>{{ number_format((float) ($row['total_cost'] ?? 0), 2) }}</td>
                    <td>{{ number_format((float) ($row['profit'] ?? 0), 2) }}</td>
                    <td>{{ $row['margin_percent'] === null ? '—' : number_format((float) $row['margin_percent'], 2) }}</td>
                    <td>{{ $row['revenue_per_trip'] === null ? '—' : number_format((float) $row['revenue_per_trip'], 2) }}</td>
                    <td>{{ $row['cost_per_trip'] === null ? '—' : number_format((float) $row['cost_per_trip'], 2) }}</td>
                    <td>{{ $row['cost_per_km'] === null ? '—' : number_format((float) $row['cost_per_km'], 2) }}</td>
                    <td>{{ $row['outsource_trip_share_percent'] === null ? '—' : number_format((float) $row['outsource_trip_share_percent'], 2) }}</td>
                    <td>{{ $row['outsource_tonnage_share_percent'] === null ? '—' : number_format((float) $row['outsource_tonnage_share_percent'], 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="16">No data available for the selected filters.</td>
                </tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td>Totals ({{ $summary['customer_count'] ?? 0 }} customers)</td>
                <td>{{ number_format((float) ($summary['operations'] ?? 0), 0) }}</td>
                <td>{{ number_format((float) $rowCollection->sum('lanes_used'), 0) }}</td>
                <td>{{ number_format((float) ($summary['internal_trips'] ?? 0), 0) }}</td>
                <td>{{ number_format((float) ($summary['outsource_trips'] ?? 0), 0) }}</td>
                <td>{{ number_format((float) ($summary['total_trips'] ?? 0), 0) }}</td>
                <td>{{ number_format((float) ($summary['total_tonnage'] ?? 0), 2) }}</td>
                <td>{{ number_format((float) ($summary['revenue'] ?? 0), 2) }}</td>
                <td>{{ number_format((float) ($summary['total_cost'] ?? 0), 2) }}</td>
                <td>{{ number_format((float) ($summary['profit'] ?? 0), 2) }}</td>
                <td>{{ $summary['margin_percent'] === null ? '—' : number_format((float) $summary['margin_percent'], 2) }}</td>
                <td>{{ $summary['revenue_per_trip'] === null ? '—' : number_format((float) $summary['revenue_per_trip'], 2) }}</td>
                <td>{{ $summary['cost_per_trip'] === null ? '—' : number_format((float) $summary['cost_per_trip'], 2) }}</td>
                <td>{{ $summary['cost_per_km'] === null ? '—' : number_format((float) $summary['cost_per_km'], 2) }}</td>
                <td>{{ $summary['outsource_trip_share_percent'] === null ? '—' : number_format((float) $summary['outsource_trip_share_percent'], 2) }}</td>
                <td>{{ $summary['outsource_tonnage_share_percent'] === null ? '—' : number_format((float) $summary['outsource_tonnage_share_percent'], 2) }}</td>
            </tr>
        </tfoot>
    </table>
</body>
</html>
