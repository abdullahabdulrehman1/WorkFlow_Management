<?php

namespace Database\Seeders;

use App\Models\Action;
use Illuminate\Database\Seeder;

class ActionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $actions = [
            [
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
                'name' => 'Create Record',
                'fields_required' => json_encode([
                    'model' => [
                        'type' => 'select',
                        'options' => ['User', 'Product', 'Order'],
                        'required' => true,
                    ],
                    'data' => [
                        'type' => 'json',
                        'required' => true,
                    ],
                ]),
            ],
            [
                'name' => 'HTTP Request',
                'fields_required' => json_encode([
                    'url' => [
                        'type' => 'string',
                        'required' => true,
                    ],
                    'method' => [
                        'type' => 'select',
                        'options' => ['GET', 'POST', 'PUT', 'DELETE'],
                        'required' => true,
                    ],
                    'headers' => [
                        'type' => 'json',
                        'required' => false,
                    ],
                    'body' => [
                        'type' => 'json',
                        'required' => false,
                    ],
                ]),
            ],
            [
                'name' => 'Wait/Delay',
                'fields_required' => json_encode([
                    'duration' => [
                        'type' => 'number',
                        'required' => true,
                    ],
                    'unit' => [
                        'type' => 'select',
                        'options' => ['seconds', 'minutes', 'hours', 'days'],
                        'required' => true,
                    ],
                ]),
            ],
            [
                'name' => 'Condition/Branch',
                'fields_required' => json_encode([
                    'condition' => [
                        'type' => 'expression',
                        'required' => true,
                    ],
                    'true_path' => [
                        'type' => 'branch',
                        'required' => false,
                    ],
                    'false_path' => [
                        'type' => 'branch',
                        'required' => false,
                    ],
                ]),
            ],
        ];

        foreach ($actions as $action) {
            Action::create($action);
        }
    }
}