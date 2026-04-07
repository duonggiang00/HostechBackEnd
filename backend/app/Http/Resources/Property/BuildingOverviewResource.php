<?php

namespace App\Http\Resources\Property;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BuildingOverviewResource extends JsonResource
{
    /**
     * @param  array{property: \App\Models\Property\Property, templates: array}  $resource
     */
    public function toArray(Request $request): array
    {
        $property  = $this->resource['property'];
        $templates = $this->resource['templates'] ?? [];

        return [
            'id'   => $property->id,
            'name' => $property->name,
            'code' => $property->code,

            'floors' => $property->floors->sortByDesc('floor_number')->values()->map(function ($floor) {
                return [
                    'id'           => $floor->id,
                    'name'         => $floor->name,
                    'floor_number' => $floor->floor_number,
                    'rooms'        => $floor->rooms->sortBy(fn ($r) => $r->floorPlanNode?->x ?? 999)->values()->map(function ($room, $index) {
                        $node = $room->floorPlanNode;

                        return [
                            'id'         => $room->id,
                            'code'       => $room->code,
                            'name'       => $room->name,
                            'status'     => $room->status,
                            'area'       => $room->area,
                            'base_price' => $room->base_price,
                            'layout'     => $node ? [
                                'column'   => (int) $node->x,      // column_index
                                'row'      => (int) $node->y,      // row_index
                                'col_span' => (int) $node->width,  // columns occupied
                                'row_span' => (int) $node->height, // rows occupied
                            ] : [
                                'column'   => $index,      // Dàn hàng ngang theo vị trí mặc định nếu chưa xắp xếp
                                'row'      => 0,
                                'col_span' => 1,
                                'row_span' => 1,
                            ],
                        ];
                    }),
                ];
            }),

            // Templates có sẵn để dùng trong Edit Mode
            'templates' => collect($templates)->map(fn ($tpl) => [
                'id'         => $tpl['id'],
                'name'       => $tpl['name'],
                'area'       => $tpl['area'],
                'base_price' => $tpl['base_price'],
            ]),
        ];
    }
}
