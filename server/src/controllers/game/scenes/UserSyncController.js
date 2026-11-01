const ConnectedUsersCollection = require('../../../collections/ConnectedUsersCollection');
const ResponseSocketsEnum = require('../../../enums/ResponseSocketsEnum');
const UserResource = require('../../../resources/UserResource');

class UserSyncController {
    /**
     * Maneja la solicitud de sincronización de usuarios
     * Reenvía las posiciones actuales de todos los usuarios en la misma área
     */
    static main(socket, io) {
        const user = ConnectedUsersCollection.getBySocketId(socket.id);
        if (!user || !user.currentArea) {
            return;
        }

        try {
            // Obtener todos los usuarios en la misma área
            const areaUsers = user.currentArea.users.filter(areaUser =>
                areaUser && areaUser.socket && areaUser.socket.id !== socket.id &&
                areaUser.currentArea === user.currentArea &&
                areaUser.currentAreaPosition
            );

            // Reenviar información de posición de cada usuario
            areaUsers.forEach(areaUser => {
                const userData = new UserResource().transform(areaUser);
                // Other players must never receive another account's session
                // token or privileged administrative configuration.
                delete userData.authJwt;
                delete userData.admin_tools;
                
                socket.emit(ResponseSocketsEnum.USER_UPDATE_POSITION, {
                    user: userData,
                    position: {
                        x: areaUser.currentAreaPosition.x,
                        y: areaUser.currentAreaPosition.y,
                        z: areaUser.currentAreaPosition.z
                    }
                });
            });

        } catch (error) {
            // Error silencioso
        }
    }
}

module.exports = UserSyncController;