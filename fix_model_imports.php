<?php

$dir = __DIR__ . '/app/Models';

$modelNamespaces = [
    'Org' => 'App\Models\Org\Org',
    'User' => 'App\Models\Org\User',
    'Property' => 'App\Models\Property\Property',
    'Floor' => 'App\Models\Property\Floor',
    'Room' => 'App\Models\Property\Room',
    'RoomPhoto' => 'App\Models\Property\RoomPhoto',
    'RoomAsset' => 'App\Models\Property\RoomAsset',
    'RoomPrice' => 'App\Models\Property\RoomPrice',
    'Service' => 'App\Models\Service\Service',
    'ServiceRate' => 'App\Models\Service\ServiceRate',
    'TieredRate' => 'App\Models\Service\TieredRate',
    'RoomService' => 'App\Models\Service\RoomService',
    'Contract' => 'App\Models\Contract\Contract',
    'ContractMember' => 'App\Models\Contract\ContractMember',
    'AuditLog' => 'App\Models\System\AuditLog',
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
    $content = file_get_contents($file);
    $changed = false;

    // What namespace is this file in?
    preg_match('/namespace (App\\\\Models\\\\[^;]+);/', $content, $matches);
    $currentNamespace = $matches[1] ?? 'App\Models';

    $lines = explode("\n", $content);
    $useEndLine = false;
    for ($i = 0; $i < count($lines); $i++) {
        if (strpos($lines[$i], 'use ') === 0 && strpos($lines[$i], 'namespace') === false) {
            $useEndLine = $i;
        }
        if (strpos($lines[$i], 'class ') === 0) {
            if ($useEndLine === false) {
                $useEndLine = $i - 1; 
            }
            break;
        }
    }

    $addedImports = [];

    foreach ($modelNamespaces as $model => $fqcn) {
        $modelNamespace = dirname(str_replace('\\', '/', $fqcn));
        $modelNamespaceStr = str_replace('/', '\\', $modelNamespace);
        
        // Skip if same namespace
        if ($modelNamespaceStr === $currentNamespace) continue;

        // Skip if already imported
        if (strpos($content, "use $fqcn;") !== false) continue;

        // Does the file use $model::class or just $model natively?
        // simple regex: word boundary + Model + ::class or PHPDoc? Actually, if there's "$model::class"
        if (preg_match("/\\b$model::class\\b/", $content)) {
            $addedImports[] = "use $fqcn;";
        }
    }

    if (!empty($addedImports)) {
        // Insert after $useEndLine
        array_splice($lines, $useEndLine + 1, 0, $addedImports);
        $content = implode("\n", $lines);
        file_put_contents($file, $content);
        $changed = true;
        echo "Added imports to " . basename($file) . "\n";
    }
}
echo "Model imports fixed.\n";
