/**
 * Exclusión mutua FIFO por escena.
 *
 * La versión anterior registraba múltiples .then() sobre una misma promesa:
 * al liberarse podían despertar dos solicitudes a la vez y romper la exclusión.
 * Mantener la interfaz: const release = await sceneMutex.acquire(sceneId);
 */
class SceneMutex {
    constructor() {
        this.queues = new Map();
    }

    acquire(sceneId) {
        return new Promise(resolve => {
            let queue = this.queues.get(sceneId);
            if (!queue) {
                queue = [];
                this.queues.set(sceneId, queue);
            }

            let released = false;
            const grantLock = () => {
                resolve(() => {
                    // Evitar liberar dos veces y entregar el lock por error.
                    if (released) return;
                    released = true;

                    // Solo quien ocupa la cabeza de la cola puede liberar.
                    if (queue[0] !== grantLock) return;
                    queue.shift();

                    if (queue.length === 0) {
                        this.queues.delete(sceneId);
                    } else {
                        // Despertar exactamente a un solicitante.
                        queue[0]();
                    }
                });
            };

            queue.push(grantLock);
            if (queue.length === 1) grantLock();
        });
    }
}

module.exports = new SceneMutex();
