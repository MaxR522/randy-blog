<?php

namespace App\Notifications;

use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent when the account logs in from a browser it never used before (ADM-SEC-7).
 */
class NewDeviceLogin extends Notification implements SecurityAlert, ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $device,
        public readonly ?string $ip,
        public readonly CarbonInterface $loggedInAt,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $date = $this->loggedInAt->timezone(config()->string('app.display_timezone'))->locale('fr')->translatedFormat('j F Y, H \h i');

        return (new MailMessage)
            ->subject('Nouvelle connexion à votre compte')
            ->greeting('Bonjour,')
            ->line('Une connexion à l’administration de randy-donny.com vient d’avoir lieu depuis un appareil inconnu.')
            ->line("Appareil : {$this->device}")
            ->line('Adresse IP : '.($this->ip ?? 'inconnue'))
            ->line("Date : {$date}")
            ->line('Si c’est vous, ignorez cet email. Sinon, changez votre mot de passe depuis l’onglet « Sécurité » de « Gestion du compte » : les autres appareils seront déconnectés.')
            ->salutation('Randy Donny');
    }
}
