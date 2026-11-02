const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { EventEmitter } = require("node:events");

const root = path.resolve(__dirname, "..");
const avatarEnum = { BOOMER: 1, GATA: 5, RASTA: 12, BRUJITA: 2, INDIA: 7, LILIAN: 8, MODERN: 10 };
const avatarNames = { 1: "boomer", 5: "gata", 12: "rasta" };

function loadClass(filename, exportName, sandbox) {
  const source = fs.readFileSync(path.join(root, filename), "utf8")
    .replace(/^import .*?;.*$/gm, "")
    .replace(/^export default .*?;.*$/gm, `globalThis.TestedClass = ${exportName};`);
  const context = vm.createContext({
    EventEmitter, AvatarEnum: avatarEnum, setInterval: () => 1,
    clearInterval: () => {}, setTimeout, Date, console, ...sandbox,
  });
  vm.runInContext(source, context, { filename });
  return context.TestedClass;
}

test("un avatar solo está disponible si el atlas Phaser existe", () => {
  const loaded = new Set();
  const loader = new EventEmitter();
  loader.requestPriorityLoad = () => {};
  const System = loadClass("src/phaser/managers/SmartAvatarSystem.js", "SmartAvatarSystem", {
    backgroundAvatarLoader: loader,
    avatarManager: { getAvatarName: id => avatarNames[id] || "unknown" },
  });
  const system = new System();
  system.currentScene = { textures: { exists: key => loaded.has(key) } };
  system.availableAvatars.add(avatarEnum.RASTA); // Estado en memoria incorrecto.
  assert.equal(system.isAvatarAvailable(avatarEnum.RASTA), false);
  loaded.add("rasta_atlas");
  assert.equal(system.isAvatarAvailable(avatarEnum.RASTA), true);
});

test("se pide carga del original y del respaldo si faltan ambos", () => {
  const requested = [];
  const loader = new EventEmitter();
  loader.requestPriorityLoad = id => requested.push(id);
  const System = loadClass("src/phaser/managers/SmartAvatarSystem.js", "SmartAvatarSystem", {
    backgroundAvatarLoader: loader,
    avatarManager: { getAvatarName: id => avatarNames[id] || "unknown" },
  });
  const system = new System();
  system.currentScene = { textures: { exists: () => false } };
  const selection = system.getAvatarForUser("socket-123", avatarEnum.BOOMER);
  assert.equal(selection.avatarId, avatarEnum.RASTA);
  assert.equal(selection.isFallback, true);
  assert.deepEqual(requested, [avatarEnum.BOOMER, avatarEnum.RASTA]);
  assert.equal(system.activeAvatars.has("socket-123"), true);
});

test("el cargador resuelve nombres de atlas y no usa IDs numéricos", async () => {
  const textures = new Set();
  const markedLoaded = new Set([avatarEnum.RASTA]);
  let networkLoads = 0;
  const manager = {
    loadedAvatars: markedLoaded,
    getAvatarName: id => avatarNames[id] || "unknown",
    isAvatarLoaded: id => markedLoaded.has(id),
    loadAvatar: async (_scene, id) => {
      networkLoads++;
      textures.add(`${avatarNames[id]}_atlas`);
    },
  };
  const Loader = loadClass("src/phaser/managers/BackgroundAvatarLoader.js", "BackgroundAvatarLoader", {
    socket: {}, avatarManager: manager,
  });
  const loader = new Loader();
  loader.currentScene = { textures: { exists: key => textures.has(key) } };
  await loader.loadAvatarSync(avatarEnum.RASTA);
  assert.equal(networkLoads, 1);
  assert.equal(loader.loadedAvatars.has(avatarEnum.RASTA), true);
  assert.equal(textures.has("12_atlas"), false);
  await loader.loadAvatarSync(avatarEnum.RASTA);
  assert.equal(networkLoads, 1);
});

test("el listado inicial crea los sprites antes de marcar la escena lista", () => {
  const src = fs.readFileSync(path.join(root, "src/phaser/controllers/scene/CreateSceneController.js"), "utf8");
  assert.ok(src.includes("await AddUserController.processUser(gameScene, userData)"));
  const controller = fs.readFileSync(path.join(root, "src/phaser/controllers/scene/AddUserController.js"), "utf8");
  assert.ok(controller.includes("const userId = user.socketId;"));
  assert.ok(controller.includes("_isPlaceholderAvatar = true"));
  assert.ok(!controller.includes("spriteAvatar.setVisible(false)"));
});
