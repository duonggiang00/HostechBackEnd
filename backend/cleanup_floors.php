<?php
$properties = App\Models\Property\Property::all();
foreach ($properties as $p) {
    $floors = App\Models\Property\Floor::where('property_id', $p->id)->orderBy('created_at', 'desc')->get();
    $seen = [];
    foreach ($floors as $f) {
        if (in_array($f->floor_number, $seen)) {
            // Re-map any rooms to the original before deleting? The seeder created multiple floors and put zero rooms in most of them.
            // Just force delete to clean up UI for user testing.
            $f->forceDelete();
            echo "Deleted duplicate floor {$f->name} in Property {$p->name}\n";
        } else {
            $seen[] = $f->floor_number;
        }
    }
}
echo "Cleanup done.\n";
