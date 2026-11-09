<?php

use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use App\Support\Seo\SeoCache;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->author = User::factory()->create();
});

/**
 * @return array<int, string>
 */
function listedCategoryNames(string $url): array
{
    $names = [];

    test()->actingAs(test()->author)->get($url)->assertOk()->assertInertia(function (Assert $page) use (&$names) {
        $names = array_column($page->toArray()['props']['categories']['data'], 'name');
    });

    return $names;
}

function category(string $name): Category
{
    return Category::factory()->create(['key' => mb_strtoupper($name), 'value' => $name]);
}

test('ADM-COM-8 guests get a 404 on every category route', function (string $method, string $path) {
    $category = category('Culture');

    $this->{$method}(str_replace('{id}', (string) $category->id, $path))->assertNotFound();

    expect($category->fresh()->trashed())->toBeFalse();
})->with([
    ['get', '/admin/categories'],
    ['post', '/admin/categories'],
    ['put', '/admin/categories/{id}'],
    ['delete', '/admin/categories/{id}'],
]);

test('ADM-CAT-3 the list gives each category its article count, not counting deleted articles', function () {
    $category = category('Culture');
    $category->articles()->attach(Article::factory()->count(2)->create());
    $category->articles()->attach(tap(Article::factory()->create())->delete());

    $this->actingAs($this->author)
        ->get('/admin/categories')
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/categories')
            ->where('categories.data.0.name', 'Culture')
            ->where('categories.data.0.articlesCount', 2)
            ->where('categories.total', 1)
            ->where('hasCategories', true));
});

test('ADM-COM-5 the list shows 10 rows per page and keeps the query string in its links', function () {
    foreach (range(1, 11) as $number) {
        category(sprintf('Sujet %02d', $number));
    }

    $this->actingAs($this->author)
        ->get('/admin/categories?q=sujet')
        ->assertInertia(fn (Assert $page) => $page
            ->has('categories.data', 10)
            ->where('categories.lastPage', 2)
            ->where('categories.nextUrl', fn (string $url) => str_contains($url, 'q=sujet') && str_contains($url, 'page=2')));

    expect(listedCategoryNames('/admin/categories?page=2'))->toBe(['Sujet 11']);
});

test('ADM-COM-5 a page past the end redirects to the last page and keeps the search', function () {
    category('Culture');

    $this->actingAs($this->author)
        ->get('/admin/categories?q=cult&page=4')
        ->assertRedirect('/admin/categories?q=cult&page=1');
});

test('ADM-CAT-7 search ignores accents and case', function (string $query) {
    category('Économie');
    category('Culture');

    expect(listedCategoryNames('/admin/categories?q='.urlencode($query)))->toBe(['Économie']);
})->with(['economie', 'ÉCONO', 'nomi']);

test('ADM-CAT-7 search treats wildcard characters literally', function () {
    category('Culture');
    category('100% local');

    expect(listedCategoryNames('/admin/categories?q='.urlencode('%')))->toBe(['100% local']);
});

test('the empty search state can tell « no match » from « no category yet »', function () {
    $this->actingAs($this->author)
        ->get('/admin/categories')
        ->assertInertia(fn (Assert $page) => $page->where('hasCategories', false));

    category('Culture');

    $this->get('/admin/categories?q=sport')
        ->assertInertia(fn (Assert $page) => $page->has('categories.data', 0)->where('hasCategories', true));
});

test('ADM-CAT-7 the list sorts by name by default, accents among their letters', function () {
    category('Histoire');
    category('Économie');
    category('Culture');

    expect(listedCategoryNames('/admin/categories'))->toBe(['Culture', 'Économie', 'Histoire']);
});

test('ADM-CAT-7 the list sorts by date, newest first unless told otherwise', function () {
    Category::factory()->create(['value' => 'Ancienne', 'created_at' => '2019-03-14']);
    Category::factory()->create(['value' => 'Récente', 'created_at' => '2026-11-07']);

    expect(listedCategoryNames('/admin/categories?sort=date'))->toBe(['Récente', 'Ancienne'])
        ->and(listedCategoryNames('/admin/categories?sort=date&direction=asc'))->toBe(['Ancienne', 'Récente']);
});

test('an unknown sort falls back to the default instead of reaching the query', function () {
    category('Culture');

    $this->actingAs($this->author)
        ->get('/admin/categories?sort=password&direction=sideways')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.sort', 'name')
            ->where('filters.direction', 'asc'));
});

test('dates are labelled in French, long and short', function () {
    Category::factory()->create(['value' => 'Culture', 'created_at' => '2026-11-07 12:00:00']);

    $this->actingAs($this->author)
        ->get('/admin/categories')
        ->assertInertia(fn (Assert $page) => $page
            ->where('categories.data.0.createdAtLabel', '7 novembre 2026')
            ->where('categories.data.0.createdAtShortLabel', '7 nov. 2026'));
});

test('ADM-CAT-2 creating a category stores it and confirms', function () {
    $this->actingAs($this->author)
        ->from('/admin/categories?q=x&page=2')
        ->post('/admin/categories', ['name' => 'Économie'])
        ->assertRedirect('/admin/categories?q=x&page=2')
        ->assertInertiaFlash('success', 'Catégorie créée.');

    $this->assertDatabaseHas('categories', ['key' => 'ÉCONOMIE', 'value' => 'Économie']);
});

test('ADM-CAT-2 the name is validated, in French', function (mixed $name, string $message) {
    category('Politique');

    $this->actingAs($this->author)
        ->post('/admin/categories', ['name' => $name])
        ->assertSessionHasErrors(['name' => $message]);

    expect(Category::query()->count())->toBe(1);
})->with([
    'empty' => ['', 'Le nom de la catégorie est obligatoire.'],
    'blank' => ['   ', 'Le nom de la catégorie est obligatoire.'],
    'too long' => [str_repeat('a', 51), 'Le nom de la catégorie ne peut pas dépasser 50 caractères.'],
    'same case' => ['Politique', 'Cette catégorie existe déjà.'],
    'other case' => ['politique', 'Cette catégorie existe déjà.'],
]);

test('ADM-CAT-2 a name of exactly 50 characters is accepted', function () {
    $this->actingAs($this->author)
        ->post('/admin/categories', ['name' => str_repeat('é', 50)])
        ->assertSessionHasNoErrors();
});

test('ADM-CAT-6 the name of a deleted category can be reused', function () {
    category('Culture')->delete();

    $this->actingAs($this->author)
        ->post('/admin/categories', ['name' => 'culture'])
        ->assertSessionHasNoErrors();

    expect(Category::query()->where('value', 'culture')->exists())->toBeTrue();
});

test('ADM-CAT-6 the database itself refuses two live categories with the same name', function () {
    category('Culture');

    expect(fn () => Category::factory()->create(['value' => 'CULTURE']))
        ->toThrow(UniqueConstraintViolationException::class);
});

test('an article cannot be linked twice to the same category', function () {
    $category = category('Culture');
    $article = Article::factory()->create();
    $category->articles()->attach($article);

    expect(fn () => $category->articles()->attach($article))
        ->toThrow(UniqueConstraintViolationException::class);
});

test('ADM-CAT-4 renaming a category updates it and confirms', function () {
    $category = category('Culture');

    $this->actingAs($this->author)
        ->put("/admin/categories/{$category->id}", ['name' => 'Cultures'])
        ->assertInertiaFlash('success', 'Catégorie modifiée.');

    $this->assertDatabaseHas('categories', ['id' => $category->id, 'key' => 'CULTURES', 'value' => 'Cultures']);
});

test('ADM-CAT-4 a category can change only the case of its own name', function () {
    $category = category('Culture');

    $this->actingAs($this->author)
        ->put("/admin/categories/{$category->id}", ['name' => 'CULTURE'])
        ->assertSessionHasNoErrors();

    expect($category->fresh()->value)->toBe('CULTURE');
});

test('ADM-CAT-4 a category cannot take the name of another one', function () {
    category('Politique');
    $category = category('Culture');

    $this->actingAs($this->author)
        ->put("/admin/categories/{$category->id}", ['name' => 'politique'])
        ->assertSessionHasErrors(['name' => 'Cette catégorie existe déjà.']);

    expect($category->fresh()->value)->toBe('Culture');
});

test('ADM-CAT-5 deleting a category soft deletes it, detaches it and leaves its articles published', function () {
    $category = category('Culture');
    $article = Article::factory()->published()->create();
    $category->articles()->attach($article);

    $this->actingAs($this->author)
        ->from('/admin/categories?q=cul')
        ->delete("/admin/categories/{$category->id}")
        ->assertRedirect('/admin/categories?q=cul')
        ->assertInertiaFlash('success', 'Catégorie supprimée.');

    $this->assertSoftDeleted($category);
    $this->assertDatabaseMissing('article_categories', ['category_id' => $category->id]);

    expect($article->fresh()->isPublished())->toBeTrue();
});

test('a deleted category cannot be edited or deleted again', function (string $method) {
    $category = category('Culture');
    $category->delete();

    $this->actingAs($this->author)
        ->{$method}("/admin/categories/{$category->id}", ['name' => 'Autre'])
        ->assertNotFound();
})->with(['put', 'delete']);

test('renaming a category refreshes the crawl files that print its name', function () {
    $category = category('Culture');
    Cache::put(SeoCache::Feed, 'ancien flux');

    $this->actingAs($this->author)->put("/admin/categories/{$category->id}", ['name' => 'Cultures']);

    expect(Cache::has(SeoCache::Feed))->toBeFalse();
});

test('deleting a category refreshes the crawl files that print its name', function () {
    $category = category('Culture');
    Cache::put(SeoCache::Feed, 'ancien flux');

    $this->actingAs($this->author)->delete("/admin/categories/{$category->id}");

    expect(Cache::has(SeoCache::Feed))->toBeFalse();
});

describe('expired form', function () {
    beforeEach(function () {
        Route::middleware('web')->post('/admin/test-formulaire-expire', fn () => abort(419));
        Route::middleware('web')->post('/test-formulaire-expire', fn () => abort(419));
    });

    test('in the admin it goes back with a message, in a 303 so that a DELETE is not replayed', function () {
        $this->from('/admin/connexion')
            ->post('/admin/test-formulaire-expire')
            ->assertStatus(303)
            ->assertRedirect('/admin/connexion')
            ->assertInertiaFlash('error', 'La page a expiré. Réessayez.');
    });

    test('a JSON request keeps its 419', function () {
        $this->postJson('/admin/test-formulaire-expire')->assertStatus(419);
    });

    test('the public site keeps its 419', function () {
        $this->post('/test-formulaire-expire')->assertStatus(419);
    });
});
