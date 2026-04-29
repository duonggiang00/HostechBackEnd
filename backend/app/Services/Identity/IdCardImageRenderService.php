<?php

namespace App\Services\Identity;

use Illuminate\Support\Facades\File;
use RuntimeException;

/**
 * Vẽ snapshot nhận dạng lên bản sao PNG mẫu CCCD (GD + TTF UTF-8).
 * Tọa độ: config/cccd_render.php.
 */
class IdCardImageRenderService
{
    public function canRender(): bool
    {
        return extension_loaded('gd')
            && function_exists('imagettftext')
            && $this->resolveFontPath() !== null;
    }

    /**
     * @param  array{full_name: string, identity_number: string, date_of_birth: string, gender: string, nationality: string}  $identity
     * @return array{0: string, 1: string} Đường dẫn file PNG tạm [mặt trước, mặt sau]
     */
    public function renderPair(string $frontTemplatePath, string $backTemplatePath, array $identity): array
    {
        if (! $this->canRender()) {
            throw new RuntimeException(
                'Không render được CCCD: cần PHP extension gd + TTF (đặt ID_CARD_FONT_PATH hoặc đặt font tại resources/fonts/NotoSans-Regular.ttf).'
            );
        }

        if (! is_readable($frontTemplatePath) || ! is_readable($backTemplatePath)) {
            throw new RuntimeException('Không đọc được file mẫu CCCD.');
        }

        $font = $this->resolveFontPath();
        $frontOut = $this->renderSide($frontTemplatePath, $identity, (array) config('cccd_render.front', []), $font);
        $backOut = $this->renderSide($backTemplatePath, $identity, (array) config('cccd_render.back', []), $font);

        return [$frontOut, $backOut];
    }

    public function resolveFontPath(): ?string
    {
        $candidates = (array) config('cccd_render.font_candidates', []);
        foreach ($candidates as $path) {
            if (is_string($path) && $path !== '' && is_readable($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * @param  list<array{key?: string, size?: float|int, x?: float, y?: float, clear?: array{0: float, 1: float, 2: float, 3: float}}>  $fields
     */
    private function renderSide(string $templatePath, array $identity, array $fields, string $fontPath): string
    {
        $src = @imagecreatefrompng($templatePath);
        if ($src === false) {
            throw new RuntimeException('Không mở được PNG: '.$templatePath);
        }

        $w = imagesx($src);
        $h = imagesy($src);
        $img = imagecreatetruecolor($w, $h);
        imagealphablending($img, false);
        imagesavealpha($img, true);
        imagecopy($img, $src, 0, 0, 0, 0, $w, $h);
        imagealphablending($img, true);
        imagedestroy($src);

        $rgb = (array) config('cccd_render.rgb', [25, 25, 25]);
        $textColor = imagecolorallocate($img, (int) $rgb[0], (int) $rgb[1], (int) $rgb[2]);
        $white = imagecolorallocate($img, 255, 255, 255);

        $maxWidthRatio = (float) config('cccd_render.max_width_ratio', 0.55);
        $minFont = (int) config('cccd_render.min_font_size', 11);

        foreach ($fields as $field) {
            $key = $field['key'] ?? '';
            if ($key === '' || ! isset($identity[$key])) {
                continue;
            }
            $text = (string) $identity[$key];
            if ($text === '') {
                continue;
            }

            if (! empty($field['clear']) && is_array($field['clear']) && count($field['clear']) === 4) {
                [$cx, $cy, $cw, $ch] = $field['clear'];
                $x1 = (int) ($w * (float) $cx);
                $y1 = (int) ($h * (float) $cy);
                $x2 = (int) ($w * ((float) $cx + (float) $cw));
                $y2 = (int) ($h * ((float) $cy + (float) $ch));
                imagefilledrectangle($img, $x1, $y1, max($x1 + 1, $x2), max($y1 + 1, $y2), $white);
            }

            $size = (float) ($field['size'] ?? 18);
            $xFrac = (float) ($field['x'] ?? 0);
            $yFrac = (float) ($field['y'] ?? 0);
            $x = (int) ($w * $xFrac);
            $maxW = (int) ($w * $maxWidthRatio);

            while ($size >= $minFont) {
                $bbox = imagettfbbox($size, 0, $fontPath, $text);
                $tw = abs($bbox[2] - $bbox[0]);
                if ($tw <= $maxW || $size <= $minFont) {
                    break;
                }
                $size -= 0.5;
            }

            $bbox = imagettfbbox($size, 0, $fontPath, $text);
            $baselineOffset = abs($bbox[7]);
            $baseline = (int) ($h * $yFrac) + $baselineOffset;

            imagettftext($img, (int) $size, 0, $x, $baseline, $textColor, $fontPath, $text);
        }

        $tmp = tempnam(sys_get_temp_dir(), 'cccd_');
        if ($tmp === false) {
            imagedestroy($img);
            throw new RuntimeException('Không tạo được file tạm.');
        }
        $outPath = $tmp.'.png';
        File::delete($tmp);

        imagepng($img, $outPath);
        imagedestroy($img);

        return $outPath;
    }
}
