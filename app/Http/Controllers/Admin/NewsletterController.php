<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\NewsletterRequest;
use App\Http\Resources\AdminNewsletterResource;
use App\Mail\NewsletterMail;
use App\Models\Article;
use App\Models\Newsletter;
use App\Models\Subscription;
use App\NewsletterAudience;
use App\NewsletterRecipientStatus;
use App\NewsletterStatus;
use App\Support\ArticleHtml;
use App\Support\CloudinaryUrl;
use App\Support\Newsletter\NewsletterRenderer;
use App\Support\Newsletter\NewsletterSender;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class NewsletterController extends Controller
{
    private const int PerPage = 10;

    private const int PickerArticles = 10;

    private const int PickerSubscribers = 20;

    /**
     * The « Newsletters envoyées » tab of « Abonnements » (ADM-SUB-10): drafts first, then the newest sent.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $newsletters = Newsletter::query()
            ->orderByRaw('status = ? desc', [NewsletterStatus::Draft->value])
            ->orderByRaw('coalesce(sent_at, updated_at) desc')
            ->orderByDesc('id')
            ->paginate(self::PerPage)
            ->withQueryString();

        if ($newsletters->isEmpty() && $newsletters->currentPage() > 1) {
            return redirect($newsletters->url($newsletters->lastPage()));
        }

        return Inertia::render('admin/newsletters', [
            'newsletters' => [
                'data' => AdminNewsletterResource::collection($newsletters->items())->resolve(),
                'total' => $newsletters->total(),
                'currentPage' => $newsletters->currentPage(),
                'lastPage' => $newsletters->lastPage(),
                'previousUrl' => $newsletters->previousPageUrl(),
                'nextUrl' => $newsletters->nextPageUrl(),
            ],
            'subscriberCount' => Subscription::query()->count(),
            'newsletterCount' => Newsletter::query()->count(),
        ]);
    }

    /**
     * A blank composer, or one pre-filled with a published article (ADM-SUB-30: the publish toast's shortcut).
     */
    public function create(Request $request): Response
    {
        $article = $request->integer('article') > 0
            ? Article::query()->published()->find($request->integer('article'))
            : null;

        return $this->editor($request, null, $article);
    }

    public function store(NewsletterRequest $request): RedirectResponse
    {
        $newsletter = new Newsletter;

        $this->save($request, $newsletter);

        Inertia::flash('success', 'Brouillon enregistré.');

        return to_route('admin.newsletters.show', $newsletter);
    }

    /**
     * The composer for a draft (ADM-SUB-10: a draft can be reopened), the read-only email for the others.
     */
    public function show(Request $request, Newsletter $newsletter): Response
    {
        return $this->editor($request, $newsletter);
    }

    public function update(NewsletterRequest $request, Newsletter $newsletter): RedirectResponse
    {
        abort_unless($newsletter->isDraft(), 403);

        $this->save($request, $newsletter);

        return Inertia::flash('success', 'Brouillon enregistré.')->back();
    }

    /**
     * « Envoyer » (ADM-SUB-26), after the confirmation modal: saves the composer, then sends in the background
     * (ADM-SUB-27). An unsaved composer is created on the way.
     */
    public function send(NewsletterRequest $request, NewsletterSender $sender, ?Newsletter $newsletter = null): RedirectResponse
    {
        $newsletter ??= new Newsletter;

        abort_unless($newsletter->isDraft(), 403);

        $this->save($request, $newsletter);

        try {
            $sender->send($newsletter);
        } catch (ValidationException $exception) {
            return to_route('admin.newsletters.show', $newsletter)->withErrors($exception->errors());
        }

        Inertia::flash('success', 'Newsletter en cours d’envoi.');

        return to_route('admin.newsletters.show', $newsletter);
    }

    /**
     * A new draft from a newsletter (ADM-SUB-10). Of a selection, only the addresses still confirmed are kept.
     */
    public function duplicate(Newsletter $newsletter): RedirectResponse
    {
        $copy = DB::transaction(function () use ($newsletter): Newsletter {
            $copy = Newsletter::query()->create([
                'subject' => $newsletter->subject,
                'preheader' => $newsletter->preheader,
                'content' => $newsletter->content,
                'audience' => $newsletter->audience,
            ]);

            if ($newsletter->audience === NewsletterAudience::Selection) {
                $this->syncSelection($copy, $this->confirmedSelection($newsletter));
            }

            return $copy;
        });

        Inertia::flash('success', 'Newsletter dupliquée : vous modifiez la copie.');

        return to_route('admin.newsletters.show', $copy);
    }

    /**
     * The final email of the unsaved composer, for the desktop and mobile preview (ADM-SUB-23).
     */
    public function preview(Request $request, NewsletterRenderer $renderer): JsonResponse
    {
        $validated = $request->validate([
            'subject' => ['nullable', 'string', 'max:'.NewsletterRequest::SubjectMaxLength],
            'preheader' => ['nullable', 'string', 'max:'.NewsletterRequest::PreheaderMaxLength],
            'content' => ['nullable', 'string'],
        ]);

        return response()->json([
            'html' => $renderer->render(
                (string) ($validated['subject'] ?? ''),
                $validated['preheader'] ?? null,
                $validated['content'] ?? null,
                url('/'),
            ),
        ]);
    }

    /**
     * « Envoyer un test »: the email of the unsaved composer, to the author's own addresses only (ADM-SUB-24): the
     * login email and the verified recovery email, one email each. The unsubscribe link of a test leads to the home
     * page: the author is not a subscriber.
     */
    public function test(NewsletterRequest $request, NewsletterRenderer $renderer): RedirectResponse
    {
        $emails = $this->testEmails($request);
        $subject = $request->string('subject')->toString();
        $html = $renderer->render($subject, $request->validated('preheader'), $request->validated('content'), url('/'));

        try {
            foreach ($emails as $email) {
                Mail::to($email)->send(new NewsletterMail('[Test] '.$subject, $html));
            }
        } catch (TransportExceptionInterface $exception) {
            Log::warning('Newsletter test email failed: '.$exception->getMessage());

            return Inertia::flash('error', 'L’email de test n’a pas pu être envoyé. Réessayez dans quelques minutes.')->back();
        }

        return Inertia::flash('success', 'Email de test envoyé à '.implode(' et ', $emails).'.')->back();
    }

    /**
     * Published articles for « Insérer un article » (ADM-SUB-21), searched by title, newest first.
     */
    public function articles(Request $request): JsonResponse
    {
        $search = $request->string('q')->trim()->toString();

        $articles = Article::query()
            ->published()
            ->when($search !== '', fn ($query) => $query->whereRaw(
                'unaccent(title) ILIKE unaccent(?)',
                ['%'.addcslashes($search, '%_\\').'%'],
            ))
            ->latest('published_date')
            ->orderByDesc('id')
            ->limit(self::PickerArticles)
            ->get();

        return response()->json(['data' => $articles->map($this->pickedArticle(...))->all()]);
    }

    /**
     * Confirmed subscribers for the « Sélection » picker (ADM-SUB-25), searched by email.
     */
    public function subscribers(Request $request): JsonResponse
    {
        $search = $request->string('q')->trim()->toString();

        $subscribers = Subscription::query()
            ->confirmed()
            ->when($search !== '', fn ($query) => $query->where('email', 'ilike', '%'.addcslashes($search, '%_\\').'%'))
            ->orderBy('email')
            ->paginate(self::PickerSubscribers, ['id', 'email'])
            ->withQueryString();

        return response()->json([
            'data' => $subscribers->map(fn (Subscription $subscription): array => ['id' => $subscription->id, 'email' => $subscription->email])->all(),
            'total' => $subscribers->total(),
            'currentPage' => $subscribers->currentPage(),
            'lastPage' => $subscribers->lastPage(),
        ]);
    }

    private function editor(Request $request, ?Newsletter $newsletter, ?Article $article = null): Response
    {
        $selection = $newsletter === null ? collect() : Subscription::query()
            ->confirmed()
            ->whereIn('id', $newsletter->recipients()->select('subscription_id'))
            ->orderBy('email')
            ->get(['id', 'email']);

        return Inertia::render('admin/newsletter-editor', [
            'newsletter' => $newsletter === null ? null : AdminNewsletterResource::make($newsletter)->resolve(),
            'content' => $newsletter?->content,
            'initialArticle' => $article !== null ? $this->pickedArticle($article) : null,
            'selectedSubscribers' => $selection->map(fn (Subscription $subscription): array => ['id' => $subscription->id, 'email' => $subscription->email])->values()->all(),
            'confirmedCount' => Subscription::query()->confirmed()->count(),
            'testEmails' => $this->testEmails($request),
            'emailHtml' => $newsletter !== null && ! $newsletter->isDraft() ? $this->sentEmail($newsletter) : null,
        ]);
    }

    /**
     * @return list<string>
     */
    private function testEmails(Request $request): array
    {
        return $request->user()?->securityEmailAddresses() ?? [];
    }

    /**
     * An article as the picker lists it, which is also what the composer needs to insert its card.
     *
     * @return array{id: int, title: string, dateLabel: string|null, thumbnail: string|null, chapo: string}
     */
    private function pickedArticle(Article $article): array
    {
        return [
            'id' => $article->id,
            'title' => $article->title,
            'dateLabel' => $article->published_date_label,
            'thumbnail' => $article->cover_photo !== null && CloudinaryUrl::isCloudinary($article->cover_photo)
                ? CloudinaryUrl::transform($article->cover_photo, 'c_fill,g_auto,ar_3:2/c_limit,w_240/f_auto,q_auto')
                : $article->cover_photo,
            'chapo' => Str::limit(ArticleHtml::plainText($article->lead_paragraph), 220),
        ];
    }

    /**
     * The email as it went out, its unsubscribe link leading to the home page like the test send's.
     */
    private function sentEmail(Newsletter $newsletter): string
    {
        return $newsletter->html !== null
            ? NewsletterSender::personalise($newsletter->html, url('/'))
            : app(NewsletterRenderer::class)->render($newsletter->subject, $newsletter->preheader, $newsletter->content, url('/'));
    }

    private function save(NewsletterRequest $request, Newsletter $newsletter): void
    {
        DB::transaction(function () use ($request, $newsletter): void {
            $newsletter->fill([
                'subject' => $request->validated('subject'),
                'preheader' => $request->validated('preheader'),
                'content' => ArticleHtml::clean($request->validated('content'), allowArticleCards: true) ?: null,
                'audience' => $request->audience(),
            ])->save();

            $this->syncSelection($newsletter, $request->subscriptionIds());
        });
    }

    /**
     * A draft's selection is kept as pending recipient rows (ADM-SUB-25); « Tous les abonnés confirmés » keeps none
     * until it is sent.
     *
     * @param  list<int>  $subscriptionIds
     */
    private function syncSelection(Newsletter $newsletter, array $subscriptionIds): void
    {
        $newsletter->recipients()->delete();

        $newsletter->recipients()->insert(array_map(fn (int $id): array => [
            'newsletter_id' => $newsletter->id,
            'subscription_id' => $id,
            'status' => NewsletterRecipientStatus::Pending,
        ], $subscriptionIds));
    }

    /**
     * @return list<int>
     */
    private function confirmedSelection(Newsletter $newsletter): array
    {
        /** @var list<int> $ids */
        $ids = Subscription::query()
            ->confirmed()
            ->whereIn('id', $newsletter->recipients()->select('subscription_id'))
            ->pluck('id')
            ->all();

        return $ids;
    }
}
