<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;
use NotificationChannels\WebPush\WebPushChannel;

class WorkflowSavedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $title;
    public $body;
    public $actionUrl;

    /**
     * Create a new notification instance.
     *
     * @param string $title
     * @param string $body
     * @param string $actionUrl
     */
    public function __construct($title, $body, $actionUrl)
    {
        $this->title = $title;
        $this->body = $body;
        $this->actionUrl = $actionUrl;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return [WebPushChannel::class];
    }

    /**
     * Get the web push representation of the notification.
     *
     * @param  mixed  $notifiable
     * @param  mixed  $notification
     * @return \NotificationChannels\WebPush\WebPushMessage
     */
    public function toWebPush($notifiable, $notification)
    {
        return (new WebPushMessage)
            ->title($this->title)
            ->icon('/logo.png')
            ->body($this->body)
            ->action('View Workflow', $this->actionUrl);
    }
}
