<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DesktopCallEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $workflowId;
    public $callData;
    public $callerId;
    public $callerName;

    /**
     * Create a new event instance.
     */
    public function __construct($workflowId, $callData, $callerId, $callerName)
    {
        $this->workflowId = $workflowId;
        $this->callData = $callData;
        $this->callerId = $callerId;
        $this->callerName = $callerName;
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
        return 'DesktopCallEvent';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => 'desktop_call',
            'callData' => $this->callData,
            'callerId' => $this->callerId,
            'callerName' => $this->callerName,
            'timestamp' => now()->toISOString()
        ];
    }
}