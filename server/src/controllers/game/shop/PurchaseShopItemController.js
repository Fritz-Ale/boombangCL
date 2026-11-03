const ConnectedUsersCollection = require('../../../collections/ConnectedUsersCollection');
const ResponseSocketsEnum = require('../../../enums/ResponseSocketsEnum');
const ShopApiService = require('../../../services-api/ShopApiService');
const InventoryApiService = require('../../../services-api/InventoryApiService');

class PurchaseShopItemController {
    static async main(socket, io, data) {
        let lockedUser = null;
        try {
            const user = ConnectedUsersCollection.getBySocketId(socket.id);

            if (!user) {
                socket.emit(ResponseSocketsEnum.SHOP_PURCHASE, {
                    success: false,
                    message: 'Usuario no autenticado',
                });
                return;
            }

            const { catalog_item_id, quantity = 1 } = data || {};

            if (!Number.isInteger(catalog_item_id) || catalog_item_id < 1 ||
                !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
                socket.emit(ResponseSocketsEnum.SHOP_PURCHASE, {
                    success: false,
                    message: 'Identificador o cantidad inválidos',
                });
                return;
            }

            // Una misma sesión no debe procesar dos pagos y snapshots de
            // inventario intercalados. El segundo intento se rechaza sin cargo.
            if (user._purchasePending) {
                socket.emit(ResponseSocketsEnum.SHOP_PURCHASE, {
                    success: false,
                    message: 'Ya hay una compra en proceso. Espera su confirmación.',
                });
                return;
            }
            user._purchasePending = true;
            lockedUser = user;

            //console.log('=== PURCHASE ATTEMPT (SERVER) ===');
            //console.log('User ID:', user.id);
            //console.log('User Gold (before):', user.gold);
            //console.log('User Silver (before):', user.silver);
            //console.log('Catalog Item ID:', catalog_item_id);
            //console.log('Quantity:', quantity);
            //console.log('Quantity Type:', typeof quantity);

            const responseData = await ShopApiService.purchaseItem(user, catalog_item_id, quantity);

            //console.log('=== PURCHASE RESPONSE ===');
            //console.log('Success:', responseData.success);
            //console.log('Response:', JSON.stringify(responseData, null, 2));

            if (responseData.success) {
                // Actualizar el oro y plata del usuario en ConnectedUsersCollection
                user.gold = responseData.user.gold;
                user.silver = responseData.user.silver;
                user.goldCoins = responseData.user.gold;
                user.silverCoins = responseData.user.silver;

                //console.log('=== USER UPDATED ===');
                //console.log('New Gold:', user.gold);
                //console.log('New Silver:', user.silver);

                // Emitir evento para actualizar los créditos en el UI
                socket.emit(ResponseSocketsEnum.REFRESH_USER_CREDITS, {
                    gold: responseData.user.gold,
                    silver: responseData.user.silver,
                });

                // El objeto comprado debe aparecer en el inventario de la misma sesión
                // sin necesidad de abandonar y volver a entrar en la isla.
                try {
                    const updated = await InventoryApiService.getUserInventory(user);
                    if (Array.isArray(updated?.inventory)) {
                        const previousIds = new Set((user.inventory || []).map(item => String(item.id)));
                        user.setInventory(updated.inventory);
                        for (const item of user.inventory) {
                            if (!previousIds.has(String(item.id))) {
                                socket.emit(ResponseSocketsEnum.ADD_ITEM_TO_INVENTORY, { item });
                            }
                        }
                        socket.emit(ResponseSocketsEnum.PUBLIC_INVENTORY_DATA, {
                            success: true,
                            inventory: updated.inventory,
                        });
                    }
                } catch (syncError) {
                    // La compra ya fue confirmada; un fallo al refrescar no debe cobrar de nuevo.
                    console.error('Error syncing inventory after purchase:', syncError);
                }

                socket.emit(ResponseSocketsEnum.SHOP_PURCHASE, {
                    success: true,
                    message: responseData.message,
                    user: {
                        gold: responseData.user.gold,
                        silver: responseData.user.silver,
                    },
                });
            } else {
                socket.emit(ResponseSocketsEnum.SHOP_PURCHASE, {
                    success: false,
                    message: responseData.error || 'Error al comprar el item',
                });
            }
        } catch (err) {
            console.error('Error en PurchaseShopItemController:', err);
            socket.emit(ResponseSocketsEnum.SHOP_PURCHASE, {
                success: false,
                message: err.message || 'Error del servidor',
            });
        } finally {
            if (lockedUser) lockedUser._purchasePending = false;
        }
    }
}

module.exports = PurchaseShopItemController;
