const Resource = require('./Resource');
const GameClock = require('../utils/GameClock');

class PublicSceneResource extends Resource {
    transform(data) {
        return {
            game_time: GameClock.getCurrentGameTime(),
            uuid: data.uuid,
            id: data.id,
            name: data.name,
            type: data.type,
            sound: data.sound,
            sound_url: data.sound_url,
            darkening: data.darkening,
            menu_type: data.menu_type,
            big_scene: data.big_scene,
            // game_map se indexa como [y][x]: filas = alto, columnas = ancho.
            map_rows: data.map_height,
            map_cols: data.map_width,
            game_map: data.game_map,
            items: data.possible_items,
            assets_data: data.assets_data,
            npc: data.npc,
            base_api_url: data.base_api_url,
            arrows: data.arrows ?? [],
        };
    }
}

module.exports = PublicSceneResource;