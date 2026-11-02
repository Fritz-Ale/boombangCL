const PrivateScenesCollection = require('../collections/PrivateScenesCollection');
const IslandModel = require('../models/IslandModel');
const IslandResource = require('../resources/IslandResource');

/**
 * Reconstruye la foto pública desde salas activas (fuente: servidor).
 * El contador representa visitantes conectados, no estadísticas históricas.
 */
function publicIslandsSnapshot() {
    const byIsland = new Map();
    for (const scene of PrivateScenesCollection.getAll()) {
        if (!scene.island) continue;
        const id = String(scene.island.id);
        if (!byIsland.has(id)) {
            byIsland.set(id, { ...scene.island, visitors: 0 });
        }
        byIsland.get(id).visitors += Array.isArray(scene.users) ? scene.users.length : 0;
    }
    const islands = [...byIsland.values()].map(data => new IslandModel(data));
    return islands.length ? IslandResource.collection(islands) : [];
}

module.exports = publicIslandsSnapshot;
