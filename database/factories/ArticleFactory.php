<?php

namespace Database\Factories;

use App\ArticleStatus;
use App\Models\Article;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Article>
 */
class ArticleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->unique()->sentence(6);
        $leadParagraph = fake()->paragraph();
        $content = fake()->paragraphs(5, true);

        return [
            'title' => $title,
            'slug' => Str::slug($title),
            'lead_paragraph' => "<p>{$leadParagraph}</p>",
            'content' => "<p>{$content}</p>",
            'raw_content' => "{$leadParagraph} {$content}",
            'cover_photo' => 'https://res.cloudinary.com/randy-blog/image/upload/f_auto,q_70/'.Str::random(20),
            'cover_photo_credit' => fake()->name(),
            'description' => fake()->text(160),
            'keywords' => implode(',', fake()->words(4)),
            'status' => ArticleStatus::Draft,
            'published_date' => null,
            'is_featured' => false,
            'author_id' => User::factory(),
        ];
    }

    /**
     * Indicate that the article is published, a few days ago by default.
     */
    public function published(?\DateTimeInterface $publishedDate = null): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ArticleStatus::Published,
            'published_date' => $publishedDate ?? fake()->dateTimeBetween('-1 year', '-1 hour'),
        ]);
    }

    /**
     * Indicate that the article was published and then archived.
     */
    public function archived(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ArticleStatus::Archived,
            'published_date' => fake()->dateTimeBetween('-1 year', '-1 hour'),
        ]);
    }

    /**
     * Indicate that the article is the featured one.
     */
    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }
}
