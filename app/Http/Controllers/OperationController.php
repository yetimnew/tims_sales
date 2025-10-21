<?php

namespace App\Http\Controllers;

use App\Models\Operation;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;

class OperationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $operations = Operation::with(['customer'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Operations/Index', [
            'operations' => $operations,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $customers = Customer::where('status', 'active')->get();

        return Inertia::render('Operations/Create', [
            'customers' => $customers,
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
                'description' => 'nullable|string|max:1000',
                'status' => 'required|string|in:active,inactive',
            ]);

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
        $operation->load(['customer', 'performances']);

        return Inertia::render('Operations/Show', [
            'operation' => $operation,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Operation $operation): Response
    {
        $customers = Customer::where('status', 'active')->get();

        return Inertia::render('Operations/Edit', [
            'operation' => $operation,
            'customers' => $customers,
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
                'description' => 'nullable|string|max:1000',
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
}



