<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Queue\SerializesModels;

/**
 * A newsletter email, already rendered by `NewsletterRenderer` (ADM-SUB-22). The test send (ADM-SUB-24) uses it as is.
 * Sent to a subscriber, it carries the one-click `List-Unsubscribe` headers (PUB-SUB-8, RFC 8058) and the recipient id
 * in `X-Mailin-custom`, which Brevo sends back with a hard bounce.
 */
class NewsletterMail extends Mailable
{
    use Queueable, SerializesModels;

    public const string RecipientHeaderPrefix = 'newsletter-recipient:';

    public function __construct(
        public readonly string $emailSubject,
        public readonly string $renderedHtml,
        public readonly ?string $unsubscribeUrl = null,
        public readonly ?int $recipientId = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->emailSubject);
    }

    public function headers(): Headers
    {
        return new Headers(text: array_filter([
            'List-Unsubscribe' => $this->unsubscribeUrl !== null ? '<'.$this->unsubscribeUrl.'>' : null,
            'List-Unsubscribe-Post' => $this->unsubscribeUrl !== null ? 'List-Unsubscribe=One-Click' : null,
            'X-Mailin-custom' => $this->recipientId !== null ? self::RecipientHeaderPrefix.$this->recipientId : null,
        ]));
    }

    public function content(): Content
    {
        return new Content(htmlString: $this->renderedHtml);
    }
}
