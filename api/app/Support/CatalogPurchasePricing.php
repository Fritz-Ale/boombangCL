<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * Authoritative validation of in-game coin purchases.
 *
 * Database imports and existing rows may bypass Backpack validation.
 * Never let a malformed price/discount/currency generate free rewards or
 * increase a player's balance through a negative charge.
 */
final class CatalogPurchasePricing
{
    public static function total(mixed $price, mixed $discount, int $quantity, string $currency): int
    {
        if (!in_array($currency, ['golden_coins', 'silver_coins'], true)) {
            throw new InvalidArgumentException('Tipo de moneda no permitido para compras internas.');
        }
        if ($quantity < 1 || $quantity > 1000) {
            throw new InvalidArgumentException('Cantidad fuera del límite de compra.');
        }
        if (!is_numeric($price) || !is_numeric($discount)) {
            throw new InvalidArgumentException('Precio o descuento no numérico.');
        }

        $unitPrice = (float) $price;
        $percent = (float) $discount;
        if (!is_finite($unitPrice) || $unitPrice < 0 ||
            !is_finite($percent) || $percent < 0 || $percent > 100) {
            throw new InvalidArgumentException('Precio o descuento fuera de rango.');
        }

        $gross = $unitPrice * $quantity;
        if (!is_finite($gross) || $gross > PHP_INT_MAX) {
            throw new InvalidArgumentException('Precio total fuera del rango permitido.');
        }

        $total = $gross * (1 - $percent / 100);
        if (!is_finite($total) || $total < 0 || $total > PHP_INT_MAX) {
            throw new InvalidArgumentException('Precio total inválido.');
        }

        return (int) round($total);
    }
}
