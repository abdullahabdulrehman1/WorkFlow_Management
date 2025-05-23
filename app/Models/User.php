<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\PushSubscription; // Add this line
use NotificationChannels\WebPush\HasPushSubscriptions; // Add this line

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasPushSubscriptions; // Add HasPushSubscriptions here

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // The HasPushSubscriptions trait will provide the pushSubscriptions() relationship
    // If you had a custom pushSubscriptions() method, you might need to remove or adjust it
    // if it conflicts with the one provided by the trait.
    // For laravel-notification-channels/webpush, the trait defines this relationship.
}
