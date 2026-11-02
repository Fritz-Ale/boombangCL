const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const serverRoot = path.resolve(__dirname, "..");
const clientRoot = path.resolve(serverRoot, "../client");

test("bloqueo del servidor y tween del cliente duran 630 ms", () => {
  const AnimationBlockTimerEnum = require("../src/enums/AnimationBlockTimerEnum");
  assert.equal(AnimationBlockTimerEnum.WALK, 630);

  const clientConfig = fs.readFileSync(path.join(clientRoot, "src/enums/AnimationsTimerEnum.js"), "utf8");
  assert.match(clientConfig, /WALK:\\s*630/);
});

test("el procesador programa cada ciclo de inicio a inicio, sin sumar cálculo de rutas", async () => {
  const source = fs.readFileSync(path.join(serverRoot, "src/instances/MovementProcessorInstance.js"), "utf8");
  const scheduled = [];
  const context = {
    module: { exports: {} },
    require: moduleName => {
      if (moduleName === "easystarjs") return { js: class {} };
      if (moduleName.endsWith("ConsoleLogger")) return class { log() {} };
      if (moduleName.endsWith("AnimationBlockTimerEnum")) return { WALK: 630 };
      return {};
    },
    setTimeout: (callback, delay) => { scheduled.push({ callback, delay }); return 1; },
    setInterval: () => 1,
    clearInterval: () => {},
    Date: { now: () => 1000 },
    console,
  };
  vm.runInNewContext(source, context, { filename: "MovementProcessorInstance.js" });
  const Processor = context.module.exports;
  const processor = new Processor({ users: [] });
  processor.startProcessing();
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].delay, 630);
  processor.stopProcessing();
});
