<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=hostech_test', 'root', '');
    echo "CONNECTED TO MYSQL!\n";
} catch (\Exception $e) {
    echo "FAILED: " . $e->getMessage() . "\n";
}
try {
    $pdo = new PDO('sqlite::memory:');
    echo "CONNECTED TO SQLITE!\n";
} catch (\Exception $e) {
    echo "FAILED SQLITE: " . $e->getMessage() . "\n";
}
