<?php

$dir = __DIR__ . '/app';

$fixes = [
    'namespace App\Models\Org\Org;' => 'namespace App\Models\Org;',
    'namespace App\Models\Property\Property;' => 'namespace App\Models\Property;',
    'namespace App\Models\Service\Service;' => 'namespace App\Models\Service;',
    'namespace App\Models\Contract\Contract;' => 'namespace App\Models\Contract;',
];

function scanAllDir($dir) {
    if (!is_dir($dir)) return [];
    $result = [];
    foreach(scandir($dir) as $filename) {
        if ($filename[0] === '.') continue;
        $filePath = $dir . '/' . $filename;
        if (is_dir($filePath)) {
            foreach (scanAllDir($filePath) as $child) {
                $result[] = $child;
            }
        } else {
            if (pathinfo($filePath, PATHINFO_EXTENSION) === 'php') {
                $result[] = $filePath;
            }
        }
    }
    return $result;
}

$files = scanAllDir($dir);

foreach ($files as $file) {
    // Only process models
    if (strpos($file, 'Models') === false) continue;

    $content = file_get_contents($file);
    $changed = false;
    foreach ($fixes as $old => $new) {
        if (strpos($content, $old) !== false) {
            $content = str_replace($old, $new, $content);
            $changed = true;
        }
    }
    if ($changed) {
        file_put_contents($file, $content);
        echo "Fixed namespace in $file\n";
    }
}
echo "Double namespace fixing done.\n";
