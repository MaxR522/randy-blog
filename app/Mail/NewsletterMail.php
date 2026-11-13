<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * A newsletter email, already rendered by `NewsletterRenderer` (ADM-SUB-22). The test send (ADM-SUB-24) uses it as is;
 * the subscriber sends of session 12 add the `List-Unsubscribe` headers (PUB-SUB-8) through `headers()`.
 */
class NewsletterMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly string $emailSubject, public readonly string $renderedHtml) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->emailSubject);
    }

    public function content(): Content
    {
        return new Content(htmlString: $this->renderedHtml);
    }
}
