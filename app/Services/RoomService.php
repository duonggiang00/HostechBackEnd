<?php

namespace App\Services;

use App\Models\Room;
use Spatie\QueryBuilder\QueryBuilder;

class RoomService
{
    public function paginate(array $allowedFilters = [], int $perPage = 15)
    {
        $query = QueryBuilder::for(Room::class)
            ->allowedFilters($allowedFilters)
            ->defaultSort('code');

        return $query->paginate($perPage)->withQueryString();
    }

    public function find(string $id): ?Room
    {
        return Room::find($id);
    }

    public function create(array $data): Room
    {
        return Room::create($data);
    }

    public function update(string $id, array $data): ?Room
    {
        $room = $this->find($id);
        if ($room) {
            $room->update($data);
        }

        return $room;
    }

    public function delete(string $id): bool
    {
        $room = $this->find($id);
        if ($room) {
            return $room->delete();
        }

        return false;
    }
}

