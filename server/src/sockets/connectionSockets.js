const ConnectedUsersCollection = require('../collections/ConnectedUsersCollection');
const DisconnectUserController = require('../controllers/connection/DisconnectUserController');
const RequestSocketsEnum = require('../enums/RequestSocketsEnum');
const UserResource = require('../resources/UserResource');

module.exports = (socket, io) => {
    socket.on(RequestSocketsEnum.DISCONNECT, () => {
        DisconnectUserController.main(socket, io);
    });

    socket.on(RequestSocketsEnum.GET_CONNECTED_USERS, () => {
        // No enviar instancias completas del modelo: contienen tokens y estado privado.
        const requester = ConnectedUsersCollection.getBySocketId(socket.id);
        if (!requester) {
            socket.emit('connected_users', []);
            return;
        }
        const connectedUsers = ConnectedUsersCollection.getAll()
            .map(user => new UserResource(user).toPublicObject());
        socket.emit('connected_users', connectedUsers);
    });

    socket.on(RequestSocketsEnum.USER_SEND_MESSAGE, (data) => {
        const sender = ConnectedUsersCollection.getBySocketId(socket.id);
        if (!sender) {
            socket.emit('error', { message: 'Unauthorized' });
            return;
        }
        if (!data || (typeof data.recipientId !== 'string' && typeof data.recipientId !== 'number') ||
            typeof data.message !== 'string' || !data.message.trim() ||
            data.message.length > 500) {
            socket.emit('error', { message: 'Invalid message' });
            return;
        }

        const recipientSocketId = ConnectedUsersCollection.getSocketIdByUserId(data.recipientId);
        if (!recipientSocketId) {
            socket.emit('error', { message: 'User not connected' });
            return;
        }

        io.to(recipientSocketId).emit('receive_message', {
            message: data.message.trim(),
            senderId: sender.id,
            senderName: sender.username
        });
    });
};
