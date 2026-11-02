<?php
declare(strict_types=1);

require __DIR__ . '/../../app/Support/CatalogPurchasePricing.php';

use App\Support\CatalogPurchasePricing as Pricing;

$valid = [
    [100, 0, 1, 'golden_coins', 100],
    [100, 10, 3, 'silver_coins', 270],
    [101, 50, 3, 'golden_coins', 152],
    [0, 0, 1, 'golden_coins', 0],
    [100, 100, 1, 'silver_coins', 0],
    [1, 0, 1000, 'golden_coins', 1000],
];
foreach ($valid as [$price, $discount, $quantity, $currency, $expected]) {
    $actual = Pricing::total($price, $discount, $quantity, $currency);
    if ($actual !== $expected) {
        throw new RuntimeException("Wrong total: expected $expected, got $actual");
    }
}

$invalid = [
    [-100, 0, 1, 'golden_coins'],
    [100, -1, 1, 'golden_coins'],
    [100, 101, 1, 'golden_coins'],
    [100, 0, 1, 'unsupported_currency'],
    [100, 0, 1, 'stripe_payment'],
    ['not-a-price', 0, 1, 'golden_coins'],
    [100, 'bad', 1, 'golden_coins'],
    [INF, 0, 1, 'silver_coins'],
    [100, INF, 1, 'silver_coins'],
    [100, 0, 0, 'golden_coins'],
    [100, 0, 1001, 'golden_coins'],
    [PHP_INT_MAX, 0, 1000, 'golden_coins'],
];
foreach ($invalid as [$price, $discount, $quantity, $currency]) {
    try {
        Pricing::total($price, $discount, $quantity, $currency);
        throw new RuntimeException('Invalid purchase was accepted');
    } catch (InvalidArgumentException $expected) {
        // Expected: fail closed before charging or delivering a reward.
    }
}

echo "OK: safe currencies, totals, limits and invalid purchase rejection\n";
