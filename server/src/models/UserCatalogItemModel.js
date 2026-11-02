class UserCatalogItemModel {
    static parseTileList(value, fallback) {
        try {
            const parsed = typeof value === 'string' ? JSON.parse(value) : value;
            if (Array.isArray(parsed) && parsed.every(tile =>
                Array.isArray(tile) && tile.length === 2 &&
                Number.isInteger(tile[0]) && Number.isInteger(tile[1])
            )) return parsed;
        } catch (_error) {
            // Datos antiguos o incompletos no deben bloquear la entrada a la isla.
        }
        return fallback;
    }

    constructor(row) {
        this.id = row.id;
        this.private_scene_id = row.private_scene_id; // ID de la escena a la que pertenece el objeto
        this.display_name = row.display_name;
        this.sprite_name = row.sprite_name;
        this.map_size = UserCatalogItemModel.parseTileList(row.map_size, [[0, 0]]);
        this.occupied_tiles = UserCatalogItemModel.parseTileList(row.occupied_tiles, []);
        this.image = row.image;
        this.image_url = row.image_url;
        this.spreadsheet = row.spreadsheet;
        this.spreadsheet_url = row.spreadsheet_url;
        this.atlas = row.atlas;
        this.atlas_url = row.atlas_url;
        this.width = row.width;
        this.height = row.height;
        this.rotated = row.rotated;
        this.resize_enabled = row.resize_enabled;
        this.resized = row.resized;
        this.type_of_behavior = row.type_of_behavior;
        this.scale = row.scale;
        this.rarity_code = row.rarity_code || 'comun';
        this.rarity_label = row.rarity_label || 'Común';
    }
}

module.exports = UserCatalogItemModel; 