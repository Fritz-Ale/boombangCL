<?php
// Comprueba config/database.php con PHP 8.2 y PHP 8.5 sin Composer.
namespace Illuminate\Support {
    class Str {
        public static function slug(string $value, string $separator = '-'): string {
            return 'laravel';
        }
    }
}

namespace {
    function env(string $key, mixed $default = null): mixed {
        return $key === 'MYSQL_ATTR_SSL_CA' ? '/tmp/test-ca.pem' : $default;
    }
    function database_path(string $file): string { return '/tmp/'.$file; }

    error_reporting(E_ALL);
    set_error_handler(static function (int $severity, string $message): never {
        throw new \ErrorException($message, 0, $severity);
    });

    $config = require __DIR__ . '/../../config/database.php';
    if (!extension_loaded('pdo_mysql')) {
        echo "SKIP: extensión pdo_mysql no disponible\n";
        exit(0);
    }
    $attribute = defined(\Pdo\Mysql::class.'::ATTR_SSL_CA')
        ? \Pdo\Mysql::ATTR_SSL_CA
        : \PDO::MYSQL_ATTR_SSL_CA;

    foreach (['mysql', 'mariadb'] as $driver) {
        $options = $config['connections'][$driver]['options'];
        if (($options[$attribute] ?? null) !== '/tmp/test-ca.pem') {
            throw new \RuntimeException("Atributo de CA SSL incorrecto en $driver");
        }
        echo "OK: atributo de CA SSL para $driver\n";
    }
}
