<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Old slugs of articles whose URL changed after publication, answered with a 301 (ADM-ART-64).
     */
    public function up(): void
    {
        Schema::create('article_slug_redirects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->cascadeOnDelete();
            $table->string('old_slug')->unique();
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article_slug_redirects');
    }
};
