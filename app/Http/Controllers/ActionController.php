<?php

namespace App\Http\Controllers;

use App\Models\Action;
use Illuminate\Http\Request;

class ActionController extends Controller
{
    /**
     * Display a listing of available actions.
     */
    public function index()
    {
        $actions = Action::all();
        
        return response()->json([
            'actions' => $actions,
        ]);
    }

    /**
     * Display the specified action.
     */
    public function show(Action $action)
    {
        return response()->json([
            'action' => $action,
        ]);
    }
}