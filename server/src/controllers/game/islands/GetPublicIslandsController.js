const Log = require('../../../utils/Log');
const ConnectedUsersCollection = require('../../../collections/ConnectedUsersCollection');
const ResponseSocketsEnum = require('../../../enums/ResponseSocketsEnum');
const IslandResource = require('../../../resources/IslandResource');
const PrivateScenesCollection = require('../../../collections/PrivateScenesCollection');

class GetPublicIslandsController {
    // Estado de ocupación calculado directamente desde las escenas activas.
    // La lista se emite una vez por actualización, no una vez por usuario.
    static snapshot() {
        const islands = new Map();
        for (const scene of PrivateScenesCollection.getAll()) {
            if (!scene?.island?.id) continue;
            const key = String(scene.island.id);
            if (!islands.has(key)) {
                // scene.island ya es IslandModel: no reconstruirlo con camelCase
                // convertido a snake_case, porque se perderían sus metadatos.
                islands.set(key, { ...scene.island, visitors: 0 });
            }
            islands.get(key).visitors += scene.users?.length || 0;
        }
        return IslandResource.collection(Array.from(islands.values()));
    }

    static broadcastToLobby() {
        try {
            const snapshot = this.snapshot();
            for (const user of ConnectedUsersCollection.getAllNotInArea()) {
                user.socket?.emit(ResponseSocketsEnum.UPDATE_PUBLIC_ISLANDS, { islands: snapshot });
            }
        } catch (error) {
            Log.error('Error broadcasting public islands: ' + error);
        }
    }

    static async main(socket) {
        try {
            const user = ConnectedUsersCollection.getBySocketId(socket.id);
            if (!user || user.currentArea) return;
            socket.emit(ResponseSocketsEnum.UPDATE_PUBLIC_ISLANDS, {
                islands: this.snapshot(),
            });
        } catch (err) {
            Log.error('Error in GetPublicIslandsController: ' + err);
            socket.emit(ResponseSocketsEnum.UPDATE_PUBLIC_ISLANDS, {
                islands: [],
                error: 'No fue posible actualizar el listado de islas.',
            });
        }
    }
}

module.exports = GetPublicIslandsController;
