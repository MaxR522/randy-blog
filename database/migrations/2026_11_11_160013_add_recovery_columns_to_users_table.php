<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Recovery email and phone of the Security tab (ADM-SEC-1, ADM-SEC-2, spec §7.3.2). The phone is stored only
     * until an SMS provider is chosen (Q6), so its verification date stays empty.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('recovery_email')->nullable();
            $table->timestamp('recovery_email_verified_at')->nullable();
            $table->string('recovery_phone', 32)->nullable();
            $table->timestamp('recovery_phone_verified_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['recovery_email', 'recovery_email_verified_at', 'recovery_phone', 'recovery_phone_verified_at']);
        });
    }
};
