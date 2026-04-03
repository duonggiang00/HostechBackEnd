<?php

namespace App\Http\Controllers\Api\Property;

use App\Http\Controllers\Controller;
use App\Models\Property\PriceHistory;
use App\Models\Property\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PriceHistoryController extends Controller
{
    public function index(Room $room): JsonResponse
    {
        return response()->json([
            'data' => $room->priceHistories,
        ]);
    }

    public function store(Request $request, Room $room): JsonResponse
    {
        $validated = $request->validate([
            'price' => 'required|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        // Close the previous price history if needed (optional logic)

        $priceHistory = $room->priceHistories()->create($validated);

        return response()->json([
            'message' => 'Price history updated successfully',
            'data' => $priceHistory,
        ], 201);
    }

    public function destroy(Room $room, PriceHistory $history): JsonResponse
    {
        if ($history->room_id !== $room->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $history->delete();

        return response()->json(['message' => 'Price record deleted successfully']);
    }
}
