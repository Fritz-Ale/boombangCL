<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('portal_friendships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_low_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('user_high_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->string('status', 12)->default('pending');
            $table->timestamps();
            $table->unique(['user_low_id', 'user_high_id']);
        });

        Schema::create('portal_clans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('name', 40)->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('portal_clan_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clan_id')->constrained('portal_clans')->cascadeOnDelete();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('portal_clan_invites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('clan_id')->constrained('portal_clans')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('invited_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['clan_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('portal_clan_invites');
        Schema::dropIfExists('portal_clan_members');
        Schema::dropIfExists('portal_clans');
        Schema::dropIfExists('portal_friendships');
    }
};
