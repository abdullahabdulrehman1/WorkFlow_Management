<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class FCMController extends Controller
{
    /**
     * Register a new FCM token for the authenticated user
     */
    public function register(Request $request)
    {
        // Validate the token
        $request->validate([
            'token' => 'required|string'
        ]);
        
        try {
            // Get authenticated user
            $user = Auth::user();
            
            if (!$user) {
                // Handle case when user is not authenticated
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }
            
            // Store token - update the user's push_token field
            $user->push_token = $request->token;
            $user->save();
            
            Log::info('FCM token registered for user: ' . $user->id);
            
            return response()->json([
                'success' => true,
                'message' => 'FCM token registered successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error registering FCM token: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to register FCM token',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
