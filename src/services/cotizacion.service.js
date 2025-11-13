import Cotizaciones from '../models/cotizaciones.model.js';
import Cotizaciones_Items from '../models/cotizacionesItems.model.js';
import Cotizaciones_Ordenes from '../models/cotizacionesOrdenes.model.js';
import Producto from '../models/producto.model.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

/**
 * Función auxiliar mejorada para manejo seguro de transacciones
 */
const ejecutarConTransaccion = async (operation) => {
    const transaction = await sequelize.transaction();
    
    try {
        const result = await operation(transaction);
        await transaction.commit();
        return result;
    } catch (error) {
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }
        throw error;
    }
};

/**
 * Generar número de cotización único
 */
export const generarNumeroCotizacion = async () => {
    try {
        const fecha = new Date();
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        
        // Contar cotizaciones del día actual
        const inicioDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
        const finDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1);
        
        const cotizacionesDelDia = await Cotizaciones.count({
            where: {
                fecha_creacion: {
                    [Op.between]: [inicioDia, finDia]
                }
            }
        });
        
        const numero = String(cotizacionesDelDia + 1).padStart(4, '0');
        return `COT-${año}${mes}${dia}-${numero}`;
    } catch (error) {
        // Fallback si hay error en la generación
        const timestamp = Date.now();
        return `COT-${timestamp}`;
    }
};

/**
 * Crear nueva cotización
 */
export const crearCotizacion = async (id_cliente, id_usuario_creador, datos) => {
    const transaction = await sequelize.transaction();
    try {
        const numero_cotizacion = await generarNumeroCotizacion();
        
        const cotizacion = await Cotizaciones.create({
            id_cliente,
            id_usuario_creador,
            numero_cotizacion,
            fecha_expiracion: datos.fecha_expiracion,
            notas: datos.notas,
            terminos_condiciones: datos.terminos_condiciones,
            estado: 'borrador'
        }, { transaction });
        
        await transaction.commit();
        return await obtenerCotizacion(cotizacion.id_cotizacion);
    } catch (error) {
        if (transaction && !transaction.finished) {
            await transaction.rollback();
        }
        throw new Error(`Error al crear cotización: ${error.message}`);
    }
};

/**
 * Versión mejorada de crearCotizacion usando la función auxiliar
 */
export const crearCotizacionMejorada = async (id_cliente, id_usuario_creador, datos) => {
    return await ejecutarConTransaccion(async (transaction) => {
        // Verificar que el cliente existe
        const { Clientes } = await import('../models/clientes.model.js');
        const cliente = await Clientes.findByPk(id_cliente, { transaction });
        if (!cliente) {
            throw new Error('El cliente especificado no existe');
        }

        // Verificar que el usuario existe
        const { Usuarios } = await import('../models/usuarios.model.js');
        const usuario = await Usuarios.findByPk(id_usuario_creador, { transaction });
        if (!usuario) {
            throw new Error('El usuario creador no existe');
        }

        const numero_cotizacion = await generarNumeroCotizacion();
        
        const cotizacion = await Cotizaciones.create({
            id_cliente,
            id_usuario_creador,
            numero_cotizacion,
            fecha_expiracion: datos.fecha_expiracion,
            notas: datos.notas,
            terminos_condiciones: datos.terminos_condiciones,
            estado: 'borrador'
        }, { transaction });
        
        return await obtenerCotizacion(cotizacion.id_cotizacion);
    });
};

/**
 * Agregar item a cotización
 */
export const agregarItemCotizacion = async (id_cotizacion, id_producto, cantidad, precio_unitario, descuento_porcentaje = 0) => {
    return await ejecutarConTransaccion(async (transaction) => {
        // Verificar que la cotización existe y está en estado borrador
        const cotizacion = await Cotizaciones.findByPk(id_cotizacion, { transaction });
        if (!cotizacion) {
            throw new Error('Cotización no encontrada');
        }
        
        if (cotizacion.estado !== 'borrador') {
            throw new Error('Solo se pueden agregar items a cotizaciones en estado borrador');
        }

        // Verificar que el producto existe
        const producto = await Producto.findByPk(id_producto, { transaction });
        if (!producto) {
            throw new Error('Producto no encontrado');
        }

        const item = await Cotizaciones_Items.create({
            id_cotizacion,
            id_producto,
            cantidad,
            precio_unitario,
            descuento_porcentaje
        }, { transaction });
        
        // Recalcular totales de la cotización
        await recalcularTotalesCotizacion(id_cotizacion, transaction);
        
        return item;
    });
};

/**
 * Actualizar un item de la cotización (Transaccional)
 */
export const actualizarItemCotizacion = async (id_cotizacion_item, updates) => {
    return await ejecutarConTransaccion(async (transaction) => {
        const item = await Cotizaciones_Items.findByPk(id_cotizacion_item, { transaction });
        if (!item) {
            throw new Error('Item de cotización no encontrado');
        }
        
        const cotizacion = await Cotizaciones.findByPk(item.id_cotizacion, { transaction });
        if (cotizacion.estado !== 'borrador') {
            throw new Error('Solo se pueden modificar items de cotizaciones en estado borrador');
        }
        
        await item.update(updates, { transaction });
        
        // Siempre recalcular los totales después de modificar un item
        await recalcularTotalesCotizacion(item.id_cotizacion, transaction);
        
        return item;
    });
};

/**
 * Recalcular totales de la cotización
 */
export const recalcularTotalesCotizacion = async (id_cotizacion, transaction = null) => {
    let localTransaction = null;
    
    try {
        // Si no se proporciona transacción, crear una local
        if (!transaction) {
            localTransaction = await sequelize.transaction();
            transaction = localTransaction;
        }

        const items = await Cotizaciones_Items.findAll({
            where: { id_cotizacion },
            transaction
        });

        if (items.length === 0) {
            // Si no hay items, establecer todo en 0
            await Cotizaciones.update(
                {
                    subtotal: 0,
                    impuestos: 0,
                    total: 0
                },
                {
                    where: { id_cotizacion },
                    transaction
                }
            );
            
            if (localTransaction) await localTransaction.commit();
            return;
        }

        const subtotal = items.reduce((sum, item) => {
            const descuento = item.descuento_porcentaje || 0;
            const precioConDescuento = item.precio_unitario * (1 - descuento / 100);
            return sum + (item.cantidad * precioConDescuento);
        }, 0);

        // Lógica de impuestos (configurable)
        const tasaImpuestos = 0.12; // 12%
        const impuestos = subtotal * tasaImpuestos;
        const total = subtotal + impuestos;

        await Cotizaciones.update(
            {
                subtotal: parseFloat(subtotal.toFixed(2)),
                impuestos: parseFloat(impuestos.toFixed(2)),
                total: parseFloat(total.toFixed(2))
            },
            {
                where: { id_cotizacion },
                transaction
            }
        );

        if (localTransaction) await localTransaction.commit();
        
    } catch (error) {
        if (localTransaction && !localTransaction.finished) {
            await localTransaction.rollback();
        }
        throw new Error(`Error al recalcular totales: ${error.message}`);
    }
};

/**
 * Obtener cotización completa
 */
export const obtenerCotizacion = async (id_cotizacion) => {
    try {
        const cotizacion = await Cotizaciones.findByPk(id_cotizacion, {
            include: [
                {
                    model: Cotizaciones_Items,
                    include: [{ 
                        model: Producto,
                        attributes: ['id_producto', 'nombre_producto', 'descripcion', 'sku']
                    }]
                }
            ]
        });
        
        if (!cotizacion) {
            throw new Error('Cotización no encontrada');
        }
        
        return cotizacion;
    } catch (error) {
        throw new Error(`Error al obtener cotización: ${error.message}`);
    }
};

/**
 * Listar cotizaciones (con filtros y paginación)
 */
export const listarCotizaciones = async (options = {}) => {
    try {
        const { page = 1, limit = 20, estado, id_cliente, id_usuario_creador } = options;
        const offset = (page - 1) * limit;
        const where = {};
        
        if (estado) where.estado = estado;
        if (id_cliente) where.id_cliente = id_cliente;
        if (id_usuario_creador) where.id_usuario_creador = id_usuario_creador;
        
        const { count, rows } = await Cotizaciones.findAndCountAll({
            where,
            include: [
                {
                    model: Cotizaciones_Items,
                    include: [Producto]
                }
            ],
            order: [['fecha_creacion', 'DESC']],
            limit: parseInt(limit),
            offset: offset,
            distinct: true
        });
        
        return {
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            cotizaciones: rows
        };
    } catch (error) {
        throw new Error(`Error al listar cotizaciones: ${error.message}`);
    }
};

/**
 * Listar cotizaciones de un cliente
 */
export const listarCotizacionesPorCliente = async (id_cliente, estado = null) => {
    try {
        const where = { id_cliente };
        if (estado) {
            where.estado = estado;
        }
        
        const cotizaciones = await Cotizaciones.findAll({
            where,
            include: [
                {
                    model: Cotizaciones_Items,
                    include: [Producto]
                }
            ],
            order: [['fecha_creacion', 'DESC']]
        });
        
        return cotizaciones;
    } catch (error) {
        throw new Error(`Error al listar cotizaciones: ${error.message}`);
    }
};

/**
 * Actualizar cotización (solo en estado borrador)
 */
export const actualizarCotizacion = async (id_cotizacion, datos) => {
    return await ejecutarConTransaccion(async (transaction) => {
        const cotizacion = await Cotizaciones.findByPk(id_cotizacion, { transaction });
        
        if (!cotizacion) {
            throw new Error('Cotización no encontrada');
        }
        
        if (cotizacion.estado !== 'borrador') {
            throw new Error('Solo se pueden editar cotizaciones en estado borrador');
        }
        
        await cotizacion.update(datos, { transaction });
        return await obtenerCotizacion(id_cotizacion);
    });
};

/**
 * Eliminar item de cotización
 */
export const eliminarItemCotizacion = async (id_cotizacion_item) => {
    return await ejecutarConTransaccion(async (transaction) => {
        const item = await Cotizaciones_Items.findByPk(id_cotizacion_item, { transaction });
        
        if (!item) {
            throw new Error('Item no encontrado');
        }
        
        const id_cotizacion = item.id_cotizacion;
        await item.destroy({ transaction });
        
        // Recalcular totales
        await recalcularTotalesCotizacion(id_cotizacion, transaction);
        
        return { mensaje: 'Item eliminado correctamente' };
    });
};

/**
 * Enviar cotización (cambiar estado a enviada)
 */
export const enviarCotizacion = async (id_cotizacion) => {
    return await ejecutarConTransaccion(async (transaction) => {
        const cotizacion = await Cotizaciones.findByPk(id_cotizacion, { transaction });
        
        if (!cotizacion) {
            throw new Error('Cotización no encontrada');
        }
        
        if (cotizacion.estado !== 'borrador') {
            throw new Error('Solo se pueden enviar cotizaciones en estado borrador');
        }
        
        await cotizacion.update({
            estado: 'enviada'
        }, { transaction });
        
        return await obtenerCotizacion(id_cotizacion);
    });
};

/**
 * Aceptar cotización
 */
export const aceptarCotizacion = async (id_cotizacion) => {
    return await ejecutarConTransaccion(async (transaction) => {
        const cotizacion = await Cotizaciones.findByPk(id_cotizacion, { transaction });
        
        if (!cotizacion) {
            throw new Error('Cotización no encontrada');
        }
        
        if (!['enviada', 'borrador'].includes(cotizacion.estado)) {
            throw new Error('La cotización no puede ser aceptada en este estado');
        }
        
        await cotizacion.update({
            estado: 'aceptada'
        }, { transaction });
        
        return await obtenerCotizacion(id_cotizacion);
    });
};

/**
 * Rechazar cotización
 */
export const rechazarCotizacion = async (id_cotizacion) => {
    return await ejecutarConTransaccion(async (transaction) => {
        const cotizacion = await Cotizaciones.findByPk(id_cotizacion, { transaction });
        
        if (!cotizacion) {
            throw new Error('Cotización no encontrada');
        }
        
        if (!['enviada', 'borrador'].includes(cotizacion.estado)) {
            throw new Error('La cotización no puede ser rechazada en este estado');
        }
        
        await cotizacion.update({
            estado: 'rechazada'
        }, { transaction });
        
        return await obtenerCotizacion(id_cotizacion);
    });
};

/**
 * Convertir cotización aceptada a orden
 */
export const convertirCotizacionAOrden = async (id_cotizacion, id_orden) => {
    return await ejecutarConTransaccion(async (transaction) => {
        const cotizacion = await Cotizaciones.findByPk(id_cotizacion, { transaction });
        
        if (!cotizacion) {
            throw new Error('Cotización no encontrada');
        }
        
        if (cotizacion.estado !== 'aceptada') {
            throw new Error('Solo se pueden convertir cotizaciones aceptadas a órdenes');
        }
        
        // Crear registro de conversión
        const conversion = await Cotizaciones_Ordenes.create({
            id_cotizacion,
            id_orden
        }, { transaction });
        
        return conversion;
    });
};

/**
 * Verificar y expirar cotizaciones vencidas
 */
export const verificarCotizacionesExpiradas = async () => {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const [affectedCount] = await Cotizaciones.update(
            { estado: 'expirada' },
            {
                where: {
                    estado: ['enviada', 'borrador'],
                    fecha_expiracion: {
                        [Op.lt]: hoy
                    }
                }
            }
        );
        
        return { cotizacionesExpiradas: affectedCount };
    } catch (error) {
        throw new Error(`Error al verificar cotizaciones expiradas: ${error.message}`);
    }
};

/**
 * Obtener cotizaciones por rango de fechas
 */
export const obtenerCotizacionesPorFecha = async (fecha_inicio, fecha_fin) => {
    try {
        const cotizaciones = await Cotizaciones.findAll({
            where: {
                fecha_creacion: {
                    [sequelize.Op.between]: [fecha_inicio, fecha_fin]
                }
            },
            include: [
                {
                    model: Cotizaciones_Items,
                    include: [Producto]
                }
            ],
            order: [['fecha_creacion', 'DESC']]
        });
        
        return cotizaciones;
    } catch (error) {
        throw new Error(`Error al obtener cotizaciones: ${error.message}`);
    }
};

/**
 * Generar reporte de cotizaciones
 */
export const generarReporteCotizaciones = async (filtros = {}) => {
    try {
        const where = {};
        
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        
        if (filtros.id_cliente) {
            where.id_cliente = filtros.id_cliente;
        }
        
        if (filtros.fecha_inicio && filtros.fecha_fin) {
            where.fecha_creacion = {
                [sequelize.Op.between]: [filtros.fecha_inicio, filtros.fecha_fin]
            };
        }
        
        const cotizaciones = await Cotizaciones.findAll({
            where,
            include: [
                {
                    model: Cotizaciones_Items,
                    include: [Producto]
                }
            ],
            order: [['fecha_creacion', 'DESC']]
        });
        
        const totalCotizaciones = cotizaciones.length;
        const sumaTotal = cotizaciones.reduce((sum, cot) => sum + parseFloat(cot.total || 0), 0);
        const promedioTotal = totalCotizaciones > 0 ? sumaTotal / totalCotizaciones : 0;
        
        // Estadísticas por estado
        const estadisticasEstado = {};
        cotizaciones.forEach(cot => {
            if (!estadisticasEstado[cot.estado]) {
                estadisticasEstado[cot.estado] = 0;
            }
            estadisticasEstado[cot.estado]++;
        });
        
        return {
            totalCotizaciones,
            sumaTotal,
            promedioTotal,
            estadisticasEstado,
            cotizaciones
        };
    } catch (error) {
        throw new Error(`Error al generar reporte: ${error.message}`);
    }
};

/**
 * Obtener estadísticas rápidas de cotizaciones
 */
export const obtenerEstadisticasCotizaciones = async () => {
    try {
        const totalCotizaciones = await Cotizaciones.count();
        const cotizacionesBorrador = await Cotizaciones.count({ where: { estado: 'borrador' } });
        const cotizacionesEnviadas = await Cotizaciones.count({ where: { estado: 'enviada' } });
        const cotizacionesAceptadas = await Cotizaciones.count({ where: { estado: 'aceptada' } });
        
        const resultado = await Cotizaciones.findOne({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('total')), 'valorTotal']
            ],
            raw: true
        });
        
        const valorTotal = parseFloat(resultado.valorTotal) || 0;
        
        return {
            totalCotizaciones,
            cotizacionesBorrador,
            cotizacionesEnviadas,
            cotizacionesAceptadas,
            valorTotal
        };
    } catch (error) {
        throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
};