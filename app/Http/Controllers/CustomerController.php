<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Exception;
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
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        $allowedSorts = ['name', 'contact_person', 'phone', 'email', 'status', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);
        $customers = $query->paginate(15);

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
            $query->with('performances')->paginate(10);
        }]);

        $activityLogs = Activity::forSubject($customer)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Customers/Show', [
            'customer' => $customer,
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
            // Check if customer is being used in operations
            if ($customer->operations()->count() > 0) {
                return back()->withErrors(['error' => 'Cannot delete customer that has operations.']);
            }

            $customer->delete();

            return redirect()->route('customers.index')
                ->with('success', 'Customer deleted successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete customer. Please try again.']);
        }
    }
}



