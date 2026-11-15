<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The audio version of an article, made by the author with Piper and stored on Cloudinary (spec Q1).
     */
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->string('audio_url')->nullable();
            $table->unsignedInteger('audio_duration')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn(['audio_url', 'audio_duration']);
        });
    }
};
