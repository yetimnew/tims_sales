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
    <p>Reporting window: {{ $from }} to {{ $to }}</p>

    @php($grouped = collect($rows)->groupBy('level'))

    @foreach ($grouped as $level => $groupRows)
        <h2>{{ $level }} Summary</h2>
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
                @forelse ($groupRows as $row)
                    <tr class="{{ !empty($row['is_total']) ? 'total' : '' }}">
                        <td>{{ $row['name'] }}</td>
                        <td>{{ number_format($row['trips']) }}</td>
                        <td>{{ number_format((float) $row['tonnage'], 2) }}</td>
                        <td>{{ number_format((float) $row['revenue'], 2) }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4">No data available for this section.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    @endforeach

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
                    <td>{{ number_format($totals['trips'] ?? 0) }}</td>
                    <td>{{ number_format((float) ($totals['tonnage'] ?? 0), 2) }}</td>
                    <td>{{ number_format((float) ($totals['revenue'] ?? 0), 2) }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
