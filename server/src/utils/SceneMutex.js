/**
 * Mutex FIFO por sala.
 *
 * El mecanismo anterior encadenaba todos los aspirantes al mismo Promise
 * de liberación y podía conceder más de un lock al mismo tiempo. Esta
 * implementación transfiere el control a un solo aspirante por turno.
 */
class SceneMutex {
    constructor() {
        this.states = new Map(); // sceneId -> { waiters: [resolve] }
    }

    async acquire(sceneId) {
        let state = this.states.get(sceneId);
        if (!state) {
            state = { waiters: [] };
            this.states.set(sceneId, state);
            return this.makeRelease(sceneId, state);
        }

        return new Promise(resolve => {
            state.waiters.push(resolve);
        });
    }

    makeRelease(sceneId, state) {
        let released = false;
        return () => {
            if (released) return; // Doble liberación no debe saltarse un turno.
            released = true;

            // Ignorar una liberación obsoleta si se recreó el lock de la sala.
            if (this.states.get(sceneId) !== state) return;

            const next = state.waiters.shift();
            if (next) {
                // Mantener el estado ocupado hasta que el siguiente lo libere.
                next(this.makeRelease(sceneId, state));
            } else {
                this.states.delete(sceneId);
            }
        };
    }
}

module.exports = new SceneMutex();
