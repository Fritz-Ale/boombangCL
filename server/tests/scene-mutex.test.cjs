const test = require('node:test');
const assert = require('node:assert/strict');
const mutex = require('../src/utils/SceneMutex');

test('un solo usuario adquiere el bloqueo de la misma sala por turno', async () => {
  const first = await mutex.acquire('test-room-fifo');
  const order = [];
  let current = 1, max = 1;
  const enter = async (name) => {
    const release = await mutex.acquire('test-room-fifo');
    current++;
    max = Math.max(max, current);
    order.push(name);
    await new Promise(resolve => setImmediate(resolve));
    current--;
    release();
  };
  const second = enter('segundo');
  const third = enter('tercero');
  await Promise.resolve();
  assert.deepEqual(order, [], 'no deben entrar mientras primero tiene el lock');
  current--;
  first();
  await Promise.all([second, third]);
  assert.deepEqual(order, ['segundo', 'tercero']);
  assert.equal(max, 1, 'no se permite acceso simultáneo');
});

test('dos salas diferentes no se bloquean mutuamente', async () => {
  const first = await mutex.acquire('room-a-independent');
  const second = await mutex.acquire('room-b-independent');
  assert.equal(typeof first, 'function');
  assert.equal(typeof second, 'function');
  first();
  second();
});

test('doble liberación no deja entrar a dos usuarios a la vez', async () => {
  const first = await mutex.acquire('room-double-release');
  const acquired = [];
  const secondPromise = mutex.acquire('room-double-release').then(release => {
    acquired.push('second'); return release;
  });
  const thirdPromise = mutex.acquire('room-double-release').then(release => {
    acquired.push('third'); return release;
  });
  first();
  first();
  const second = await secondPromise;
  assert.deepEqual(acquired, ['second']);
  second();
  const third = await thirdPromise;
  assert.deepEqual(acquired, ['second', 'third']);
  third();
});

test('adquisición posterior funciona después de liberar la cola', async () => {
  const release = await mutex.acquire('room-reusable');
  release();
  const next = await mutex.acquire('room-reusable');
  next();
});
