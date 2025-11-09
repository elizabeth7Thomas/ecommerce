import { InteraccionesCliente, Cliente, Usuario } from '../models/index.js';
import { sendResponse } from '../utils/response.js';

export const crearInteraccion = async (req, res) => {
    try {
        const { id_cliente, id_usuario_asignado, tipo_interaccion, descripcion, resultado, proxima_accion, fecha_proxima_accion } = req.body;

        // Validar que el cliente existe
        const cliente = await Cliente.findByPk(id_cliente);
        if (!cliente) {
            return sendResponse(res, 404, false, 'Cliente no encontrado');
        }

        // Validar usuario asignado si se proporciona
        if (id_usuario_asignado) {
            const usuario = await Usuario.findByPk(id_usuario_asignado);
            if (!usuario) {
                return sendResponse(res, 404, false, 'Usuario no encontrado');
            }
        }

        const nuevaInteraccion = await InteraccionesCliente.create({
            id_cliente,
            id_usuario_asignado: id_usuario_asignado || null,
            tipo_interaccion,
            descripcion,
            resultado,
            proxima_accion,
            fecha_proxima_accion
        });

        sendResponse(res, 201, true, 'Interacción creada exitosamente', nuevaInteraccion);
    } catch (error) {
        console.error('Error al crear interacción:', error);
        sendResponse(res, 500, false, 'Error al crear interacción', error.message);
    }
};

export const obtenerInteracciones = async (req, res) => {
    try {
        const { id_cliente, estado, tipo } = req.query;
        const where = {};

        if (id_cliente) where.id_cliente = id_cliente;
        if (estado) where.estado = estado;
        if (tipo) where.tipo_interaccion = tipo;

        const interacciones = await InteraccionesCliente.findAll({
            where,
            include: [
                { model: Cliente, as: 'cliente', attributes: ['id_cliente', 'nombre', 'apellido'] },
                { model: Usuario, as: 'usuarioAsignado', attributes: ['id_usuario', 'nombre_usuario', 'correo_electronico'] }
            ],
            order: [['fecha_interaccion', 'DESC']]
        });

        sendResponse(res, 200, true, 'Interacciones obtenidas', interacciones);
    } catch (error) {
        console.error('Error al obtener interacciones:', error);
        sendResponse(res, 500, false, 'Error al obtener interacciones', error.message);
    }
};

export const obtenerInteraccionPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const interaccion = await InteraccionesCliente.findByPk(id, {
            include: [
                { model: Cliente, as: 'cliente' },
                { model: Usuario, as: 'usuarioAsignado' }
            ]
        });

        if (!interaccion) {
            return sendResponse(res, 404, false, 'Interacción no encontrada');
        }

        sendResponse(res, 200, true, 'Interacción obtenida', interaccion);
    } catch (error) {
        console.error('Error al obtener interacción:', error);
        sendResponse(res, 500, false, 'Error al obtener interacción', error.message);
    }
};

export const actualizarInteraccion = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, resultado, proxima_accion, fecha_proxima_accion, fecha_completado } = req.body;

        const interaccion = await InteraccionesCliente.findByPk(id);
        if (!interaccion) {
            return sendResponse(res, 404, false, 'Interacción no encontrada');
        }

        await interaccion.update({
            estado: estado || interaccion.estado,
            resultado: resultado || interaccion.resultado,
            proxima_accion: proxima_accion !== undefined ? proxima_accion : interaccion.proxima_accion,
            fecha_proxima_accion: fecha_proxima_accion || interaccion.fecha_proxima_accion,
            fecha_completado: fecha_completado || interaccion.fecha_completado
        });

        sendResponse(res, 200, true, 'Interacción actualizada', interaccion);
    } catch (error) {
        console.error('Error al actualizar interacción:', error);
        sendResponse(res, 500, false, 'Error al actualizar interacción', error.message);
    }
};

export const eliminarInteraccion = async (req, res) => {
    try {
        const { id } = req.params;

        const interaccion = await InteraccionesCliente.findByPk(id);
        if (!interaccion) {
            return sendResponse(res, 404, false, 'Interacción no encontrada');
        }

        await interaccion.destroy();

        sendResponse(res, 200, true, 'Interacción eliminada exitosamente');
    } catch (error) {
        console.error('Error al eliminar interacción:', error);
        sendResponse(res, 500, false, 'Error al eliminar interacción', error.message);
    }
};

export const obtenerInteraccionesCliente = async (req, res) => {
    try {
        const { id_cliente } = req.params;

        const cliente = await Cliente.findByPk(id_cliente);
        if (!cliente) {
            return sendResponse(res, 404, false, 'Cliente no encontrado');
        }

        const interacciones = await InteraccionesCliente.findAll({
            where: { id_cliente },
            include: [
                { model: Usuario, as: 'usuarioAsignado', attributes: ['id_usuario', 'nombre_usuario'] }
            ],
            order: [['fecha_interaccion', 'DESC']]
        });

        sendResponse(res, 200, true, 'Interacciones del cliente', interacciones);
    } catch (error) {
        console.error('Error al obtener interacciones del cliente:', error);
        sendResponse(res, 500, false, 'Error al obtener interacciones', error.message);
    }
};
