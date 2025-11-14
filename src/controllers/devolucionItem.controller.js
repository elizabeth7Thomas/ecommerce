import * as devolucionService from '../services/devolucion.service.js';

/**
 * @namespace DevolucionItemController
 * @description Controladores para la gestión específica de los ítems dentro de una solicitud de devolución.
 */

/**
 * @function eliminarItemDevolucion
 * @description Maneja la eliminación de un ítem específico de una solicitud de devolución.
 * Solo permite eliminar ítems si la devolución está en estado 'solicitada'.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 * @returns {Promise<void>}
 * @memberof DevolucionItemController
 */
export const eliminarItemDevolucion = async (req, res) => {
    try {
        const { id_devolucion, id_devolucion_item } = req.params; // Necesitamos id_devolucion para contexto, aunque el servicio solo use id_devolucion_item para encontrarlo

        if (!id_devolucion_item) {
            return res.status(400).json({
                success: false,
                mensaje: 'El ID del ítem de devolución es requerido.'
            });
        }

        const eliminado = await devolucionService.eliminarItemDevolucion(parseInt(id_devolucion_item));

        if (!eliminado) {
            // Esto solo debería ocurrir si el servicio no lanza un error pero no elimina,
            // lo cual es manejado con errores en el servicio.
            return res.status(404).json({
                success: false,
                mensaje: 'Ítem de devolución no encontrado o no se pudo eliminar.'
            });
        }

        // Opcional: obtener la devolución actualizada para mostrar el nuevo monto
        const devolucionActualizada = await devolucionService.obtenerDevolucion(parseInt(id_devolucion));

        res.json({
            success: true,
            mensaje: 'Ítem de devolución eliminado exitosamente.',
            data: {
                id_devolucion_item_eliminado: id_devolucion_item,
                devolucion: devolucionActualizada
            }
        });
    } catch (error) {
        console.error('Error en eliminarItemDevolucion:', error);
        const statusCode = error.message.includes('no encontrado') || error.message.includes('no están en estado "solicitada"') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * @function actualizarItemDevolucion
 * @description Maneja la actualización de campos de un ítem específico de una solicitud de devolución.
 * Solo permite actualizar ítems si la devolución está en estado 'solicitada'.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 * @returns {Promise<void>}
 * @memberof DevolucionItemController
 */
export const actualizarItemDevolucion = async (req, res) => {
    try {
        const { id_devolucion, id_devolucion_item } = req.params;
        const { cantidad_solicitada, motivo_item } = req.body;

        // Validaciones: al menos un campo para actualizar debe estar presente
        if (cantidad_solicitada === undefined && motivo_item === undefined) {
            return res.status(400).json({
                success: false,
                mensaje: 'Se debe proporcionar al menos "cantidad_solicitada" o "motivo_item" para actualizar.'
            });
        }

        if (cantidad_solicitada !== undefined && (isNaN(cantidad_solicitada) || cantidad_solicitada <= 0)) {
            return res.status(400).json({
                success: false,
                mensaje: 'La cantidad solicitada debe ser un número positivo.'
            });
        }

        const updatedItem = await devolucionService.actualizarItemDevolucion(
            parseInt(id_devolucion_item),
            { cantidad_solicitada, motivo_item }
        );

        if (!updatedItem) {
            return res.status(404).json({
                success: false,
                mensaje: 'Ítem de devolución no encontrado o no se pudo actualizar.'
            });
        }

        // Opcional: obtener la devolución actualizada para mostrar el nuevo monto
        const devolucionActualizada = await devolucionService.obtenerDevolucion(parseInt(id_devolucion));

        res.json({
            success: true,
            mensaje: 'Ítem de devolución actualizado exitosamente.',
            data: {
                item: updatedItem,
                devolucion: devolucionActualizada
            }
        });
    } catch (error) {
        console.error('Error en actualizarItemDevolucion:', error);
        const statusCode = error.message.includes('no encontrado') || error.message.includes('no están en estado "solicitada"') || error.message.includes('cantidad total solicitada') ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
};

// Puedes añadir otras funciones específicas para ítems si las necesitas, por ejemplo, para obtener un ítem individual.
/**
 * @function obtenerItemDevolucion
 * @description Obtiene un ítem específico de una solicitud de devolución.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 * @returns {Promise<void>}
 * @memberof DevolucionItemController
 */
export const obtenerItemDevolucion = async (req, res) => {
    try {
        const { id_devolucion_item } = req.params;

        // Aunque el servicio 'obtenerDevolucion' trae los ítems, no tenemos una función directa para un solo item
        // Podríamos añadir una en el servicio, o usar la existente y filtrar.
        // Por simplicidad, asumimos que obtendremos la devolución completa y filtraremos el ítem aquí si el servicio no ofrece una específica.
        // ¡Mejor opción: añadir `obtenerDevolucionItem` al servicio!

        // Asumiendo que has añadido `obtenerDevolucionItem` al servicio:
        // const item = await devolucionService.obtenerDevolucionItem(parseInt(id_devolucion_item));
        // Si no, podemos obtener la devolución y buscar en sus ítems.

        // Dado que el servicio `obtenerDevolucion` trae los ítems, podemos hacerlo así:
        const { id_devolucion } = req.params; // Necesitamos el id_devolucion para obtener la devolución principal
        const devolucion = await devolucionService.obtenerDevolucion(parseInt(id_devolucion));

        if (!devolucion) {
            return res.status(404).json({
                success: false,
                mensaje: 'Devolución principal no encontrada.'
            });
        }

        const item = devolucion.items.find(i => i.id_devolucion_item === parseInt(id_devolucion_item));

        if (!item) {
            return res.status(404).json({
                success: false,
                mensaje: 'Ítem de devolución no encontrado dentro de esta devolución.'
            });
        }

        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error('Error en obtenerItemDevolucion:', error);
        const statusCode = error.message.includes('no encontrada') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
};