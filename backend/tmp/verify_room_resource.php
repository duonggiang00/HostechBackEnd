<?php
use App\Http\Resources\Property\RoomResource;
use App\Features\Property\Models\Room;

$room = Room::with(["roomServices.service.currentRate"])->has("roomServices")->first();
if ($room) {
    echo json_encode((new RoomResource($room))->toArray(request()), JSON_PRETTY_PRINT);
} else {
    echo "No room with services found";
}
