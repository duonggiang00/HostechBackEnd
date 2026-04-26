<?php

// Function to find PHP files recursively
function getFiles($path) {
    if (!is_dir($path)) return [];
    $files = [];
    $it = new RecursiveDirectoryIterator($path);
    foreach (new RecursiveIteratorIterator($it) as $file) {
        if ($file->getExtension() === 'php') {
            $files[] = $file->getPathname();
        }
    }
    return $files;
}

$policiesPath = 'backend/app/Policies';
$files = getFiles($policiesPath);
$matrix = [];

foreach ($files as $file) {
    $content = file_get_contents($file);
    
    // Check if it implements RbacModuleProvider
    if (strpos($content, 'RbacModuleProvider') === false) continue;

    // Extract Module Name
    $module = 'Unknown';
    if (preg_match('/public static function getModuleName\(\): string\s*{\s*return\s+[\'"](.+?)[\'"]\s*;?\s*}/s', $content, $m)) {
        $module = $m[1];
    }

    // Extract Role Permissions Array
    $permissions = [];
    if (preg_match('/public static function getRolePermissions\(\): array\s*{\s*return\s+\[(.+?)\]\s*;?\s*}/s', $content, $p)) {
        $permissionsStr = $p[1];
        
        // Match key-value pairs 'Role' => 'Permission'
        if (preg_match_all('/[\'"](.+?)[\'"]\s*=>\s*[\'"](.+?)[\'"]/', $permissionsStr, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $permissions[$match[1]] = $match[2];
            }
        }
    }

    if ($module !== 'Unknown') {
        $matrix[$module] = $permissions;
    }
}

ksort($matrix);
echo json_encode($matrix, JSON_PRETTY_PRINT);
