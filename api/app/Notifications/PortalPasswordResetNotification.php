<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PortalPasswordResetNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly string $url)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Restablece tu contraseña de BoomBang CL')
            ->greeting('Hola')
            ->line('Recibimos una solicitud para cambiar tu contraseña de BoomBang CL.')
            ->action('Restablecer mi contraseña', $this->url)
            ->line('El enlace caduca en 60 minutos y solo puede utilizarse una vez.')
            ->line('Si no solicitaste el cambio, puedes ignorar este mensaje.');
    }
}
