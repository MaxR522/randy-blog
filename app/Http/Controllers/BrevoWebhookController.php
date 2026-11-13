<?php

namespace App\Http\Controllers;

use App\Mail\NewsletterMail;
use App\Models\Newsletter;
use App\Models\NewsletterRecipient;
use App\Models\Subscription;
use App\NewsletterRecipientStatus;
use App\NewsletterStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Brevo's transactional webhook (spec §7.6): a hard bounce, a spam complaint or an unsubscribe through Brevo marks the
 * subscriber as unsubscribed. A hard bounce of a newsletter email also counts that recipient as failed (ADM-SUB-27),
 * found through the `X-Mailin-custom` header the email carried. Other events are acknowledged and ignored.
 */
class BrevoWebhookController extends Controller
{
    private const array UnsubscribingEvents = ['hard_bounce', 'spam', 'unsubscribed'];

    public function __invoke(Request $request): Response
    {
        $token = config('services.brevo.webhook_token');

        abort_unless(is_string($token) && $token !== '', 404);
        abort_unless($this->isAuthorized($request, $token), 401);

        // One event per call, or a list when Brevo batches them.
        $events = array_is_list($request->all()) ? $request->all() : [$request->all()];

        foreach ($events as $event) {
            if (is_array($event)) {
                $this->handle($event);
            }
        }

        return new Response(status: 200);
    }

    /**
     * Brevo sends the token as a bearer token (`auth.type = bearer`) or as basic credentials, whatever the user name.
     */
    private function isAuthorized(Request $request, string $token): bool
    {
        $given = $request->bearerToken() ?? $request->getPassword();

        return is_string($given) && hash_equals($token, $given);
    }

    /**
     * @param  array<mixed>  $event
     */
    private function handle(array $event): void
    {
        $type = $event['event'] ?? null;
        $email = $event['email'] ?? null;

        if (! in_array($type, self::UnsubscribingEvents, true) || ! is_string($email)) {
            return;
        }

        Subscription::query()
            ->where('email', Str::lower(trim($email)))
            ->whereNull('unsubscribed_at')
            ->update(['unsubscribed_at' => now()]);

        if ($type === 'hard_bounce') {
            $this->failRecipient($event);
        }
    }

    /**
     * The newsletter email was accepted, then bounced: it moves from « remis » to « échec ».
     *
     * @param  array<mixed>  $event
     */
    private function failRecipient(array $event): void
    {
        $custom = $event['X-Mailin-custom'] ?? null;

        if (! is_string($custom) || preg_match('/^'.preg_quote(NewsletterMail::RecipientHeaderPrefix, '/').'(\d+)$/', $custom, $matches) !== 1) {
            return;
        }

        DB::transaction(function () use ($matches, $event): void {
            $recipient = NewsletterRecipient::query()->lockForUpdate()->find((int) $matches[1]);

            if ($recipient === null || $recipient->status !== NewsletterRecipientStatus::Sent) {
                return;
            }

            $reason = $event['reason'] ?? null;

            $recipient->update([
                'status' => NewsletterRecipientStatus::Failed,
                'error' => Str::limit(is_string($reason) && $reason !== '' ? $reason : 'Adresse rejetée (hard bounce).', 500),
            ]);

            Newsletter::query()->whereKey($recipient->newsletter_id)->update([
                'sent_count' => DB::raw('greatest(sent_count - 1, 0)'),
                'failed_count' => DB::raw('failed_count + 1'),
            ]);

            Newsletter::query()
                ->whereKey($recipient->newsletter_id)
                ->where('status', NewsletterStatus::Sent)
                ->update(['status' => NewsletterStatus::PartiallyFailed]);
        });
    }
}
