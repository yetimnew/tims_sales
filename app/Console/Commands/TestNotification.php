<?php

namespace App\Console\Commands;

use App\Models\NotificationType;
use App\Models\User;
use App\Notifications\TruckLifecycleNotification;
use Illuminate\Console\Command;

class TestNotification extends Command
{
    protected $signature = 'notifications:test {--user= : User ID to send test notification to}';

    protected $description = 'Send a test notification to verify the system is working';

    public function handle(): int
    {
        $this->info('🔔 Testing TIMS Notification System...');
        $this->newLine();

        // Get user
        $userId = $this->option('user');
        $user = $userId ? User::find($userId) : User::first();

        if (!$user) {
            $this->error('❌ No users found in database. Create a user first.');
            return self::FAILURE;
        }

        $this->info("📨 Sending test notification to: {$user->name} (ID: {$user->id})");

        // Get or create notification type
        $type = NotificationType::where('key', 'trucks.created')->first();
        
        if (!$type) {
            $this->warn('⚠️  Notification type not found. Run: php artisan db:seed --class=NotificationTypeSeeder');
            $this->info('Creating temporary notification type...');
            
            $type = NotificationType::create([
                'key' => 'trucks.created',
                'name' => 'Truck Created',
                'description' => 'Notification when a truck is created',
                'category' => 'trucks',
            ]);
        }

        // Send test notification
        try {
            $user->notify(
                new TruckLifecycleNotification(
                    $type,
                    '✅ Test Notification',
                    'Your TIMS notification system is working perfectly! This test was sent at ' . now()->format('Y-m-d H:i:s'),
                    [
                        'test' => true,
                        'truck_id' => 9999,
                        'plate' => 'TEST-123',
                        'actor' => [
                            'name' => 'System Test',
                            'id' => null,
                        ],
                    ]
                )
            );

            $this->newLine();
            $this->info('✅ SUCCESS! Test notification sent to database.');
            $this->newLine();
            $this->info('📍 Next steps:');
            $this->line('  1. Open your browser and login');
            $this->line('  2. Check the notification bell (top right)');
            $this->line('  3. You should see the test notification within 30 seconds');
            $this->newLine();
            $this->info('💡 The notification appears via polling (every 30s by default)');
            $this->info('💡 No WebSockets needed - works on ANY shared hosting!');
            $this->newLine();

            // Show database confirmation
            $notificationCount = $user->notifications()->count();
            $unreadCount = $user->unreadNotifications()->count();
            
            $this->info("📊 User has {$notificationCount} total notifications ({$unreadCount} unread)");
            
            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Failed to send notification: ' . $e->getMessage());
            $this->error('Stack trace: ' . $e->getTraceAsString());
            return self::FAILURE;
        }
    }
}
