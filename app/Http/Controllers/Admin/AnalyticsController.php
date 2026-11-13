<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Newsletter;
use App\Models\Subscription;
use App\NewsletterStatus;
use App\Support\Analytics\AnalyticsPeriod;
use App\Support\Analytics\AnalyticsReport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    /**
     * « Analytique » (ADM-ANA-1…6). The blog figures come from the database and paint at once; the GA4 figures are
     * deferred, cached for an hour, and `null` when GA4 is unavailable (ADM-ANA-5).
     */
    public function index(Request $request, AnalyticsReport $report): Response
    {
        $period = AnalyticsPeriod::fromRequest($request->query('periode'));
        $start = $period->startDate();

        $lastNewsletter = Newsletter::query()
            ->whereIn('status', [NewsletterStatus::Sent, NewsletterStatus::PartiallyFailed])
            ->whereNotNull('sent_at')
            ->latest('sent_at')
            ->first();

        return Inertia::render('admin/analytics', [
            'period' => $period->value,
            'range' => [
                'start' => $start->toDateString(),
                'end' => $period->endDate()->toDateString(),
            ],
            'blog' => [
                'publishedArticles' => Article::query()->published()->count(),
                'confirmedSubscribers' => Subscription::query()->confirmed()->count(),
                'newSubscribers' => Subscription::query()->confirmed()->where('verified_at', '>=', $start->utc())->count(),
                'lastNewsletter' => $lastNewsletter === null ? null : [
                    'subject' => $lastNewsletter->subject,
                    'sentAt' => $lastNewsletter->sent_at?->toDateString(),
                    'recipients' => $lastNewsletter->recipients_count,
                ],
            ],
            'analytics' => Inertia::defer(fn (): ?array => $report->forPeriod($period)),
        ]);
    }
}
