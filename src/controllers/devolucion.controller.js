import * as devolucionService from '../services/devolucion.service.js';

/**
 * Crear solicitud de devolución
 */
export const crearSolicitudDevolucion = async (req, res) => {
    try {
        const { id_orden, id_cliente, tipo_devolucion, motivo, motivo_detalle, metodo_reembolso, notas_cliente, evidencia_imagenes } = req.body;
        
        // Validaciones
        if (!id_orden || !id_cliente || !tipo_devolucion || !motivo) {
            return res.status(400).json({ 
                mensaje: 'id_orden, id_cliente, tipo_devolucion y motivo son requeridos' 
            });
        }
        
        // Verificar elegibilidad
        const elegibilidad = await devolucionService.verificarElegibilidadDevolucion(id_orden);
        if (!elegibilidad.elegible) {
            return res.status(400).json({ 
                mensaje: elegibilidad.razon 
            });
        }
        
        const devolucion = await devolucionService.crearSolicitudDevolucion(
            id_orden,
            id_cliente,
            {
                tipo_devolucion,
                motivo,
                motivo_detalle,
                metodo_reembolso,
                notas_cliente,
                evidencia_imagenes
            }
        );
        
        res.status(201).json({
            mensaje: 'Solicitud de devolución creada exitosamente',
            devolucion
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Agregar item a devolución
 */
export const agregarItemDevolucion = async (req, res) => {
    try {
        const { id_devolucion } = req.params;
        const { id_orden_item, id_producto, cantidad_solicitada, precio_unitario, motivo_item } = req.body;
        
        // Validaciones
        if (!id_orden_item || !id_producto || !cantidad_solicitada || !precio_unitario) {
            return res.status(400).json({ 
                mensaje: 'id_orden_item, id_producto, cantidad_solicitada y precio_unitario son requeridos' 
            });
        }
        
        if (cantidad_solicitada <= 0) {
            return res.status(400).json({ 
                mensaje: 'La cantidad debe ser positiva' 
            });
        }
        
        const item = await devolucionService.agregarItemDevolucion(
            id_devolucion,
            id_orden_item,
            id_producto,
            cantidad_solicitada,
            precio_unitario,
            motivo_item
        );
        
        const devolucionActualizada = await devolucionService.obtenerDevolucion(id_devolucion);
        
        res.status(201).json({
            mensaje: 'Item agregado a devolución exitosamente',
            item,
            devolucion: devolucionActualizada
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Obtener devolución completa
 */
export const obtenerDevolucion = async (req, res) => {
    try {
        const { id_devolucion } = req.params;
        
        const devolucion = await devolucionService.obtenerDevolucion(id_devolucion);
        
        if (!devolucion) {
            return res.status(404).json({ 
                mensaje: 'Devolución no encontrada' 
            });
        }
        
        res.json({
            devolucion
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Listar devoluciones del cliente
 */
export const listarDevolucionesCliente = async (req, res) => {
    try {
        const { id_cliente } = req.params;
        const { estado } = req.query;
        
        const devoluciones = await devolucionService.listarDevolucionesCliente(
            id_cliente,
            estado
        );
        
        res.json({
            total: devoluciones.length,
            devoluciones
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Listar devoluciones de una orden
 */
export const listarDevolucionesOrden = async (req, res) => {
    try {
        const { id_orden } = req.params;
        
        const devoluciones = await devolucionService.listarDevolucionesOrden(id_orden);
        
        res.json({
            total: devoluciones.length,
            devoluciones
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Aprobar devolución (Admin/Vendedor)
 */
export const aprobarDevolucion = async (req, res) => {
    try {
        const { id_devolucion } = req.params;
        const id_usuario = req.user.id_usuario;
        const { items_aprobados, notas_internas } = req.body;
        
        if (!items_aprobados) {
            return res.status(400).json({ 
                mensaje: 'items_aprobados es requerido' 
            });
        }
        
        const devolucion = await devolucionService.aprobarDevolucion(
            id_devolucion,
            id_usuario,
            { items_aprobados, notas_internas }
        );
        
        res.json({
            mensaje: 'Devolución aprobada exitosamente',
            devolucion
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Rechazar devolución
 */
export const rechazarDevolucion = async (req, res) => {
    try {
        const { id_devolucion } = req.params;
        const id_usuario = req.user.id_usuario;
        const { razon } = req.body;
        
        const devolucion = await devolucionService.rechazarDevolucion(
            id_devolucion,
            id_usuario,
            razon
        );
        
        res.json({
            mensaje: 'Devolución rechazada exitosamente',
            devolucion
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Registrar recepción de devolución
 */
export const registrarRecepcionDevolucion = async (req, res) => {
    try {
        const { id_devolucion } = req.params;
        const { items_recibidos, guia_devolucion, transportista, condiciones } = req.body;
        
        if (!items_recibidos || !guia_devolucion) {
            return res.status(400).json({ 
                mensaje: 'items_recibidos y guia_devolucion son requeridos' 
            });
        }
        
        const devolucion = await devolucionService.registrarRecepcionDevolucion(
            id_devolucion,
            { items_recibidos, guia_devolucion, transportista, condiciones }
        );
        
        res.json({
            mensaje: 'Recepción registrada exitosamente',
            devolucion
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Inspeccionar items de devolución
 */
export const inspeccionarItems = async (req, res) => {
    try {
        const { id_devolucion } = req.params;
        const { inspecciones } = req.body;
        
        if (!inspecciones) {
            return res.status(400).json({ 
                mensaje: 'inspecciones es requerido' 
            });
        }
        
        const devolucion = await devolucionService.inspeccionarItems(
            id_devolucion,
            inspecciones
        );
        
        res.json({
            mensaje: 'Inspección completada exitosamente',
            devolucion
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Crear reembolso
 */
export const crearReembolso = async (req, res) => {
    try {
        const { id_devolucion } = req.params;
        const { id_metodo_pago, monto_reembolso } = req.body;
        
        if (!monto_reembolso) {
            return res.status(400).json({ 
                mensaje: 'monto_reembolso es requerido' 
            });
        }
        
        const reembolso = await devolucionService.crearReembolso(
            id_devolucion,
            id_metodo_pago,
            monto_reembolso
        );
        
        res.status(201).json({
            mensaje: 'Reembolso creado exitosamente',
            reembolso
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Procesar reembolso
 */
export const procesarReembolso = async (req, res) => {
    try {
        const { id_reembolso } = req.params;
        const id_usuario = req.user.id_usuario;
        
        const reembolso = await devolucionService.procesarReembolso(id_reembolso, id_usuario);
        
        res.json({
            mensaje: 'Reembolso procesado exitosamente',
            reembolso
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Completar reembolso
 */
export const completarReembolso = async (req, res) => {
    try {
        const { id_reembolso } = req.params;
        const { transaccion_id } = req.body;
        
        if (!transaccion_id) {
            return res.status(400).json({ 
                mensaje: 'transaccion_id es requerido' 
            });
        }
        
        const reembolso = await devolucionService.completarReembolso(id_reembolso, transaccion_id);
        
        res.json({
            mensaje: 'Reembolso completado exitosamente',
            reembolso
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Verificar elegibilidad de devolución
 */
export const verificarElegibilidad = async (req, res) => {
    try {
        const { id_orden } = req.params;
        
        const elegibilidad = await devolucionService.verificarElegibilidadDevolucion(id_orden);
        
        res.json({
            elegibilidad
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Obtener reporte de devoluciones
 */
export const obtenerReporte = async (req, res) => {
    try {
        const { estado, id_cliente, fecha_inicio, fecha_fin } = req.query;
        
        const reporte = await devolucionService.generarReporteDevolucioness({
            estado,
            id_cliente,
            fecha_inicio,
            fecha_fin
        });
        
        res.json({
            reporte
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Obtener devoluciones pendientes
 */
export const obtenerPendientes = async (req, res) => {
    try {
        const devoluciones = await devolucionService.obtenerDevolucionesPendientes();
        
        res.json({
            total: devoluciones.length,
            devoluciones
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Cancelar devolución
 */
export const cancelarDevolucion = async (req, res) => {
    try {
        const { id_devolucion } = req.params;
        const { razon } = req.body;
        
        const devolucion = await devolucionService.cancelarDevolucion(id_devolucion, razon);
        
        res.json({
            mensaje: 'Devolución cancelada exitosamente',
            devolucion
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};
