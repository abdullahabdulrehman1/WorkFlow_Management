<?php

namespace Database\Seeders;

use App\Models\Trigger;
use Illuminate\Database\Seeder;

class TriggerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $triggers = [
            [
                'name' => 'Manual Trigger',
                'parameters' => json_encode(['description' => 'Manually triggered workflow']),
            ],
            [
                'name' => 'Scheduled Trigger',
                'parameters' => json_encode([
                    'frequency' => ['daily', 'weekly', 'monthly'],
                    'time' => 'time_of_day',
                ]),
            ],
            [
                'name' => 'Webhook Trigger',
                'parameters' => json_encode([
                    'endpoint' => 'url_string',
                    'method' => ['GET', 'POST', 'PUT', 'DELETE'],
                ]),
            ],
            [
                'name' => 'Form Submission',
                'parameters' => json_encode(['form_id' => 'string']),
            ],
        ];

        foreach ($triggers as $trigger) {
            Trigger::create($trigger);
        }
    }
}