/**
 * Suscripciones Socket.IO propiedad de UNA instancia Phaser.
 *
 * El antiguo RemovePhaserSocketsUtil deja vivos algunos eventos de avatar e
 * interacción porque también existen suscriptores globales en Vue. Guardar
 * el callback exacto permite eliminar únicamente el listener de esta escena
 * sin desregistrar la lógica global del lobby.
 */
export default function sceneSocketSubscriptions(scene, socket) {
    const listeners = [];
    let disposed = false;

    function dispose() {
        if (disposed) return;
        disposed = true;
        for (const [event, handler] of listeners) {
            socket.off(event, handler);
        }
        listeners.length = 0;
        scene.events?.off?.('shutdown', dispose);
        scene.events?.off?.('destroy', dispose);
    }

    scene.events?.once?.('shutdown', dispose);
    scene.events?.once?.('destroy', dispose);

    function listen(event, handler) {
        if (disposed) return;
        socket.on(event, handler);
        listeners.push([event, handler]);
    }

    return { listen, dispose };
}
