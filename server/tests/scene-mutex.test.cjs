const test = require("node:test");
const assert = require("node:assert/strict");
const sceneMutex = require("../src/utils/SceneMutex");

test("una misma escena se entrega en orden FIFO y sin solapamiento", async () => {
  const releaseFirst = await sceneMutex.acquire("fifa");
  const acquired = [];
  let secondRelease;
  const second = sceneMutex.acquire("fifa").then(release => {
    acquired.push("segundo");
    secondRelease = release;
  });
  const third = sceneMutex.acquire("fifa").then(release => {
    acquired.push("tercero");
    return release;
  });

  await Promise.resolve();
  assert.deepEqual(acquired, []);
  releaseFirst();
  await second;
  assert.deepEqual(acquired, ["segundo"]);
  await Promise.resolve();
  assert.deepEqual(acquired, ["segundo"], "el tercero debe esperar al segundo");
  secondRelease();
  const thirdRelease = await third;
  assert.deepEqual(acquired, ["segundo", "tercero"]);
  thirdRelease();
});

test("dos escenas independientes pueden trabajar al mismo tiempo", async () => {
  const first = await sceneMutex.acquire("escena-a");
  const second = await sceneMutex.acquire("escena-b");
  assert.equal(typeof first, "function");
  assert.equal(typeof second, "function");
  second();
  first();
});

test("release repetido no entrega el bloqueo a más de un usuario", async () => {
  const first = await sceneMutex.acquire("escena-repeat");
  let thirdGranted = false;
  const second = sceneMutex.acquire("escena-repeat");
  const third = sceneMutex.acquire("escena-repeat").then(release => {
    thirdGranted = true;
    return release;
  });
  first();
  first();
  const releaseSecond = await second;
  await Promise.resolve();
  assert.equal(thirdGranted, false);
  releaseSecond();
  (await third)();
});

test("carga concurrente de 100 ingresos nunca se solapa", async () => {
  let inside = 0;
  let maxInside = 0;
  const order = [];
  await Promise.all(Array.from({ length: 100 }, (_, index) => (async () => {
    const release = await sceneMutex.acquire("escena-carga");
    inside++;
    maxInside = Math.max(maxInside, inside);
    order.push(index);
    await Promise.resolve();
    inside--;
    release();
  })()));
  assert.equal(maxInside, 1);
  assert.deepEqual(order, Array.from({ length: 100 }, (_, i) => i));
  assert.equal(sceneMutex.queues.has("escena-carga"), false);
});
