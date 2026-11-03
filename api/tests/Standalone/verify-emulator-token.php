<?php
// Pruebas aisladas de la autenticación interna, sin instalar Laravel ni usar la BD.
namespace Symfony\Component\HttpFoundation {
    class Response {
        public function __construct(public array $data, public int $status = 200) {}
    }
}

namespace Illuminate\Http {
    class Request {
        public function __construct(private ?string $token = null) {}
        public function header(string $key): ?string {
            return $key === 'X-Emulator-Token' ? $this->token : null;
        }
    }
}

namespace {
    use Symfony\Component\HttpFoundation\Response;
    use Illuminate\Http\Request;

    final class AppStub {
        public function environment(string $name): bool {
            return $GLOBALS['testEnvironment'] === $name;
        }
    }
    function app(): AppStub { return new AppStub(); }
    function config(string $key): mixed {
        if ($key !== 'app.emulator_api_token') throw new \RuntimeException('Unexpected config key');
        return $GLOBALS['testConfiguredToken'];
    }
    function response(): object {
        return new class {
            public function json(array $data, int $status): Response {
                return new Response($data, $status);
            }
        };
    }

    require __DIR__ . '/../../app/Http/Middleware/VerifyEmulatorToken.php';

    $run = static function ($configured, $provided, string $environment): Response {
        $GLOBALS['testConfiguredToken'] = $configured;
        $GLOBALS['testEnvironment'] = $environment;
        $middleware = new \App\Http\Middleware\VerifyEmulatorToken();
        return $middleware->handle(
            new Request($provided),
            static fn (Request $request): Response => new Response(['ok' => true], 200)
        );
    };

    $cases = [
        ['null sin cabecera', null, null, 'production', 503],
        ['token vacío', '', '', 'production', 503],
        ['token placeholder', 'CHANGE_ME_EMULATOR_API_TOKEN', 'CHANGE_ME_EMULATOR_API_TOKEN', 'production', 503],
        ['sin cabecera con token válido', 'long-random-token', null, 'production', 401],
        ['token incorrecto', 'long-random-token', 'wrong-token', 'production', 401],
        ['token correcto', 'long-random-token', 'long-random-token', 'production', 200],
        ['desarrollo local', null, null, 'local', 200],
    ];
    foreach ($cases as [$name, $configured, $provided, $environment, $expected]) {
        $actual = $run($configured, $provided, $environment)->status;
        if ($actual !== $expected) {
            throw new \RuntimeException("$name: expected HTTP $expected, got $actual");
        }
        echo "OK: $name\n";
    }
}
