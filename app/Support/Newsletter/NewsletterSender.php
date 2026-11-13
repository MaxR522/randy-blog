<?php

namespace App\Support\Newsletter;

use App\Jobs\SendNewsletterToRecipient;
use App\Models\Newsletter;
use App\Models\NewsletterRecipient;
use App\Models\Subscription;
use App\NewsletterAudience;
use App\NewsletterRecipientStatus;
use App\NewsletterStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * « Envoyer » (ADM-SUB-26, ADM-SUB-27): freezes the recipients and the email, then queues one job per subscriber.
 * The email is rendered once with a placeholder; each job only swaps in the subscriber's own unsubscribe link
 * (ADM-SUB-28).
 */
class NewsletterSender
{
    public const string UnsubscribePlaceholder = '%%UNSUBSCRIBE_URL%%';

    public function __construct(private readonly NewsletterRenderer $renderer) {}

    /**
     * @throws ValidationException when no confirmed subscriber is left to send to
     */
    public function send(Newsletter $newsletter): void
    {
        DB::transaction(function () use ($newsletter): void {
            $newsletter = Newsletter::query()->lockForUpdate()->findOrFail($newsletter->id);

            abort_unless($newsletter->isDraft(), 403);

            $this->freezeRecipients($newsletter);

            $recipientsCount = $newsletter->recipients()->count();

            if ($recipientsCount === 0) {
                throw ValidationException::withMessages(['audience' => 'Aucun abonné confirmé à qui envoyer.']);
            }

            $newsletter->update([
                'html' => $this->renderer->render($newsletter->subject, $newsletter->preheader, $newsletter->content, self::UnsubscribePlaceholder),
                'status' => NewsletterStatus::Sending,
                'sent_at' => now(),
                'recipients_count' => $recipientsCount,
                'sent_count' => 0,
                'failed_count' => 0,
            ]);
        });

        $newsletter->recipients()->select('id')->lazyById()->each(
            fn (NewsletterRecipient $recipient) => SendNewsletterToRecipient::dispatch($recipient->id),
        );
    }

    /**
     * The email of one subscriber: the frozen email with their own one-click unsubscribe link.
     */
    public static function personalise(string $html, string $unsubscribeUrl): string
    {
        return strtr($html, [self::UnsubscribePlaceholder => e($unsubscribeUrl)]);
    }

    /**
     * Once no recipient is pending, the newsletter is « Envoyée », or « Échec partiel » when some emails failed.
     * Only a sending newsletter moves, so concurrent jobs finishing together give the same result.
     */
    public static function finishIfDone(int $newsletterId): void
    {
        $hasPending = NewsletterRecipient::query()
            ->where('newsletter_id', $newsletterId)
            ->where('status', NewsletterRecipientStatus::Pending)
            ->exists();

        if ($hasPending) {
            return;
        }

        Newsletter::query()
            ->whereKey($newsletterId)
            ->where('status', NewsletterStatus::Sending)
            ->update(['status' => DB::raw(sprintf(
                "case when failed_count > 0 then '%s' else '%s' end",
                NewsletterStatus::PartiallyFailed->value,
                NewsletterStatus::Sent->value,
            ))]);
    }

    /**
     * « Tous les abonnés confirmés » becomes one pending row per confirmed subscriber at the time of sending; a
     * selection loses the addresses that are no longer confirmed (PUB-SUB-7).
     */
    private function freezeRecipients(Newsletter $newsletter): void
    {
        if ($newsletter->audience === NewsletterAudience::Selection) {
            $newsletter->recipients()
                ->whereNotIn('subscription_id', Subscription::query()->confirmed()->select('id'))
                ->delete();

            return;
        }

        $newsletter->recipients()->delete();

        NewsletterRecipient::query()->insertUsing(
            ['newsletter_id', 'subscription_id', 'status'],
            Subscription::query()->confirmed()->selectRaw('?, id, ?', [$newsletter->id, NewsletterRecipientStatus::Pending->value]),
        );
    }
}
