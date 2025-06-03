<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Add presence channel for workflow connections
Broadcast::channel('workflow.{workflowId}', function ($user, $workflowId) {
    return [
        'id' => $user->id,
        'name' => $user->name,
        'browser' => request()->header('User-Agent')
    ];
});
