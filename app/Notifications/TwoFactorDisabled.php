<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent after 2FA has been disabled from the Security tab (ADM-SEC-7).
 */
class TwoFactorDisabled extends Notification implements SecurityAlert, ShouldQueue
{
    use Queueable;

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('La double authentification est désactivée')
            ->greeting('Bonjour,')
            ->line('La vérification en deux étapes vient d’être désactivée sur l’administration de randy-donny.com. La connexion ne demande plus que le mot de passe.')
            ->line('Si vous n’êtes pas à l’origine de ce changement, réinitialisez votre mot de passe depuis la page de connexion, puis réactivez la 2FA.')
            ->salutation('Randy Donny');
    }
}
