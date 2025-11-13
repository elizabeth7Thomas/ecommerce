import Devoluciones from '../models/devoluciones.model.js';
import Devoluciones_Items from '../models/devolucionesItems.model.js';
import Reembolsos from '../models/reembolsos.model.js';
import Politicas_Devolucion from '../models/politicasDevolucion.model.js';
import Orden from '../models/ordenes.model.js';
import Cliente from '../models/cliente.model.js';
import Producto from '../models/producto.model.js';
import Ordenesitems from '../models/ordenesItems.model.js';
import sequelize from '../config/database.js';

/**
 * Generar número de devolución único
 */
export const generarNumeroDevolucion = async () => {
    const fecha = new Date();
    const devolucionesDelDia = await Devoluciones.count({
        where: sequelize.where(
            sequelize.fn('DATE', sequelize.col('fecha_solicitud')),
            '=',
            fecha.toISOString().split('T')[0]
        )
    });
    
    const numero = String(devolucionesDelDia + 1).padStart(5, '0');
    return `DEV-${fecha.toISOString().split('T')[0].replace(/-/g, '')}-${numero}`;
};

/**
 * Crear solicitud de devolución
 */
export const crearSolicitudDevolucion = async (id_orden, id_cliente, datos) => {
    const transaction = await sequelize.transaction();
    
    try {
        // Verificar que la orden existe
        const orden = await Orden.findByPk(id_orden, { transaction });
        if (!orden) {
            throw new Error('Orden no encontrada');
        }

        const numero_devolucion = await generarNumeroDevolucion();
        
        const devolucion = await Devoluciones.create({
            id_orden,
            id_cliente,
            numero_devolucion,
            tipo_devolucion: datos.tipo_devolucion,
            motivo: datos.motivo,
            motivo_detalle: datos.motivo_detalle,
            metodo_reembolso: datos.metodo_reembolso,
            notas_cliente: datos.notas_cliente,
            evidencia_imagenes: datos.evidencia_imagenes || null,
            estado: 'solicitada',
            fecha_solicitud: new Date()
        }, { transaction });
        
        await transaction.commit();
        return devolucion;
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al crear solicitud de devolución: ${error.message}`);
    }
};

/**
 * Agregar items a la devolución
 */
export const agregarItemDevolucion = async (id_devolucion, id_orden_item, id_producto, cantidad_solicitada, precio_unitario, motivo_item) => {
    const transaction = await sequelize.transaction();
    
    try {
        // Verificar que la devolución existe y está en estado correcto
        const devolucion = await Devoluciones.findByPk(id_devolucion, { transaction });
        if (!devolucion) {
            throw new Error('Devolución no encontrada');
        }
        
        if (devolucion.estado !== 'solicitada') {
            throw new Error('Solo se pueden agregar items a devoluciones en estado "solicitada"');
        }

        const item = await Devoluciones_Items.create({
            id_devolucion,
            id_orden_item,
            id_producto,
            cantidad_solicitada,
            precio_unitario,
            motivo_item,
            estado_item: 'pendiente'
        }, { transaction });
        
        // Recalcular monto total de la devolución
        await recalcularMontosDevolucion(id_devolucion, transaction);
        
        await transaction.commit();
        return item;
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al agregar item de devolución: ${error.message}`);
    }
};

/**
 * Recalcular montos de devolución
 */
export const recalcularMontosDevolucion = async (id_devolucion, transaction = null) => {
    try {
        const options = transaction ? { where: { id_devolucion }, transaction } : { where: { id_devolucion } };
        
        const items = await Devoluciones_Items.findAll(options);
        
        const monto_total = items.reduce((sum, item) => {
            return sum + (item.cantidad_solicitada * item.precio_unitario);
        }, 0);
        
        const updateOptions = transaction ? 
            { where: { id_devolucion }, transaction } : 
            { where: { id_devolucion } };
            
        await Devoluciones.update(
            { monto_total_devolucion: monto_total },
            updateOptions
        );
    } catch (error) {
        throw new Error(`Error al recalcular montos: ${error.message}`);
    }
};

/**
 * Obtener devolución completa
 */
export const obtenerDevolucion = async (id_devolucion) => {
    try {
        const devolucion = await Devoluciones.findByPk(id_devolucion, {
            include: [
                {
                    model: Devoluciones_Items,
                    include: [Producto]
                },
                {
                    model: Orden,
                    include: [Cliente]
                },
                {
                    model: Reembolsos
                }
            ]
        });
        
        return devolucion;
    } catch (error) {
        throw new Error(`Error al obtener devolución: ${error.message}`);
    }
};

/**
 * Listar devoluciones de un cliente
 */
export const listarDevolucionesCliente = async (id_cliente, estado = null) => {
    try {
        const where = { id_cliente };
        if (estado) {
            where.estado = estado;
        }
        
        const devoluciones = await Devoluciones.findAll({
            where,
            include: [
                {
                    model: Devoluciones_Items,
                    include: [Producto]
                },
                {
                    model: Orden
                }
            ],
            order: [['fecha_solicitud', 'DESC']]
        });
        
        return devoluciones;
    } catch (error) {
        throw new Error(`Error al listar devoluciones: ${error.message}`);
    }
};

/**
 * Listar devoluciones de una orden
 */
export const listarDevolucionesOrden = async (id_orden) => {
    try {
        const devoluciones = await Devoluciones.findAll({
            where: { id_orden },
            include: [
                {
                    model: Devoluciones_Items,
                    include: [Producto]
                }
            ],
            order: [['fecha_solicitud', 'DESC']]
        });
        
        return devoluciones;
    } catch (error) {
        throw new Error(`Error al listar devoluciones de la orden: ${error.message}`);
    }
};

/**
 * Aprobar devolución
 */
export const aprobarDevolucion = async (id_devolucion, id_usuario, datos) => {
    const transaction = await sequelize.transaction();
    
    try {
        const devolucion = await Devoluciones.findByPk(id_devolucion, { transaction });
        
        if (!devolucion) {
            throw new Error('Devolución no encontrada');
        }
        
        if (devolucion.estado !== 'solicitada') {
            throw new Error('Solo se pueden aprobar devoluciones en estado "solicitada"');
        }
        
        // Aprobar items
        const items = await Devoluciones_Items.findAll({
            where: { id_devolucion },
            transaction
        });
        
        let monto_aprobado = 0;
        for (const item of items) {
            const cantidad_aprobada = datos.items_aprobados[item.id_devolucion_item] || item.cantidad_solicitada;
            
            await item.update({
                cantidad_aprobada,
                estado_item: 'aprobado'
            }, { transaction });
            
            monto_aprobado += cantidad_aprobada * item.precio_unitario;
        }
        
        await devolucion.update({
            estado: 'aprobada',
            monto_aprobado,
            fecha_aprobacion: new Date(),
            id_usuario_aprobo: id_usuario,
            notas_internas: datos.notas_internas
        }, { transaction });
        
        await transaction.commit();
        return await obtenerDevolucion(id_devolucion);
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al aprobar devolución: ${error.message}`);
    }
};

/**
 * Rechazar devolución
 */
export const rechazarDevolucion = async (id_devolucion, id_usuario, razon) => {
    const transaction = await sequelize.transaction();
    
    try {
        const devolucion = await Devoluciones.findByPk(id_devolucion, { transaction });
        
        if (!devolucion) {
            throw new Error('Devolución no encontrada');
        }
        
        if (devolucion.estado !== 'solicitada') {
            throw new Error('Solo se pueden rechazar devoluciones en estado "solicitada"');
        }
        
        await devolucion.update({
            estado: 'rechazada',
            fecha_rechazo: new Date(),
            id_usuario_aprobo: id_usuario,
            notas_internas: razon
        }, { transaction });
        
        await transaction.commit();
        return await obtenerDevolucion(id_devolucion);
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al rechazar devolución: ${error.message}`);
    }
};

/**
 * Registrar recepción de devolución
 */
export const registrarRecepcionDevolucion = async (id_devolucion, datos) => {
    const transaction = await sequelize.transaction();
    
    try {
        const devolucion = await Devoluciones.findByPk(id_devolucion, { transaction });
        
        if (!devolucion) {
            throw new Error('Devolución no encontrada');
        }
        
        if (devolucion.estado !== 'aprobada') {
            throw new Error('Solo se puede registrar recepción de devoluciones aprobadas');
        }
        
        // Registrar recepción de items
        for (const item_id in datos.items_recibidos) {
            const item = await Devoluciones_Items.findByPk(item_id, { transaction });
            if (item) {
                await item.update({
                    estado_item: 'recibido',
                    fecha_recibido: new Date(),
                    condicion_producto: datos.condiciones?.[item_id] || 'pendiente'
                }, { transaction });
            }
        }
        
        await devolucion.update({
            estado: 'en_proceso',
            guia_devolucion: datos.guia_devolucion,
            transportista_devolucion: datos.transportista
        }, { transaction });
        
        await transaction.commit();
        return await obtenerDevolucion(id_devolucion);
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al registrar recepción: ${error.message}`);
    }
};

/**
 * Inspeccionar items de devolución
 */
export const inspeccionarItems = async (id_devolucion, inspecciones) => {
    const transaction = await sequelize.transaction();
    
    try {
        const devolucion = await Devoluciones.findByPk(id_devolucion, { transaction });
        
        if (!devolucion) {
            throw new Error('Devolución no encontrada');
        }
        
        if (devolucion.estado !== 'en_proceso') {
            throw new Error('Solo se pueden inspeccionar devoluciones en proceso');
        }
        
        for (const item_id in inspecciones) {
            const inspeccion = inspecciones[item_id];
            const item = await Devoluciones_Items.findByPk(item_id, { transaction });
            
            if (item) {
                await item.update({
                    estado_item: 'inspeccionado',
                    fecha_inspeccion: new Date(),
                    condicion_producto: inspeccion.condicion,
                    accion_tomar: inspeccion.accion,
                    notas_inspeccion: inspeccion.notas
                }, { transaction });
            }
        }
        
        await transaction.commit();
        return await obtenerDevolucion(id_devolucion);
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error en inspección: ${error.message}`);
    }
};

/**
 * Crear reembolso para devolución
 */
export const crearReembolso = async (id_devolucion, id_metodo_pago, monto_reembolso) => {
    const transaction = await sequelize.transaction();
    
    try {
        const devolucion = await Devoluciones.findByPk(id_devolucion, { transaction });
        
        if (!devolucion) {
            throw new Error('Devolución no encontrada');
        }
        
        if (devolucion.estado !== 'en_proceso') {
            throw new Error('Solo se pueden crear reembolsos para devoluciones en proceso');
        }
        
        const reembolso = await Reembolsos.create({
            id_devolucion,
            id_metodo_pago,
            monto_reembolso,
            estado_reembolso: 'pendiente'
        }, { transaction });
        
        await transaction.commit();
        return reembolso;
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al crear reembolso: ${error.message}`);
    }
};

/**
 * Procesar reembolso
 */
export const procesarReembolso = async (id_reembolso, id_usuario) => {
    const transaction = await sequelize.transaction();
    
    try {
        const reembolso = await Reembolsos.findByPk(id_reembolso, { transaction });
        
        if (!reembolso) {
            throw new Error('Reembolso no encontrado');
        }
        
        if (reembolso.estado_reembolso !== 'pendiente') {
            throw new Error('Solo se pueden procesar reembolsos pendientes');
        }
        
        await reembolso.update({
            estado_reembolso: 'procesando',
            fecha_procesamiento: new Date(),
            id_usuario_aprobo_reembolso: id_usuario
        }, { transaction });
        
        await transaction.commit();
        return reembolso;
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al procesar reembolso: ${error.message}`);
    }
};

/**
 * Completar reembolso
 */
export const completarReembolso = async (id_reembolso, transaccion_id) => {
    const transaction = await sequelize.transaction();
    
    try {
        const reembolso = await Reembolsos.findByPk(id_reembolso, { transaction });
        
        if (!reembolso) {
            throw new Error('Reembolso no encontrado');
        }
        
        if (reembolso.estado_reembolso !== 'procesando') {
            throw new Error('Solo se pueden completar reembolsos en procesamiento');
        }
        
        await reembolso.update({
            estado_reembolso: 'completado',
            fecha_completado: new Date(),
            transaccion_reembolso_id: transaccion_id
        }, { transaction });
        
        // Actualizar estado de devolución
        const devolucion = await Devoluciones.findByPk(reembolso.id_devolucion, { transaction });
        await devolucion.update({
            estado: 'completada',
            fecha_completada: new Date()
        }, { transaction });
        
        await transaction.commit();
        return reembolso;
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al completar reembolso: ${error.message}`);
    }
};

/**
 * Verificar si una orden es elegible para devolución
 */
export const verificarElegibilidadDevolucion = async (id_orden) => {
    try {
        const orden = await Orden.findByPk(id_orden);
        
        if (!orden) {
            throw new Error('Orden no encontrada');
        }
        
        // Obtener política de devoluciones activa
        const politica = await Politicas_Devolucion.findOne({
            where: { activo: true }
        });
        
        if (!politica) {
            return { 
                elegible: false, 
                razon: 'No hay política de devoluciones activa' 
            };
        }
        
        const dias_transcurridos = Math.floor((new Date() - orden.fecha_orden) / (1000 * 60 * 60 * 24));
        
        if (dias_transcurridos > politica.dias_devolucion) {
            return { 
                elegible: false, 
                razon: `La orden supera el límite de ${politica.dias_devolucion} días para devoluciones` 
            };
        }
        
        // Verificar si ya existe una devolución activa para esta orden
        const devolucionExistente = await Devoluciones.findOne({
            where: { 
                id_orden,
                estado: ['solicitada', 'aprobada', 'en_proceso']
            }
        });
        
        if (devolucionExistente) {
            return {
                elegible: false,
                razon: 'Ya existe una devolución en proceso para esta orden'
            };
        }
        
        return { 
            elegible: true, 
            politica,
            dias_transcurridos,
            dias_restantes: politica.dias_devolucion - dias_transcurridos
        };
    } catch (error) {
        throw new Error(`Error al verificar elegibilidad: ${error.message}`);
    }
};

/**
 * Obtener reporte de devoluciones
 */
export const generarReporteDevoluciones = async (filtros = {}) => {
    try {
        const where = {};
        
        if (filtros.estado) {
            where.estado = filtros.estado;
        }
        
        if (filtros.id_cliente) {
            where.id_cliente = filtros.id_cliente;
        }
        
        if (filtros.fecha_inicio && filtros.fecha_fin) {
            where.fecha_solicitud = {
                [sequelize.Op.between]: [filtros.fecha_inicio, filtros.fecha_fin]
            };
        }
        
        const devoluciones = await Devoluciones.findAll({
            where,
            include: [
                {
                    model: Cliente,
                    attributes: ['id_cliente', 'nombre', 'email']
                },
                {
                    model: Devoluciones_Items
                }
            ],
            order: [['fecha_solicitud', 'DESC']]
        });
        
        const totalDevoluciones = devoluciones.length;
        const montosTotal = devoluciones.reduce((sum, dev) => sum + parseFloat(dev.monto_total_devolucion || 0), 0);
        const montosAprobados = devoluciones.reduce((sum, dev) => sum + parseFloat(dev.monto_aprobado || 0), 0);
        
        // Estadísticas por estado
        const estadisticasEstado = {};
        devoluciones.forEach(dev => {
            if (!estadisticasEstado[dev.estado]) {
                estadisticasEstado[dev.estado] = 0;
            }
            estadisticasEstado[dev.estado]++;
        });
        
        return {
            totalDevoluciones,
            montosTotal,
            montosAprobados,
            estadisticasEstado,
            devoluciones
        };
    } catch (error) {
        throw new Error(`Error al generar reporte: ${error.message}`);
    }
};

/**
 * Obtener devoluciones pendientes de aprobación
 */
export const obtenerDevolucionesPendientes = async () => {
    try {
        const devoluciones = await Devoluciones.findAll({
            where: { estado: 'solicitada' },
            include: [
                {
                    model: Cliente,
                    attributes: ['id_cliente', 'nombre', 'email']
                },
                {
                    model: Devoluciones_Items,
                    include: [Producto]
                }
            ],
            order: [['fecha_solicitud', 'ASC']]
        });
        
        return devoluciones;
    } catch (error) {
        throw new Error(`Error al obtener devoluciones pendientes: ${error.message}`);
    }
};

/**
 * Cancelar devolución
 */
export const cancelarDevolucion = async (id_devolucion, razon) => {
    const transaction = await sequelize.transaction();
    
    try {
        const devolucion = await Devoluciones.findByPk(id_devolucion, { transaction });
        
        if (!devolucion) {
            throw new Error('Devolución no encontrada');
        }
        
        if (['completada', 'rechazada', 'cancelada'].includes(devolucion.estado)) {
            throw new Error('No se puede cancelar una devolución en este estado');
        }
        
        await devolucion.update({
            estado: 'cancelada',
            notas_internas: razon,
            fecha_cancelacion: new Date()
        }, { transaction });
        
        await transaction.commit();
        return await obtenerDevolucion(id_devolucion);
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al cancelar devolución: ${error.message}`);
    }
};