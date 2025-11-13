
import Cotizaciones from '../models/cotizaciones.model.js';
import Cotizaciones_Items from '../models/cotizacionesItems.model.js';
import Cotizaciones_Ordenes from '../models/cotizacionesOrdenes.model.js';
import Producto from '../models/producto.model.js';
import sequelize  from '../config/database.js';
import { Op } from 'sequelize'; // Importar Op para consultas complejas

/**
 * Generar número de cotización único
 */
export const generarNumeroCotizacion = async () => {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    // Contar cotizaciones creadas en el año actual para un consecutivo anual
    const cotizacionesDelAño = await Cotizaciones.count({
        where: sequelize.where(
            sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM fecha_creacion')),
            '=',
            año
        )
    });
    const numero = String(cotizacionesDelAño + 1).padStart(5, '0');
    return `COT-${año}${mes}-${numero}`;
};

/**
 * Crear nueva cotización
 */
export const crearCotizacion = async (id_cliente, id_usuario_creador, datos) => {
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
        });
        
        return cotizacion;
    } catch (error) {
        throw new Error(`Error al crear cotización: ${error.message}`);
    }
};

/**
 * Agregar item a cotización
 */
export const agregarItemCotizacion = async (id_cotizacion, id_producto, cantidad, precio_unitario, descuento_porcentaje = 0) => {
    const t = await sequelize.transaction();
    try {
        const item = await Cotizaciones_Items.create({
            id_cotizacion,
            id_producto,
            cantidad,
            precio_unitario,
            descuento_porcentaje
        }, { transaction: t });
        // Recalcular totales de la cotización dentro de la misma transacción
        await recalcularTotalesCotizacion(id_cotizacion, t);
        await t.commit();
        return item;
    } catch (error) {
        await t.rollback();
        throw new Error(`Error al agregar item: ${error.message}`);
    }
};

/**
 * Actualizar un item de la cotización (Transaccional)
 */
export const actualizarItemCotizacion = async (id_cotizacion_item, updates) => {
    const t = await sequelize.transaction();
    try {
        const item = await Cotizaciones_Items.findByPk(id_cotizacion_item, { transaction: t });
        if (!item) {
            throw new Error('Item de cotización no encontrado');
        }
        const cotizacion = await Cotizaciones.findByPk(item.id_cotizacion, { transaction: t });
        if (cotizacion.estado !== 'borrador') {
            throw new Error('Solo se pueden modificar items de cotizaciones en estado borrador');
        }
        await item.update(updates, { transaction: t });
        // Siempre recalcular los totales después de modificar un item
        await recalcularTotalesCotizacion(item.id_cotizacion, t);
        await t.commit();
        return item; // Devuelve el item actualizado
    } catch (error) {
        await t.rollback();
        throw new Error(`Error al actualizar el item: ${error.message}`);
    }
};

/**
 * Recalcular totales de la cotización
 */
export const recalcularTotalesCotizacion = async (id_cotizacion, transaction) => {
    try {
        const items = await Cotizaciones_Items.findAll({
            where: { id_cotizacion },
            transaction
        });
        const subtotal = items.reduce((sum, item) => {
            // Si el modelo tiene un campo subtotal, úsalo, si no, calcula aquí
            if (item.subtotal !== undefined) {
                return sum + parseFloat(item.subtotal);
            }
            return sum + (item.cantidad * item.precio_unitario * (1 - (item.descuento_porcentaje || 0) / 100));
        }, 0);
        // Lógica de impuestos (configurable si es necesario)
        const tasaImpuestos = 0.12; // 12%
        const impuestos = subtotal * tasaImpuestos;
        const total = subtotal + impuestos;
        await Cotizaciones.update(
            {
                subtotal: subtotal.toFixed(2),
                impuestos: impuestos.toFixed(2),
                total: total.toFixed(2)
            },
            {
                where: { id_cotizacion },
                transaction
            }
        );
    } catch (error) {
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
                    as: 'items', // Usar alias si se define en las asociaciones
                    include: [{ model: Producto, as: 'producto' }]
                }
            ]
        });
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
                    as: 'items'
                }
            ],
            order: [['fecha_creacion', 'DESC']],
            limit: parseInt(limit),
            offset: offset,
            distinct: true // Importante para que el conteo funcione bien con 'include'
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
    try {
        const cotizacion = await Cotizaciones.findByPk(id_cotizacion);
        if (!cotizacion) {
            throw new Error('Cotización no encontrada');
        }
        if (cotizacion.estado !== 'borrador') {
            throw new Error('Solo se pueden editar cotizaciones en estado borrador');
        }
        await cotizacion.update(datos);
        return cotizacion;
    } catch (error) {
        throw new Error(`Error al actualizar cotización: ${error.message}`);
    }
};

/**
 * Eliminar item de cotización
 */
export const eliminarItemCotizacion = async (id_cotizacion_item) => {
    const t = await sequelize.transaction();
    try {
        const item = await Cotizaciones_Items.findByPk(id_cotizacion_item, { transaction: t });
        if (!item) {
            throw new Error('Item no encontrado');
        }
        const id_cotizacion = item.id_cotizacion;
        await item.destroy({ transaction: t });
        // Recalcular totales
        await recalcularTotalesCotizacion(id_cotizacion, t);
        await t.commit();
        return { mensaje: 'Item eliminado correctamente' };
    } catch (error) {
        await t.rollback();
        throw new Error(`Error al eliminar item: ${error.message}`);
    }
};

/**
 * Enviar cotización (cambiar estado a enviada)
 */
export const enviarCotizacion = async (id_cotizacion) => {
    try {
        const cotizacion = await Cotizaciones.findByPk(id_cotizacion);
        
        if (!cotizacion) {
            throw new Error('Cotización no encontrada');
        }
        
        if (cotizacion.estado !== 'borrador') {
            throw new Error('Solo se pueden enviar cotizaciones en estado borrador');
        }
        
        await cotizacion.update({
            estado: 'enviada'
        });
        
        return cotizacion;
    } catch (error) {
        throw new Error(`Error al enviar cotización: ${error.message}`);
    }
};

/**
 * Aceptar cotización
 */
export const aceptarCotizacion = async (id_cotizacion) => {
    try {
        const cotizacion = await Cotizaciones.findByPk(id_cotizacion);
        
        if (!cotizacion) {
            throw new Error('Cotización no encontrada');
        }
        
        if (!['enviada', 'borrador'].includes(cotizacion.estado)) {
            throw new Error('La cotización no puede ser aceptada en este estado');
        }
        
        await cotizacion.update({
            estado: 'aceptada'
        });
        
        return cotizacion;
    } catch (error) {
        throw new Error(`Error al aceptar cotización: ${error.message}`);
    }
};

/**
 * Rechazar cotización
 */
export const rechazarCotizacion = async (id_cotizacion) => {
    try {
        const cotizacion = await Cotizaciones.findByPk(id_cotizacion);
        
        if (!cotizacion) {
            throw new Error('Cotización no encontrada');
        }
        
        if (!['enviada', 'borrador'].includes(cotizacion.estado)) {
            throw new Error('La cotización no puede ser rechazada en este estado');
        }
        
        await cotizacion.update({
            estado: 'rechazada'
        });
        
        return cotizacion;
    } catch (error) {
        throw new Error(`Error al rechazar cotización: ${error.message}`);
    }
};

/**
 * Convertir cotización aceptada a orden
 */
export const convertirCotizacionAOrden = async (id_cotizacion, id_orden) => {
    try {
        const cotizacion = await Cotizaciones.findByPk(id_cotizacion);
        
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
        });
        
        // Cambiar estado a aceptada (ya está, pero lo dejamos para claridad)
        return conversion;
    } catch (error) {
        throw new Error(`Error al convertir cotización: ${error.message}`);
    }
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
                    model: Cotizaciones_Items
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
            attributes: [
                'id_cotizacion',
                'numero_cotizacion',
                'estado',
                'fecha_creacion',
                'subtotal',
                'impuestos',
                'total'
            ],
            raw: true
        });
        
        const totalCotizaciones = cotizaciones.length;
        const sumaTotal = cotizaciones.reduce((sum, cot) => sum + parseFloat(cot.total || 0), 0);
        const promedioTotal = totalCotizaciones > 0 ? sumaTotal / totalCotizaciones : 0;
        
        return {
            totalCotizaciones,
            sumaTotal,
            promedioTotal,
            cotizaciones
        };
    } catch (error) {
        throw new Error(`Error al generar reporte: ${error.message}`);
    }
};
