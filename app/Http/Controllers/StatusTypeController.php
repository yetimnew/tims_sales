<?php

namespace App\Http\Controllers;

use App\Models\StatusType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;

class StatusTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $statusTypes = StatusType::withCount('statuses')
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('StatusTypes/Index', [
            'statusTypes' => $statusTypes,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('StatusTypes/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:statustypes',
                'description' => 'nullable|string|max:1000',
            ]);

            $statusType = StatusType::create($validated);

            Log::info('Status type created', [
                'status_type_id' => $statusType->id,
                'name' => $statusType->name,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('statustypes.index')
                ->with('success', 'Status type created successfully.');

        } catch (Exception $e) {
            Log::error('Status type creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create status type. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(StatusType $statusType): Response
    {
        $statusType->load(['statuses']);

        return Inertia::render('StatusTypes/Show', [
            'statusType' => $statusType,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(StatusType $statusType): Response
    {
        return Inertia::render('StatusTypes/Edit', [
            'statusType' => $statusType,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, StatusType $statusType)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:statustypes,name,' . $statusType->id,
                'description' => 'nullable|string|max:1000',
            ]);

            $statusType->update($validated);

            Log::info('Status type updated', [
                'status_type_id' => $statusType->id,
                'name' => $statusType->name,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('statustypes.index')
                ->with('success', 'Status type updated successfully.');

        } catch (Exception $e) {
            Log::error('Status type update failed', [
                'status_type_id' => $statusType->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update status type. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(StatusType $statusType)
    {
        try {
            // Check if status type is being used by statuses
            if ($statusType->statuses()->count() > 0) {
                return back()->withErrors(['error' => 'Cannot delete status type that has statuses.']);
            }

            $statusTypeData = $statusType->toArray();
            $statusType->delete();

            Log::info('Status type deleted', [
                'status_type_id' => $statusType->id,
                'name' => $statusTypeData['name'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('statustypes.index')
                ->with('success', 'Status type deleted successfully.');

        } catch (Exception $e) {
            Log::error('Status type deletion failed', [
                'status_type_id' => $statusType->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete status type. Please try again.']);
        }
    }
}



