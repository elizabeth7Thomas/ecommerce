import { DataTypes, Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

// Se importan los modelos necesarios para definir las asociaciones.
import Cliente from '../models/cliente.model.js'; 
import Direccion from '../models/direccion.model.js';
import OrdenItem from '../models/ordenesItems.model.js';
import Producto from '../models/producto.model.js';
import CarritoCompras from '../models/carritoCompras.model.js';
import CarritoProducto from '../models/carritoProducto.model.js';

const Orden = sequelize.define('Orden', {
    id_orden: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    id_cliente: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Cliente,
            key: 'id_cliente'
        }
    },
    id_direccion_envio: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Direccion,
            key: 'id_direccion'
        }
    },
    total_orden: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { 
            min: 0,
            isDecimal: true
        },
    },
    estado_orden: {
        type: DataTypes.ENUM(
            'pendiente', 
            'procesando', 
            'enviado', 
            'entregado', 
            'cancelado'
        ),
        allowNull: false,
        defaultValue: 'pendiente',
    },
    notas_orden: {
        type: DataTypes.TEXT,
    },
}, {
    tableName: 'ordenes',
    timestamps: true,
    createdAt: 'fecha_orden',
    updatedAt: 'fecha_actualizacion',
});

// Definir las asociaciones
Orden.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
Orden.belongsTo(Direccion, { foreignKey: 'id_direccion_envio', as: 'direccionEnvio' });
Orden.hasMany(OrdenItem, { foreignKey: 'id_orden', as: 'items' });


/**
 * =================================================================
 *                          CAPA DE SERVICIO
 * =================================================================
 * Lógica de negocio para la gestión de órdenes.
 */
class OrdenService {
    
    /**
     * Crea una nueva orden a partir del carrito de compras activo de un cliente.
     * @param {number} idCliente - ID del cliente.
     * @param {number} idDireccionEnvio - ID de la dirección de envío.
     * @param {string} notas_orden - Notas adicionales para la orden.
     * @returns {Promise<Orden>} La orden creada con todos sus detalles.
     */
    async createOrderFromCart(idCliente, idDireccionEnvio, notas_orden) {
        const t = await sequelize.transaction();
        try {
            // 1. Verificar carrito y productos
            const carrito = await CarritoCompras.findOne({
                where: { id_cliente: idCliente, estado: 'activo' },
                include: [{ 
                    model: CarritoProducto, 
                    as: 'productosCarrito',
                    include: [{ 
                        model: Producto, 
                        as: 'producto',
                        attributes: ['id_producto', 'nombre_producto', 'precio', 'stock', 'activo']
                    }] 
                }],
                transaction: t,
            });

            if (!carrito || !carrito.productosCarrito || carrito.productosCarrito.length === 0) {
                throw new Error('El carrito está vacío o no se encontró.');
            }

            // 2. Validar productos y stock
            const productosSinStock = carrito.productosCarrito.filter(item => 
                Number(item.producto.stock) < Number(item.cantidad) || !item.producto.activo
            );

            if (productosSinStock.length > 0) {
                const nombres = productosSinStock.map(item => item.producto.nombre_producto);
                throw new Error(`Productos sin stock o inactivos: ${nombres.join(', ')}`);
            }

            // 3. Verificar dirección
            const direccion = await Direccion.findOne({ 
                where: { id_direccion: idDireccionEnvio, id_cliente: idCliente }, 
                transaction: t 
            });
            
            if (!direccion) {
                throw new Error('La dirección de envío no es válida o no pertenece al cliente.');
            }

            // 4. Calcular total
            const total_orden = carrito.productosCarrito.reduce((total, item) => {
                return total + (Number(item.cantidad) * Number(item.producto.precio));
            }, 0);

            // 5. Crear orden
            const nuevaOrden = await Orden.create({
                id_cliente: idCliente,
                id_direccion_envio: idDireccionEnvio,
                total_orden,
                estado_orden: 'pendiente',
                notas_orden,
            }, { transaction: t });

            // 6. Crear items de orden (EL TRIGGER SE ENCARGA DEL STOCK)
            const ordenItems = carrito.productosCarrito.map(item => ({
                id_orden: nuevaOrden.id_orden,
                id_producto: item.id_producto,
                cantidad: item.cantidad,
                precio_unitario: item.producto.precio,
            }));

            await OrdenItem.bulkCreate(ordenItems, { transaction: t });

            // 7. Limpiar carrito
            await CarritoProducto.destroy({
                where: { id_carrito: carrito.id_carrito },
                transaction: t
            });

            await CarritoCompras.update(
                { estado: 'convertido' },
                { where: { id_carrito: carrito.id_carrito }, transaction: t }
            );

            // Guardar el ID antes de commit para posterior consulta
            const idOrdenCreada = nuevaOrden.id_orden;
            
            await t.commit();
            
            // Recargar la orden con relaciones para devolverla completa (FUERA de la transacción)
            return await this.getOrderDetailsById(idOrdenCreada);
            
        } catch (error) {
            // Solo hacer rollback si la transacción aún está activa
            if (t && !t.finished) {
                await t.rollback();
            }
            console.error("Error al crear la orden:", error);
            throw error; // Re-lanzar el error para que sea manejado en una capa superior.
        }
    }

    /**
     * Obtiene los detalles completos de una orden por su ID.
     * @param {number} id_orden - El ID de la orden.
     * @returns {Promise<Orden|null>} La orden con sus relaciones o null si no se encuentra.
     */
    async getOrderDetailsById(id_orden) {
        return await Orden.findByPk(id_orden, {
            include: [
                { model: Cliente, as: 'cliente', attributes: ['id_cliente', 'nombre', 'apellido'] },
                { model: Direccion, as: 'direccionEnvio' },
                { 
                    model: OrdenItem, 
                    as: 'items',
                    include: [{ model: Producto, as: 'producto', attributes: ['nombre_producto'] }]
                }
            ]
        });
    }

    /**
     * Obtiene todas las órdenes de un cliente específico.
     * @param {number} idCliente - El ID del cliente.
     * @returns {Promise<Orden[]>} Un array de órdenes.
     */
    async getOrdersByClient(idCliente) {
        return await Orden.findAll({
            where: { id_cliente: idCliente },
            order: [['fecha_orden', 'DESC']],
            include: [{ model: OrdenItem, as: 'items' }] // Incluir detalles básicos
        });
    }

    /**
     * Actualiza el estado de una orden.
     * @param {number} id_orden - El ID de la orden a actualizar.
     * @param {'procesando' | 'enviado' | 'entregado' | 'cancelado'} nuevoEstado - El nuevo estado.
     * @returns {Promise<Orden>} La orden actualizada.
     */
    async updateOrderStatus(id_orden, nuevoEstado) {
        const orden = await Orden.findByPk(id_orden);
        if (!orden) {
            throw new Error('Orden no encontrada.');
        }

        // Validación simple para asegurar que el estado es válido
        const estadosValidos = ['procesando', 'enviado', 'entregado', 'cancelado', 'pendiente'];
        if (!estadosValidos.includes(nuevoEstado)) {
            throw new Error(`Estado '${nuevoEstado}' no es válido.`);
        }

        orden.estado_orden = nuevoEstado;
        await orden.save();
        
        return orden;
    }
}

// Exportar tanto el modelo como el servicio para su uso en otras partes de la aplicación.
export default Orden;
export const ordenService = new OrdenService();