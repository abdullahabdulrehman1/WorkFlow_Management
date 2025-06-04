<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- PWA Meta Tags -->
        <link rel="manifest" href="{{ asset('build/manifest.webmanifest') }}">
        <meta name="theme-color" content="#0f172a">
        <link rel="apple-touch-icon" href="{{ asset('icons/icon-192x192.png') }}">
        <meta name="apple-mobile-web-app-capable" content="yes">

        <!-- Push Notification VAPID Public Key -->
        <meta name="vapid-public-key" content="{{ config('webpush.vapid.public_key') }}">

        <!-- Favicon and Browser Tab Icons -->
        <link rel="icon" href="{{ asset('z360.jpg') }}?v=1.0" type="image/jpeg">
        <link rel="shortcut icon" href="{{ asset('z360.jpg') }}?v=1.0" type="image/jpeg">
        <link rel="apple-touch-icon" sizes="180x180" href="{{ asset('z360.jpg') }}?v=1.0">
        <meta name="theme-color" content="#ffffff">
        <meta property="og:image" content="{{ asset('z360.jpg') }}">
        <meta name="msapplication-TileImage" content="{{ asset('z360.jpg') }}">
        <!-- Force favicon refresh with absolute URL -->
        <link rel="icon" type="image/jpeg" href="{{ url('/') }}/z360.jpg?v=1.0">

        <!-- Open Graph meta tags for social sharing -->
        <meta property="og:title" content="{{ config('app.name', 'Laravel') }}">
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ url('/') }}">
        <meta property="og:image" content="{{ asset('z360.jpg') }}">
        <meta property="og:image:type" content="image/jpeg">
        <meta property="og:image:width" content="300">
        <meta property="og:image:height" content="300">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        
        @viteReactRefresh
        @vite(['resources/js/app.jsx', 'resources/css/app.css'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>