<?php

use App\Services\Identity\IdCardImageRenderService;

/**
 * Tọa độ vẽ chữ lên mẫu CCCD (tỉ lệ 0–1 theo chiều rộng/cao ảnh).
 * Hiệu chỉnh theo file PNG mẫu thực tế (mặt trước / mặt sau).
 *
 * @see IdCardImageRenderService
 */
return [

    'font_path' => env('ID_CARD_FONT_PATH'),

    'font_candidates' => array_values(array_filter([
        env('ID_CARD_FONT_PATH'),
        resource_path('fonts/NotoSans-Regular.ttf'),
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        'C:\\Windows\\Fonts\\arial.ttf',
        'C:\\Windows\\Fonts\\times.ttf',
    ])),

    'rgb' => [25, 25, 25],

    /**
     * Mỗi field: key khớp payload; x/y tỉ lệ; y ~ vị trí baseline từ đỉnh ảnh (ước lượng).
     * clear: [x, y, w, h] tỉ lệ — tô trắng trước khi vẽ.
     */
    'front' => [
        ['key' => 'full_name', 'size' => 22, 'x' => 0.36, 'y' => 0.40, 'clear' => [0.34, 0.36, 0.52, 0.08]],
        ['key' => 'identity_number', 'size' => 20, 'x' => 0.36, 'y' => 0.52, 'clear' => [0.34, 0.49, 0.48, 0.06]],
        ['key' => 'date_of_birth', 'size' => 18, 'x' => 0.36, 'y' => 0.62, 'clear' => [0.34, 0.59, 0.40, 0.06]],
        ['key' => 'gender', 'size' => 18, 'x' => 0.36, 'y' => 0.71, 'clear' => [0.34, 0.68, 0.22, 0.06]],
        ['key' => 'nationality', 'size' => 18, 'x' => 0.36, 'y' => 0.80, 'clear' => [0.34, 0.77, 0.42, 0.06]],
    ],

    'back' => [
        ['key' => 'nationality', 'size' => 16, 'x' => 0.08, 'y' => 0.88, 'clear' => [0.06, 0.84, 0.45, 0.08]],
    ],

    'min_font_size' => 11,

    'max_width_ratio' => 0.55,
];
