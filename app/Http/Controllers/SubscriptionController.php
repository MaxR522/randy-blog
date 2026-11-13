<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubscribeRequest;
use App\Models\Subscription;
use App\Notifications\ConfirmSubscription;
use App\SubscriptionStatus;
use App\Support\Seo\Seo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Public newsletter subscription with double opt-in (spec §4.7).
 */
class SubscriptionController extends Controller
{
    /**
     * Every outcome gets the same answer, so the form never tells whether an address is known (PUB-SUB-5).
     * A confirmed address gets no new email.
     */
    public function store(SubscribeRequest $request): RedirectResponse
    {
        if (! $request->isFromBot()) {
            $this->subscribe($request->string('email')->toString());
        }

        return Inertia::flash('subscribed', true)->back();
    }

    /**
     * The signature is checked here rather than by the `signed` middleware, so a stale link gets the
     * « Ce lien a expiré » page instead of Laravel's error page (PUB-SUB-6). A link for an address
     * erased, purged or unsubscribed since then counts as expired: only a new subscription restarts it.
     */
    public function confirm(Request $request, int $subscription): Response
    {
        $found = Subscription::query()->find($subscription);

        if (! $request->hasValidSignature() || $found === null || $found->status === SubscriptionStatus::Unsubscribed) {
            return $this->statusPage($request, 'expired', 403);
        }

        if ($found->status === SubscriptionStatus::Pending) {
            $found->update([
                'is_verified' => true,
                'verified_at' => now(),
                'confirmed_ip' => $request->ip(),
            ]);
        }

        return $this->statusPage($request, 'confirmed');
    }

    /**
     * One click from the newsletter, no login (PUB-SUB-8). `POST` is the one-click call mail clients
     * make from the `List-Unsubscribe-Post` header (RFC 8058): it answers without a page.
     */
    public function unsubscribe(Request $request, int $subscription): Response
    {
        abort_unless($request->hasValidSignature(), 404);

        $found = Subscription::query()->find($subscription);

        if ($found !== null && $found->unsubscribed_at === null) {
            $found->update(['unsubscribed_at' => now()]);
        }

        if ($request->isMethod('post')) {
            return new HttpResponse(status: 200);
        }

        return $this->statusPage($request, 'unsubscribed');
    }

    /**
     * New address: pending, with a confirmation email. Pending: the email again, at most every 10 minutes.
     * Unsubscribed or erased by soft delete: restarts as pending. Confirmed: nothing to do.
     */
    private function subscribe(string $email): void
    {
        $subscription = Subscription::withTrashed()->firstOrNew(['email' => $email]);

        if ($subscription->exists && ! $subscription->trashed() && $subscription->status === SubscriptionStatus::Confirmed) {
            return;
        }

        $isRestart = ! $subscription->exists || $subscription->trashed() || $subscription->status === SubscriptionStatus::Unsubscribed;

        if (! $isRestart && ! $subscription->canResendConfirmation()) {
            return;
        }

        if ($isRestart) {
            $subscription->fill([
                'is_verified' => false,
                'verified_at' => null,
                'confirmed_ip' => null,
                'unsubscribed_at' => null,
            ]);
            $subscription->deleted_at = null;
            $subscription->created_at = now();
        }

        $subscription->last_confirmation_sent_at = now();
        $subscription->save();

        $subscription->notify(new ConfirmSubscription($subscription->confirmationUrl()));
    }

    /**
     * @param  'confirmed'|'expired'|'unsubscribed'  $state
     */
    private function statusPage(Request $request, string $state, int $status = 200): Response
    {
        $titles = [
            'confirmed' => 'Votre abonnement est confirmé',
            'expired' => 'Ce lien a expiré',
            'unsubscribed' => 'Vous êtes désabonné',
        ];

        return Inertia::render('subscription-status', [
            'seo' => Seo::private($titles[$state])->toArray(),
            'state' => $state,
        ])->toResponse($request)->setStatusCode($status);
    }
}
