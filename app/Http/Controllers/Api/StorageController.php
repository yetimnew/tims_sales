<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class StorageController extends Controller
{
    /**
     * Serve storage files with proper CORS headers
     */
    public function serve(Request $request, string $path): Response
    {
        // Handle OPTIONS preflight request
        if ($request->isMethod('OPTIONS')) {
            return response('', 204)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                ->header('Access-Control-Max-Age', '86400');
        }

        // Security: Only allow certain directories
        $allowedPaths = ['profile-pictures'];
        $pathParts = explode('/', $path);

        if (empty($pathParts) || !in_array($pathParts[0], $allowedPaths)) {
            abort(403, 'Access denied');
        }

        // Check if file exists
        if (!Storage::disk('public')->exists($path)) {
            abort(404, 'File not found');
        }

        // Get file
        $file = Storage::disk('public')->get($path);
        $mimeType = Storage::disk('public')->mimeType($path) ?? 'image/jpeg';

        // Return file with CORS headers
        return response($file, 200)
            ->header('Content-Type', $mimeType)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            ->header('Access-Control-Expose-Headers', 'Content-Type, Content-Length')
            ->header('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    }
}

