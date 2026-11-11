<?php

namespace App\Support;

/**
 * Browser, system and device type read from a user agent string, for « Appareils connectés » and the login history
 * (ADM-SEC-5, ADM-SEC-6). It only knows the common browsers: one author with a few devices does not need a full
 * device database.
 */
final readonly class UserAgent
{
    public const string Desktop = 'ordinateur';

    public const string Mobile = 'mobile';

    public const string Tablet = 'tablette';

    /**
     * Checked in order: Chromium-based browsers also announce « Chrome » and « Safari », so they come first.
     *
     * @var array<string, string>
     */
    private const array Browsers = [
        'Edge' => '/\bEdg(?:e|A|iOS)?\//',
        'Opera' => '/\b(?:OPR|Opera|OPT)\//',
        'Samsung Internet' => '/\bSamsungBrowser\//',
        'Firefox' => '/\b(?:Firefox|FxiOS)\//',
        'Chrome' => '/\b(?:Chrome|CriOS)\//',
        'Safari' => '/\bVersion\/[\d.]+.*\bSafari\//',
    ];

    /**
     * @var array<string, string>
     */
    private const array Systems = [
        'iPadOS' => '/\biPad\b/',
        'iOS' => '/\b(?:iPhone|iPod)\b/',
        'Android' => '/\bAndroid\b/',
        'ChromeOS' => '/\bCrOS\b/',
        'Windows' => '/\bWindows\b/',
        'macOS' => '/\bMacintosh\b/',
        'Linux' => '/\bLinux\b/',
    ];

    public function __construct(
        public ?string $browser,
        public ?string $system,
        public string $deviceType,
    ) {}

    public static function fromString(?string $userAgent): self
    {
        $userAgent ??= '';

        $browser = self::firstMatch(self::Browsers, $userAgent);
        $system = self::firstMatch(self::Systems, $userAgent);

        return new self($browser, $system, self::deviceType($system, $userAgent));
    }

    /**
     * « Firefox · Linux · ordinateur », as in the devices table.
     */
    public function label(): string
    {
        return implode(' · ', [$this->shortLabel(), $this->deviceType]);
    }

    /**
     * « Firefox · Linux », as in the login history and the phone cards.
     */
    public function shortLabel(): string
    {
        $parts = array_filter([$this->browser ?? 'Navigateur inconnu', $this->system]);

        return implode(' · ', $parts);
    }

    /**
     * @param  array<string, string>  $patterns
     */
    private static function firstMatch(array $patterns, string $userAgent): ?string
    {
        foreach ($patterns as $name => $pattern) {
            if (preg_match($pattern, $userAgent) === 1) {
                return $name;
            }
        }

        return null;
    }

    /**
     * Android tablets drop « Mobile » from their user agent; iPads say « iPad », except recent ones in desktop mode,
     * which cannot be told from a Mac.
     */
    private static function deviceType(?string $system, string $userAgent): string
    {
        return match (true) {
            $system === 'iPadOS', $system === 'Android' && ! str_contains($userAgent, 'Mobile') => self::Tablet,
            $system === 'iOS', $system === 'Android', str_contains($userAgent, 'Mobile') => self::Mobile,
            default => self::Desktop,
        };
    }
}
