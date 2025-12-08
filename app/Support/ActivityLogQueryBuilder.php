<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Spatie\Activitylog\Models\Activity;

class ActivityLogQueryBuilder
{
    /**
     * Build an activity log query with the provided filters and sort options.
     *
     * @param  array<string, mixed>  $filters
     * @param  array<string, mixed>  $sort
     */
    public static function build(array $filters = [], array $sort = []): Builder
    {
        $activity = new Activity;
        $table = $activity->getTable();

        $builder = $activity->newQuery()
            ->select([$table.'.*'])
            ->with(['causer:id,name,email', 'subject'])
            ->leftJoin('users as causers', $table.'.causer_id', '=', 'causers.id')
            ->addSelect(['causer_name' => 'causers.name']);

        if ($from = Arr::get($filters, 'from')) {
            $builder->where($table.'.created_at', '>=', Carbon::parse($from)->startOfDay());
        }

        if ($to = Arr::get($filters, 'to')) {
            $builder->where($table.'.created_at', '<=', Carbon::parse($to)->endOfDay());
        }

        if ($causerId = Arr::get($filters, 'causer_id')) {
            $builder->where($table.'.causer_id', $causerId);
        }

        if ($logName = Arr::get($filters, 'log_name')) {
            $builder->where($table.'.log_name', $logName);
        }

        if ($subjectType = Arr::get($filters, 'subject_type')) {
            $builder->where($table.'.subject_type', $subjectType);
        }

        if ($search = Arr::get($filters, 'search')) {
            $normalized = Str::lower((string) $search);
            $builder->where(function (Builder $query) use ($normalized, $table): void {
                $query
                    ->whereRaw('LOWER('.$table.'.description) LIKE ?', ['%'.$normalized.'%'])
                    ->orWhereRaw('LOWER('.$table.'.log_name) LIKE ?', ['%'.$normalized.'%'])
                    ->orWhereRaw('LOWER('.$table.'.subject_type) LIKE ?', ['%'.$normalized.'%'])
                    ->orWhereRaw('LOWER(causers.name) LIKE ?', ['%'.$normalized.'%']);
            });
        }

        if ($action = Arr::get($filters, 'action')) {
            $normalized = Str::lower((string) $action);
            $builder->where(function (Builder $query) use ($normalized, $table): void {
                $query
                    ->whereRaw('LOWER('.$table.'.event) = ?', [$normalized])
                    ->orWhereRaw('LOWER('.$table.'.description) = ?', [$normalized])
                    ->orWhereRaw('LOWER('.$table.'.description) LIKE ?', ['%'.$normalized.'%']);
            });
        }

        $column = Arr::get($sort, 'column', 'created_at');
        $direction = Str::lower((string) Arr::get($sort, 'direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedColumns = [
            'created_at',
            'description',
            'event',
            'log_name',
            'subject_type',
            'causer_name',
        ];

        if (! in_array($column, $allowedColumns, true)) {
            $column = 'created_at';
        }

        if ($column === 'causer_name') {
            $builder->orderBy('causers.name', $direction);
        } else {
            $builder->orderBy($table.'.'.$column, $direction);
        }

        return $builder;
    }
}
