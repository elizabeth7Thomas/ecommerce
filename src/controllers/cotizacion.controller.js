import * as cotizacionService from '../services/cotizacion.service.js';

/**
 * Crear nueva cotización
 */
export const crearCotizacion = async (req, res) => {
    try {
        const { id_cliente, fecha_expiracion, notas, terminos_condiciones } = req.body;
        const id_usuario_creador = req.user.id_usuario;
        
        // Validaciones
        if (!id_cliente) {
            return res.status(400).json({ 
                mensaje: 'El id_cliente es requerido' 
            });
        }
        
        const cotizacion = await cotizacionService.crearCotizacion(
            id_cliente,
            id_usuario_creador,
            {
                fecha_expiracion,
                notas,
                terminos_condiciones
            }
        );
        
        res.status(201).json({
            mensaje: 'Cotización creada exitosamente',
            cotizacion
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Agregar item a cotización
 */
export const agregarItem = async (req, res) => {
    try {
        const { id_cotizacion } = req.params;
        const { id_producto, cantidad, precio_unitario, descuento_porcentaje } = req.body;
        
        // Validaciones
        if (!id_producto || !cantidad || !precio_unitario) {
            return res.status(400).json({ 
                mensaje: 'id_producto, cantidad y precio_unitario son requeridos' 
            });
        }
        
        if (cantidad <= 0 || precio_unitario < 0) {
            return res.status(400).json({ 
                mensaje: 'La cantidad debe ser positiva y el precio no negativo' 
            });
        }
        
        const item = await cotizacionService.agregarItemCotizacion(
            id_cotizacion,
            id_producto,
            cantidad,
            precio_unitario,
            descuento_porcentaje || 0
        );
        
        // Obtener cotización actualizada
        const cotizacionActualizada = await cotizacionService.obtenerCotizacion(id_cotizacion);
        
        res.status(201).json({
            mensaje: 'Item agregado exitosamente',
            item,
            cotizacion: cotizacionActualizada
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
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
            return res.status(404).json({ 
                mensaje: 'Cotización no encontrada' 
            });
        }
        
        res.json({
            cotizacion
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
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
        const { fecha_expiracion, notas, terminos_condiciones } = req.body;
        
        const cotizacion = await cotizacionService.actualizarCotizacion(
            id_cotizacion,
            {
                fecha_expiracion,
                notas,
                terminos_condiciones
            }
        );
        
        res.json({
            mensaje: 'Cotización actualizada exitosamente',
            cotizacion
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Actualizar item de cotización
 */
export const actualizarItem = async (req, res) => {
    try {
        const { id_cotizacion_item } = req.params;
        const { cantidad, precio_unitario, descuento_porcentaje } = req.body;
        
        // Validaciones
        if (cantidad && cantidad <= 0) {
            return res.status(400).json({ 
                mensaje: 'La cantidad debe ser positiva' 
            });
        }
        
        if (precio_unitario && precio_unitario < 0) {
            return res.status(400).json({ 
                mensaje: 'El precio no puede ser negativo' 
            });
        }
        
        // Aquí necesitarías implementar una función de actualización en el servicio
        res.status(501).json({ 
            mensaje: 'Funcionalidad en desarrollo' 
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Eliminar item de cotización
 */
export const eliminarItem = async (req, res) => {
    try {
        const { id_cotizacion_item } = req.params;
        
        const resultado = await cotizacionService.eliminarItemCotizacion(id_cotizacion_item);
        
        res.json({
            mensaje: resultado.mensaje
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Enviar cotización
 */
export const enviarCotizacion = async (req, res) => {
    try {
        const { id_cotizacion } = req.params;
        
        const cotizacion = await cotizacionService.enviarCotizacion(id_cotizacion);
        
        res.json({
            mensaje: 'Cotización enviada exitosamente',
            cotizacion
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Aceptar cotización
 */
export const aceptarCotizacion = async (req, res) => {
    try {
        const { id_cotizacion } = req.params;
        
        const cotizacion = await cotizacionService.aceptarCotizacion(id_cotizacion);
        
        res.json({
            mensaje: 'Cotización aceptada exitosamente',
            cotizacion
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Rechazar cotización
 */
export const rechazarCotizacion = async (req, res) => {
    try {
        const { id_cotizacion } = req.params;
        
        const cotizacion = await cotizacionService.rechazarCotizacion(id_cotizacion);
        
        res.json({
            mensaje: 'Cotización rechazada exitosamente',
            cotizacion
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};

/**
 * Convertir cotización a orden
 */
export const convertirAOrden = async (req, res) => {
    try {
        const { id_cotizacion } = req.params;
        const { id_orden } = req.body;
        
        if (!id_orden) {
            return res.status(400).json({ 
                mensaje: 'El id_orden es requerido' 
            });
        }
        
        const conversion = await cotizacionService.convertirCotizacionAOrden(
            id_cotizacion,
            id_orden
        );
        
        res.json({
            mensaje: 'Cotización convertida a orden exitosamente',
            conversion
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
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
        
        res.json({
            reporte
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        });
    }
};
