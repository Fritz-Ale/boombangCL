<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PortalEmailVerificationNotification extends Notification
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
            ->subject('Confirma tu correo en BoomBang CL')
            ->greeting('Verificación de correo')
            ->line('Recibimos una solicitud para verificar el correo de tu cuenta del portal BoomBang CL.')
            ->action('Confirmar correo', $this->url)
            ->line('Este enlace es válido durante 60 minutos. Si no creaste una cuenta, puedes ignorarlo.')
            ->salutation('Equipo BoomBang CL');
    }
}
