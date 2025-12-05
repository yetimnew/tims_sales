<?php

namespace Tests\Unit\Database\Seeders;

use Database\Seeders\CheckPermissionSeeder;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use ReflectionProperty;

class CheckPermissionSeederTest extends TestCase
{
    public function test_it_builds_dependencies_for_all_modules(): void
    {
        $permissions = [
            'trucks.view',
            'trucks.show',
            'trucks.create',
            'trucks.update',
            'drivers.view',
            'drivers.edit',
            'view telescope',
        ];

        $seeder = new CheckPermissionSeeder;

        $buildDependencies = new ReflectionMethod(CheckPermissionSeeder::class, 'buildPermissionDependencies');
        $buildDependencies->setAccessible(true);
        $buildDependencies->invoke($seeder, $permissions);

        $dependenciesProperty = new ReflectionProperty(CheckPermissionSeeder::class, 'permissionDependencies');
        $dependenciesProperty->setAccessible(true);
        $dependencies = $dependenciesProperty->getValue($seeder);

        $this->assertSame([
            'trucks.view',
            'trucks.show',
        ], $dependencies['trucks.create']);

        $this->assertSame([
            'trucks.view',
            'trucks.show',
        ], $dependencies['trucks.update']);

        $this->assertSame([
            'drivers.view',
        ], $dependencies['drivers.edit']);

        $this->assertArrayNotHasKey('trucks.view', $dependencies);
        $this->assertArrayNotHasKey('view telescope', $dependencies);
    }
}
