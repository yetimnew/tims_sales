<?php

namespace Tests\Unit\Validation;

use App\Http\Requests\StoreTruckRequest;
use App\Http\Requests\UpdateTruckRequest;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TruckValidationTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_validates_truck_store_request()
    {
        $vehicleType = VehicleType::factory()->create();

        $validData = [
            'plate' => 'ABC-123',
            'vehicletype_id' => $vehicleType->id,
            'chasisNumber' => 'CH123456',
            'engineNumber' => 'EN789012',
            'tyreSyze' => '12R22.5',
            'serviceIntervalKM' => 10000,
            'purchasePrice' => 500000.50,
            'productionDate' => '2023-01-01',
            'serviceStartDate' => '2023-02-01',
            'status' => 'active',
        ];

        $request = new StoreTruckRequest;
        $validator = Validator::make($validData, $request->rules());

        $this->assertTrue($validator->passes());
    }

    #[Test]
    public function it_requires_plate_field()
    {
        $data = [];

        $request = new StoreTruckRequest;
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('plate', $validator->errors()->toArray());
    }

    #[Test]
    public function it_validates_plate_format()
    {
        $invalidPlates = [
            '', // empty
            'ABC', // too short
            'ABC-12345', // too long
            'ABC123', // missing dash
            'abc-123', // lowercase
            '123-ABC', // wrong order
        ];

        foreach ($invalidPlates as $plate) {
            $data = ['plate' => $plate];
            $request = new StoreTruckRequest;
            $validator = Validator::make($data, $request->rules());

            $this->assertTrue($validator->fails(), "Plate '{$plate}' should fail validation");
        }
    }

    #[Test]
    public function it_validates_plate_uniqueness()
    {
        $vehicleType = VehicleType::factory()->create();

        // Create existing truck
        \App\Models\Truck::factory()->create(['plate' => 'EXIST-123']);

        $data = [
            'plate' => 'EXIST-123', // duplicate
            'vehicletype_id' => $vehicleType->id,
            'status' => 'active',
        ];

        $request = new StoreTruckRequest;
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('plate', $validator->errors()->toArray());
    }

    #[Test]
    public function it_requires_vehicletype_id_field()
    {
        $data = ['plate' => 'ABC-123'];

        $request = new StoreTruckRequest;
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('vehicletype_id', $validator->errors()->toArray());
    }

    #[Test]
    public function it_validates_vehicletype_id_exists()
    {
        $data = [
            'plate' => 'ABC-123',
            'vehicletype_id' => 99999, // non-existent
            'status' => 'active',
        ];

        $request = new StoreTruckRequest;
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('vehicletype_id', $validator->errors()->toArray());
    }

    #[Test]
    public function it_requires_status_field()
    {
        $data = ['plate' => 'ABC-123'];

        $request = new StoreTruckRequest;
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('status', $validator->errors()->toArray());
    }

    #[Test]
    public function it_validates_status_values()
    {
        $vehicleType = VehicleType::factory()->create();

        $invalidStatuses = ['invalid', 'unknown', ''];

        foreach ($invalidStatuses as $status) {
            $data = [
                'plate' => 'ABC-123',
                'vehicletype_id' => $vehicleType->id,
                'status' => $status,
            ];

            $request = new StoreTruckRequest;
            $validator = Validator::make($data, $request->rules());

            $this->assertTrue($validator->fails(), "Status '{$status}' should fail validation");
        }
    }

    #[Test]
    public function it_validates_numeric_fields()
    {
        $vehicleType = VehicleType::factory()->create();

        $invalidNumericData = [
            'serviceIntervalKM' => 'not-a-number',
            'purchasePrice' => 'invalid-price',
        ];

        foreach ($invalidNumericData as $field => $value) {
            $data = [
                'plate' => 'ABC-123',
                'vehicletype_id' => $vehicleType->id,
                'status' => 'active',
                $field => $value,
            ];

            $request = new StoreTruckRequest;
            $validator = Validator::make($data, $request->rules());

            $this->assertTrue($validator->fails(), "Field '{$field}' with value '{$value}' should fail validation");
        }
    }

    #[Test]
    public function it_validates_date_fields()
    {
        $vehicleType = VehicleType::factory()->create();

        $invalidDateData = [
            'productionDate' => 'invalid-date',
            'serviceStartDate' => 'not-a-date',
        ];

        foreach ($invalidDateData as $field => $value) {
            $data = [
                'plate' => 'ABC-123',
                'vehicletype_id' => $vehicleType->id,
                'status' => 'active',
                $field => $value,
            ];

            $request = new StoreTruckRequest;
            $validator = Validator::make($data, $request->rules());

            $this->assertTrue($validator->fails(), "Field '{$field}' with value '{$value}' should fail validation");
        }
    }

    #[Test]
    public function it_validates_service_start_date_after_production_date()
    {
        $vehicleType = VehicleType::factory()->create();

        $data = [
            'plate' => 'ABC-123',
            'vehicletype_id' => $vehicleType->id,
            'status' => 'active',
            'productionDate' => '2023-02-01',
            'serviceStartDate' => '2023-01-01', // before production date
        ];

        $request = new StoreTruckRequest;
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('serviceStartDate', $validator->errors()->toArray());
    }

    #[Test]
    public function it_validates_truck_update_request()
    {
        $truck = \App\Models\Truck::factory()->create();
        $vehicleType = VehicleType::factory()->create();

        $validData = [
            'plate' => 'UPD-123',
            'vehicletype_id' => $vehicleType->id,
            'status' => 'maintenance',
        ];

        $request = new UpdateTruckRequest;
        $validator = Validator::make($validData, $request->rules());

        $this->assertTrue($validator->passes());
    }

    #[Test]
    public function it_allows_plate_update_with_same_value()
    {
        $truck = \App\Models\Truck::factory()->create(['plate' => 'SAME-123']);
        $vehicleType = VehicleType::factory()->create();

        $data = [
            'plate' => 'SAME-123', // same as existing
            'vehicletype_id' => $vehicleType->id,
            'status' => 'active',
        ];

        $request = new UpdateTruckRequest;
        $rules = $request->rules();

        // Update the unique rule to ignore current truck
        $rules['plate'] = str_replace('trucks,plate', "trucks,plate,{$truck->id}", $rules['plate']);

        $validator = Validator::make($data, $rules);

        $this->assertTrue($validator->passes());
    }

    #[Test]
    public function it_validates_optional_fields()
    {
        $vehicleType = VehicleType::factory()->create();

        $minimalData = [
            'plate' => 'MIN-123',
            'vehicletype_id' => $vehicleType->id,
            'status' => 'active',
        ];

        $request = new StoreTruckRequest;
        $validator = Validator::make($minimalData, $request->rules());

        $this->assertTrue($validator->passes());
    }

    #[Test]
    public function it_validates_string_length_limits()
    {
        $vehicleType = VehicleType::factory()->create();

        $invalidLengthData = [
            'chasisNumber' => str_repeat('A', 256), // too long
            'engineNumber' => str_repeat('B', 256), // too long
            'tyreSyze' => str_repeat('C', 256), // too long
        ];

        foreach ($invalidLengthData as $field => $value) {
            $data = [
                'plate' => 'ABC-123',
                'vehicletype_id' => $vehicleType->id,
                'status' => 'active',
                $field => $value,
            ];

            $request = new StoreTruckRequest;
            $validator = Validator::make($data, $request->rules());

            $this->assertTrue($validator->fails(), "Field '{$field}' with long value should fail validation");
        }
    }

    #[Test]
    public function it_validates_positive_numeric_values()
    {
        $vehicleType = VehicleType::factory()->create();

        $negativeData = [
            'serviceIntervalKM' => -1000,
            'purchasePrice' => -50000,
        ];

        foreach ($negativeData as $field => $value) {
            $data = [
                'plate' => 'ABC-123',
                'vehicletype_id' => $vehicleType->id,
                'status' => 'active',
                $field => $value,
            ];

            $request = new StoreTruckRequest;
            $validator = Validator::make($data, $request->rules());

            $this->assertTrue($validator->fails(), "Field '{$field}' with negative value should fail validation");
        }
    }
}
