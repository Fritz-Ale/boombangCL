class PrivateScenesCollection {
    constructor() {
        this.collection = new Map();
    }

    add(id, item) {
        this.collection.set(id, item);
    }

    getById(id) {
        return this.collection.get(id) ?? Array.from(this.collection.values()).find(scene => String(scene.id) === String(id));
    }

    getAll() {
        return Array.from(this.collection.values());
    }

    getByIslandId(islandId) {
        return Array.from(this.collection.values()).filter(scene => String(scene.island_id) === String(islandId));
    }

    remove(id) {
        if (this.collection.delete(id)) return;
        for (const [key, scene] of this.collection) {
            if (String(scene.id) === String(id)) {
                this.collection.delete(key);
                return;
            }
        }
    }
}

module.exports = new PrivateScenesCollection();