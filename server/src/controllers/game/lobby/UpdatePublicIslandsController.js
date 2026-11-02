const ConnectedUsersCollection = require('../../../collections/ConnectedUsersCollection');
const ResponseSocketsEnum = require('../../../enums/ResponseSocketsEnum');
const publicIslandsSnapshot = require('../../../services/publicIslandsSnapshot');

class UpdatePublicIslandsController {
    static main() {
        const islands = publicIslandsSnapshot();
        for (const user of ConnectedUsersCollection.getAllNotInArea()) {
            user.socket.emit(ResponseSocketsEnum.UPDATE_PUBLIC_ISLANDS, { islands });
        }
    }
}

module.exports = UpdatePublicIslandsController;
