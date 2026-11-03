import SceneUtils from "@/utils/SceneUtils";

class PrivateSceneLoader {
    static main(gameScene, preload = true) {
        const sceneId = gameScene.sceneData?.scenery?.id;
        const assets = gameScene.sceneData?.sceneConfig?.assets_data?.assets_data_repeatable || [];
        const baseApiUrl = gameScene.sceneData?.sceneConfig?.base_api_url || '';
        if (preload) {
            this.#preload(sceneId, assets, gameScene, baseApiUrl);
        } else {
            this.#load(sceneId, assets, gameScene);
        }
    }

    // Asset URLs returned by Laravel must not depend on whether Vite is in
    // 'local' mode. In that mode the client may still be served by a different
    // origin (5173, nginx or Cloudflare).
    static #assetUrl(value, baseApiUrl) {
        if (typeof value !== 'string' || !value.trim()) return '';
        const source = value.trim();
        if (/^(https?:|data:|blob:|\/\/)/i.test(source)) return source;
        const base = String(baseApiUrl || '').replace(/\/+$/, '');
        if (!base) return source.startsWith('/') ? source : '/' + source;
        return base + '/' + source.replace(/^\/+/, '');
    }

    static #warn(gameScene, code, spriteName, url = '') {
        const detail = { sceneId: gameScene.sceneData?.scenery?.id, code, spriteName, url };
        console.warn('[BoomBangCL] Recurso de isla no disponible:', detail);
        gameScene.events?.emit('private-scene-asset-warning', detail);
    }

    static #preload(sceneId, assets, gameScene, baseApiUrl) {
        assets.forEach((asset, index) => {
            if (!asset || typeof asset !== 'object') return;
            const spriteName = 'private_scene_' + sceneId + '_item_' + index;
            const url = this.#assetUrl(asset.image, baseApiUrl);
            if (!url) {
                this.#warn(gameScene, 'asset_url_missing', spriteName);
                return;
            }
            if (SceneUtils.isVideoFile(url.split(/[?#]/, 1)[0])) {
                gameScene.load.video(spriteName, url);
            } else {
                gameScene.load.image(spriteName, url);
            }
        });
    }

    static #load(sceneId, assets, gameScene) {
        let backgroundLoaded = false;
        assets.forEach((asset, index) => {
            if (!asset || typeof asset !== 'object') return;
            const spriteName = 'private_scene_' + sceneId + '_item_' + index;
            if (asset.is_background == 1) {
                backgroundLoaded = this.#loadBackground(gameScene, spriteName) || backgroundLoaded;
                return;
            }
            const x = Number(asset.position_x);
            const y = Number(asset.position_y);
            const scale = Number(asset.scale);
            this.#loadSingleItem(gameScene, spriteName, {
                x: Number.isFinite(x) ? x : 0,
                y: Number.isFinite(y) ? y : 0,
                custom_depth: Number(asset.depth),
                scale: Number.isFinite(scale) && scale > 0 ? scale : 1,
                show_controller: asset.show_controller == 1
            });
        });
        if (!backgroundLoaded) {
            this.#warn(gameScene, 'background_missing', 'private_scene_' + sceneId);
        }
    }

    static #loadBackground(gameScene, spriteName) {
        const video = gameScene.cache.video.has(spriteName);
        if (!video && !gameScene.textures.exists(spriteName)) {
            this.#warn(gameScene, 'background_texture_missing', spriteName);
            return false;
        }
        const background = video
            ? gameScene.add.video(0, 0, spriteName)
            : gameScene.add.image(0, 0, spriteName);
        background.setOrigin(0).setDisplaySize(gameScene.scale.width, gameScene.scale.height).setDepth(-1);
        if (video) {
            background.setLoop(true);
            background.play(true);
        }
        return true;
    }

    static #loadSingleItem(gameScene, spriteName, item) {
        const video = gameScene.cache.video.has(spriteName);
        if (!video && !gameScene.textures.exists(spriteName)) {
            this.#warn(gameScene, 'scene_item_missing', spriteName);
            return;
        }
        const depth = Number.isFinite(item.custom_depth)
            ? item.custom_depth
            : item.y;
        const sprite = video
            ? gameScene.add.video(item.x * item.scale, item.y * item.scale, spriteName)
            : gameScene.add.image(item.x * item.scale, item.y * item.scale, spriteName);
        sprite.setOrigin(0.5, 1).setDepth(depth).setName(spriteName).setScale(item.scale);
        if (video) {
            sprite.setLoop(true);
            sprite.play(true);
        }
        if (item.show_controller) {
            if (!gameScene.activeItems) gameScene.activeItems = new Map();
            gameScene.activeItems.set(spriteName, sprite);
        }
    }
}

export default PrivateSceneLoader;
