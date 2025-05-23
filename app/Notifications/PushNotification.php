<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use App\Services\WebPushService;
use Illuminate\Support\Facades\App;

class PushNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $title;
    protected $body;
    protected $options;

    /**
     * Create a new notification instance.
     *
     * @param string $title
     * @param string $body
     * @param array $options
     */
    public function __construct($title, $body, array $options = [])
    {
        $this->title = $title;
        $this->body = $body;
        $this->options = $options;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['database']; // Using database channel, we'll handle the push notification manually
    }

    /**
     * Get the array representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function toArray($notifiable)
    {
        return [
            'title' => $this->title,
            'body' => $this->body,
            'options' => $this->options,
        ];
    }

    /**
     * Send the notification.
     *
     * @param  mixed  $notifiable
     * @return void
     */
    public function send($notifiable)
    {
        // Save to database
        parent::send($notifiable);
        
        // Send push notification using WebPushService
        if (method_exists($notifiable, 'pushSubscriptions')) {
            $webPushService = App::make(WebPushService::class);
            
            $payload = [
                'title' => $this->title,
                'body' => $this->body,
                'icon' => $this->options['icon'] ?? '/logo.png',
                'badge' => $this->options['badge'] ?? '/logo.png',
                'url' => $this->options['url'] ?? '/',
                'tag' => $this->options['tag'] ?? 'default',
                'data' => $this->options['data'] ?? [],
            ];
            
            $webPushService->notifyUser($notifiable, $payload);
        }
    }
}