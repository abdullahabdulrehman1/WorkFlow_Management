<?php

namespace App\Http\Controllers;

use App\Models\Trigger;
use Illuminate\Http\Request;

class TriggerController extends Controller
{
    /**
     * Display a listing of available triggers.
     */
    public function index()
    {
        $triggers = Trigger::all();
        
        return response()->json([
            'triggers' => $triggers,
        ]);
    }

    /**
     * Display the specified trigger.
     */
    public function show(Trigger $trigger)
    {
        return response()->json([
            'trigger' => $trigger,
        ]);
    }
}