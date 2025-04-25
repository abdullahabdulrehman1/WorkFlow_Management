<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Action extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'fields_required'
    ];

    protected $casts = [
        'fields_required' => 'array'
    ];

    public function workflowActions(): HasMany
    {
        return $this->hasMany(WorkflowAction::class);
    }
}