<?php

namespace App\Http\Controllers;

use App\Models\Operation;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Spatie\Activitylog\Models\Activity;
use Exception;

class OperationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Operation::with(['customer']);

        // Handle search
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('operationid', 'like', "%{$search}%")
                    ->orWhere('remark', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'operationid');
        $direction = $request->input('direction', 'asc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['operationid', 'status', 'startdate', 'enddate', 'volume', 'km', 'tariff', 'closed', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'operationid';
        }

        $query->orderBy($sort, $direction);

        $operations = $query->paginate(15);

        return Inertia::render('Operations/Index', [
            'operations' => $operations,
            'totalCount' => $operations->total(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $customers = Customer::where('status', 'active')->get();
        $regions = \App\Models\Region::all();

        return Inertia::render('Operations/Create', [
            'customers' => $customers,
            'regions' => $regions,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'operationid' => 'required|string|max:255|unique:operations',
                'customer_id' => 'required|exists:customers,id',
                'region_id' => 'required|exists:regions,id',
                'startdate' => 'required|date',
                'volume' => 'required|numeric|min:0',
                'cargotype' => 'required|string|max:255',
                'km' => 'required|numeric|min:0',
                'tariff' => 'required|numeric|min:0',
                'remark' => 'nullable|string|max:1000',
                'status' => 'required|string|in:active,inactive',
            ]);

            // Add user_id to the validated data
            $validated['user_id'] = auth()->id();

            $operation = Operation::create($validated);

            Log::info('Operation created', [
                'operation_id' => $operation->id,
                'operationid' => $operation->operationid,
                'customer_id' => $operation->customer_id,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('operations.index')
                ->with('success', 'Operation created successfully.');

        } catch (Exception $e) {
            Log::error('Operation creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create operation. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Operation $operation): Response
    {
        $operation->load(['customer', 'performances', 'region', 'user']);

        // Load activity logs for this operation using Spatie Activity Log
        $activityLogs = Activity::forSubject($operation)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Operations/Show', [
            'operation' => $operation,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Operation $operation): Response
    {
        $customers = Customer::where('status', 'active')->get();
        $regions = \App\Models\Region::all();

        return Inertia::render('Operations/Edit', [
            'operation' => $operation,
            'customers' => $customers,
            'regions' => $regions,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Operation $operation)
    {
        try {
            $validated = $request->validate([
                'operationid' => 'required|string|max:255|unique:operations,operationid,' . $operation->id,
                'customer_id' => 'required|exists:customers,id',
                'region_id' => 'required|exists:regions,id',
                'startdate' => 'required|date',
                'volume' => 'required|numeric|min:0',
                'cargotype' => 'required|string|max:255',
                'km' => 'required|numeric|min:0',
                'tariff' => 'required|numeric|min:0',
                'remark' => 'nullable|string|max:1000',
                'status' => 'required|string|in:active,inactive',
            ]);

            $operation->update($validated);

            Log::info('Operation updated', [
                'operation_id' => $operation->id,
                'operationid' => $operation->operationid,
                'customer_id' => $operation->customer_id,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('operations.index')
                ->with('success', 'Operation updated successfully.');

        } catch (Exception $e) {
            Log::error('Operation update failed', [
                'operation_id' => $operation->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update operation. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Operation $operation)
    {
        try {
            // Check if operation is being used in performances
            if ($operation->performances()->count() > 0) {
                return back()->withErrors(['error' => 'Cannot delete operation that is being used in performances.']);
            }

            $operationData = $operation->toArray();
            $operation->delete();

            Log::info('Operation deleted', [
                'operation_id' => $operation->id,
                'operationid' => $operationData['operationid'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('operations.index')
                ->with('success', 'Operation deleted successfully.');

        } catch (Exception $e) {
            Log::error('Operation deletion failed', [
                'operation_id' => $operation->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete operation. Please try again.']);
        }
    }

    /**
     * Export operations to CSV.
     */
    public function export(Request $request)
    {
        $query = Operation::with(['customer']);

        // Apply same search and sort as index
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('operationid', 'like', "%{$search}%")
                    ->orWhere('remark', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Apply sorting
        if ($request->has('sort')) {
            $sort = $request->input('sort', 'operationid');
            $direction = $request->input('direction', 'asc');
            $query->orderBy($sort, $direction);
        }

        $operations = $query->get();

        // Generate CSV
        $filename = 'operations_' . now()->format('Y-m-d_H-i-s') . '.csv';
        $handle = fopen('php://temp', 'r+');

        // Write header
        fputcsv($handle, [
            'ID',
            'Operation ID',
            'Customer',
            'Description',
            'Status',
            'Start Date',
            'End Date',
            'Volume (MT)',
            'Distance (KM)',
            'Tariff',
            'Closed',
            'Created At',
        ]);

        // Write data
        foreach ($operations as $operation) {
            fputcsv($handle, [
                $operation->id,
                $operation->operationid,
                $operation->customer?->name ?? 'N/A',
                $operation->description ?? 'N/A',
                $operation->status,
                $operation->startdate,
                $operation->enddate ?? 'N/A',
                $operation->volume ?? 'N/A',
                $operation->km ?? 'N/A',
                $operation->tariff ?? 'N/A',
                $operation->closed ? 'Yes' : 'No',
                $operation->created_at,
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        // Log activity using Spatie Activity Log
        if (Auth::check()) {
            activity()
                ->causedBy(Auth::user())
                ->withProperties(['count' => count($operations)])
                ->log('exported operations to CSV');
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Deactivate the specified operation.
     */
    public function deactivate(Operation $operation)
    {
        try {
            $operation->update(['status' => 'inactive']);

            Log::info('Operation deactivated', [
                'operation_id' => $operation->id,
                'operationid' => $operation->operationid,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('operations.index')
                ->with('success', 'Operation deactivated successfully.');

        } catch (Exception $e) {
            Log::error('Operation deactivation failed', [
                'operation_id' => $operation->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to deactivate operation. Please try again.']);
        }
    }

    /**
     * Get available operations (not closed/completed).
     */
    public function availableOperations()
    {
        try {
            $availableOperations = Operation::where('status', 'active')
                ->where('closed', false)
                ->with(['customer', 'region'])
                ->orderBy('operationid')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $availableOperations,
                'count' => $availableOperations->count()
            ]);

        } catch (Exception $e) {
            Log::error('Failed to retrieve available operations', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve available operations'
            ], 500);
        }
    }
}



