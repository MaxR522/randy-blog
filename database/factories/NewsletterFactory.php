<?php

namespace Database\Factories;

use App\Models\Newsletter;
use App\NewsletterAudience;
use App\NewsletterStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Newsletter>
 */
class NewsletterFactory extends Factory
{
    /**
     * A draft to all confirmed subscribers, the common case.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'subject' => fake()->sentence(5),
            'preheader' => fake()->sentence(8),
            'content' => '<p>'.fake()->paragraph().'</p>',
            'status' => NewsletterStatus::Draft,
            'audience' => NewsletterAudience::All,
        ];
    }

    public function sending(): static
    {
        return $this->state(fn (): array => [
            'status' => NewsletterStatus::Sending,
            'sent_at' => now(),
            'recipients_count' => 10,
            'sent_count' => 4,
        ]);
    }

    public function sent(): static
    {
        return $this->state(fn (): array => [
            'status' => NewsletterStatus::Sent,
            'sent_at' => now()->subDays(3),
            'recipients_count' => 10,
            'sent_count' => 10,
        ]);
    }

    public function partiallyFailed(): static
    {
        return $this->state(fn (): array => [
            'status' => NewsletterStatus::PartiallyFailed,
            'sent_at' => now()->subDays(3),
            'recipients_count' => 10,
            'sent_count' => 8,
            'failed_count' => 2,
        ]);
    }
}
