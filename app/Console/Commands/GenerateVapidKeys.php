<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

class GenerateVapidKeys extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'webpush:vapid';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate VAPID keys for web push notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Generating VAPID keys...');

        $vapidKeys = VAPID::createVapidKeys();
        
        $this->info('VAPID keys generated successfully!');
        $this->info('Public key: ' . $vapidKeys['publicKey']);
        $this->info('Private key: ' . $vapidKeys['privateKey']);
        
        $this->info('Add these keys to your .env file:');
        $this->info('VAPID_PUBLIC_KEY=' . $vapidKeys['publicKey']);
        $this->info('VAPID_PRIVATE_KEY=' . $vapidKeys['privateKey']);
        
        return Command::SUCCESS;
    }
}