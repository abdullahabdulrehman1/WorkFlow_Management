<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', function () {
    return view('welcome');
});



Route::get('/', function () {
    return Inertia::render('App');
});

Route::get('/workflows', function () {
    return Inertia::render('Workflows');
});
Route::get('/create-new-workflow', function () {
    return Inertia::render('CreateNewWorkflow');
});