<?php

$basePath = __DIR__;

$moves = [
    'database/factories/OrgFactory.php' => 'database/factories/Org/OrgFactory.php',
    'database/factories/UserFactory.php' => 'database/factories/Org/UserFactory.php',
    'database/factories/PropertyFactory.php' => 'database/factories/Property/PropertyFactory.php',
    'database/factories/FloorFactory.php' => 'database/factories/Property/FloorFactory.php',
    'database/factories/RoomFactory.php' => 'database/factories/Property/RoomFactory.php',
    'database/factories/ServiceFactory.php' => 'database/factories/Service/ServiceFactory.php',
    'database/factories/ContractFactory.php' => 'database/factories/Contract/ContractFactory.php',
    'database/factories/ContractMemberFactory.php' => 'database/factories/Contract/ContractMemberFactory.php',
];

$namespaceReplacements = [
    'namespace Database\Factories;' => function($file) {
        if (strpos($file, 'Org/') !== false) return 'namespace Database\Factories\Org;';
        if (strpos($file, 'Property/') !== false) return 'namespace Database\Factories\Property;';
        if (strpos($file, 'Service/') !== false) return 'namespace Database\Factories\Service;';
        if (strpos($file, 'Contract/') !== false) return 'namespace Database\Factories\Contract;';
        return 'namespace Database\Factories;';
    }
];

foreach ($moves as $old => $new) {
    $fullOld = $basePath . '/' . $old;
    $fullNew = $basePath . '/' . $new;

    if (file_exists($fullOld)) {
        // Create dir if not exists
        $dir = dirname($fullNew);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        // Move file
        rename($fullOld, $fullNew);
        echo "Moved $old to $new\n";

        // Update namespace
        $content = file_get_contents($fullNew);
        
        foreach ($namespaceReplacements as $search => $replace) {
            if (is_callable($replace)) {
                $content = str_replace($search, $replace($new), $content);
            } else {
                $content = str_replace($search, $replace, $content);
            }
        }
        
        file_put_contents($fullNew, $content);
    } else {
        echo "File $old not found\n";
    }
}
echo "Factories updated.\n";
