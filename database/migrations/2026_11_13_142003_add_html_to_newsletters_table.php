<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The email as rendered when « Envoyer » was clicked (ADM-SUB-27), with a placeholder for each subscriber's
     * unsubscribe link: every recipient gets the same email, and a sent newsletter keeps showing what went out.
     */
    public function up(): void
    {
        Schema::table('newsletters', function (Blueprint $table) {
            $table->longText('html')->nullable()->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('newsletters', function (Blueprint $table) {
            $table->dropColumn('html');
        });
    }
};
