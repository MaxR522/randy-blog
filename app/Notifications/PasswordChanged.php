<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent after the password changed from the Security tab (ADM-SEC-7).
 */
class PasswordChanged extends Notification implements SecurityAlert, ShouldQueue
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
            ->subject('Votre mot de passe a changé')
            ->greeting('Bonjour,')
            ->line('Le mot de passe de l’administration de randy-donny.com vient d’être modifié. Les autres appareils ont été déconnectés.')
            ->line('Si vous n’êtes pas à l’origine de ce changement, réinitialisez votre mot de passe depuis la page de connexion.')
            ->salutation('Randy Donny');
    }
}
