<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Enable the unaccent extension
        DB::statement('CREATE EXTENSION IF NOT EXISTS unaccent');

        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255)->nullable(false);
            $table->text('content')->nullable(false);
            $table->text('raw_content')->nullable(false); // Add raw_content column
            $table->string('cover_photo')->nullable(true);
            $table->timestamp('published_date')->nullable(true);
            $table->string('slug')->unique()->nullable(false);
            $table->string('origin', 255)->nullable(true);
            $table->integer('views')->default(0);
            $table->integer('shares')->default(0);
            $table->integer('read_duration')->default(0);
            $table->enum('status', ['DRAFT', 'PUBLISHED', 'ARCHIVED'])->default('DRAFT');
            $table->foreignId('author_id')->constrained('users', 'id')->onDelete('cascade')->nullable(false);
            $table->softDeletes();
            $table->timestamps();
        });

        // Add the tsvector column without the generated expression
        DB::statement('ALTER TABLE articles ADD COLUMN search_vector tsvector');

        // Create the trigger function to update the tsvector column
        DB::statement("
            CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $$
            BEGIN
                NEW.search_vector := to_tsvector('french', unaccent(coalesce(NEW.title, '') || ' ' || coalesce(NEW.raw_content, '')));
                RETURN NEW;
            END
            $$ LANGUAGE plpgsql;
        ");

        // Create the trigger to call the function on insert and update
        DB::statement('
            CREATE TRIGGER trigger_update_search_vector
            BEFORE INSERT OR UPDATE ON articles
            FOR EACH ROW EXECUTE FUNCTION update_search_vector();
        ');

        // Create the GIN index on the tsvector column
        DB::statement('CREATE INDEX articles_search_vector_index ON articles USING GIN (search_vector)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
