<?php

namespace App\Exceptions;

use Exception;

class TruckAssignmentException extends Exception
{
    /**
     * Create a new truck assignment exception.
     */
    public function __construct(string $message = 'Truck assignment failed', int $code = 0, ?Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Report the exception.
     */
    public function report(): bool
    {
        // Log the exception
        \Log::error('Truck Assignment Exception', [
            'message' => $this->getMessage(),
            'code' => $this->getCode(),
            'file' => $this->getFile(),
            'line' => $this->getLine(),
            'trace' => $this->getTraceAsString(),
        ]);

        return true;
    }

    /**
     * Render the exception into an HTTP response.
     */
    public function render($request)
    {
        if ($request->expectsJson()) {
            return response()->json([
                'error' => 'Truck Assignment Error',
                'message' => $this->getMessage(),
            ], 422);
        }

        return back()->withErrors(['truck_assignment' => $this->getMessage()]);
    }
}

