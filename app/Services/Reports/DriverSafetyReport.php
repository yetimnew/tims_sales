<?php

namespace App\Services\Reports;

use App\Models\Driver;
use App\Models\DriverSafetyRecord;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class DriverSafetyReport
{
    public function build(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange($filters);
        $driverIds = $this->resolveIntegerArray($filters['driver_ids'] ?? []);
        $incidentTypes = $this->resolveStringArray($filters['incident_types'] ?? []);
        $severities = $this->resolveStringArray($filters['severities'] ?? []);

        $baseQuery = DriverSafetyRecord::query()
            ->whereBetween('incident_date', [$from->toDateString(), $to->toDateString()]);

        if ($driverIds !== []) {
            $baseQuery->whereIn('driver_id', $driverIds);
        }

        if ($incidentTypes !== []) {
            $baseQuery->whereIn('incident_type', $incidentTypes);
        }

        if ($severities !== []) {
            $baseQuery->whereIn('severity', $severities);
        }

        $summary = $this->summary(clone $baseQuery, $to);
        $severityBreakdown = $this->severityBreakdown(clone $baseQuery);
        $incidentTypeBreakdown = $this->incidentTypeBreakdown(clone $baseQuery);
        $driverLeaderboard = $this->driverLeaderboard(clone $baseQuery);
        $trend = $this->trend(clone $baseQuery, $from, $to);
        $recentIncidents = $this->recentIncidents(clone $baseQuery);
        $options = $this->filterOptions();

        return [
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'driver_ids' => $driverIds,
                'incident_types' => $incidentTypes,
                'severities' => $severities,
            ],
            'summary' => $summary,
            'severity_breakdown' => $severityBreakdown,
            'incident_type_breakdown' => $incidentTypeBreakdown,
            'driver_leaderboard' => $driverLeaderboard,
            'trend' => $trend,
            'recent_incidents' => $recentIncidents,
            'options' => $options,
        ];
    }

    private function resolveDateRange(array $filters): array
    {
        $from = $filters['from'] ?? now()->subMonthsNoOverflow(6)->toDateString();
        $to = $filters['to'] ?? now()->toDateString();

        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();

        if ($fromDate->greaterThan($toDate)) {
            [$fromDate, $toDate] = [$toDate->copy()->startOfDay(), $fromDate->copy()->endOfDay()];
        }

        return [$fromDate, $toDate];
    }

    /**
     * @param  iterable<int, mixed>  $values
     * @return array<int, int>
     */
    private function resolveIntegerArray(iterable $values): array
    {
        return collect(Arr::wrap($values))
            ->map(static fn ($value) => (int) $value)
            ->filter(static fn (int $value) => $value > 0)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  iterable<int, mixed>  $values
     * @return array<int, string>
     */
    private function resolveStringArray(iterable $values): array
    {
        return collect(Arr::wrap($values))
            ->map(static fn ($value) => trim((string) $value))
            ->filter(static fn (string $value) => $value !== '')
            ->unique()
            ->values()
            ->all();
    }

    private function summary(Builder $query, CarbonInterface $to): array
    {
        $base = clone $query;

        $totalIncidents = (clone $base)->count();
        $criticalIncidents = (clone $base)->where('severity', 'critical')->count();
        $majorIncidents = (clone $base)->where('severity', 'major')->count();
        $minorIncidents = (clone $base)->where('severity', 'minor')->count();
        $incidentTypesCount = (clone $base)->distinct('incident_type')->count('incident_type');
        $driversAffected = (clone $base)->distinct('driver_id')->count('driver_id');
        $totalDamageCost = (float) (clone $base)->sum('damage_cost');
        $averageDamageCost = (float) (clone $base)->avg('damage_cost');

        $lastIncidentDate = (clone $base)
            ->orderByDesc('incident_date')
            ->value('incident_date');

        $daysSinceLastIncident = null;
        if ($lastIncidentDate !== null) {
            $lastIncident = Carbon::parse($lastIncidentDate)->endOfDay();
            $daysSinceLastIncident = $lastIncident->diffInDays($to, false);
        }

        return [
            'total_incidents' => $totalIncidents,
            'critical_incidents' => $criticalIncidents,
            'major_incidents' => $majorIncidents,
            'minor_incidents' => $minorIncidents,
            'incident_type_variants' => $incidentTypesCount,
            'drivers_affected' => $driversAffected,
            'total_damage_cost' => round($totalDamageCost, 2),
            'average_damage_cost' => round($averageDamageCost, 2),
            'days_since_last_incident' => $daysSinceLastIncident,
        ];
    }

    private function severityBreakdown(Builder $query): array
    {
        return (clone $query)
            ->select(['severity'])
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(COALESCE(damage_cost, 0)) as damage_cost_total')
            ->groupBy('severity')
            ->orderByDesc('total')
            ->get()
            ->map(static function (DriverSafetyRecord $record) {
                $severity = (string) $record->severity;

                return [
                    'severity' => $severity,
                    'label' => Str::of($severity)->replace('_', ' ')->headline(),
                    'total' => (int) $record->total,
                    'damage_cost_total' => round((float) $record->damage_cost_total, 2),
                ];
            })
            ->values()
            ->all();
    }

    private function incidentTypeBreakdown(Builder $query): array
    {
        return (clone $query)
            ->select(['incident_type'])
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(COALESCE(damage_cost, 0)) as damage_cost_total')
            ->selectRaw('SUM(CASE WHEN severity = "critical" THEN 1 ELSE 0 END) as critical_incidents')
            ->selectRaw('SUM(CASE WHEN severity = "major" THEN 1 ELSE 0 END) as major_incidents')
            ->selectRaw('SUM(CASE WHEN severity = "minor" THEN 1 ELSE 0 END) as minor_incidents')
            ->groupBy('incident_type')
            ->orderByDesc('total')
            ->get()
            ->map(static function (DriverSafetyRecord $record) {
                $type = (string) $record->incident_type;

                return [
                    'incident_type' => $type,
                    'label' => Str::of($type)->replace('_', ' ')->headline(),
                    'total' => (int) $record->total,
                    'critical_incidents' => (int) $record->critical_incidents,
                    'major_incidents' => (int) $record->major_incidents,
                    'minor_incidents' => (int) $record->minor_incidents,
                    'damage_cost_total' => round((float) $record->damage_cost_total, 2),
                ];
            })
            ->values()
            ->all();
    }

    private function driverLeaderboard(Builder $query): array
    {
        return (clone $query)
            ->select(['driver_id'])
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN severity = "critical" THEN 1 ELSE 0 END) as critical_incidents')
            ->selectRaw('SUM(CASE WHEN severity = "major" THEN 1 ELSE 0 END) as major_incidents')
            ->selectRaw('SUM(CASE WHEN severity = "minor" THEN 1 ELSE 0 END) as minor_incidents')
            ->selectRaw('SUM(COALESCE(damage_cost, 0)) as damage_cost_total')
            ->with('driver:id,name')
            ->groupBy('driver_id')
            ->whereNotNull('driver_id')
            ->orderByDesc('critical_incidents')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(static function (DriverSafetyRecord $record) {
                return [
                    'driver_id' => $record->driver_id,
                    'driver_name' => $record->driver?->name ?? 'Unassigned',
                    'total' => (int) $record->total,
                    'critical_incidents' => (int) $record->critical_incidents,
                    'major_incidents' => (int) $record->major_incidents,
                    'minor_incidents' => (int) $record->minor_incidents,
                    'damage_cost_total' => round((float) $record->damage_cost_total, 2),
                ];
            })
            ->values()
            ->all();
    }

    private function trend(Builder $query, CarbonInterface $from, CarbonInterface $to): array
    {
        $trendRows = (clone $query)
            ->selectRaw("DATE_FORMAT(incident_date, '%Y-%m') as period")
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(COALESCE(damage_cost, 0)) as damage_cost_total')
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->keyBy('period');

        $labels = [];
        $incidents = [];
        $damageCosts = [];

        $cursor = $from->copy()->startOfMonth();
        $end = $to->copy()->startOfMonth();

        while ($cursor <= $end) {
            $key = $cursor->format('Y-m');
            $label = $cursor->format('M Y');
            $row = $trendRows->get($key);

            $labels[] = $label;
            $incidents[] = $row ? (int) $row->total : 0;
            $damageCosts[] = $row ? round((float) $row->damage_cost_total, 2) : 0.0;

            $cursor->addMonth();
        }

        return [
            'labels' => $labels,
            'incidents' => $incidents,
            'damage_costs' => $damageCosts,
        ];
    }

    private function recentIncidents(Builder $query): array
    {
        return (clone $query)
            ->with(['driver:id,name', 'reportedBy:id,name'])
            ->orderByDesc('incident_date')
            ->orderByDesc('created_at')
            ->limit(25)
            ->get()
            ->map(static function (DriverSafetyRecord $record) {
                return [
                    'id' => $record->id,
                    'incident_date' => $record->incident_date?->toDateString(),
                    'incident_type' => $record->incident_type,
                    'severity' => $record->severity,
                    'description' => $record->description,
                    'location' => $record->location,
                    'damage_cost' => $record->damage_cost !== null ? round((float) $record->damage_cost, 2) : null,
                    'resolution' => $record->resolution,
                    'driver' => $record->driver ? [
                        'id' => $record->driver->id,
                        'name' => $record->driver->name,
                    ] : null,
                    'reported_by' => $record->reportedBy ? [
                        'id' => $record->reportedBy->id,
                        'name' => $record->reportedBy->name,
                    ] : null,
                    'safety_score_impact' => $record->safety_score_impact,
                ];
            })
            ->values()
            ->all();
    }

    private function filterOptions(): array
    {
        $drivers = Cache::remember('reports.driver_safety.drivers', 3600, static function (): array {
            return Driver::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get()
                ->map(static fn (Driver $driver) => [
                    'id' => $driver->id,
                    'name' => $driver->name,
                ])
                ->values()
                ->all();
        });

        $incidentTypes = Cache::remember('reports.driver_safety.incident_types', 3600, static function (): array {
            return DriverSafetyRecord::query()
                ->select('incident_type')
                ->whereNotNull('incident_type')
                ->distinct()
                ->orderBy('incident_type')
                ->get()
                ->map(static function (DriverSafetyRecord $record): array {
                    $value = (string) $record->incident_type;

                    return [
                        'value' => $value,
                        'label' => Str::of($value)->replace('_', ' ')->headline(),
                    ];
                })
                ->values()
                ->all();
        });

        $severities = Cache::remember('reports.driver_safety.severities', 3600, static function (): array {
            return DriverSafetyRecord::query()
                ->select('severity')
                ->whereNotNull('severity')
                ->distinct()
                ->orderBy('severity')
                ->get()
                ->map(static function (DriverSafetyRecord $record): array {
                    $value = (string) $record->severity;

                    return [
                        'value' => $value,
                        'label' => Str::of($value)->replace('_', ' ')->headline(),
                    ];
                })
                ->values()
                ->all();
        });

        return [
            'drivers' => $drivers,
            'incident_types' => $incidentTypes,
            'severities' => $severities,
        ];
    }
}
