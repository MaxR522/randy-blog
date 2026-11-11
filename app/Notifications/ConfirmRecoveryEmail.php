<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to a new recovery email: it is used only once its link is opened (ADM-SEC-1).
 */
class ConfirmRecoveryEmail extends Notification
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
            ->subject('Confirmez votre email de récupération')
            ->greeting('Bonjour,')
            ->line('Cette adresse a été indiquée comme email de récupération de l’administration de randy-donny.com. Elle recevra les liens de réinitialisation du mot de passe et les alertes de sécurité.')
            ->action('Confirmer l’adresse', $this->confirmationUrl)
            ->line('Ce lien est valable '.self::ExpiresInMinutes.' minutes.')
            ->line('Si vous n’êtes pas à l’origine de cette demande, ignorez cet email : l’adresse ne sera pas utilisée.')
            ->salutation('Randy Donny');
    }
}
