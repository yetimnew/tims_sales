<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $customers = Customer::withCount('operations')
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
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
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'contact_person' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'address' => 'nullable|string|max:500',
                'status' => 'required|string|in:active,inactive',
            ]);

            $customer = Customer::create($validated);

            Log::info('Customer created', [
                'customer_id' => $customer->id,
                'name' => $customer->name,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('customers.index')
                ->with('success', 'Customer created successfully.');

        } catch (Exception $e) {
            Log::error('Customer creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create customer. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Customer $customer): Response
    {
        $customer->load(['operations' => function ($query) {
            $query->with('performances')->paginate(10);
        }]);

        return Inertia::render('Customers/Show', [
            'customer' => $customer,
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
    public function update(Request $request, Customer $customer)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'contact_person' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'address' => 'nullable|string|max:500',
                'status' => 'required|string|in:active,inactive',
            ]);

            $customer->update($validated);

            Log::info('Customer updated', [
                'customer_id' => $customer->id,
                'name' => $customer->name,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('customers.index')
                ->with('success', 'Customer updated successfully.');

        } catch (Exception $e) {
            Log::error('Customer update failed', [
                'customer_id' => $customer->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update customer. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Customer $customer)
    {
        try {
            // Check if customer is being used in operations
            if ($customer->operations()->count() > 0) {
                return back()->withErrors(['error' => 'Cannot delete customer that has operations.']);
            }

            $customerData = $customer->toArray();
            $customer->delete();

            Log::info('Customer deleted', [
                'customer_id' => $customer->id,
                'name' => $customerData['name'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('customers.index')
                ->with('success', 'Customer deleted successfully.');

        } catch (Exception $e) {
            Log::error('Customer deletion failed', [
                'customer_id' => $customer->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete customer. Please try again.']);
        }
    }
}



