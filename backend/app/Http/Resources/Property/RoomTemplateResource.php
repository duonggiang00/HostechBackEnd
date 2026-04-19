<?php

namespace App\Http\Resources\Property;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoomTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'property_id' => $this->property_id,
            'name'        => $this->name,
            'area'        => (float) $this->area,
            'capacity'    => $this->capacity,
            'base_price'  => $this->base_price,
            'description' => $this->description,
            'services'    => $this->whenLoaded('services'),
            'assets'      => $this->whenLoaded('assets'),
            'images'      => $this->getMedia('gallery')->map(fn ($m) => [
                'uuid'      => $m->uuid,
                'url'       => $m->getUrl(),
                'thumb_url' => $m->hasGeneratedConversion('thumb') ? $m->getUrl('thumb') : $m->getUrl(),
                'name'      => $m->name,
            ])->values(),
            'cover_url'   => $this->getFirstMediaUrl('cover') ?: null,
            'created_at'  => $this->created_at,
            'updated_at'  => $this->updated_at,
        ];
    }
}
