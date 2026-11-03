/**
 * Drena eventos de usuarios que llegaron antes de que Phaser terminara de
 * construir la sala. No usa setTimeout: los callbacks no quedan pendientes
 * después de cerrar o reiniciar la escena.
 *
 * generation es el identificador de la entrada actual. Si una entrada nueva
 * reemplaza a la anterior, no se procesa ningún otro evento antiguo.
 */
export default async function drainSceneEntryEvents(scene, events, generation, onError = console.error) {
    for (const event of events) {
        if (!scene.isSceneReady || scene.sceneGeneration !== generation) {
            return false;
        }
        if (typeof event?.callback !== 'function') continue;
        try {
            await event.callback();
        } catch (error) {
            // Un atlas/usuario inválido no debe ocultar a los demás usuarios.
            onError('No se pudo procesar un evento de entrada a la sala', event.type, error);
        }
    }
    return scene.isSceneReady && scene.sceneGeneration === generation;
}
