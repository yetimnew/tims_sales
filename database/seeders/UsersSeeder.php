<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class UsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $datasetPath = database_path('seeders/data/legacy_users.json');

        if (! File::exists($datasetPath)) {
            throw new \RuntimeException('Legacy users dataset missing.');
        }

        $users = collect(json_decode(
            File::get($datasetPath),
            true,
            512,
            JSON_THROW_ON_ERROR
        ));

        if ($users->isEmpty()) {
            $this->command?->warn('Legacy users dataset is empty; skipping UsersSeeder.');

            return;
        }

        Schema::disableForeignKeyConstraints();
        DB::table('users')->truncate();
        Schema::enableForeignKeyConstraints();

        $payload = $users->map(function (array $user): array {
            $legacyId = (int) ($user['legacy_id'] ?? 0);
            $name = Str::of($user['name'] ?? '')->trim()->squish();
            $email = Str::of($user['email'] ?? '')->trim()->lower();

            if ($legacyId === 0 || $name->isEmpty() || $email->isEmpty()) {
                throw new \RuntimeException('Invalid legacy user payload encountered.');
            }

            return [
                'id' => $legacyId,
                'name' => (string) $name,
                'email' => (string) $email,
                'email_verified_at' => $user['email_verified_at'] ?? null,
                'password' => $user['password'] ?? null,
                'remember_token' => $user['remember_token'] ?? null,
                'two_factor_secret' => null,
                'two_factor_recovery_codes' => null,
                'two_factor_confirmed_at' => null,
                'created_at' => $user['created_at'] ?? now(),
                'updated_at' => $user['updated_at'] ?? now(),
            ];
        })->all();

        DB::table('users')->insert($payload);
    }
}
