<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubscriptionResource;
use App\Models\Newsletter;
use App\Models\Subscription;
use App\SubscriptionStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    private const int PerPage = 10;

    /**
     * Subscribers, searched by email and filtered by status, most recent first (ADM-SUB-3).
     * Soft-deleted V1 rows are left out: they no longer receive anything.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $search = $request->string('q')->trim()->toString();
        $status = SubscriptionStatus::tryFrom($request->string('status')->toString());

        $subscriptions = Subscription::query()
            ->when($search !== '', fn ($query) => $query->where(
                'email',
                'ilike',
                '%'.addcslashes($search, '%_\\').'%',
            ))
            ->when($status !== null, fn ($query) => $query->withStatus($status))
            ->latest()
            ->orderByDesc('id')
            ->paginate(self::PerPage)
            ->withQueryString();

        // Deleting the only row of the last page leaves the URL past the end.
        if ($subscriptions->isEmpty() && $subscriptions->currentPage() > 1) {
            return redirect($subscriptions->url($subscriptions->lastPage()));
        }

        return Inertia::render('admin/subscriptions', [
            'subscriptions' => [
                'data' => SubscriptionResource::collection($subscriptions->items())->resolve(),
                'total' => $subscriptions->total(),
                'currentPage' => $subscriptions->currentPage(),
                'lastPage' => $subscriptions->lastPage(),
                'previousUrl' => $subscriptions->previousPageUrl(),
                'nextUrl' => $subscriptions->nextPageUrl(),
            ],
            'filters' => ['q' => $search, 'status' => $status?->value],
            'subscriberCount' => Subscription::query()->count(),
            'newsletterCount' => Newsletter::query()->count(),
        ]);
    }

    /**
     * Permanent erasure, the GDPR right to be forgotten (ADM-SUB-4).
     */
    public function destroy(Subscription $subscription): RedirectResponse
    {
        $subscription->forceDelete();

        return Inertia::flash('success', 'Abonné supprimé.')->back();
    }
}
