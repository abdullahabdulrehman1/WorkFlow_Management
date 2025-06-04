<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/*', // Exclude all API routes from CSRF verification
        '/api/workflow/*/desktop-call', // Specifically exclude desktop call endpoint
        '/api/workflow/*/broadcast', // Exclude broadcast endpoint
        '/test-broadcast', // Exclude test broadcast
        '/reverb-status', // Exclude reverb status
    ];
}