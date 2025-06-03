<?php
require __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';

// Boot the application
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

try {
    echo "=== Checking push_subscriptions table ===\n";
    
    // Check if table exists
    if (!Schema::hasTable('push_subscriptions')) {
        echo "❌ Table 'push_subscriptions' does not exist!\n";
        echo "Run: php artisan migrate\n";
        exit(1);
    }
    
    echo "✅ Table exists\n";
    
    // Check table structure
    echo "\n=== Table Structure ===\n";
    $columns = DB::select("DESCRIBE push_subscriptions");
    foreach ($columns as $column) {
        echo "- {$column->Field}: {$column->Type} " . 
             ($column->Null === 'YES' ? '(nullable)' : '(required)') . 
             ($column->Key === 'PRI' ? ' PRIMARY KEY' : '') . 
             ($column->Extra ? " {$column->Extra}" : '') . "\n";
    }
    
    // Check current data
    echo "\n=== Current Data ===\n";
    $count = DB::table('push_subscriptions')->count();
    echo "Total records: $count\n";
    
    if ($count > 0) {
        $records = DB::table('push_subscriptions')->select('id', 'endpoint', 'content_encoding', 'created_at')->get();
        foreach ($records as $record) {
            echo "ID: {$record->id}, Type: {$record->content_encoding}, Endpoint: " . 
                 substr($record->endpoint, 0, 50) . "..., Created: {$record->created_at}\n";
        }
    } else {
        echo "No records found\n";
    }
    
    // Check table status
    echo "\n=== Table Status ===\n";
    $status = DB::select("SHOW TABLE STATUS LIKE 'push_subscriptions'");
    if (!empty($status)) {
        $table = $status[0];
        echo "Engine: {$table->Engine}\n";
        echo "Auto_increment: {$table->Auto_increment}\n";
        echo "Data_length: {$table->Data_length} bytes\n";
        echo "Index_length: {$table->Index_length} bytes\n";
    }
    
    // Check if auto-increment is corrupted
    $maxId = DB::table('push_subscriptions')->max('id') ?? 0;
    $autoIncrement = $status[0]->Auto_increment ?? 1;
    
    echo "\n=== Auto-increment Analysis ===\n";
    echo "Max ID in table: $maxId\n";
    echo "Current auto_increment: $autoIncrement\n";
    
    if ($autoIncrement <= $maxId) {
        echo "❌ Auto-increment issue detected!\n";
        echo "Fixing auto-increment...\n";
        
        // Fix auto-increment
        $nextId = $maxId + 1;
        DB::statement("ALTER TABLE push_subscriptions AUTO_INCREMENT = $nextId");
        
        // Verify fix
        $newStatus = DB::select("SHOW TABLE STATUS LIKE 'push_subscriptions'");
        $newAutoIncrement = $newStatus[0]->Auto_increment;
        
        echo "✅ Auto-increment fixed! New value: $newAutoIncrement\n";
    } else {
        echo "✅ Auto-increment is correct\n";
    }
    
    // If table is empty but auto-increment is not 1, reset it
    if ($count === 0 && $autoIncrement !== 1) {
        echo "\n=== Resetting empty table ===\n";
        DB::statement("ALTER TABLE push_subscriptions AUTO_INCREMENT = 1");
        echo "✅ Reset auto-increment to 1 for empty table\n";
    }
    
    echo "\n=== Testing Insert ===\n";
    try {
        // Test a simple insert
        $testId = DB::table('push_subscriptions')->insertGetId([
            'endpoint' => 'test-endpoint-' . time(),
            'public_key' => 'test-key',
            'auth_token' => 'test-token',
            'content_encoding' => 'aes128gcm',
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        echo "✅ Test insert successful! ID: $testId\n";
        
        // Clean up test record
        DB::table('push_subscriptions')->where('id', $testId)->delete();
        echo "✅ Test record cleaned up\n";
        
    } catch (Exception $e) {
        echo "❌ Test insert failed: " . $e->getMessage() . "\n";
        
        // Try to fix by recreating the table
        echo "\n=== Attempting table recreation ===\n";
        try {
            DB::statement("DROP TABLE IF EXISTS push_subscriptions_backup");
            DB::statement("CREATE TABLE push_subscriptions_backup AS SELECT * FROM push_subscriptions");
            DB::statement("DROP TABLE push_subscriptions");
            
            // Recreate table using Laravel migration
            echo "Running migration to recreate table...\n";
            echo "Please run: php artisan migrate:refresh --path=database/migrations/2025_05_15_125405_create_push_subscriptions_table.php\n";
            
        } catch (Exception $e2) {
            echo "❌ Table recreation failed: " . $e2->getMessage() . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}