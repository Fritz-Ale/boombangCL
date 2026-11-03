const ResponseSocketsEnum = require('../../../enums/ResponseSocketsEnum');
const ConnectedUsersCollection = require('../../../collections/ConnectedUsersCollection');
const IslandApiService = require('../../../services-api/IslandApiService');
const PrivateScenesCollection = require('../../../collections/PrivateScenesCollection');
const GetPublicIslandsController = require('./GetPublicIslandsController');

class UpdateIslandNameController {
    static async main(socket, io, data) {
        try {
            const user = ConnectedUsersCollection.getBySocketId(socket.id);
            if (!user) {
                socket.emit(ResponseSocketsEnum.ERROR_ISLAND_NAME_UPDATED, {
                    message: 'User not found'
                });
                return;
            }

            const { islandId, name } = data;
            
            if (!islandId || !name) {
                socket.emit(ResponseSocketsEnum.ERROR_ISLAND_NAME_UPDATED, {
                    message: 'Island ID and name are required'
                });
                return;
            }

            if (!name.trim()) {
                socket.emit(ResponseSocketsEnum.ERROR_ISLAND_NAME_UPDATED, {
                    message: 'Island name cannot be empty'
                });
                return;
            }

            if (name.length > 50) {
                socket.emit(ResponseSocketsEnum.ERROR_ISLAND_NAME_UPDATED, {
                    message: 'Island name is too long (max 50 characters)'
                });
                return;
            }

            const trimmedName = name.trim();

            // Llamar a la API para actualizar el nombre de la isla
            const response = await IslandApiService.updateName({
                islandId: islandId,
                name: trimmedName
            }, user);

            if (response.success) {
                // Mantener el estado en memoria consistente con Laravel.
                // Los espectadores del lobby reciben el snapshot actualizado
                // en lugar de esperar a que recarguen o vuelvan a entrar.
                for (const scene of PrivateScenesCollection.getAll()) {
                    if (String(scene.island_id) === String(islandId) && scene.island) {
                        scene.island.name = trimmedName;
                    }
                }
                GetPublicIslandsController.broadcastToLobby();
                socket.emit(ResponseSocketsEnum.ISLAND_NAME_UPDATED, {
                    success: true,
                    islandId: islandId,
                    name: trimmedName
                });

                // Notificar a otros usuarios en la isla si están conectados
                const roomName = `island_${islandId}`;
                socket.to(roomName).emit(ResponseSocketsEnum.ISLAND_NAME_UPDATED, {
                    success: true,
                    islandId: islandId,
                    name: trimmedName
                });
            } else {
                socket.emit(ResponseSocketsEnum.ERROR_ISLAND_NAME_UPDATED, {
                    message: response.message || 'Failed to update island name'
                });
            }

        } catch (error) {
            console.error('UpdateIslandNameController error:', error);
            
            let errorMessage = 'An error occurred while updating island name';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            socket.emit(ResponseSocketsEnum.ERROR_ISLAND_NAME_UPDATED, {
                message: errorMessage
            });
        }
    }
}

module.exports = UpdateIslandNameController;