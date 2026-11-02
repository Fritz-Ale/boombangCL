/**
 * Listener ownership for Vue screens. Never call socket.off(event) without
 * its exact callback: other screens (and Phaser) may use that same event.
 */
export default function createSocketSubscriptions(socket) {
    const listeners = [];
    let disposed = false;

    function on(event, handler) {
        if (disposed) return () => {};
        socket.on(event, handler);
        const pair = [event, handler];
        listeners.push(pair);
        return () => {
            const index = listeners.indexOf(pair);
            if (index === -1) return;
            listeners.splice(index, 1);
            socket.off(event, handler);
        };
    }

    function once(event, handler) {
        let unsubscribe;
        unsubscribe = on(event, (...args) => {
            unsubscribe();
            handler(...args);
        });
        return unsubscribe;
    }

    function dispose() {
        if (disposed) return;
        disposed = true;
        for (const [event, handler] of listeners) {
            socket.off(event, handler);
        }
        listeners.length = 0;
    }

    return { on, once, dispose };
}
