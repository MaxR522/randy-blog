<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Double opt-in proof and resend throttling (spec §7.3.2, NFR-PRIV-2, PUB-SUB-5). Additive only: V1 rows keep their meaning.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('confirmed_ip', 45)->nullable()->after('verified_at');
            $table->timestamp('last_confirmation_sent_at')->nullable()->after('confirmed_ip');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropColumn(['confirmed_ip', 'last_confirmation_sent_at']);
        });
    }
};
