<?php

use App\Models\User;
use App\Support\Cloudinary\Cloudinary;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

const UploadEndpoint = 'https://api.cloudinary.com/v1_1/randy/image/upload';

beforeEach(function () {
    config(['services.cloudinary.url' => 'cloudinary://123456:s3cr3t@randy']);
    $this->author = User::factory()->create();
});

/**
 * @param  array<int, array{name: string, contents: mixed}>  $parts
 * @return array<string, mixed>
 */
function multipartFields(Request $request): array
{
    return collect($request->data())->mapWithKeys(fn (array $part) => [$part['name'] => $part['contents']])->all();
}

test('ADM-COM-8 guests get a 404 and nothing is uploaded', function () {
    Http::fake();

    $this->post(route('admin.media.store'), ['image' => UploadedFile::fake()->image('a.jpg'), 'folder' => 'articles'])
        ->assertNotFound();

    Http::assertNothingSent();
});

test('ADM-ART-53 an editor image goes to Cloudinary, optimized and signed, and its URL comes back for TinyMCE', function () {
    $this->freezeTime();
    Http::fake([UploadEndpoint => Http::response([
        'secure_url' => 'https://res.cloudinary.com/randy/image/upload/v1/articles/abc.jpg',
        'width' => 2400,
        'height' => 1600,
    ])]);

    $this->actingAs($this->author)
        ->postJson(route('admin.media.store'), ['image' => UploadedFile::fake()->image('marché.jpg', 4000, 3000), 'folder' => 'newsletters'])
        ->assertCreated()
        ->assertExactJson([
            'location' => 'https://res.cloudinary.com/randy/image/upload/v1/articles/abc.jpg',
            'width' => 2400,
            'height' => 1600,
        ]);

    $timestamp = now()->getTimestamp();

    Http::assertSent(function (Request $request) use ($timestamp) {
        $fields = multipartFields($request);

        return $request->url() === UploadEndpoint
            && $fields['folder'] === 'newsletters'
            && $fields['transformation'] === 'c_limit,w_2400,h_2400,q_auto:good'
            && $fields['api_key'] === '123456'
            && $fields['timestamp'] === (string) $timestamp
            && $fields['signature'] === sha1("folder=newsletters&timestamp={$timestamp}&transformation=c_limit,w_2400,h_2400,q_auto:goods3cr3t");
    });
});

test('invalid uploads are refused in French before reaching Cloudinary', function (array $payload, string $field, string $message) {
    Http::fake();

    $this->actingAs($this->author)
        ->postJson(route('admin.media.store'), $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors([$field => $message]);

    Http::assertNothingSent();
})->with([
    'no file' => [['folder' => 'articles'], 'image', 'Choisissez une image.'],
    'a PDF' => [fn () => ['image' => UploadedFile::fake()->create('a.pdf', 10, 'application/pdf'), 'folder' => 'articles'], 'image', 'Le fichier doit être une image JPG, PNG, WebP ou GIF.'],
    'over 10 MB' => [fn () => ['image' => UploadedFile::fake()->image('a.jpg')->size(10241), 'folder' => 'articles'], 'image', 'L’image ne doit pas dépasser 10 Mo.'],
    'the avatars folder' => [fn () => ['image' => UploadedFile::fake()->image('a.jpg'), 'folder' => 'avatars'], 'folder', 'Ce dossier de destination n’est pas autorisé.'],
]);

test('an image of exactly 10 MB is accepted', function () {
    Http::fake([UploadEndpoint => Http::response(['secure_url' => 'https://res.cloudinary.com/randy/image/upload/v1/articles/big.jpg', 'width' => 2400, 'height' => 1600])]);

    $this->actingAs($this->author)
        ->postJson(route('admin.media.store'), ['image' => UploadedFile::fake()->image('big.jpg')->size(10240), 'folder' => 'articles'])
        ->assertCreated();
});

test('a Cloudinary failure gives a French error instead of a URL', function () {
    Http::fake([UploadEndpoint => Http::response(['error' => ['message' => 'Invalid Signature']], 401)]);

    $this->actingAs($this->author)
        ->postJson(route('admin.media.store'), ['image' => UploadedFile::fake()->image('a.jpg'), 'folder' => 'articles'])
        ->assertStatus(502)
        ->assertExactJson(['message' => 'L’image n’a pas pu être envoyée. Réessayez dans quelques instants.']);
});

test('a missing CLOUDINARY_URL gives the same French error without any request', function () {
    config(['services.cloudinary.url' => null]);
    app()->forgetInstance(Cloudinary::class);
    Http::fake();

    $this->actingAs($this->author)
        ->postJson(route('admin.media.store'), ['image' => UploadedFile::fake()->image('a.jpg'), 'folder' => 'articles'])
        ->assertStatus(502);

    Http::assertNothingSent();
});
