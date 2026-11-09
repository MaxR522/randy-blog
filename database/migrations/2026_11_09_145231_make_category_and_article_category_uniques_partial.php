<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A deleted category frees its name, and names are unique whatever their case (ADM-CAT-2, ADM-CAT-6).
     * An article is linked to a category only once (spec §7.3.2).
     */
    public function up(): void
    {
        DB::statement('
            DELETE FROM article_categories duplicate
            USING article_categories kept
            WHERE duplicate.article_id = kept.article_id
                AND duplicate.category_id = kept.category_id
                AND duplicate.id > kept.id
        ');

        Schema::table('article_categories', function (Blueprint $table) {
            $table->unique(['article_id', 'category_id']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique(['key']);
            $table->dropUnique(['value']);
        });

        DB::statement('CREATE UNIQUE INDEX categories_live_key_unique ON categories (key) WHERE deleted_at IS NULL');
        DB::statement('CREATE UNIQUE INDEX categories_live_value_unique ON categories (lower(value)) WHERE deleted_at IS NULL');
    }

    /**
     * Fails if a deleted category's name has been reused, since the old indexes also covered deleted rows.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX categories_live_key_unique');
        DB::statement('DROP INDEX categories_live_value_unique');

        Schema::table('categories', function (Blueprint $table) {
            $table->unique('key');
            $table->unique('value');
        });

        Schema::table('article_categories', function (Blueprint $table) {
            $table->dropUnique(['article_id', 'category_id']);
        });
    }
};
