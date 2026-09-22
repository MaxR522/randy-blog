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
        Schema::table('articles', function (Blueprint $table) {
            // Drop the trigger
            DB::statement('DROP TRIGGER IF EXISTS trigger_update_keywords ON articles');

            // Drop the trigger function
            DB::statement('DROP FUNCTION IF EXISTS update_keywords()');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the keywords column
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn('keywords');
        });
    }
};
