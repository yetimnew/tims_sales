<?php

namespace App\Http\Controllers;

use App\Models\Status;
use App\Models\StatusType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;

class StatusController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $statuses = Status::with(['statusType'])
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('Statuses/Index', [
            'statuses' => $statuses,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $statusTypes = StatusType::orderBy('name')->get();

        return Inertia::render('Statuses/Create', [
            'statusTypes' => $statusTypes,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'statustype_id' => 'required|exists:statustypes,id',
                'description' => 'nullable|string|max:1000',
            ]);

            $status = Status::create($validated);

            Log::info('Status created', [
                'status_id' => $status->id,
                'name' => $status->name,
                'statustype_id' => $status->statustype_id,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('statuses.index')
                ->with('success', 'Status created successfully.');

        } catch (Exception $e) {
            Log::error('Status creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create status. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Status $status): Response
    {
        $status->load(['statusType']);

        return Inertia::render('Statuses/Show', [
            'status' => $status,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Status $status): Response
    {
        $statusTypes = StatusType::orderBy('name')->get();

        return Inertia::render('Statuses/Edit', [
            'status' => $status,
            'statusTypes' => $statusTypes,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Status $status)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'statustype_id' => 'required|exists:statustypes,id',
                'description' => 'nullable|string|max:1000',
            ]);

            $status->update($validated);

            Log::info('Status updated', [
                'status_id' => $status->id,
                'name' => $status->name,
                'statustype_id' => $status->statustype_id,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('statuses.index')
                ->with('success', 'Status updated successfully.');

        } catch (Exception $e) {
            Log::error('Status update failed', [
                'status_id' => $status->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update status. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Status $status)
    {
        try {
            $statusData = $status->toArray();
            $status->delete();

            Log::info('Status deleted', [
                'status_id' => $status->id,
                'name' => $statusData['name'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('statuses.index')
                ->with('success', 'Status deleted successfully.');

        } catch (Exception $e) {
            Log::error('Status deletion failed', [
                'status_id' => $status->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete status. Please try again.']);
        }
    }
}



