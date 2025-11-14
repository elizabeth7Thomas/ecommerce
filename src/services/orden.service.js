import sequelize from '../config/database.js';
import {
    Orden,
    OrdenItem,
    CarritoCompras,
    CarritoProducto,
    Producto,
    Cliente,
    Usuario,
    Direccion,
} from '../models/index.js';

class OrdenService {
    /**
     * Genera número de orden único
     */
    async generarNumeroOrden() {
        const timestamp = new Date();
        const year = timestamp.getFullYear();
        const count = await Orden.count();
        return `ORD-${year}-${String(count + 1).padStart(5, '0')}`;
    }

    /**
     * Crea una orden a partir del carrito activo de un cliente.
     */
    async createOrderFromCart(idCliente, idDireccionEnvio, notas_orden) {
        const t = await sequelize.transaction();
        try {
            // 1. Encontrar el carrito activo del cliente con sus productos
            const carrito = await CarritoCompras.findOne({
                where: { id_cliente: idCliente, estado: 'activo' },
                include: [{ 
                    model: CarritoProducto, 
                    as: 'productosCarrito',
                    include: [{ model: Producto, as: 'producto' }] 
                }],
                transaction: t,
            });

            if (!carrito || !carrito.productosCarrito || carrito.productosCarrito.length === 0) {
                throw new Error('El carrito está vacío o no se encontró.');
            }

            // 2. Verificar que la dirección de envío pertenece al cliente
            const direccion = await Direccion.findOne({ 
                where: { id_direccion: idDireccionEnvio, id_cliente: idCliente }, 
                transaction: t 
            });
            if (!direccion) {
                throw new Error('La dirección de envío no es válida o no pertenece al cliente.');
            }

            // 3. Calcular el total de la orden
            const total_orden = carrito.productosCarrito.reduce((total, item) => {
                const precio = Number(item.producto.precio);
                return total + (Number(item.cantidad) * precio);
            }, 0);

            // 4. Generar número de orden único
            const numero_orden = await this.generarNumeroOrden();

            // 5. Crear la orden
            const nuevaOrden = await Orden.create({
                id_cliente: idCliente,
                id_direccion_envio: idDireccionEnvio,
                total_orden,
                estado_orden: 'pendiente',
                numero_orden,
                notas_orden,
            }, { transaction: t });

            // 6. Mover productos del carrito a Ordenes_Items y actualizar stock
            for (const item of carrito.productosCarrito) {
                const producto = item.producto;

                // Verificar stock
                if (Number(producto.stock) < Number(item.cantidad)) {
                    throw new Error(`Stock insuficiente para el producto: ${producto.nombre_producto}`);
                }

                await OrdenItem.create({
                    id_orden: nuevaOrden.id_orden,
                    id_producto: item.id_producto,
                    cantidad: item.cantidad,
                    precio_unitario: producto.precio,
                }, { transaction: t });

                // Actualizar stock del producto
                await Producto.decrement('stock', {
                    by: Number(item.cantidad),
                    where: { id_producto: item.id_producto },
                    transaction: t,
                });
            }

            // 7. Marcar el carrito como 'convertido'
            await CarritoCompras.update(
                { estado: 'convertido' },
                { 
                    where: { id_carrito: carrito.id_carrito },
                    transaction: t 
                }
            );

            await t.commit();
            return nuevaOrden;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Obtiene todas las órdenes (para administradores).
     */
    async getAllOrders() {
        return Orden.findAll({
            include: [
                { 
                    model: Cliente, 
                    as: 'cliente', 
                    include: [{ 
                        model: Usuario, 
                        as: 'usuario',
                        attributes: ['nombre_usuario', 'correo_electronico']
                    }] 
                }
            ],
            order: [['fecha_orden', 'DESC']],
        });
    }

    /**
     * Obtiene las órdenes de un cliente específico.
     */
    async getOrdersByClientId(idCliente) {
        return Orden.findAll({
            where: { id_cliente: idCliente },
            include: [
                {
                    model: OrdenItem,
                    as: 'items',
                    include: [{
                        model: Producto,
                        as: 'producto',
                        attributes: ['nombre_producto', 'precio']
                    }]
                }
            ],
            order: [['fecha_orden', 'DESC']],
        });
    }

    /**
     * Obtiene el detalle completo de una orden.
     */
    async getOrderDetailsById(id_orden) {
        const orden = await Orden.findByPk(id_orden, {
            include: [
                { 
                    model: Cliente, 
                    as: 'cliente', 
                    include: [{ 
                        model: Usuario, 
                        as: 'usuario', 
                        attributes: ['nombre_usuario', 'correo_electronico'] 
                    }] 
                },
                { 
                    model: Direccion, 
                    as: 'direccionEnvio' 
                },
                { 
                    model: OrdenItem, 
                    as: 'items', 
                    include: [{ 
                        model: Producto, 
                        as: 'producto', 
                        attributes: ['nombre_producto', 'precio', 'imagen_url'] 
                    }] 
                }
            ]
        });
        if (!orden) {
            throw new Error('Orden no encontrada');
        }
        return orden;
    }

    /**
     * Actualiza el estado de una orden (para administradores).
     */
    async updateOrderStatus(id_orden, nuevo_estado) {
        const t = await sequelize.transaction();
        try {
            const orden = await Orden.findByPk(id_orden, { transaction: t });
            if (!orden) {
                throw new Error('Orden no encontrada');
            }

            // Lógica de cancelación: reponer el stock
            if (nuevo_estado === 'cancelada' && orden.estado_orden !== 'cancelada') {
                const items = await OrdenItem.findAll({ 
                    where: { id_orden }, 
                    transaction: t 
                });
                
                for (const item of items) {
                    await Producto.increment('stock', {
                        by: Number(item.cantidad),
                        where: { id_producto: item.id_producto },
                        transaction: t,
                    });
                }
            }

            // Actualizar estado y fecha de cambio
            await orden.update({
                estado_orden: nuevo_estado,
                fecha_estado_cambio: new Date()
            }, { transaction: t });

            await t.commit();
            return orden;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Elimina una orden de la base de datos.
     */
    async deleteOrder(id_orden) {
        const t = await sequelize.transaction();
        try {
            const orden = await Orden.findByPk(id_orden, { transaction: t });
            if (!orden) {
                throw new Error('Orden no encontrada');
            }
            
            // Eliminar items de la orden primero
            await OrdenItem.destroy({ 
                where: { id_orden }, 
                transaction: t 
            });
            
            // Eliminar la orden
            await orden.destroy({ transaction: t });

            await t.commit();
            return true;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
}

export default new OrdenService();