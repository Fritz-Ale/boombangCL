<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catalog_items', function (Blueprint $table) {
            // La rareza no se infiere de estrellas: permite la clasificación por tirada.
            $table->string('rarity_code', 24)->default('comun')->index();
            // Una ficha de investigación no debe venderse hasta tener arte y configuración.
            $table->boolean('is_reference_only')->default(false)->index();
            $table->unsignedInteger('reference_copy_count')->nullable();
            $table->string('reference_source_url', 500)->nullable();
            $table->string('asset_rights_status', 24)->default('unverified');
        });
    }

    public function down(): void
    {
        Schema::table('catalog_items', function (Blueprint $table) {
            $table->dropIndex(['rarity_code']);
            $table->dropIndex(['is_reference_only']);
            $table->dropColumn([
                'rarity_code', 'is_reference_only', 'reference_copy_count',
                'reference_source_url', 'asset_rights_status',
            ]);
        });
    }
};
