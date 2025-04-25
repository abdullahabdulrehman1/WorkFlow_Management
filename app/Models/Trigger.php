<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Trigger extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'parameters'
    ];

    protected $casts = [
        'parameters' => 'array'
    ];

    public function workflows(): HasMany
    {
        return $this->hasMany(Workflow::class);
    }
}