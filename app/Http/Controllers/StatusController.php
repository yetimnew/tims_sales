<?php

namespace App\Http\Controllers;

use App\Models\Status;
use App\Models\StatusType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Exception;

class StatusController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): RedirectResponse
    {
        // Redirect the Status index to the Daily Truck Status Board
        return redirect()->route('truck-status-board.index');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): RedirectResponse
    {
        return redirect()->route('truck-status-board.index');
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

            return redirect()->route('truck-status-board.index')
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
    public function show(Status $status): RedirectResponse
    {
        return redirect()->route('truck-status-board.index');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Status $status): RedirectResponse
    {
        return redirect()->route('truck-status-board.index');
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

            return redirect()->route('truck-status-board.index')
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

            return redirect()->route('truck-status-board.index')
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

    /**
     * Show trucks in this status for a given date.
     */
    public function daily(Request $request, Status $status): Response
    {
        $date = $request->input('date', now()->format('Y-m-d'));

        $trucks = \App\Models\DailyTruckStatus::with(['truck' => function ($q) {
                $q->select('id', 'plate');
            }])
            ->where('status_id', $status->id)
            ->where('status_date', $date)
            ->orderByDesc('created_at')
            ->paginate(24)
            ->withQueryString();

        return Inertia::render('Statuses/Daily', [
            'status' => $status,
            'date' => $date,
            'trucks' => $trucks,
        ]);
    }
}



