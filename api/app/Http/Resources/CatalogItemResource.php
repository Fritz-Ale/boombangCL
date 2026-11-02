<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use App\Http\Resources\Traits\DtoResourceTrait;
use Illuminate\Http\Resources\Json\JsonResource;

class CatalogItemResource extends JsonResource
{
    use DtoResourceTrait;

    private static $data;

    public function __construct($resource)
    {
        parent::__construct($resource);
        self::$data = $resource;
    }

    public function toArray(Request $request): array
    {
        $return = [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'name' => $this->name,
            'sprite_name' => $this->sprite_name,
            'image' => $this->image,
            'image_url' => !empty($this->image) ? urlDocker($this->image) : null,
            'spreadsheet' => $this->spreadsheet,
            'spreadsheet_url' => !empty($this->spreadsheet) ? urlDocker($this->spreadsheet) : null,
            'atlas' => $this->atlas,
            'atlas_url' => !empty($this->atlas) ? urlDocker($this->atlas) : null,
            'width' => $this->width,
            'height' => $this->height,
            'description' => $this->description,
            'price' => $this->price,
            'price_type' => $this->price_type,
            'discount' => $this->discount,
            'stripe_price_usd' => $this->stripe_price_usd,
            'reward_type' => $this->reward_type,
            'reward_golden_coins' => $this->reward_golden_coins,
            'reward_silver_coins' => $this->reward_silver_coins,
            'stars' => $this->stars,
            'rarity_code' => $this->rarity_code,
            'rarity_label' => \App\Support\CatalogRarity::label($this->rarity_code),
            'is_reference_only' => (bool) $this->is_reference_only,
            'reference_copy_count' => $this->reference_copy_count,
            'type_of_behavior' => $this->type_of_behavior,
            'scale' => $this->scale,
            'min_purchase_quantity' => $this->min_purchase_quantity,
            'max_purchase_quantity' => $this->max_purchase_quantity,
            'is_multi_buy' => (bool) $this->is_multi_buy,
        ];

        if (debug_backtrace()[1]['function'] == "toDTO") {
            if ($this->relationLoaded('category')) {
                $return['category'] = new CatalogCategoryResource($this->whenLoaded('category'));
            }
        } else {
            $return['category'] = new CatalogCategoryResource($this->whenLoaded('category'));
        }

        return $return;
    }
}
