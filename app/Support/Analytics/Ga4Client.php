<?php

namespace App\Support\Analytics;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Minimal client of the GA4 Data API (spec §7.6), with no package: a service account JWT signed with `openssl_sign`
 * is exchanged for an access token, which is cached until shortly before it expires.
 */
class Ga4Client
{
    private const string TokenUrl = 'https://oauth2.googleapis.com/token';

    private const string ReportUrl = 'https://analyticsdata.googleapis.com/v1beta/properties';

    private const string Scope = 'https://www.googleapis.com/auth/analytics.readonly';

    private const string TokenCacheKey = 'analytics.ga4.access-token';

    private const int TimeoutSeconds = 45;

    /**
     * Google computes a report it has not seen lately in 3 to 30 seconds, and answers at once once it has: giving up
     * early only throws that work away, so one long wait and a single retry beat many short tries.
     */
    private const int Attempts = 2;

    /**
     * Google tokens last an hour; one is renewed five minutes early.
     */
    private const int TokenCacheSeconds = 3300;

    /**
     * Runs a `runReport` request on the configured property.
     *
     * @param  array<string, mixed>  $request  Body of the GA4 `runReport` call.
     * @return array<string, mixed>
     *
     * @throws Ga4Exception
     */
    public function runReport(array $request): array
    {
        $url = $this->reportUrl();

        try {
            $response = $this->request()
                ->withToken($this->accessToken())
                ->post($url, $request);
        } catch (ConnectionException $exception) {
            throw new Ga4Exception('GA4 is unreachable: '.$exception->getMessage(), previous: $exception);
        }

        if ($response->failed()) {
            throw new Ga4Exception("GA4 refused the report ({$response->status()}): ".$response->json('error.message', ''));
        }

        $report = $response->json();

        return is_array($report) ? $report : [];
    }

    /**
     * Runs several `runReport` requests at once: Google's answer time varies from one second to ten, so waiting for
     * them one after the other could outlast the web request.
     *
     * @param  array<string, array<string, mixed>>  $requests  Report bodies, keyed by name.
     * @return array<string, array<string, mixed>|null> Reports, with the same keys; null for a report still unanswered
     *                                                  after every attempt, so the others are not lost.
     *
     * @throws Ga4Exception
     */
    public function runReports(array $requests): array
    {
        $url = $this->reportUrl();
        $token = $this->accessToken();
        $reports = [];
        $pending = $requests;

        for ($attempt = 1; $attempt <= self::Attempts && $pending !== []; $attempt++) {
            $responses = Http::pool(function (Pool $pool) use ($pending, $token, $url): array {
                $calls = [];

                foreach ($pending as $name => $request) {
                    $calls[] = $pool->as((string) $name)
                        ->timeout(self::TimeoutSeconds)
                        ->withOptions(['force_ip_resolve' => 'v4'])
                        ->withToken($token)
                        ->post($url, $request);
                }

                return $calls;
            });

            foreach (array_keys($pending) as $name) {
                $response = $responses[$name] ?? null;

                if ($response instanceof Response && $response->successful()) {
                    $report = $response->json();
                    $reports[$name] = is_array($report) ? $report : [];
                    unset($pending[$name]);

                    continue;
                }

                if ($response instanceof Response && $response->status() < 500) {
                    throw new Ga4Exception("GA4 refused the report {$name} ({$response->status()}): ".$response->json('error.message', ''));
                }

            }
        }

        return [...array_fill_keys(array_keys($requests), null), ...$reports];
    }

    /**
     * @throws Ga4Exception
     */
    private function reportUrl(): string
    {
        $propertyId = config('services.google_analytics.property_id');

        if (! is_string($propertyId) && ! is_int($propertyId) || $propertyId === '') {
            throw new Ga4Exception('GA4 is not configured: set GOOGLE_ANALYTICS_PROPERTY_ID.');
        }

        return self::ReportUrl."/{$propertyId}:runReport";
    }

    /**
     * @throws Ga4Exception
     */
    private function accessToken(): string
    {
        $cached = Cache::get(self::TokenCacheKey);

        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        [$email, $privateKey] = $this->credentials();

        try {
            $response = $this->request()->asForm()->post(self::TokenUrl, [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $this->signedAssertion($email, $privateKey),
            ]);
        } catch (ConnectionException $exception) {
            throw new Ga4Exception('Google OAuth is unreachable: '.$exception->getMessage(), previous: $exception);
        }

        $token = $response->json('access_token');

        if ($response->failed() || ! is_string($token) || $token === '') {
            throw new Ga4Exception("Google refused the service account ({$response->status()}): ".$response->json('error_description', ''));
        }

        Cache::put(self::TokenCacheKey, $token, self::TokenCacheSeconds);

        return $token;
    }

    /**
     * @return array{0: string, 1: string} Service account email and PEM private key.
     *
     * @throws Ga4Exception
     */
    private function credentials(): array
    {
        $json = config('services.google_analytics.credentials_json');

        if (! is_string($json) || $json === '') {
            throw new Ga4Exception('GA4 is not configured: set GOOGLE_ANALYTICS_CREDENTIALS_JSON.');
        }

        $credentials = json_decode($json, true);
        $email = is_array($credentials) ? ($credentials['client_email'] ?? null) : null;
        $privateKey = is_array($credentials) ? ($credentials['private_key'] ?? null) : null;

        if (! is_string($email) || ! is_string($privateKey)) {
            throw new Ga4Exception('GOOGLE_ANALYTICS_CREDENTIALS_JSON is not a service account key (client_email, private_key).');
        }

        return [$email, $privateKey];
    }

    /**
     * @throws Ga4Exception
     */
    private function signedAssertion(string $email, string $privateKey): string
    {
        $issuedAt = time();
        $unsigned = $this->base64Url((string) json_encode(['alg' => 'RS256', 'typ' => 'JWT']))
            .'.'
            .$this->base64Url((string) json_encode([
                'iss' => $email,
                'scope' => self::Scope,
                'aud' => self::TokenUrl,
                'iat' => $issuedAt,
                'exp' => $issuedAt + 3600,
            ]));

        $signature = '';

        if (! @openssl_sign($unsigned, $signature, $privateKey, OPENSSL_ALGO_SHA256)) {
            throw new Ga4Exception('The service account private key could not sign the request.');
        }

        return $unsigned.'.'.$this->base64Url($signature);
    }

    /**
     * Google answers over IPv4 as well as IPv6. Where IPv6 is broken (a Docker network, some hosts), Guzzle tries it
     * first and hangs until the timeout on one call in two, so the dashboard asks for IPv4.
     */
    private function request(): PendingRequest
    {
        return Http::timeout(self::TimeoutSeconds)->withOptions(['force_ip_resolve' => 'v4']);
    }

    private function base64Url(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
