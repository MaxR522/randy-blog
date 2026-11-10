<?php

namespace App\Support\Cloudinary;

use App\MediaFolder;
use App\Support\CloudinaryUrl;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Authenticated uploads to Cloudinary through its signed Upload API (spec §7.5), without the SDK.
 *
 * Every upload is optimized before Cloudinary stores it: at most 2400 px on the long side (the lightbox's
 * full size) and an automatic quality. The format is chosen later, at delivery (`f_auto`), since an
 * incoming transformation must not use it.
 */
#[Singleton]
class Cloudinary
{
    public const string IncomingTransformation = 'c_limit,w_2400,h_2400,q_auto:good';

    private const string ApiUrl = 'https://api.cloudinary.com/v1_1';

    private const int TimeoutSeconds = 30;

    public function __construct(
        #[Config('services.cloudinary.url')] private readonly ?string $url = null,
    ) {}

    /**
     * Upload an image into the folder and return its delivery URL and size.
     *
     * @throws CloudinaryException
     */
    public function upload(UploadedFile $file, MediaFolder $folder): UploadedImage
    {
        $credentials = $this->credentials();

        try {
            $response = Http::timeout(self::TimeoutSeconds)
                ->attach('file', (string) file_get_contents($file->getRealPath()), $file->getClientOriginalName())
                ->post(self::ApiUrl."/{$credentials['cloud']}/image/upload", $this->signed([
                    'folder' => $folder->value,
                    'transformation' => self::IncomingTransformation,
                ], $credentials));
        } catch (ConnectionException $exception) {
            throw new CloudinaryException('Cloudinary is unreachable: '.$exception->getMessage(), previous: $exception);
        }

        $url = $response->json('secure_url');

        if ($response->failed() || ! is_string($url)) {
            throw new CloudinaryException("Cloudinary refused the upload ({$response->status()}): ".$response->json('error.message', ''));
        }

        return new UploadedImage($url, (int) $response->json('width'), (int) $response->json('height'));
    }

    /**
     * Delete the image behind a delivery URL. URLs of other clouds or hosts are left alone, and a failure is
     * only logged: an orphan file must never block a save.
     */
    public function delete(?string $url): void
    {
        $asset = $url === null ? null : CloudinaryUrl::parse($url);

        if ($asset === null) {
            return;
        }

        try {
            $credentials = $this->credentials();

            if ($asset['cloud'] !== $credentials['cloud']) {
                return;
            }

            $response = Http::timeout(self::TimeoutSeconds)
                ->asForm()
                ->post(self::ApiUrl."/{$credentials['cloud']}/image/destroy", $this->signed([
                    'invalidate' => 'true',
                    'public_id' => $asset['publicId'],
                ], $credentials));

            if ($response->failed() || ! in_array($response->json('result'), ['ok', 'not found'], true)) {
                Log::warning('Cloudinary could not delete an image.', ['url' => $url, 'status' => $response->status(), 'body' => $response->body()]);
            }
        } catch (CloudinaryException|ConnectionException $exception) {
            Log::warning('Cloudinary could not delete an image.', ['url' => $url, 'error' => $exception->getMessage()]);
        }
    }

    /**
     * Upload the new image, then delete the one it replaces (covers, avatar).
     *
     * @throws CloudinaryException
     */
    public function replace(UploadedFile $file, MediaFolder $folder, ?string $previousUrl): UploadedImage
    {
        $image = $this->upload($file, $folder);

        if ($previousUrl !== null && $previousUrl !== $image->url) {
            $this->delete($previousUrl);
        }

        return $image;
    }

    /**
     * Add the timestamp, API key and signature: SHA-1 of the sorted `key=value` pairs followed by the secret.
     *
     * @param  array<string, string>  $parameters
     * @param  array{cloud: string, key: string, secret: string}  $credentials
     * @return array<string, string>
     */
    private function signed(array $parameters, array $credentials): array
    {
        $parameters['timestamp'] = (string) now()->getTimestamp();
        ksort($parameters);

        $toSign = implode('&', array_map(
            fn (string $key, string $value): string => "{$key}={$value}",
            array_keys($parameters),
            $parameters,
        ));

        return [
            ...$parameters,
            'api_key' => $credentials['key'],
            'signature' => sha1($toSign.$credentials['secret']),
        ];
    }

    /**
     * Credentials from `CLOUDINARY_URL` (`cloudinary://key:secret@cloud`).
     *
     * @return array{cloud: string, key: string, secret: string}
     *
     * @throws CloudinaryException
     */
    private function credentials(): array
    {
        $parts = parse_url((string) $this->url);

        if (($parts['scheme'] ?? null) !== 'cloudinary' || empty($parts['host']) || empty($parts['user']) || empty($parts['pass'])) {
            throw new CloudinaryException('CLOUDINARY_URL is missing or malformed.');
        }

        return ['cloud' => $parts['host'], 'key' => rawurldecode($parts['user']), 'secret' => rawurldecode($parts['pass'])];
    }
}
