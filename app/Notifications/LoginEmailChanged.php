<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the previous login address once the change is confirmed, so an unexpected change does not go unnoticed.
 */
class LoginEmailChanged extends Notification
{
    public function __construct(public readonly string $newEmail) {}

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
            ->subject('Votre adresse de connexion a changé')
            ->greeting('Bonjour,')
            ->line("L’adresse de connexion à l’administration de randy-donny.com est désormais {$this->newEmail}.")
            ->line('Si vous n’êtes pas à l’origine de ce changement, réinitialisez votre mot de passe depuis la page de connexion et vérifiez votre compte.')
            ->salutation('Randy Donny');
    }
}
