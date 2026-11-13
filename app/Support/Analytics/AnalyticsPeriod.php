<?php

namespace App\Support\Analytics;

use Carbon\CarbonImmutable;

/**
 * Period of the analytics dashboard (ADM-ANA-1): the last 7, 28 (default) or 90 full days, ending yesterday,
 * compared with the same number of days just before.
 */
enum AnalyticsPeriod: int
{
    case Week = 7;
    case Month = 28;
    case Quarter = 90;

    public static function fromRequest(?string $value): self
    {
        return ctype_digit((string) $value) ? (self::tryFrom((int) $value) ?? self::Month) : self::Month;
    }

    /**
     * GA4 date range of the period itself, in the property's timezone.
     *
     * @return array{startDate: string, endDate: string}
     */
    public function currentRange(): array
    {
        return ['startDate' => "{$this->value}daysAgo", 'endDate' => 'yesterday'];
    }

    /**
     * GA4 date range of the days just before the period.
     *
     * @return array{startDate: string, endDate: string}
     */
    public function previousRange(): array
    {
        return ['startDate' => (2 * $this->value).'daysAgo', 'endDate' => ($this->value + 1).'daysAgo'];
    }

    public function startDate(?CarbonImmutable $today = null): CarbonImmutable
    {
        return $this->today($today)->subDays($this->value)->startOfDay();
    }

    public function endDate(?CarbonImmutable $today = null): CarbonImmutable
    {
        return $this->today($today)->subDay()->startOfDay();
    }

    /**
     * Label of the select option and of the caption: « 28 derniers jours ».
     */
    public function label(): string
    {
        return "{$this->value} derniers jours";
    }

    private function today(?CarbonImmutable $today): CarbonImmutable
    {
        return ($today ?? CarbonImmutable::now())->setTimezone(config()->string('app.display_timezone'));
    }
}
