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
            const direccion = await Direccion.findOne({ where: { id_direccion: idDireccionEnvio, id_cliente: idCliente }, transaction: t });
            if (!direccion) {
                throw new Error('La dirección de envío no es válida o no pertenece al cliente.');
            }

            // 3. Calcular el total de la orden
            const total_orden = carrito.productosCarrito.reduce((total, item) => {
                const precio = Number(item.producto.precio);
                return total + (Number(item.cantidad) * precio);
            }, 0);

            // 4. Crear la orden
            const nuevaOrden = await Orden.create({
                id_cliente: idCliente,
                id_direccion_envio: idDireccionEnvio,
                total_orden,
                estado_orden: 'pendiente',
                notas_orden,
            }, { transaction: t });

            // 5. Mover productos del carrito a Ordenes_Items y actualizar stock
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
                producto.stock = Number(producto.stock) - Number(item.cantidad);
                await producto.save({ transaction: t });
            }

            // 6. Marcar el carrito como 'convertido'
            carrito.estado = 'convertido';
            await carrito.save({ transaction: t });

            await t.commit();
            return nuevaOrden;
        } catch (error) {
            await t.rollback();
            throw error; // Re-lanzar el error para que el controlador lo maneje
        }
    }

    /**
     * Obtiene todas las órdenes (para administradores).
     */
    async getAllOrders() {
        return Orden.findAll({
            include: [
                { model: Cliente, as: 'cliente', include: [{ model: Usuario, as: 'usuario' }] }
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
            order: [['fecha_orden', 'DESC']],
        });
    }

    /**
     * Obtiene el detalle completo de una orden.
     */
    async getOrderDetailsById(id_orden) {
        const orden = await Orden.findByPk(id_orden, {
            include: [
                { model: Cliente, as: 'cliente', include: [{ model: Usuario, as: 'usuario', attributes: ['nombre_usuario', 'correo_electronico'] }] },
                { model: Direccion, as: 'direccionEnvio' },
                { model: OrdenItem, as: 'items', include: [{ model: Producto, as: 'producto', attributes: ['nombre_producto', 'precio'] }] }
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
            if (nuevo_estado === 'cancelado' && orden.estado_orden !== 'cancelado') {
                const items = await OrdenItem.findAll({ where: { id_orden }, transaction: t });
                for (const item of items) {
                    // Usar increment para evitar condiciones de carrera
                    await Producto.increment('stock', {
                        by: Number(item.cantidad),
                        where: { id_producto: item.id_producto },
                        transaction: t,
                    });
                }
            }

            orden.estado_orden = nuevo_estado;
            await orden.save({ transaction: t });

            await t.commit();
            return orden;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
}

export default new OrdenService();
