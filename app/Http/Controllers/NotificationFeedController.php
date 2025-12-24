<?php

namespace App\Http\Controllers;

use App\Support\NotificationFeedBuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationFeedController extends Controller
{
    public function __construct(private readonly NotificationFeedBuilder $builder) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user === null) {
            return response()->json([
                'unread_count' => 0,
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'per_page' => 0,
                    'total' => 0,
                    'last_page' => 1,
                    'has_more' => false,
                    'next_page' => null,
                    'previous_page' => null,
                ],
            ]);
        }

        $perPage = $request->integer('per_page', 12);
        $page = $request->integer('page', 1);

        $feed = $this->builder->paginate($user, $perPage, $page);

        return response()->json($feed);
    }
}
