<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateTruckGradingSettingsRequest;
use App\Models\Truck;
use App\Models\TruckGradingSetting;
use App\Services\TruckGradeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class TruckGradingSettingsController extends Controller
{
    public function __construct(private TruckGradeService $truckGrade) {}

    public function edit(Request $request): Response
    {
        $latest = TruckGradingSetting::query()
            ->with('updatedBy:id,name')
            ->latest('updated_at')
            ->first();

        $defaults = TruckGradingSetting::defaultWeights();
        $active = array_merge($defaults, $latest?->only(array_keys($defaults)) ?? []);

        $perPageOptions = [10, 25, 50];
        $perPageInput = (int) $request->input('per_page', $perPageOptions[0]);
        $perPage = in_array($perPageInput, $perPageOptions, true) ? $perPageInput : $perPageOptions[0];
        $gradeLetter = strtoupper((string) $request->input('grade_letter')) ?: null;
        $currentPage = LengthAwarePaginator::resolveCurrentPage();

        $trucks = Truck::query()
            ->with(['vehicleType:id,name'])
            ->orderBy('plate')
            ->get([
                'id',
                'plate',
                'vehicletype_id',
                'status',
                'serviceStartDate',
                'productionDate',
                'purchasePrice',
            ]);

        $grades = $this->truckGrade->gradeMany($trucks);

        $rows = $trucks->map(function (Truck $truck) use ($grades) {
            $grade = $grades->get($truck->id, null);

            return [
                'id' => $truck->id,
                'plate' => $truck->plate,
                'status' => $truck->status,
                'vehicleType' => $truck->vehicleType ? $truck->vehicleType->only(['id', 'name']) : null,
                'service_start_date' => $truck->serviceStartDate?->toDateString(),
                'production_date' => $truck->productionDate?->toDateString(),
                'purchase_price' => $truck->purchasePrice !== null ? (float) $truck->purchasePrice : null,
                'grade' => $grade,
            ];
        })->filter(fn (array $row) => $row['grade'] !== null);

        if ($gradeLetter) {
            $rows = $rows->filter(function (array $row) use ($gradeLetter) {
                return strtoupper((string) ($row['grade']['overall']['letter'] ?? '')) === $gradeLetter;
            });
        }

        $sorted = $rows->sortByDesc(fn (array $row) => $row['grade']['overall']['score'] ?? 0)->values();

        $total = $sorted->count();
        $offset = max($currentPage - 1, 0) * $perPage;
        $pageItems = $sorted->slice($offset, $perPage)->values();

        $paginator = new LengthAwarePaginator(
            $pageItems,
            $total,
            $perPage,
            $currentPage,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ],
        );

        return Inertia::render('settings/truck-grading', [
            'settings' => [
                'weights' => Arr::only($active, [
                    'utilization_weight',
                    'efficiency_weight',
                    'reliability_weight',
                    'financial_weight',
                    'compliance_weight',
                ]),
                'peer_sample_size' => $active['peer_sample_size'],
                'last_updated_at' => $latest?->updated_at?->toIso8601String(),
                'updated_by' => $latest?->updatedBy?->only(['id', 'name']),
            ],
            'can' => [
                'update' => $request->user()?->can('trucks.update') ?? false,
            ],
            'truckGrades' => $this->formatPaginator($paginator),
            'filters' => [
                'grade_letter' => $gradeLetter,
                'per_page' => $perPage,
            ],
            'perPageOptions' => $perPageOptions,
        ]);
    }

    public function update(UpdateTruckGradingSettingsRequest $request): RedirectResponse
    {
        $weights = $request->weights();

        $payload = array_merge($weights, [
            'updated_by' => $request->user()?->id,
        ]);

        $setting = TruckGradingSetting::query()->latest('updated_at')->first();

        if ($setting) {
            $setting->forceFill($payload)->save();
        } else {
            TruckGradingSetting::create($payload);
        }

        return to_route('settings.truck-grading.edit')
            ->with('success', 'Truck grading weights updated successfully.');
    }

    private function formatPaginator(LengthAwarePaginator $paginator): array
    {
        $links = $paginator->linkCollection()->map(static function (array $link): array {
            $label = $link['label'];

            if (is_string($label)) {
                $label = trim(strip_tags(html_entity_decode($label)));
            }

            return [
                'url' => $link['url'],
                'label' => $label,
                'active' => (bool) $link['active'],
            ];
        })->values()->all();

        return [
            'data' => $paginator->getCollection()->values()->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'links' => $links,
        ];
    }
}
