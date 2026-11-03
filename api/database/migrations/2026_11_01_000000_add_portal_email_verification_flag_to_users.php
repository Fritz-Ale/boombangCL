<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Only new portal registrations require verification.
            // Existing game accounts remain unaffected until migrated deliberately.
            $table->timestamp('portal_email_verification_required_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('portal_email_verification_required_at');
        });
    }
};
