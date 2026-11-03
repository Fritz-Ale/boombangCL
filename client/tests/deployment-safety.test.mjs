import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Regresiones de seguridad de BoomBangCL: no requieren servicios ni credenciales.
const read = (path) => readFileSync(fileURLToPath(new URL('../' + path, import.meta.url)), 'utf8');

test('el cliente publica Line Awesome desde el directorio public', () => {
  const index = read('index.html');
  assert.match(index, /href="\/assets\/line-awesome\/css\/line-awesome\.min\.css"/);
});

test('el ejemplo de entorno local tiene endpoints propios y Stripe apagado', () => {
  const env = read('.env.example');
  for (const key of ['VITE_SERVER_URL', 'VITE_API_URL', 'VITE_API_BASE_URL', 'VITE_WEB_BASE_URL']) {
    assert.match(env, new RegExp('^' + key + '=', 'm'));
  }
  assert.match(env, /^VITE_ENABLE_STRIPE_CHECKOUT=false$/m);
});

test('el correo interno no usa una API de BoomBang ajena al proyecto', () => {
  const mail = read('src/views/components/game/lobby/MailPanelComponent.vue');
  assert.doesNotMatch(mail, /api\.boombang\.com/i);
});

test('Stripe permanece desactivado por defecto y requiere API explicita', () => {
  const shop = read('src/views/components/game/scenes/ShopComponent.vue');
  assert.match(shop, /VITE_ENABLE_STRIPE_CHECKOUT !== 'true'/);
  assert.match(shop, /VITE_API_BASE_URL \|\| import\.meta\.env\.VITE_API_URL/);
  assert.doesNotMatch(shop, /VITE_API_BASE_URL \|\| 'http:\/\/127\.0\.0\.1:8000'/);
});

test('un postMessage no divulga JWT ni acredita compras sin validacion del backend', () => {
  const shop = read('src/views/components/game/scenes/ShopComponent.vue');
  const listener = shop.split('const messageListener = (event) => {')[1]
    ?.split("window.addEventListener('message', messageListener)")[0];
  assert.ok(listener, 'El listener del checkout debe ser inspeccionable');
  assert.match(listener, /event\.source !== stripeWindow/);
  assert.match(listener, /allowedOrigins\.includes\(event\.origin\)/);
  assert.doesNotMatch(listener, /postMessage\s*\(/);
  assert.doesNotMatch(listener, /jwt_response|request_jwt_for_stripe|purchase-success/);
});
