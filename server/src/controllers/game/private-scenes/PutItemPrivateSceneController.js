const Log = require('../../../utils/Log');
const ConnectedUsersCollection = require('../../../collections/ConnectedUsersCollection');
const SceneTypesEnum = require('../../../enums/SceneTypesEnum');
const ResponseSocketsEnum = require('../../../enums/ResponseSocketsEnum');
const PrivateSceneApiService = require('../../../services-api/PrivateSceneApiService');
const CatalogItemTypeOfBehaviorEnum = require('../../../enums/CatalogItemTypeOfBehaviorEnum');

class PutItemPrivateSceneController {
    static async main(socket, io, data) {
        let lockedScene = null;
        try {
            const user = ConnectedUsersCollection.getBySocketId(socket.id);
            if (!user) {
                throw new Error('User not found');
            }

            if (!user.currentArea ||
                user.currentArea.scene_type != SceneTypesEnum.PRIVATE_SCENE ||
                user.currentArea.user_id != user.id
            ) return;

            const { user_catalog_item_id, occupied_tiles, is_move } = data || {};
            if (!Number.isSafeInteger(user_catalog_item_id) || user_catalog_item_id < 1) {
                throw new Error('ID de objeto inválido');
            }
            const scene = user.currentArea;
            // Serializar cambios mientras Laravel confirma el guardado.
            if (scene._catalogMutationPending) {
                throw new Error('La sala está guardando otro objeto. Vuelve a intentar.');
            }
            scene._catalogMutationPending = true;
            lockedScene = scene;

            if (is_move) {
                // Logic for moving an item already in the scene
                const itemToMove = user.currentArea.objects.find(item => item.id == user_catalog_item_id);
                if (!itemToMove) {
                    throw new Error('Item to move not found in the scene');
                }

                if (!this.#validateOccupiedTiles(user.currentArea, occupied_tiles, user, user_catalog_item_id, true)) {
                    throw new Error('Occupied tiles validation failed for move');
                }

                await PrivateSceneApiService.updateItemPosition({
                    user_catalog_item_id: user_catalog_item_id,
                    occupied_tiles: occupied_tiles
                }, user);
                // Evitar emitir a una sala anterior si el usuario se ha desconectado.
                if (user.currentArea !== scene) return;

                // Actualizar la posición y reconstruir las colisiones de todos los muebles.
                itemToMove.occupied_tiles = occupied_tiles;
                scene.rebuildObjectNavigationMap();

                scene.emit(ResponseSocketsEnum.SCENE_PUT_ITEM, {
                    item: itemToMove
                });
            } else {
                // Logic for placing a new item from inventory
                const userCatalogItemIndex = user.inventory.findIndex(item => item.id == user_catalog_item_id);
                if (userCatalogItemIndex === -1) {
                    throw new Error('Item not found in user inventory');
                }

                if (user.currentArea.objects.length >= user.currentArea.max_objects) {
                    throw new Error('Maximum number of objects reached in the scene');
                }

                if (!this.#validateOccupiedTiles(user.currentArea, occupied_tiles, user, user_catalog_item_id, false)) {
                    throw new Error('Occupied tiles validation failed for put');
                }

                const userCatalogItem = user.inventory[userCatalogItemIndex];
                await PrivateSceneApiService.putItem({
                    user_catalog_item_id: user_catalog_item_id,
                    private_scene_id: scene.id,
                    occupied_tiles: occupied_tiles
                }, user);
                if (user.currentArea !== scene) return;

                // Update item properties
                userCatalogItem.private_scene_id = user.currentArea.id;
                userCatalogItem.occupied_tiles = occupied_tiles;

                // Move item from inventory to scene
                user.inventory.splice(userCatalogItemIndex, 1);
                user.currentArea.objects.push(userCatalogItem);

                scene.rebuildObjectNavigationMap();

                user.currentArea.emit(ResponseSocketsEnum.SCENE_PUT_ITEM, {
                    item: userCatalogItem
                });

                socket.emit(ResponseSocketsEnum.REMOVE_ITEM_FROM_INVENTORY, {
                    user_catalog_item_id: user_catalog_item_id
                });

            }

        } catch (err) {
            console.error('Error in PutItemPrivateSceneController:', err);
            Log.error('Error in PutItemPrivateSceneController: ' + err);
            socket.emit('scene_item_error', { message: 'No se pudo colocar o mover el objeto. Comprueba la posición y vuelve a intentar.' });
        } finally {
            if (lockedScene) lockedScene._catalogMutationPending = false;
        }
    }

    static #validateOccupiedTiles(currentArea, occupiedTiles, user, userCatalogItemId = null, isMove = false) {
        const sceneObjects = currentArea.objects;
        const gameMap = currentArea.game_map; // Usar el mapa de juego original
        const rows = currentArea.map_rows;
        const cols = currentArea.map_cols;

        if (!Array.isArray(occupiedTiles) || occupiedTiles.length === 0 || occupiedTiles.length > 256 ||
            !Array.isArray(gameMap) || !Number.isInteger(rows) || !Number.isInteger(cols)) {
            return false;
        }
        const uniqueTiles = new Set();
        for (const tile of occupiedTiles) {
            if (!Array.isArray(tile) || tile.length !== 2 ||
                !Number.isInteger(tile[0]) || !Number.isInteger(tile[1])) return false;
            const tileKey = `${tile[0]},${tile[1]}`;
            if (uniqueTiles.has(tileKey)) return false;
            uniqueTiles.add(tileKey);
        }

        // Find the item being placed, whether it's from inventory or being moved
        let itemBeingPlaced = null;
        if (isMove) {
            itemBeingPlaced = sceneObjects.find(obj => obj.id === userCatalogItemId);
        } else if (userCatalogItemId) {
            itemBeingPlaced = user.inventory.find(item => item.id === userCatalogItemId);
        }

        for (const tile of occupiedTiles) {
            const [x, y] = tile;

            // 1. Check map boundaries
            if (y < 0 || y >= rows || x < 0 || x >= cols) {
                return false;
            }

            // 2. Check if the tile is walkable on the base game map
            if (!Array.isArray(gameMap[y]) || gameMap[y][x] !== 0) {
                return false;
            }

            // 3. Check for collision with OTHER objects
            for (const sceneObject of sceneObjects) {
                // If moving an item, skip collision check with itself
                if (isMove && sceneObject.id === userCatalogItemId) {
                    continue;
                }

                // Check if the tile is occupied by this scene object
                if (Array.isArray(sceneObject.occupied_tiles) &&
                    sceneObject.occupied_tiles.some(t => t[0] === x && t[1] === y)) {
                    const isExistingObjectWalkable = sceneObject.type_of_behavior === CatalogItemTypeOfBehaviorEnum.WALKABLE ||
                                                   sceneObject.type_of_behavior === CatalogItemTypeOfBehaviorEnum.WALKABLE_OVERLAY;

                    const isItemBeingPlacedWalkable = itemBeingPlaced && 
                                                    (itemBeingPlaced.type_of_behavior === CatalogItemTypeOfBehaviorEnum.WALKABLE ||
                                                     itemBeingPlaced.type_of_behavior === CatalogItemTypeOfBehaviorEnum.WALKABLE_OVERLAY);

                    // If the existing object is walkable (e.g., a rug)
                    if (isExistingObjectWalkable) {
                        // Prevent placing a walkable item on another walkable item (rug on rug)
                        if (isItemBeingPlacedWalkable) {
                            return false;
                        }
                        // Allow placing a non-walkable item on a walkable one (chair on rug)
                        continue;
                    }
                    
                    // Tile is occupied by a non-walkable object
                    return false;
                }
            }
        }

        return true;
    }
}

module.exports = PutItemPrivateSceneController;