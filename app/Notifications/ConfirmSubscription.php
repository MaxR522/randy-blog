<?php

namespace App\Notifications;

use App\Models\Subscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Double opt-in: the address is subscribed only once this link is opened (PUB-SUB-4, PUB-SUB-6).
 */
class ConfirmSubscription extends Notification implements ShouldQueue
{
    use Queueable;

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
            ->subject('Confirmez votre abonnement à la newsletter')
            ->greeting('Bonjour,')
            ->line('Vous avez demandé à recevoir les nouveaux articles de Randy Donny par email. Il reste une étape : confirmer votre adresse.')
            ->action('Confirmer mon abonnement', $this->confirmationUrl)
            ->line('Ce lien est valable '.Subscription::ConfirmationHours.' heures.')
            ->line('Si vous n’êtes pas à l’origine de cette demande, ignorez cet email : vous ne recevrez rien.')
            ->salutation('Randy Donny');
    }
}
