<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\\Contracts\\Console\\Kernel')->bootstrap();

use App\Models\VehicleType;

echo "Current vehicle types count: " . VehicleType::count() . "\n";

if (VehicleType::count() < 20) {
    echo "Adding more vehicle types to test pagination...\n";

    $vehicleTypes = [
        ['name' => 'Small Truck', 'description' => 'Light duty trucks for urban delivery'],
        ['name' => 'Medium Truck', 'description' => 'Medium duty trucks for regional transport'],
        ['name' => 'Heavy Truck', 'description' => 'Heavy duty trucks for long distance hauling'],
        ['name' => 'Flatbed Truck', 'description' => 'Open bed trucks for construction materials'],
        ['name' => 'Refrigerated Truck', 'description' => 'Temperature controlled trucks for perishables'],
        ['name' => 'Tanker Truck', 'description' => 'Liquid transport trucks'],
        ['name' => 'Crane Truck', 'description' => 'Trucks with lifting equipment'],
        ['name' => 'Dump Truck', 'description' => 'Trucks for bulk material transport'],
        ['name' => 'Box Truck', 'description' => 'Enclosed cargo trucks'],
        ['name' => 'Pickup Truck', 'description' => 'Small utility trucks'],
        ['name' => 'Van', 'description' => 'Small delivery vehicles'],
        ['name' => 'Bus', 'description' => 'Passenger transport vehicles'],
        ['name' => 'Trailer', 'description' => 'Non-motorized transport units'],
        ['name' => 'Container Truck', 'description' => 'Trucks for shipping containers'],
        ['name' => 'Logistics Truck', 'description' => 'Multi-purpose logistics vehicles'],
    ];

    foreach ($vehicleTypes as $vtData) {
        VehicleType::create($vtData);
        echo "Created vehicle type: {$vtData['name']}\n";
    }

    echo "\nNew vehicle types count: " . VehicleType::count() . "\n";
} else {
    echo "Already have enough vehicle types for testing.\n";
}

echo "\nAll vehicle types:\n";
$allTypes = VehicleType::all();
foreach ($allTypes as $type) {
    echo "- {$type->name}: {$type->description}\n";
}
?>
