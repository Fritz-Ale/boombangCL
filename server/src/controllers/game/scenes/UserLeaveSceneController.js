const ConnectedUsersCollection = require('../../../collections/ConnectedUsersCollection');
const DisconnectUserController = require('../../connection/DisconnectUserController');
const Log = require('../../../utils/Log');
const RemoveUserFromSceneTask = require('../../../tasks/RemoveUserFromSceneTask');
const AnimationEnum = require('../../../enums/AnimationEnum');

class UserLeaveSceneController {
    static async main(socket, io) {
        try {
            const user = ConnectedUsersCollection.getBySocketId(socket.id);
            if (!user || !user.currentArea) {
                // Duplicate leave events and unauthenticated sockets are harmless.
                return;
            }

            if (user.isActionBlocked(AnimationEnum.LEAVE_AREA)) {
                return;
            }

            RemoveUserFromSceneTask.main(user.currentArea, user);
        } catch (err) {
            Log.error('Error in UserLeaveAreaController: ' + err);
            DisconnectUserController.main(socket, io);
            socket.emit('error_critical');
        }
    }
}

module.exports = UserLeaveSceneController;