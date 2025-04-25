<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowAction extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_id',
        'action_id',
        'configuration_json',
        'x',
        'y',
        'type',
        'label'
    ];

    protected $casts = [
        'configuration_json' => 'array',
        'x' => 'float',
        'y' => 'float'
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function action(): BelongsTo
    {
        return $this->belongsTo(Action::class);
    }
}