<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', function () {
    return view('welcome');
});



Route::get('/', function () {
    return Inertia::render('App');
});

Route::get('/test-tailwind', function () {
    return Inertia::render('TailwindTest');
});