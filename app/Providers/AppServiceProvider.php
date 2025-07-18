<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Auto-configure for ngrok to prevent Mixed Content errors
        if (str_contains(request()->getHost(), 'ngrok') || 
            str_contains(request()->getHost(), 'ngrok-free.app')) {
            
            // Force HTTPS for ngrok
            URL::forceScheme('https');
        }
    }
}
