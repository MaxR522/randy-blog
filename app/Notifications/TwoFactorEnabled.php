<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent once 2FA has been confirmed from the Security tab (ADM-SEC-7).
 */
class TwoFactorEnabled extends Notification implements SecurityAlert, ShouldQueue
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
            ->subject('La double authentification est activée')
            ->greeting('Bonjour,')
            ->line('La vérification en deux étapes vient d’être activée sur l’administration de randy-donny.com. Chaque connexion demandera désormais le code de votre application d’authentification.')
            ->line('Si vous n’êtes pas à l’origine de ce changement, réinitialisez votre mot de passe depuis la page de connexion.')
            ->salutation('Randy Donny');
    }
}
