const ConnectedUsersCollection = require('../../../collections/ConnectedUsersCollection');
const ResponseSocketsEnum = require('../../../enums/ResponseSocketsEnum');
const publicIslandsSnapshot = require('../../../services/publicIslandsSnapshot');

class UpdatePublicIslandsController {
    static main() {
        try {
            const islands = publicIslandsSnapshot();
            for (const user of ConnectedUsersCollection.getAllNotInArea()) {
                user.socket.emit(ResponseSocketsEnum.UPDATE_PUBLIC_ISLANDS, { islands });
            }
        } catch (error) {
            // Una notificación del lobby no debe interrumpir el ingreso a una sala.
            console.error('No se pudieron actualizar los visitantes de las islas:', error);
        }
    }
}

module.exports = UpdatePublicIslandsController;
