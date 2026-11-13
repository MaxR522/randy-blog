<?php

namespace Database\Factories;

use App\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subscription>
 */
class SubscriptionFactory extends Factory
{
    /**
     * A confirmed subscriber, the common case.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'email' => fake()->unique()->safeEmail(),
            'is_verified' => true,
            'verified_at' => now(),
            'confirmed_ip' => fake()->ipv4(),
            'last_confirmation_sent_at' => now(),
            'unsubscribed_at' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (): array => [
            'is_verified' => false,
            'verified_at' => null,
            'confirmed_ip' => null,
        ]);
    }

    public function unsubscribed(): static
    {
        return $this->state(fn (): array => ['unsubscribed_at' => now()]);
    }

    /**
     * Soft deleted, as some V1 rows are. V2 erases for good (ADM-SUB-4).
     */
    public function trashed(): static
    {
        return $this->state(fn (): array => ['deleted_at' => now()]);
    }
}
