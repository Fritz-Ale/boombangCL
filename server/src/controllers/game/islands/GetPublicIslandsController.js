const Log = require('../../../utils/Log');
const ConnectedUsersCollection = require('../../../collections/ConnectedUsersCollection');
const IslandApiService = require('../../../services-api/IslandApiService');
const ResponseSocketsEnum = require('../../../enums/ResponseSocketsEnum');
const DisconnectUserController = require('../../connection/DisconnectUserController');
const publicIslandsSnapshot = require('../../../services/publicIslandsSnapshot');

class GetPublicIslandsController {
    static async main(socket, io, data) {
        try {
            const user = ConnectedUsersCollection.getBySocketId(socket.id);
            if (!user) {
                throw new Error('User not found');
            }
            if (user.currentArea) return;
            const islands = publicIslandsSnapshot();
            socket.emit(ResponseSocketsEnum.UPDATE_PUBLIC_ISLANDS, { islands });
        } catch (err) {
            Log.error('Error in GetPublicIslandsController: ' + err);
            DisconnectUserController.main(socket, io);
            socket.emit('error_critical');
        }
    }
}

module.exports = GetPublicIslandsController;