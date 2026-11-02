const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sceneCode = fs.readFileSync(path.join(root, 'src/phaser/PrivateScene.js'), 'utf8');
const inventoryCode = fs.readFileSync(path.join(root, 'src/phaser/html/private-scene/InventoryPrivateSceneHtml.js'), 'utf8');

function createSceneHelpers(env = 'production') {
  const start = sceneCode.indexOf('    isVideoFile(src) {');
  const end = sceneCode.indexOf('\n    preload() {', start);
  assert.ok(start !== -1 && end > start, 'los helpers de sprites existen');
  const methods = sceneCode.slice(start, end).replaceAll('import.meta.env.VITE_APP_ENV', 'env');
  return new Function('env', 'class Helpers {' + methods + '} return new Helpers();')(env);
}

test('se reconocen vídeos con versión en querystring y extensiones seguras', () => {
  const scene = createSceneHelpers();
  assert.equal(scene.isVideoFile('https://assets.example/sprite.webm?rev=23'), true);
  assert.equal(scene.isVideoFile('/assets/objeto.png?x=2'), false);
  assert.equal(scene.isVideoFile(''), false);
  assert.equal(scene.isVideoFile(null), false);
});

test('se usa la textura de escena y se recurre a la miniatura si no existe', () => {
  const item = {
    spreadsheet: 'local-texture.webp',
    spreadsheet_url: 'https://assets.example/texture.webp',
    image: 'local-preview.png',
    image_url: 'https://assets.example/preview.png',
  };
  assert.equal(createSceneHelpers('local').catalogItemSource(item), 'local-texture.webp');
  assert.equal(createSceneHelpers('production').catalogItemSource(item), item.spreadsheet_url);
  assert.equal(createSceneHelpers('production').catalogItemSource({image_url: item.image_url}), item.image_url);
  assert.equal(createSceneHelpers().catalogItemSource({image:null,spreadsheet:null}), null);
});

test('Phaser espera el evento atlasjson y dibuja un fotograma, no la hoja completa', () => {
  assert.match(sceneCode, /type = atlas.*\? 'atlasjson' : 'image'/);
  assert.match(sceneCode, /getFrameNames\(\)/);
  assert.match(sceneCode, /frame => frame !== '__BASE'/);
  assert.match(sceneCode, /this\.add\.image\(avgX, y, item\.sprite_name, firstFrame\)/);
  assert.doesNotMatch(sceneCode, /filecomplete-atlas-\$\{textureName\}/);
});

test('el inventario mantiene los iconos legibles durante paginación y errores de imagen', () => {
  assert.match(inventoryCode, /icon\.getAttribute\('src'\) !== imageSrc/);
  assert.match(inventoryCode, /if \(!imageSrc\)/);
  assert.match(inventoryCode, /Object\.create\(null\)/);
});

test('el importador autorizado deriva medidas desde la textura y exige tamaño para atlas', () => {
  const php = fs.readFileSync(path.resolve(root, '../api/app/Console/Commands/ImportLicensedCatalogArt.php'), 'utf8');
  assert.match(php, /\$renderTexture = \$files\['spreadsheet'\] \?\? \$files\['image'\]/);
  assert.match(php, /\[\$textureWidth, \$textureHeight\] = getimagesize\(\$renderTexture\)/);
  assert.match(php, /un atlas requiere width y height explícitos/);
  assert.match(php, /scale debe estar entre 0\.05 y 8/);
});
