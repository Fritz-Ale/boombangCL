const test = require('node:test');
const assert = require('node:assert/strict');
const PublicSceneResource = require('../src/resources/PublicSceneResource');

test('las salas publicas envian filas y columnas correctas en mapas rectangulares', () => {
    const scene = {
        map_width: 18,
        map_height: 9,
        game_map: Array.from({ length: 9 }, () => Array(18).fill(0)),
        arrows: []
    };
    const payload = new PublicSceneResource(scene).toObject();
    assert.equal(payload.map_rows, 9);
    assert.equal(payload.map_cols, 18);
    assert.equal(payload.game_map.length, payload.map_rows);
    assert.equal(payload.game_map[0].length, payload.map_cols);
});
