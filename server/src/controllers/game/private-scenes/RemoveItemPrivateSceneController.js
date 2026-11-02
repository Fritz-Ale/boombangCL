const Log = require('../../../utils/Log');
const ConnectedUsersCollection = require('../../../collections/ConnectedUsersCollection');
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
            // Actualizar la escena original incluso si el propietario salió
            // mientras Laravel guardaba el cambio.

            // Remove item from the scene and add it to the user's inventory
            scene.objects = scene.objects.filter(item => String(item.id) !== String(userCatalogItemId));
            if (!user.inventory.some(item => String(item.id) === String(userCatalogItemId))) {
                user.inventory.push(userCatalogItem);
            }
            scene.rebuildObjectNavigationMap();

            // Update item properties
            userCatalogItem.private_scene_id = null;
            userCatalogItem.occupied_tiles = [];

            scene.emit(ResponseSocketsEnum.SCENE_REMOVE_ITEM, {
                user_catalog_item_id: userCatalogItemId
            });

            if (user.currentArea === scene) {
                socket.emit(ResponseSocketsEnum.ADD_ITEM_TO_INVENTORY, {
                    item: userCatalogItem
                });
            }

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
