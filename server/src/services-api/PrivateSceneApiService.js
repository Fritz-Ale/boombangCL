const ApiService = require('./ApiService');

class PrivateSceneApiService {
    static async persistDecoration(route, data, user) {
        const response = await ApiService.post(route, data, user.authJwt);
        // ApiService transforms HTTP 4xx/5xx into a statusCode-bearing object.
        // Do not commit in-memory changes unless the database accepted the action.
        if (response?.statusCode >= 400 || response?.success === false) {
            throw new Error(response?.error || response?.message || 'No se pudo guardar el objeto en la isla');
        }
        return response;
    }

    static async create(sceneData, user) {
        try {
            return await ApiService.post('api/private-scene/create', sceneData, user.authJwt);
        } catch (error) {
            console.error('Error al crear la escena:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    static async join(data, user) {
        try {
            return await ApiService.post('api/private-scene/join', data, user.authJwt);
        } catch (error) {
            console.error('Error al unirse a la escena:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    static async removeItem(data, user) {
        return await this.persistDecoration('api/private-scene/remove-item', data, user);
    }

    static async putItem(data, user) {
        return await this.persistDecoration('api/private-scene/put-item', data, user);
    }

    static async updateItemPosition(data, user) {
        return await this.persistDecoration('api/private-scene/update-item-position', data, user);
    }

    static async updateName(sceneData, user) {
        try {
            return await ApiService.post('api/private-scene/update-name', sceneData, user.authJwt);
        } catch (error) {
            console.error('Error al actualizar el nombre de la escena:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    static async delete(sceneData, user) {
        try {
            return await ApiService.post('api/private-scene/delete', sceneData, user.authJwt);
        } catch (error) {
            console.error('Error al eliminar la escena:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    static async updateColors(sceneData, user) {
        try {
            return await ApiService.post('api/private-scene/update-colors', sceneData, user.authJwt);
        } catch (error) {
            console.error('Error al actualizar los colores de la escena:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
}

module.exports = PrivateSceneApiService;