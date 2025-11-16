<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\Customer;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Customer::withCount('operations');

        // Handle search
        if ($request->has('search') && ! empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Handle status filter
        $status = $request->input('status');
        if ($status && in_array($status, ['active', 'inactive'], true)) {
            $query->where('status', $status);
        }

        // Handle sorting
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        $allowedSorts = ['name', 'contact_person', 'phone', 'email', 'status', 'created_at', 'operations_count'];
        if (! in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $perPageOptions = [10, 15, 25, 50];
        $perPage = (int) $request->input('per_page', 15);
        if (! in_array($perPage, $perPageOptions, true)) {
            $perPage = 15;
        }

        $query->orderBy($sort, $direction);
        $customers = $query->paginate($perPage)->withQueryString();

        $statusCounts = Customer::selectRaw('status, COUNT(*) as aggregate')->groupBy('status')->pluck('aggregate', 'status');
        $metrics = [
            'total' => (int) $statusCounts->sum(),
            'active' => (int) ($statusCounts->get('active') ?? 0),
            'inactive' => (int) ($statusCounts->get('inactive') ?? 0),
            'with_operations' => (int) Customer::has('operations')->count(),
        ];

        $filters = [
            'search' => $request->input('search'),
            'status' => $status,
            'sort' => $sort,
            'direction' => $direction,
            'per_page' => $perPage,
        ];

        $statusOptions = [
            ['label' => 'Active', 'value' => 'active'],
            ['label' => 'Inactive', 'value' => 'inactive'],
        ];

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'metrics' => $metrics,
            'filters' => $filters,
            'statusOptions' => $statusOptions,
            'perPageOptions' => $perPageOptions,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Customers/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCustomerRequest $request)
    {
        try {
            $validated = $request->validated();
            $customer = Customer::create($validated);

            return redirect()->route('customers.index')
                ->with('success', 'Customer created successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to create customer. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Customer $customer): Response
    {
        $customer->load(['operations' => function ($query) {
            $query->where('status', 'active')
                ->withCount('performances')
                ->withCount(['performances as completed_trips' => function ($q) {
                    $q->where('is_returned', true);
                }])
                ->withSum('performances as total_tonnage', 'CargoVolumMT')
                ->withSum('performances as total_distance_wc', 'DistanceWCargo')
                ->withSum('performances as total_distance_woc', 'DistanceWOCargo')
                ->withSum('performances as total_cost_fuel', 'fuelInBirr')
                ->withSum('performances as total_cost_perdiem', 'perdiem')
                ->withSum('performances as total_cost_other', 'other')
                ->withMax('performances as last_dispatch', 'DateDispach')
                ->orderByDesc('startdate');
        }]);

        $activeOperations = $customer->operations->map(function ($operation) {
            $totalTrips = (int) ($operation->performances_count ?? 0);
            $completedTrips = (int) ($operation->completed_trips ?? 0);
            $inProgressTrips = max($totalTrips - $completedTrips, 0);

            $deliveredTonnage = (float) ($operation->total_tonnage ?? 0);
            $plannedVolume = (float) ($operation->volume ?? 0);
            $remainingTonnage = max($plannedVolume - $deliveredTonnage, 0);
            $completionRate = $plannedVolume > 0 ? round(($deliveredTonnage / $plannedVolume) * 100, 2) : null;

            $totalDistance = (float) ($operation->total_distance_wc ?? 0) + (float) ($operation->total_distance_woc ?? 0);
            $totalCost = (float) ($operation->total_cost_fuel ?? 0)
                + (float) ($operation->total_cost_perdiem ?? 0)
                + (float) ($operation->total_cost_other ?? 0);

            return [
                'id' => $operation->id,
                'operationid' => $operation->operationid,
                'status' => $operation->status,
                'startdate' => $operation->startdate,
                'enddate' => $operation->enddate,
                'volume' => $plannedVolume,
                'km' => $operation->km,
                'tariff' => $operation->tariff,
                'totalTrips' => $totalTrips,
                'completedTrips' => $completedTrips,
                'inProgressTrips' => $inProgressTrips,
                'deliveredTonnage' => round($deliveredTonnage, 2),
                'remainingTonnage' => round($remainingTonnage, 2),
                'completionRate' => $completionRate,
                'totalDistance' => round($totalDistance, 2),
                'totalCost' => round($totalCost, 2),
                'lastDispatch' => $operation->last_dispatch,
            ];
        })->values();

        $customerData = [
            'id' => $customer->id,
            'name' => $customer->name,
            'contact_person' => $customer->contact_person,
            'phone' => $customer->phone,
            'email' => $customer->email,
            'address' => $customer->address,
            'status' => $customer->status,
            'created_at' => $customer->created_at,
        ];

        $activityLogs = Activity::forSubject($customer)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Customers/Show', [
            'customer' => $customerData,
            'activeOperations' => $activeOperations,
            'activeOperationsCount' => $activeOperations->count(),
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Customer $customer): Response
    {
        return Inertia::render('Customers/Edit', [
            'customer' => $customer,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCustomerRequest $request, Customer $customer)
    {
        try {
            $validated = $request->validated();
            $customer->update($validated);

            return redirect()->route('customers.index')
                ->with('success', 'Customer updated successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to update customer. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Customer $customer)
    {
        try {
            // Check for related records that prevent deletion

            // Check if customer has operations
            if ($customer->operations()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this customer. It has '.$customer->operations()->count().' operation(s). Please remove all operations first.',
                ]);
            }

            $customer->delete();

            return redirect()->route('customers.index')
                ->with('success', 'Customer deleted successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete customer. Please try again.']);
        }
    }

    /**
     * Export customers to CSV
     */
    public function export(Request $request)
    {
        $query = Customer::withCount('operations');

        // Apply same search and sort as index
        if ($request->has('search') && ! empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Apply sorting
        if ($request->has('sort')) {
            $sort = $request->input('sort', 'name');
            $direction = $request->input('direction', 'asc');
            $query = $query->orderBy($sort, $direction);
        }

        $customers = $query->get();

        // Generate CSV
        $filename = 'customers_'.now()->format('Y-m-d_H-i-s').'.csv';
        $handle = fopen('php://temp', 'r+');

        // Write header
        fputcsv($handle, [
            'ID',
            'Name',
            'Contact Person',
            'Phone',
            'Email',
            'Address',
            'Status',
            'Operations Count',
            'Created At',
            'Updated At',
        ]);

        // Write data
        foreach ($customers as $customer) {
            fputcsv($handle, [
                $customer->id,
                $customer->name,
                $customer->contact_person,
                $customer->phone,
                $customer->email,
                $customer->address,
                $customer->status,
                $customer->operations_count,
                $customer->created_at,
                $customer->updated_at,
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        // Log the export activity
        if (Auth::check()) {
            activity()
                ->causedBy(Auth::user())
                ->withProperties(['count' => count($customers)])
                ->log('exported customers to CSV');
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * Deactivate the specified customer.
     */
    public function deactivate(Customer $customer)
    {
        try {
            $customer->update(['status' => 'inactive']);

            return redirect()->route('customers.index')
                ->with('success', 'Customer deactivated successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to deactivate customer. Please try again.']);
        }
    }

    /**
     * Get active customers.
     */
    public function activeCustomers()
    {
        try {
            $activeCustomers = Customer::where('status', 'active')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $activeCustomers,
                'count' => $activeCustomers->count(),
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active customers',
            ], 500);
        }
    }
}
