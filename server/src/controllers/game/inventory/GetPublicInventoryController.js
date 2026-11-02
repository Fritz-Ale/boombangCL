const ConnectedUsersCollection = require('../../../collections/ConnectedUsersCollection');
const ResponseSocketsEnum = require('../../../enums/ResponseSocketsEnum');
const InventoryApiService = require('../../../services-api/InventoryApiService');

class GetPublicInventoryController {
    static async main(socket, io) {
        try {
            const user = ConnectedUsersCollection.getBySocketId(socket.id);

            if (!user) {
                socket.emit(ResponseSocketsEnum.PUBLIC_INVENTORY_DATA, {
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }

            const responseData = await InventoryApiService.getUserInventory(user);

            if (responseData?.statusCode >= 400 || responseData?.success === false ||
                !Array.isArray(responseData?.inventory)) {
                socket.emit(ResponseSocketsEnum.PUBLIC_INVENTORY_DATA, {
                    success: false,
                    message: 'No se pudo consultar la mochila. Inténtalo nuevamente.',
                });
                return;
            }
            socket.emit(ResponseSocketsEnum.PUBLIC_INVENTORY_DATA, {
                success: true,
                inventory: responseData.inventory,
            });
        } catch (err) {
            console.error('Error en GetPublicInventoryController:', err);
            socket.emit(ResponseSocketsEnum.PUBLIC_INVENTORY_DATA, {
                success: false,
                message: err.message || 'Error del servidor',
            });
        }
    }
}

module.exports = GetPublicInventoryController;
