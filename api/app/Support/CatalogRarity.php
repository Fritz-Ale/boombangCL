<?php

namespace App\Support;

/**
 * Etiquetas editoriales compatibles con la clasificación anunciada por BoomBang
 * en 2026. No implica afiliación ni sincronización de sus inventarios.
 *
 * Números de copias = ejemplares en circulación en el catálogo de referencia,
 * nunca una promesa de escasez dentro de BoomBangCL.
 */
final class CatalogRarity
{
    public const LABELS = [
        'comun' => 'Común',
        'singular' => 'Singular',
        'duo' => 'Dúo',
        'triada' => 'Tríada',
        'casi_unico' => 'Casi único',
        'excepcional' => 'Excepcional',
        'legendario' => 'Legendario',
        'reliquia' => 'Reliquia',
        'muy_rare' => 'Muy rare',
        'rare' => 'Rare',
        'ltd' => 'LTD (limitado)',
        'evento' => 'Evento',
    ];

    public static function labels(): array
    {
        return self::LABELS;
    }

    public static function label(?string $code): string
    {
        return self::LABELS[$code ?? ''] ?? self::LABELS['comun'];
    }

    public static function fromCopies(int $copies): string
    {
        if ($copies < 1) {
            throw new \InvalidArgumentException('La cantidad de copias debe ser positiva.');
        }
        if ($copies === 1) return 'singular';
        if ($copies === 2) return 'duo';
        if ($copies === 3) return 'triada';
        if ($copies <= 10) return 'casi_unico';
        if ($copies <= 25) return 'excepcional';
        if ($copies <= 50) return 'legendario';
        if ($copies <= 100) return 'reliquia';
        if ($copies <= 250) return 'muy_rare';
        return 'rare';
    }
}
