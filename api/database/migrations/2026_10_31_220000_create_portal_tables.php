<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('portal_news', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title', 120);
            $table->text('body');
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('portal_threads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title', 120);
            $table->text('body');
            $table->boolean('is_locked')->default(false);
            $table->timestamps();
        });

        Schema::create('portal_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thread_id')->constrained('portal_threads')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('portal_chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('body', 400);
            $table->timestamps();
        });

        // Only measures recent activity in this web portal, NOT game-server players.
        Schema::create('portal_presence', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained('users')->cascadeOnDelete();
            $table->timestamp('last_seen_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('portal_presence');
        Schema::dropIfExists('portal_chat_messages');
        Schema::dropIfExists('portal_replies');
        Schema::dropIfExists('portal_threads');
        Schema::dropIfExists('portal_news');
    }
};
