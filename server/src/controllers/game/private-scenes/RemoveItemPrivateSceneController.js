const Log = require('../../../utils/Log');
const ConnectedUsersCollection = require('../../../collections/ConnectedUsersCollection');
const DisconnectUserController = require('../../connection/DisconnectUserController');
const SceneTypesEnum = require('../../../enums/SceneTypesEnum');
const ResponseSocketsEnum = require('../../../enums/ResponseSocketsEnum');
const PrivateSceneApiService = require('../../../services-api/PrivateSceneApiService');

class RemoveItemPrivateSceneController {
    static async main(socket, io, data) {
        let lockedScene = null;
        try {
            const user = ConnectedUsersCollection.getBySocketId(socket.id);
            if (!user) {
                throw new Error('User not found');
            }

            if (!user.currentArea
                || user.currentArea.scene_type != SceneTypesEnum.PRIVATE_SCENE
                || user.currentArea.user_id != user.id
            ) return;

            const scene = user.currentArea;
            if (scene._catalogMutationPending) {
                throw new Error('La sala está guardando otro objeto. Vuelve a intentar.');
            }
            scene._catalogMutationPending = true;
            lockedScene = scene;

            let userCatalogItemId = data?.user_catalog_item_id;
            let userCatalogItem = user.currentArea.objects.find(item => item.id == userCatalogItemId);
            if (!userCatalogItem) {
                throw new Error('Item not found in user current area');
            }

            if (userCatalogItem.private_scene_id !== user.currentArea.id) {
                throw new Error('Item does not belong to the current private scene');
            }

            // La BD debe aceptar el cambio antes de notificar al cliente.
            await PrivateSceneApiService.removeItem({
                user_catalog_item_id: userCatalogItemId,
            }, user);
            if (user.currentArea !== scene) return;

            // Free up the tiles in the base navigation map
            if (userCatalogItem.occupied_tiles && user.currentArea.navigationMapBase) {
                userCatalogItem.occupied_tiles.forEach(tile => {
                    const [x, y] = tile;
                    if (user.currentArea.navigationMapBase[y] && user.currentArea.navigationMapBase[y][x] !== undefined) {
                        user.currentArea.navigationMapBase[y][x] = 0; // Mark as walkable
                    }
                });
            }

            // Remove item from the scene and add it to the user's inventory
            user.currentArea.objects = user.currentArea.objects.filter(item => item.id != userCatalogItemId);
            user.inventory.push(userCatalogItem);

            // Update item properties
            userCatalogItem.private_scene_id = null;
            userCatalogItem.occupied_tiles = [];

            user.currentArea.emit(ResponseSocketsEnum.SCENE_REMOVE_ITEM, {
                user_catalog_item_id: userCatalogItemId
            });

            socket.emit(ResponseSocketsEnum.ADD_ITEM_TO_INVENTORY, {
                item: userCatalogItem
            });

        } catch (err) {
            console.error('Error in RemoveItemPrivateSceneController:', err);
            Log.error('Error in RemoveItemPrivateSceneController: ' + err);
            socket.emit('scene_item_error', { message: 'No se pudo retirar el objeto. Inténtalo nuevamente.' });
        } finally {
            if (lockedScene) lockedScene._catalogMutationPending = false;
        }
    }
}

module.exports = RemoveItemPrivateSceneController;
