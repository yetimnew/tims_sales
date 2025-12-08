<?php

namespace Tests\Feature\FileUpload;

use App\Models\Driver;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class FileUploadTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Create user with permissions
        $this->user = User::factory()->create();

        // Create permissions
        $permissions = [
            'trucks.view', 'trucks.create', 'trucks.edit', 'trucks.destroy',
            'trucks.show', 'trucks.store', 'trucks.update',
            'drivers.view', 'drivers.create', 'drivers.edit', 'drivers.destroy',
            'drivers.show', 'drivers.store', 'drivers.update', 'drivers.export',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create role and assign permissions
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $role->givePermissionTo($permissions);
        $this->user->assignRole($role);

        // Fake storage
        Storage::fake('public');
    }

    #[Test]
    public function user_can_upload_profile_picture()
    {
        $file = UploadedFile::fake()->image('profile.jpg', 200, 200);

        $response = $this->actingAs($this->user)
            ->post('/user/profile-picture', [
                'profile_picture' => $file,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Storage::disk('public')->assertExists('profile-pictures/'.$file->hashName());
    }

    #[Test]
    public function user_can_upload_document()
    {
        $file = UploadedFile::fake()->create('document.pdf', 1000);

        $response = $this->actingAs($this->user)
            ->post('/user/documents', [
                'document' => $file,
                'name' => 'Test Document',
                'type' => 'contract',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Storage::disk('public')->assertExists('documents/'.$file->hashName());
    }

    #[Test]
    public function truck_can_have_documents_uploaded()
    {
        $truck = Truck::factory()->create();
        $file = UploadedFile::fake()->create('truck-document.pdf', 1000);

        $response = $this->actingAs($this->user)
            ->post('/trucks/'.$truck->id.'/documents', [
                'document' => $file,
                'name' => 'Truck Registration',
                'type' => 'registration',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Storage::disk('public')->assertExists('truck-documents/'.$file->hashName());
    }

    #[Test]
    public function driver_can_have_documents_uploaded()
    {
        $driver = Driver::factory()->create();
        $file = UploadedFile::fake()->create('driver-license.pdf', 1000);

        $response = $this->actingAs($this->user)
            ->post('/drivers/'.$driver->id.'/documents', [
                'document' => $file,
                'name' => 'Driver License',
                'type' => 'license',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Storage::disk('public')->assertExists('driver-documents/'.$file->hashName());
    }

    #[Test]
    public function maintenance_record_can_have_images_uploaded()
    {
        $maintenance = \App\Models\VehicleMaintenanceRecord::factory()->create();
        $file = UploadedFile::fake()->image('maintenance.jpg', 800, 600);

        $response = $this->actingAs($this->user)
            ->post('/maintenance/'.$maintenance->id.'/images', [
                'image' => $file,
                'description' => 'Before maintenance',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Storage::disk('public')->assertExists('maintenance-images/'.$file->hashName());
    }

    #[Test]
    public function fuel_record_can_have_receipt_uploaded()
    {
        $fuel = \App\Models\FuelRecord::factory()->create();
        $file = UploadedFile::fake()->image('receipt.jpg', 800, 600);

        $response = $this->actingAs($this->user)
            ->post('/fuel/'.$fuel->id.'/receipt', [
                'receipt' => $file,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Storage::disk('public')->assertExists('fuel-receipts/'.$file->hashName());
    }

    #[Test]
    public function file_upload_validates_file_type()
    {
        $file = UploadedFile::fake()->create('malicious.exe', 1000);

        $response = $this->actingAs($this->user)
            ->post('/user/documents', [
                'document' => $file,
                'name' => 'Test Document',
                'type' => 'contract',
            ]);

        $response->assertSessionHasErrors(['document']);
    }

    #[Test]
    public function file_upload_validates_file_size()
    {
        $file = UploadedFile::fake()->create('large-file.pdf', 10000); // 10MB

        $response = $this->actingAs($this->user)
            ->post('/user/documents', [
                'document' => $file,
                'name' => 'Test Document',
                'type' => 'contract',
            ]);

        $response->assertSessionHasErrors(['document']);
    }

    #[Test]
    public function file_upload_validates_image_dimensions()
    {
        $file = UploadedFile::fake()->image('profile.jpg', 100, 100); // Too small

        $response = $this->actingAs($this->user)
            ->post('/user/profile-picture', [
                'profile_picture' => $file,
            ]);

        $response->assertSessionHasErrors(['profile_picture']);
    }

    #[Test]
    public function file_upload_generates_unique_filename()
    {
        $file1 = UploadedFile::fake()->create('document.pdf', 1000);
        $file2 = UploadedFile::fake()->create('document.pdf', 1000);

        $response1 = $this->actingAs($this->user)
            ->post('/user/documents', [
                'document' => $file1,
                'name' => 'Test Document 1',
                'type' => 'contract',
            ]);

        $response2 = $this->actingAs($this->user)
            ->post('/user/documents', [
                'document' => $file2,
                'name' => 'Test Document 2',
                'type' => 'contract',
            ]);

        $response1->assertRedirect();
        $response2->assertRedirect();

        $files = Storage::disk('public')->files('documents');
        $this->assertCount(2, $files);
        $this->assertNotEquals($files[0], $files[1]);
    }

    #[Test]
    public function file_upload_creates_database_record()
    {
        $file = UploadedFile::fake()->create('document.pdf', 1000);

        $response = $this->actingAs($this->user)
            ->post('/user/documents', [
                'document' => $file,
                'name' => 'Test Document',
                'type' => 'contract',
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('file_uploads', [
            'user_id' => $this->user->id,
            'name' => 'Test Document',
            'type' => 'contract',
            'filename' => $file->hashName(),
        ]);
    }

    #[Test]
    public function file_can_be_downloaded()
    {
        $file = UploadedFile::fake()->create('document.pdf', 1000);
        $filename = $file->hashName();

        $response = $this->actingAs($this->user)
            ->post('/user/documents', [
                'document' => $file,
                'name' => 'Test Document',
                'type' => 'contract',
            ]);

        $response->assertRedirect();

        $response = $this->actingAs($this->user)
            ->get('/user/documents/'.$filename.'/download');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    #[Test]
    public function file_can_be_deleted()
    {
        $file = UploadedFile::fake()->create('document.pdf', 1000);

        $response = $this->actingAs($this->user)
            ->post('/user/documents', [
                'document' => $file,
                'name' => 'Test Document',
                'type' => 'contract',
            ]);

        $response->assertRedirect();

        $upload = \App\Models\FileUpload::where('user_id', $this->user->id)->first();

        $response = $this->actingAs($this->user)
            ->delete('/user/documents/'.$upload->id);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('file_uploads', [
            'id' => $upload->id,
        ]);

        Storage::disk('public')->assertMissing('documents/'.$file->hashName());
    }

    #[Test]
    public function file_upload_requires_authentication()
    {
        $file = UploadedFile::fake()->create('document.pdf', 1000);

        $response = $this->post('/user/documents', [
            'document' => $file,
            'name' => 'Test Document',
            'type' => 'contract',
        ]);

        $response->assertRedirect('/login');
    }

    #[Test]
    public function file_upload_requires_permission()
    {
        $userWithoutPermission = User::factory()->create();
        $file = UploadedFile::fake()->create('document.pdf', 1000);

        $response = $this->actingAs($userWithoutPermission)
            ->post('/user/documents', [
                'document' => $file,
                'name' => 'Test Document',
                'type' => 'contract',
            ]);

        $response->assertStatus(403);
    }

    #[Test]
    public function file_upload_handles_virus_scanning()
    {
        $file = UploadedFile::fake()->create('document.pdf', 1000);

        $response = $this->actingAs($this->user)
            ->post('/user/documents', [
                'document' => $file,
                'name' => 'Test Document',
                'type' => 'contract',
                'scan_for_viruses' => true,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function file_upload_handles_compression()
    {
        $file = UploadedFile::fake()->image('large-image.jpg', 2000, 2000);

        $response = $this->actingAs($this->user)
            ->post('/user/images', [
                'image' => $file,
                'compress' => true,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function file_upload_handles_watermarking()
    {
        $file = UploadedFile::fake()->image('image.jpg', 800, 600);

        $response = $this->actingAs($this->user)
            ->post('/user/images', [
                'image' => $file,
                'add_watermark' => true,
                'watermark_text' => 'Confidential',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function file_upload_handles_metadata_extraction()
    {
        $file = UploadedFile::fake()->image('image.jpg', 800, 600);

        $response = $this->actingAs($this->user)
            ->post('/user/images', [
                'image' => $file,
                'extract_metadata' => true,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function file_upload_handles_batch_upload()
    {
        $files = [
            UploadedFile::fake()->create('document1.pdf', 1000),
            UploadedFile::fake()->create('document2.pdf', 1000),
            UploadedFile::fake()->create('document3.pdf', 1000),
        ];

        $response = $this->actingAs($this->user)
            ->post('/user/documents/batch', [
                'documents' => $files,
                'name' => 'Batch Documents',
                'type' => 'contract',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseCount('file_uploads', 3);
    }

    #[Test]
    public function file_upload_handles_zip_extraction()
    {
        $file = UploadedFile::fake()->create('documents.zip', 1000);

        $response = $this->actingAs($this->user)
            ->post('/user/documents/extract', [
                'zip_file' => $file,
                'name' => 'Extracted Documents',
                'type' => 'contract',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function file_upload_handles_conversion()
    {
        $file = UploadedFile::fake()->create('document.doc', 1000);

        $response = $this->actingAs($this->user)
            ->post('/user/documents/convert', [
                'document' => $file,
                'target_format' => 'pdf',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function file_upload_handles_ocr()
    {
        $file = UploadedFile::fake()->image('scanned-document.jpg', 800, 600);

        $response = $this->actingAs($this->user)
            ->post('/user/documents/ocr', [
                'image' => $file,
                'extract_text' => true,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function file_upload_handles_thumbnail_generation()
    {
        $file = UploadedFile::fake()->image('image.jpg', 800, 600);

        $response = $this->actingAs($this->user)
            ->post('/user/images', [
                'image' => $file,
                'generate_thumbnail' => true,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Storage::disk('public')->assertExists('thumbnails/'.$file->hashName());
    }

    #[Test]
    public function file_upload_handles_preview_generation()
    {
        $file = UploadedFile::fake()->create('document.pdf', 1000);

        $response = $this->actingAs($this->user)
            ->post('/user/documents', [
                'document' => $file,
                'name' => 'Test Document',
                'type' => 'contract',
                'generate_preview' => true,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Storage::disk('public')->assertExists('previews/'.$file->hashName().'.jpg');
    }

    #[Test]
    public function file_upload_handles_versioning()
    {
        $file1 = UploadedFile::fake()->create('document.pdf', 1000);
        $file2 = UploadedFile::fake()->create('document.pdf', 1000);

        $response1 = $this->actingAs($this->user)
            ->post('/user/documents', [
                'document' => $file1,
                'name' => 'Test Document',
                'type' => 'contract',
            ]);

        $response2 = $this->actingAs($this->user)
            ->post('/user/documents', [
                'document' => $file2,
                'name' => 'Test Document',
                'type' => 'contract',
                'version' => 2,
            ]);

        $response1->assertRedirect();
        $response2->assertRedirect();

        $this->assertDatabaseCount('file_uploads', 2);
        $this->assertDatabaseHas('file_uploads', [
            'name' => 'Test Document',
            'version' => 1,
        ]);
        $this->assertDatabaseHas('file_uploads', [
            'name' => 'Test Document',
            'version' => 2,
        ]);
    }

    #[Test]
    public function file_upload_handles_sharing()
    {
        $file = UploadedFile::fake()->create('document.pdf', 1000);

        $response = $this->actingAs($this->user)
            ->post('/user/documents', [
                'document' => $file,
                'name' => 'Test Document',
                'type' => 'contract',
                'shareable' => true,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $upload = \App\Models\FileUpload::where('user_id', $this->user->id)->first();

        $response = $this->actingAs($this->user)
            ->post('/user/documents/'.$upload->id.'/share', [
                'email' => 'test@example.com',
                'expires_at' => now()->addDays(7),
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function file_upload_handles_permissions()
    {
        $file = UploadedFile::fake()->create('document.pdf', 1000);

        $response = $this->actingAs($this->user)
            ->post('/user/documents', [
                'document' => $file,
                'name' => 'Test Document',
                'type' => 'contract',
                'permissions' => [
                    'view' => ['admin', 'manager'],
                    'edit' => ['admin'],
                    'delete' => ['admin'],
                ],
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function file_upload_handles_encryption()
    {
        $file = UploadedFile::fake()->create('document.pdf', 1000);

        $response = $this->actingAs($this->user)
            ->post('/user/documents', [
                'document' => $file,
                'name' => 'Test Document',
                'type' => 'contract',
                'encrypt' => true,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function file_upload_handles_backup()
    {
        $file = UploadedFile::fake()->create('document.pdf', 1000);

        $response = $this->actingAs($this->user)
            ->post('/user/documents', [
                'document' => $file,
                'name' => 'Test Document',
                'type' => 'contract',
                'backup' => true,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    #[Test]
    public function file_upload_handles_cleanup()
    {
        $file = UploadedFile::fake()->create('document.pdf', 1000);

        $response = $this->actingAs($this->user)
            ->post('/user/documents', [
                'document' => $file,
                'name' => 'Test Document',
                'type' => 'contract',
                'auto_cleanup' => true,
                'cleanup_after_days' => 30,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }
}
