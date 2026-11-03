import sceneSocketSubscriptions from "../utils/sceneSocketSubscriptions.js";
import socket from "../../sockets/socket"; // Conexión Socket.io
import UserSelectUserController from "../controllers/scene/UserSelectUserController";
import UserUpdatePositionController from "../controllers/scene/UserUpdatePositionController";
import ResponseSocketsEnum from "../../enums/ResponseSocketsEnum";
import SendUppercutAnimationController from "../controllers/scene/SendUppercutAnimationController";
import UserMoveDeniedController from "../controllers/scene/UserMoveDeniedController";
import UserSendEmojiController from "../controllers/scene/UserSendEmojiController";
import UserSendChatController from "../controllers/scene/UserSendChatController";
import MoveUserController from "../controllers/scene/MoveUserController";
import RemoveUserController from "../controllers/scene/RemoveUserController";
import AddUserController from "../controllers/scene/AddUserController";
import RemoveUserAreaController from "../controllers/scene/RemoveUserAreaController";
import UserReceiveEffectController from "../controllers/scene/UserReceiveEffectController";
import InteractionNotificationController from "../controllers/scene/InteractionNotificationController";
import SendInteractionAnimationController from "../controllers/scene/SendInteractionAnimationController";
import UserChangeAvatarController from "../controllers/scene/UserChangeAvatarController.js";

class SceneResponseSockets {
    static main(gameScene) {
        const { listen } = sceneSocketSubscriptions(gameScene, socket);
        // Escuchar cuando un nuevo jugador entra
        listen(ResponseSocketsEnum.NEW_USER_JOIN_SCENE, (data) => {
            AddUserController.main(gameScene, data.user);
        });

        // Escuchar cuando un jugador se mueve
        listen(ResponseSocketsEnum.USER_MOVE, (data) => {
            MoveUserController.main(gameScene, data);
        });

        listen(ResponseSocketsEnum.USER_LEFT_PUBLIC_SCENE, (data) => {
            RemoveUserController.main(gameScene, data.socketId);
        });

        listen(ResponseSocketsEnum.REMOVE_USER_SCENE, () => {
            RemoveUserAreaController.main(gameScene);
        });

        listen(ResponseSocketsEnum.USER_MOVE_DENIED, (data) => {
            UserMoveDeniedController.main(gameScene, data.id);
        });

        listen(ResponseSocketsEnum.USER_SELECT_USER, (data) => {
            //console.log('User select user', data);
            UserSelectUserController.main(gameScene, data);
        });

        listen(ResponseSocketsEnum.USER_UPDATE_POSITION, (data) => {
            UserUpdatePositionController.main(gameScene, data);
        });

        listen(ResponseSocketsEnum.SEND_UPPERCUT, (data) => {
            SendUppercutAnimationController.main(gameScene, data);
        });

        listen(ResponseSocketsEnum.SEND_EMOJI, (data) => {
            UserSendEmojiController.main(gameScene, data);
        });

        listen(ResponseSocketsEnum.SEND_CHAT, (data) => {
            UserSendChatController.main(gameScene, data);
        });

        listen(ResponseSocketsEnum.USER_RECEIVE_EFFECT, (data) => {
            UserReceiveEffectController.main(gameScene, data);
        });

        listen(ResponseSocketsEnum.USER_RECEIVE_INTERACTION, (data) => {
            InteractionNotificationController.create(gameScene, data);
        });

        listen(ResponseSocketsEnum.USER_CANCEL_INTERACTION, (data) => {
            InteractionNotificationController.remove(data.fromUser);
        });

        listen(ResponseSocketsEnum.USER_ACCEPT_INTERACTION, (data) => {
            InteractionNotificationController.remove(data.fromUser);
        });

        listen(ResponseSocketsEnum.USERS_INTERACTION, (data) => {
            SendInteractionAnimationController.main(gameScene, data);
        });

        listen(ResponseSocketsEnum.USER_CHANGE_AVATAR, (data) => {
            UserChangeAvatarController.main(gameScene, data);
        });
    }
}

export default SceneResponseSockets;