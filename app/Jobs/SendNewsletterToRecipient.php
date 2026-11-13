<?php

namespace App\Jobs;

use App\Mail\NewsletterMail;
use App\Models\Newsletter;
use App\Models\NewsletterRecipient;
use App\NewsletterRecipientStatus;
use App\SubscriptionStatus;
use App\Support\Newsletter\NewsletterSender;
use DateTimeInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Attributes\MaxExceptions;
use Illuminate\Queue\Middleware\RateLimited;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

/**
 * Sends a newsletter to one subscriber (ADM-SUB-27), within the `newsletter` rate limiter (Brevo's per-minute and
 * daily limits). A job held back by the limiter is released, which counts as an attempt, so the job runs until a
 * week has passed and fails only after 3 errors.
 */
#[MaxExceptions(3)]
class SendNewsletterToRecipient implements ShouldQueue
{
    use Queueable;

    /**
     * @var list<int>
     */
    public array $backoff = [60, 300, 900];

    public function __construct(public int $recipientId) {}

    /**
     * Read when the job is queued, not when it runs.
     */
    public function retryUntil(): DateTimeInterface
    {
        return now()->addWeek();
    }

    /**
     * @return list<object>
     */
    public function middleware(): array
    {
        return [new RateLimited('newsletter')];
    }

    public function handle(): void
    {
        $recipient = NewsletterRecipient::query()->with(['newsletter', 'subscription'])->find($this->recipientId);

        if ($recipient === null || $recipient->status !== NewsletterRecipientStatus::Pending) {
            return;
        }

        $newsletter = $recipient->newsletter;
        $subscription = $recipient->subscription;

        // Unsubscribed (or erased) since « Envoyer »: they no longer count as a recipient.
        if ($subscription === null || $subscription->status !== SubscriptionStatus::Confirmed) {
            $recipient->delete();
            Newsletter::query()->whereKey($newsletter->id)->decrement('recipients_count');
            NewsletterSender::finishIfDone($newsletter->id);

            return;
        }

        $unsubscribeUrl = $subscription->unsubscribeUrl();

        Mail::to($subscription->email)->send(new NewsletterMail(
            $newsletter->subject,
            NewsletterSender::personalise((string) $newsletter->html, $unsubscribeUrl),
            $unsubscribeUrl,
            $recipient->id,
        ));

        $recipient->update(['status' => NewsletterRecipientStatus::Sent, 'sent_at' => now(), 'error' => null]);
        Newsletter::query()->whereKey($newsletter->id)->increment('sent_count');
        NewsletterSender::finishIfDone($newsletter->id);
    }

    /**
     * After the third error, or a week after « Envoyer ».
     */
    public function failed(?Throwable $exception): void
    {
        $recipient = NewsletterRecipient::query()->find($this->recipientId);

        if ($recipient === null || $recipient->status !== NewsletterRecipientStatus::Pending) {
            return;
        }

        $recipient->update([
            'status' => NewsletterRecipientStatus::Failed,
            'error' => Str::limit($exception?->getMessage() ?? 'Échec de l’envoi.', 500),
        ]);
        Newsletter::query()->whereKey($recipient->newsletter_id)->increment('failed_count');
        NewsletterSender::finishIfDone($recipient->newsletter_id);
    }
}
