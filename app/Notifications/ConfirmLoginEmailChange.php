<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the new login address: the change applies only once its link is opened (ADM-ACC-4).
 */
class ConfirmLoginEmailChange extends Notification
{
    public const int ExpiresInMinutes = 60;

    public function __construct(public readonly string $confirmationUrl) {}

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
            ->subject('Confirmez votre nouvelle adresse de connexion')
            ->greeting('Bonjour,')
            ->line('Vous avez demandé à utiliser cette adresse pour vous connecter à l’administration de randy-donny.com.')
            ->action('Confirmer la nouvelle adresse', $this->confirmationUrl)
            ->line('Ce lien est valable '.self::ExpiresInMinutes.' minutes. D’ici là, vous vous connectez toujours avec votre adresse actuelle.')
            ->line('Si vous n’êtes pas à l’origine de cette demande, ignorez cet email : rien ne change.')
            ->salutation('Randy Donny');
    }
}
