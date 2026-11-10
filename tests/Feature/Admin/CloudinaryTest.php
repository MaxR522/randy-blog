<?php

use App\MediaFolder;
use App\Support\Cloudinary\Cloudinary;
use App\Support\Cloudinary\CloudinaryException;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

const DestroyEndpoint = 'https://api.cloudinary.com/v1_1/randy/image/destroy';

beforeEach(function () {
    config(['services.cloudinary.url' => 'cloudinary://123456:s3cr3t@randy']);
});

test('deleting an image sends its public ID, whatever the stored transformations and version', function (string $url, string $publicId) {
    Http::fake([DestroyEndpoint => Http::response(['result' => 'ok'])]);

    app(Cloudinary::class)->delete($url);

    Http::assertSent(fn (Request $request) => $request->url() === DestroyEndpoint
        && $request['public_id'] === $publicId
        && $request['invalidate'] === 'true');
})->with([
    'new upload' => ['https://res.cloudinary.com/randy/image/upload/v1731234567/articles/abc123.jpg', 'articles/abc123'],
    'V1 cover with f_auto,q_70' => ['https://res.cloudinary.com/randy/image/upload/f_auto,q_70/v1712/couverture_xyz.png', 'couverture_xyz'],
    'no version' => ['https://res.cloudinary.com/randy/image/upload/avatars/randy.webp', 'avatars/randy'],
]);

test('images of another cloud or host, and empty values, are never deleted', function (?string $url) {
    Http::fake();

    app(Cloudinary::class)->delete($url);

    Http::assertNothingSent();
})->with([
    'another cloud' => ['https://res.cloudinary.com/someone-else/image/upload/v1/a.jpg'],
    'another host' => ['https://example.com/image/upload/a.jpg'],
    'no image' => [null],
]);

test('a failed delete is logged, never thrown', function () {
    Http::fake([DestroyEndpoint => Http::response(['error' => ['message' => 'boom']], 500)]);

    app(Cloudinary::class)->delete('https://res.cloudinary.com/randy/image/upload/v1/articles/a.jpg');

    Http::assertSentCount(1);
});

test('replacing an image uploads the new one, then deletes the previous one', function () {
    Http::fake([
        'https://api.cloudinary.com/v1_1/randy/image/upload' => Http::response(['secure_url' => 'https://res.cloudinary.com/randy/image/upload/v2/articles/new.jpg', 'width' => 1600, 'height' => 900]),
        DestroyEndpoint => Http::response(['result' => 'ok']),
    ]);

    $image = app(Cloudinary::class)->replace(UploadedFile::fake()->image('new.jpg'), MediaFolder::Articles, 'https://res.cloudinary.com/randy/image/upload/v1/articles/old.jpg');

    expect($image->url)->toBe('https://res.cloudinary.com/randy/image/upload/v2/articles/new.jpg');
    Http::assertSentInOrder([
        fn (Request $request) => str_ends_with($request->url(), '/image/upload'),
        fn (Request $request) => $request->url() === DestroyEndpoint && $request['public_id'] === 'articles/old',
    ]);
});

test('a failed upload keeps the previous image', function () {
    Http::fake(['https://api.cloudinary.com/v1_1/randy/image/upload' => Http::response([], 500)]);

    expect(fn () => app(Cloudinary::class)->replace(UploadedFile::fake()->image('new.jpg'), MediaFolder::Avatars, 'https://res.cloudinary.com/randy/image/upload/v1/avatars/old.jpg'))
        ->toThrow(CloudinaryException::class);

    Http::assertSentCount(1);
});
