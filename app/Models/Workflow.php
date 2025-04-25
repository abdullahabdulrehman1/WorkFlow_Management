<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workflow extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 
        'status', 
        'trigger_id'
    ];

    public function trigger(): BelongsTo
    {
        return $this->belongsTo(Trigger::class);
    }

    public function actions(): HasMany
    {
        return $this->hasMany(WorkflowAction::class);
    }

    public function connections(): HasMany
    {
        return $this->hasMany(WorkflowConnection::class);
    }
}