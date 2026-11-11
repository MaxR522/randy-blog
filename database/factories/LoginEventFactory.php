<?php

namespace Database\Factories;

use App\Models\LoginEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LoginEvent>
 */
class LoginEventFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'ip' => fake()->ipv4(),
            'user_agent' => 'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
            'succeeded' => true,
            'two_factor_used' => false,
        ];
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => ['succeeded' => false]);
    }
}
