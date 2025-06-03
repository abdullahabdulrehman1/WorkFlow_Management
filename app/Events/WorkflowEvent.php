<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WorkflowEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $workflowId;
    public $type;
    public $message;
    public $connectionId;
    public $browser;

    /**
     * Create a new event instance.
     */
    public function __construct($workflowId, $type, $message, $connectionId, $browser = null)
    {
        $this->workflowId = $workflowId;
        $this->type = $type;
        $this->message = $message;
        $this->connectionId = $connectionId;
        $this->browser = $browser;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('workflow.' . $this->workflowId),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'WorkflowEvent';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => $this->type,
            'message' => $this->message,
            'connectionId' => $this->connectionId,
            'browser' => $this->browser,
            'timestamp' => now()->toISOString()
        ];
    }
}