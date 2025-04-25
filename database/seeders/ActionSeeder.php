<?php

namespace Database\Seeders;

use App\Models\Action;
use App\Models\WorkflowAction;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ActionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Temporarily disable foreign key checks
        Schema::disableForeignKeyConstraints();
        
        // Delete existing actions
        Action::query()->delete();
        
        // Define exactly the three actions needed with specific IDs
        $actions = [
            [
                'id' => 1,
                'name' => 'Send Email',
                'fields_required' => json_encode([
                    'to' => [
                        'type' => 'email',
                        'required' => true,
                    ],
                    'subject' => [
                        'type' => 'string',
                        'required' => true,
                    ],
                    'body' => [
                        'type' => 'text',
                        'required' => true,
                    ],
                ]),
            ],
            [
                'id' => 2,
                'name' => 'Send SMS',
                'fields_required' => json_encode([
                    'to' => [
                        'type' => 'phone',
                        'required' => true,
                    ],
                    'message' => [
                        'type' => 'text',
                        'required' => true,
                    ],
                ]),
            ],
            [
                'id' => 3,
                'name' => 'In-app notification',
                'fields_required' => json_encode([
                    'user_id' => [
                        'type' => 'number',
                        'required' => true,
                    ],
                    'message' => [
                        'type' => 'text',
                        'required' => true,
                    ],
                    'type' => [
                        'type' => 'select',
                        'options' => ['info', 'warning', 'error', 'success'],
                        'required' => true,
                    ],
                ]),
            ],
        ];

        foreach ($actions as $action) {
            Action::updateOrCreate(['id' => $action['id']], $action);
        }
        
        // Re-enable foreign key checks
        Schema::enableForeignKeyConstraints();
    }
}