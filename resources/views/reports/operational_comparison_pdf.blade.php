<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Operational Comparison Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #1e293b; font-size: 12px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p { margin: 2px 0 12px 0; }
        table { width: 100%; border-collapse: collapse; }
        thead { background-color: #e2e8f0; }
        th, td { border: 1px solid #cbd5f5; padding: 6px 8px; text-align: right; }
        th:first-child, td:first-child { text-align: left; }
        th:nth-child(2), td:nth-child(2) { text-align: left; }
        tfoot td { font-weight: 600; background-color: #f8fafc; border-top: 2px solid #94a3b8; }
    </style>
</head>
<body>
    <h1>Operational Comparison Report</h1>
    <p>Reporting window: {{ $from }} to {{ $to }}</p>

    <table>
        <thead>
            <tr>
                <th>Operation</th>
                <th>Customer</th>
                <th>Internal Trips</th>
                <th>Outsource Trips</th>
                <th>Total Trips</th>
                <th>Internal Tonnage (MT)</th>
                <th>Outsource Tonnage (MT)</th>
                <th>Total Tonnage (MT)</th>
                <th>Total Ton-KM</th>
                <th>Revenue</th>
                <th>Total Cost</th>
                <th>Profit</th>
                <th>Margin %</th>
                <th>Revenue / Ton-KM</th>
                <th>Cost / Ton-KM</th>
                <th>Profit / Ton-KM</th>
                <th>Revenue / Trip</th>
                <th>Cost / Trip</th>
                <th>Tonnage / Trip</th>
                <th>Average Km/Trip</th>
                <th>Total Distance (KM)</th>
                <th>Empty Distance %</th>
                <th>Cost per Km</th>
                <th>Internal Fuel / Km</th>
                <th>Outsource Cost / Km</th>
                <th>Outsource Trip Share %</th>
                <th>Outsource Tonnage Share %</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
                <tr>
                    <td>{{ $row['operation_code'] }}</td>
                    <td>{{ $row['customer_name'] }}</td>
                    <td>{{ number_format($row['internal_trips']) }}</td>
                    <td>{{ number_format($row['outsource_trips']) }}</td>
                    <td>{{ number_format($row['total_trips']) }}</td>
                    <td>{{ number_format($row['internal_tonnage'], 2) }}</td>
                    <td>{{ number_format($row['outsource_tonnage'], 2) }}</td>
                    <td>{{ number_format($row['total_tonnage'], 2) }}</td>
                    <td>{{ number_format($row['total_ton_km'], 2) }}</td>
                    <td>{{ number_format($row['revenue'], 2) }}</td>
                    <td>{{ number_format($row['total_cost'], 2) }}</td>
                    <td>{{ number_format($row['profit'], 2) }}</td>
                    <td>{{ $row['margin_percent'] === null ? '—' : number_format($row['margin_percent'], 2) }}</td>
                    <td>{{ $row['revenue_per_ton_km'] === null ? '—' : number_format($row['revenue_per_ton_km'], 2) }}</td>
                    <td>{{ $row['cost_per_ton_km'] === null ? '—' : number_format($row['cost_per_ton_km'], 2) }}</td>
                    <td>{{ $row['profit_per_ton_km'] === null ? '—' : number_format($row['profit_per_ton_km'], 2) }}</td>
                    <td>{{ $row['revenue_per_trip'] === null ? '—' : number_format($row['revenue_per_trip'], 2) }}</td>
                    <td>{{ $row['cost_per_trip'] === null ? '—' : number_format($row['cost_per_trip'], 2) }}</td>
                    <td>{{ $row['tonnage_per_trip'] === null ? '—' : number_format($row['tonnage_per_trip'], 2) }}</td>
                    <td>{{ $row['average_km_per_trip'] === null ? '—' : number_format($row['average_km_per_trip'], 2) }}</td>
                    <td>{{ number_format($row['total_distance'], 2) }}</td>
                    <td>{{ $row['empty_distance_ratio_percent'] === null ? '—' : number_format($row['empty_distance_ratio_percent'], 2) }}</td>
                    <td>{{ $row['cost_per_km'] === null ? '—' : number_format($row['cost_per_km'], 2) }}</td>
                    <td>{{ $row['internal_fuel_cost_per_km'] === null ? '—' : number_format($row['internal_fuel_cost_per_km'], 2) }}</td>
                    <td>{{ $row['outsource_cost_per_km'] === null ? '—' : number_format($row['outsource_cost_per_km'], 2) }}</td>
                    <td>{{ $row['outsource_trip_share_percent'] === null ? '—' : number_format($row['outsource_trip_share_percent'], 2) }}</td>
                    <td>{{ $row['outsource_tonnage_share_percent'] === null ? '—' : number_format($row['outsource_tonnage_share_percent'], 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="27">No data available for the selected filters.</td>
                </tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td>Totals</td>
                <td>{{ number_format($summary['operation_count']) }} operations</td>
                <td>{{ number_format($summary['internal_trips']) }}</td>
                <td>{{ number_format($summary['outsource_trips']) }}</td>
                <td>{{ number_format($summary['total_trips']) }}</td>
                <td>{{ number_format($summary['internal_tonnage'], 2) }}</td>
                <td>{{ number_format($summary['outsource_tonnage'], 2) }}</td>
                <td>{{ number_format($summary['total_tonnage'], 2) }}</td>
                <td>{{ number_format($summary['total_ton_km'], 2) }}</td>
                <td>{{ number_format($summary['revenue'], 2) }}</td>
                <td>{{ number_format($summary['total_cost'], 2) }}</td>
                <td>{{ number_format($summary['profit'], 2) }}</td>
                <td>{{ $summary['margin_percent'] === null ? '—' : number_format($summary['margin_percent'], 2) }}</td>
                <td>{{ $summary['revenue_per_ton_km'] === null ? '—' : number_format($summary['revenue_per_ton_km'], 2) }}</td>
                <td>{{ $summary['cost_per_ton_km'] === null ? '—' : number_format($summary['cost_per_ton_km'], 2) }}</td>
                <td>{{ $summary['profit_per_ton_km'] === null ? '—' : number_format($summary['profit_per_ton_km'], 2) }}</td>
                <td>{{ $summary['revenue_per_trip'] === null ? '—' : number_format($summary['revenue_per_trip'], 2) }}</td>
                <td>{{ $summary['cost_per_trip'] === null ? '—' : number_format($summary['cost_per_trip'], 2) }}</td>
                <td>{{ $summary['tonnage_per_trip'] === null ? '—' : number_format($summary['tonnage_per_trip'], 2) }}</td>
                <td>{{ $summary['average_km_per_trip'] === null ? '—' : number_format($summary['average_km_per_trip'], 2) }}</td>
                <td>{{ number_format($summary['total_distance'], 2) }}</td>
                <td>{{ $summary['empty_distance_ratio_percent'] === null ? '—' : number_format($summary['empty_distance_ratio_percent'], 2) }}</td>
                <td>{{ $summary['cost_per_km'] === null ? '—' : number_format($summary['cost_per_km'], 2) }}</td>
                <td>{{ $summary['internal_fuel_cost_per_km'] === null ? '—' : number_format($summary['internal_fuel_cost_per_km'], 2) }}</td>
                <td>{{ $summary['outsource_cost_per_km'] === null ? '—' : number_format($summary['outsource_cost_per_km'], 2) }}</td>
                <td>{{ $summary['outsource_trip_share_percent'] === null ? '—' : number_format($summary['outsource_trip_share_percent'], 2) }}</td>
                <td>{{ $summary['outsource_tonnage_share_percent'] === null ? '—' : number_format($summary['outsource_tonnage_share_percent'], 2) }}</td>
            </tr>
        </tfoot>
    </table>
</body>
</html>
