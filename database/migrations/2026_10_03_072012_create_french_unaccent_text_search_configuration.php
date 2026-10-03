<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * French stemming on unaccented words: parses search queries into the same lexemes as `articles.search_vector`,
     * and lets `ts_headline` highlight accented words (« démocratie ») in the original text.
     *
     * Dropped first: `migrate:fresh` drops tables, not text search configurations, and there is no `IF NOT EXISTS`.
     */
    public function up(): void
    {
        DB::statement('DROP TEXT SEARCH CONFIGURATION IF EXISTS french_unaccent');
        DB::statement('CREATE TEXT SEARCH CONFIGURATION french_unaccent (COPY = french)');
        DB::statement('ALTER TEXT SEARCH CONFIGURATION french_unaccent ALTER MAPPING FOR hword, hword_part, word WITH unaccent, french_stem');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP TEXT SEARCH CONFIGURATION IF EXISTS french_unaccent');
    }
};
