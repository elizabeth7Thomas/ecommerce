import * as cotizacionService from '../services/cotizacion.service.js';

/**
 * Crear nueva cotización
 */
export const crearCotizacion = async (req, res) => {
    try {
        const { id_cliente, fecha_expiracion, notas, terminos_condiciones } = req.body;
        // Asumiendo que el ID del usuario viene de un middleware de autenticación
        const id_usuario_creador = req.user.id_usuario; 
        if (!id_cliente) {
            return res.status(400).json({ mensaje: 'El id_cliente es requerido' });
        }
        const datos = { fecha_expiracion, notas, terminos_condiciones };
        const cotizacion = await cotizacionService.crearCotizacion(id_cliente, id_usuario_creador, datos);
        res.status(201).json(cotizacion);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Agregar item a cotización
 */
export const agregarItem = async (req, res) => {
    try {
        const { id_cotizacion } = req.params;
        const { id_producto, cantidad, precio_unitario, descuento_porcentaje } = req.body;
        if (!id_producto || !cantidad || !precio_unitario) {
            return res.status(400).json({ mensaje: 'id_producto, cantidad y precio_unitario son requeridos' });
        }
        const item = await cotizacionService.agregarItemCotizacion(
            id_cotizacion,
            id_producto,
            cantidad,
            precio_unitario,
            descuento_porcentaje
        );
        const cotizacionActualizada = await cotizacionService.obtenerCotizacion(id_cotizacion);
        res.status(201).json({
            mensaje: 'Item agregado exitosamente',
            item,
            cotizacion: cotizacionActualizada
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Obtener cotización completa
 */
export const obtenerCotizacion = async (req, res) => {
    try {
        const { id_cotizacion } = req.params;
        const cotizacion = await cotizacionService.obtenerCotizacion(id_cotizacion);
        if (!cotizacion) {
            return res.status(404).json({ mensaje: 'Cotización no encontrada' });
        }
        res.status(200).json(cotizacion);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
/**
 * Listar todas las cotizaciones con filtros y paginación
 */
export const listarCotizaciones = async (req, res) => {
    try {
        // Obteniendo filtros y paginación desde el query string
        const { page, limit, estado, id_cliente } = req.query;
        const id_usuario_creador = req.user.id_usuario; // Opcional: filtrar por usuario
        const resultado = await cotizacionService.listarCotizaciones({
            page,
            limit,
            estado,
            id_cliente,
            id_usuario_creador
        });
        res.status(200).json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Listar cotizaciones de un cliente
 */
export const listarCotizacionesCliente = async (req, res) => {
    try {
        const { id_cliente } = req.params;
        const { estado } = req.query;
        
        const cotizaciones = await cotizacionService.listarCotizacionesPorCliente(
            id_cliente,
            estado
        );
        
        res.json({
            total: cotizaciones.length,
            cotizaciones
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Actualizar cotización
 */
export const actualizarCotizacion = async (req, res) => {
    try {
        const { id_cotizacion } = req.params;
        const updates = req.body;
        const cotizacionActualizada = await cotizacionService.actualizarCotizacion(id_cotizacion, updates);
        res.status(200).json({
            mensaje: 'Cotización actualizada exitosamente',
            cotizacion: cotizacionActualizada
        });
    } catch (error) {
        // Manejar errores específicos del servicio
        if (error.message.includes('borrador')) {
            return res.status(403).json({ error: error.message });
        }
        if (error.message.includes('no encontrada')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

/**
 * Actualizar item de cotización
 */
export const actualizarItem = async (req, res) => {
    try {
        const { id_cotizacion_item } = req.params;
        const { cantidad, precio_unitario, descuento_porcentaje } = req.body;
        if (!cantidad && !precio_unitario && !descuento_porcentaje) {
            return res.status(400).json({ mensaje: 'Debe proporcionar al menos un campo para actualizar.' });
        }
        const updates = { cantidad, precio_unitario, descuento_porcentaje };
        // Eliminar propiedades nulas o indefinidas para no sobrescribir con nada
        Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);
        const itemActualizado = await cotizacionService.actualizarItemCotizacion(id_cotizacion_item, updates);
        const cotizacionActualizada = await cotizacionService.obtenerCotizacion(itemActualizado.id_cotizacion);
        res.status(200).json({
            mensaje: 'Item actualizado exitosamente',
            item: itemActualizado,
            cotizacion: cotizacionActualizada
        });
    } catch (error) {
        if (error.message.includes('borrador')) {
            return res.status(403).json({ error: error.message });
        }
        if (error.message.includes('no encontrado')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

/**
 * Eliminar item de cotización
 */
export const eliminarItem = async (req, res) => {
    try {
        const { id_cotizacion_item } = req.params;
        const resultado = await cotizacionService.eliminarItemCotizacion(id_cotizacion_item);
        res.status(200).json(resultado);
    } catch (error) {
        if (error.message.includes('no encontrado')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};


/**
 * Cambiar estado de la cotización (función genérica)
 */
const cambiarEstadoCotizacion = async (serviceFunction, successMessage, req, res) => {
    try {
        const { id_cotizacion } = req.params;
        const cotizacion = await serviceFunction(id_cotizacion);
        res.status(200).json({
            mensaje: successMessage,
            cotizacion
        });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('no puede ser')) {
            return res.status(409).json({ error: error.message }); // 409 Conflict
        }
        res.status(500).json({ error: error.message });
    }
};

export const enviarCotizacion = (req, res) => 
    cambiarEstadoCotizacion(cotizacionService.enviarCotizacion, 'Cotización enviada exitosamente', req, res);

export const aceptarCotizacion = (req, res) => 
    cambiarEstadoCotizacion(cotizacionService.aceptarCotizacion, 'Cotización aceptada exitosamente', req, res);

export const rechazarCotizacion = (req, res) => 
    cambiarEstadoCotizacion(cotizacionService.rechazarCotizacion, 'Cotización rechazada exitosamente', req, res);

/**
 * Convertir cotización a orden
 */
export const convertirAOrden = async (req, res) => {
    try {
        const { id_cotizacion } = req.params;
        const { id_orden } = req.body;
        if (!id_orden) {
            return res.status(400).json({ mensaje: 'El id_orden es requerido' });
        }
        const conversion = await cotizacionService.convertirCotizacionAOrden(id_cotizacion, id_orden);
        res.status(200).json({
            mensaje: 'Cotización convertida a orden exitosamente',
            conversion
        });
    } catch (error) {
        if (error.message.includes('aceptada')) {
            return res.status(409).json({ error: error.message });
        }
        if (error.message.includes('no encontrada')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

/**
 * Obtener reporte de cotizaciones
 */
export const obtenerReporte = async (req, res) => {
    try {
        const { estado, id_cliente, fecha_inicio, fecha_fin } = req.query;
        const reporte = await cotizacionService.generarReporteCotizaciones({
            estado,
            id_cliente,
            fecha_inicio,
            fecha_fin
        });
        res.status(200).json(reporte);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
