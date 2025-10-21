<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use App\Models\Truck;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DriverController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $drivers = Driver::with('trucks')
            ->paginate(15);

        return Inertia::render('Drivers/Index', [
            'drivers' => $drivers,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Drivers/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'driverid' => 'required|string|max:255|unique:drivers',
            'name' => 'required|string|max:255',
            'sex' => 'required|string|in:male,female',
            'birthdate' => 'nullable|date',
            'zone' => 'nullable|string|max:255',
            'woreda' => 'nullable|string|max:255',
            'kebele' => 'nullable|string|max:255',
            'housenumber' => 'nullable|string|max:255',
            'mobile' => 'nullable|string|max:255',
            'hireddate' => 'nullable|date',
            'status' => 'required|string|in:active,inactive',
        ]);

        Driver::create($validated);

        return redirect()->route('drivers.index')
            ->with('success', 'Driver created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Driver $driver): Response
    {
        $driver->load(['trucks', 'performances']);

        return Inertia::render('Drivers/Show', [
            'driver' => $driver,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Driver $driver): Response
    {
        return Inertia::render('Drivers/Edit', [
            'driver' => $driver,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Driver $driver)
    {
        $validated = $request->validate([
            'driverid' => 'required|string|max:255|unique:drivers,driverid,' . $driver->id,
            'name' => 'required|string|max:255',
            'sex' => 'required|string|in:male,female',
            'birthdate' => 'nullable|date',
            'zone' => 'nullable|string|max:255',
            'woreda' => 'nullable|string|max:255',
            'kebele' => 'nullable|string|max:255',
            'housenumber' => 'nullable|string|max:255',
            'mobile' => 'nullable|string|max:255',
            'hireddate' => 'nullable|date',
            'status' => 'required|string|in:active,inactive',
        ]);

        $driver->update($validated);

        return redirect()->route('drivers.index')
            ->with('success', 'Driver updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Driver $driver)
    {
        $driver->delete();

        return redirect()->route('drivers.index')
            ->with('success', 'Driver deleted successfully.');
    }

    /**
     * Deactivate the specified driver.
     */
    public function deactivate(Driver $driver)
    {
        $driver->update(['status' => 'inactive']);

        return redirect()->route('drivers.index')
            ->with('success', 'Driver deactivated successfully.');
    }
}

