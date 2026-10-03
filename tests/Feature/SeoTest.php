<?php

use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->author = User::factory()->create([
        'slug' => 'randy-donny',
        'display_name' => 'The man I used to be...',
        'avatar' => 'https://res.cloudinary.com/randy-blog/image/upload/v1728624075/avatar.jpg',
        'bio' => '<p>Historien de formation et journaliste par passion.</p>',
    ]);
});

/**
 * Decode the JSON-LD prop of a page and key its entities by `@type`.
 *
 * @return array<string, array<string, mixed>>
 */
function seoGraph(string $jsonLd): array
{
    $data = json_decode($jsonLd, true, flags: JSON_THROW_ON_ERROR);

    return collect($data['@graph'])->keyBy('@type')->all();
}

test('SEO-HEAD-2 the home page has its title, description, canonical and WebSite + Person data', function () {
    $this->get('/?utm_source=facebook&fbclid=abc')
        ->assertInertia(fn (Assert $page) => $page
            ->where('seo.title', 'Randy Donny — Je pense, donc j’essuie…')
            ->where('seo.description', config('blog.description'))
            ->where('seo.canonical', url('/').'/')
            ->where('seo.robots', 'index, follow, max-image-preview:large')
            ->where('seo.type', 'website')
            ->where('seo.image.url', 'https://res.cloudinary.com/randy-blog/image/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/v1728624075/avatar.jpg')
            ->where('seo.image.width', 1200)
            ->where('seo.image.height', 630)
            ->where('seo.jsonLd', function (string $jsonLd) {
                $graph = seoGraph($jsonLd);

                return $graph['WebSite']['potentialAction']['target']['urlTemplate'] === route('search').'?q={search_term_string}'
                    && $graph['Person']['name'] === 'Randy Donny'
                    && $graph['Person']['url'] === route('profile.show', 'randy-donny')
                    && in_array('https://x.com/Randydonny', $graph['Person']['sameAs'], true);
            }));
});

test('SEO-HEAD-3 the home page description is 140 to 160 characters long', function () {
    expect(mb_strlen(config('blog.description')))->toBeBetween(140, 160);
});

test('SEO-HEAD-4 later home pages are indexable and canonical to themselves', function () {
    $this->get('/?page=2')
        ->assertInertia(fn (Assert $page) => $page
            ->where('seo.title', 'Tous les articles, page 2 — Randy Donny')
            ->where('seo.canonical', url('/').'/?page=2')
            ->where('seo.robots', 'index, follow, max-image-preview:large'));
});

test('SEO-HEAD-6 an article has article Open Graph tags with its real dates and BlogPosting data', function () {
    $this->travelTo('2026-09-21 12:00:00');
    $category = Category::factory()->create(['value' => 'Politique']);
    $article = Article::factory()->for($this->author, 'author')->published(now()->subDays(2))->create([
        'title' => 'La politique malgache expliquée aux Martiens',
        'slug' => 'la-politique-malgache-expliquee-aux-martiens',
        'cover_photo' => 'https://res.cloudinary.com/randy-blog/image/upload/f_auto,q_70/cover',
        'description' => 'Une description.',
        'keywords' => 'politique, Madagascar',
    ]);
    $article->categories()->attach($category);
    $this->travelTo('2026-09-20 08:00:00');
    $article->update(['content' => '<p>Un deux trois.</p>', 'raw_content' => 'Un deux trois.']);
    $this->travelTo('2026-09-21 12:00:00');
    $url = route('articles.show', $article->slug);

    $this->get($url)
        ->assertInertia(fn (Assert $page) => $page
            ->where('seo.title', 'La politique malgache expliquée aux Martiens — Randy Donny')
            ->where('seo.description', 'Une description.')
            ->where('seo.canonical', $url)
            ->where('seo.type', 'article')
            ->where('seo.image.url', 'https://res.cloudinary.com/randy-blog/image/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/cover')
            ->where('seo.image.alt', 'La politique malgache expliquée aux Martiens')
            ->where('seo.article', [
                'publishedTime' => '2026-09-19T12:00:00+00:00',
                'modifiedTime' => '2026-09-20T08:00:00+00:00',
                'author' => route('profile.show', 'randy-donny'),
                'section' => 'Politique',
                'tags' => ['Politique'],
            ])
            ->where('seo.alternates', [[
                'type' => 'text/markdown',
                'href' => route('articles.markdown', $article->slug),
                'title' => 'La politique malgache expliquée aux Martiens',
            ]])
            ->where('seo.jsonLd', function (string $jsonLd) use ($url) {
                $graph = seoGraph($jsonLd);
                $posting = $graph['BlogPosting'];

                return $posting['datePublished'] === '2026-09-19T12:00:00+00:00'
                    && $posting['dateModified'] === '2026-09-20T08:00:00+00:00'
                    && $posting['mainEntityOfPage'] === $url
                    && $posting['wordCount'] === 3
                    && $posting['articleSection'] === ['Politique']
                    && count($posting['image']) === 3
                    && $posting['author'] === ['@id' => url('/').'/#randy-donny']
                    && $graph['BreadcrumbList']['itemListElement'][1]['item'] === $url;
            }));
});

test('SEO-LD-2 an article without a cover shares the author photo', function () {
    $article = Article::factory()->for($this->author, 'author')->published()->create(['cover_photo' => null]);

    $this->get(route('articles.show', $article->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->where('seo.image.url', 'https://res.cloudinary.com/randy-blog/image/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/v1728624075/avatar.jpg')
            ->where('seo.image.alt', 'Randy Donny'));
});

test('SEO-LD-2 a title cannot close the JSON-LD script tag', function () {
    $article = Article::factory()->for($this->author, 'author')->published()->create([
        'title' => 'Titre</script><script>alert(1)</script>',
    ]);

    $this->get(route('articles.show', $article->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->where('seo.jsonLd', fn (string $jsonLd) => ! str_contains($jsonLd, '</script>')
                && seoGraph($jsonLd)['BlogPosting']['headline'] === 'Titre</script><script>alert(1)</script>'));
});

test('SEO-LD-3 the author page is a ProfilePage with the bio as description', function () {
    $this->get(route('profile.show', 'randy-donny'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('seo.title', 'Randy Donny — À propos')
            ->where('seo.description', 'Historien de formation et journaliste par passion.')
            ->where('seo.canonical', route('profile.show', 'randy-donny'))
            ->where('seo.robots', 'index, follow')
            ->where('seo.type', 'profile')
            ->where('seo.jsonLd', fn (string $jsonLd) => seoGraph($jsonLd)['ProfilePage']['mainEntity'] === ['@id' => url('/').'/#randy-donny']));
});

test('SEO-CRAWL-3 the privacy policy is indexable', function () {
    $this->get(route('privacy'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('seo.title', 'Politique de confidentialité — Randy Donny')
            ->where('seo.canonical', route('privacy'))
            ->where('seo.robots', 'index, follow'));
});

test('SEO-CRAWL-3 search results are not indexed but their links are followed', function () {
    $this->get(route('search', ['q' => 'démocratie']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('seo.title', 'Résultats pour « démocratie » — Randy Donny')
            ->where('seo.robots', 'noindex, follow')
            ->where('seo.canonical', null)
            ->where('seo.jsonLd', null));
});

test('SEO-CRAWL-4 the 404 page is not indexed', function () {
    $this->get('/page-qui-n-existe-pas')
        ->assertNotFound()
        ->assertInertia(fn (Assert $page) => $page
            ->component('not-found')
            ->where('seo.title', 'Page introuvable — Randy Donny')
            ->where('seo.robots', 'noindex'));
});
