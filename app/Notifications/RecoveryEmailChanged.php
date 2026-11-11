<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to the login email when the recovery email is set, changed or removed (ADM-SEC-7). It does not go to the
 * recovery address itself: that one may be the change being reported.
 */
class RecoveryEmailChanged extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly ?string $recoveryEmail) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $change = $this->recoveryEmail === null
            ? 'L’email de récupération de l’administration de randy-donny.com a été supprimé.'
            : "L’email de récupération de l’administration de randy-donny.com est désormais {$this->recoveryEmail}. Il servira une fois vérifié par le lien qui lui a été envoyé.";

        return (new MailMessage)
            ->subject('Votre email de récupération a changé')
            ->greeting('Bonjour,')
            ->line($change)
            ->line('Si vous n’êtes pas à l’origine de ce changement, changez votre mot de passe et vérifiez l’onglet « Sécurité » de « Gestion du compte ».')
            ->salutation('Randy Donny');
    }
}
