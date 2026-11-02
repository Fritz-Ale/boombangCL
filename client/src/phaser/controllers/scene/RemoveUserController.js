import InteractionNotificationController from "./InteractionNotificationController";

class RemoveUserController {
    static main(gameScene, socketId) {
        const user = gameScene.users[socketId];
        if (!user) return;

        // Remove any interaction notifications for this user
        InteractionNotificationController.remove(socketId);

        // Detener y eliminar tweens activos
        if (user.currentTween) user.currentTween.stop();
        gameScene.tweens.killTweensOf(user.containerUser);

        // Detener cualquier animación activa
        if (user.spriteAvatar?.anims) {
            user.spriteAvatar.anims.stop();
        }

        // Eliminar contenedor completo
        if (user.containerUser && user.containerUser.active) {
            user.containerUser.destroy();
        }

        // Soltar listeners para impedir que actualizaciones tardías revivan un sprite destruido.
        user.cleanupCallbacks?.forEach(cleanup => cleanup());
        delete gameScene.users[socketId];
    }
}

export default RemoveUserController;
