import { TareasCRM, Cliente, Usuario, OportunidadesVenta } from '../models/index.js';
import { sendResponse } from '../utils/response.js';

export const crearTarea = async (req, res) => {
    try {
        const { id_cliente, id_oportunidad, id_usuario_asignado, titulo, descripcion, tipo_tarea, prioridad, fecha_vencimiento } = req.body;

        // Validar usuario asignado
        const usuario = await Usuario.findByPk(id_usuario_asignado);
        if (!usuario) {
            return sendResponse(res, 404, false, 'Usuario no encontrado');
        }

        // Validar cliente si se proporciona
        if (id_cliente) {
            const cliente = await Cliente.findByPk(id_cliente);
            if (!cliente) {
                return sendResponse(res, 404, false, 'Cliente no encontrado');
            }
        }

        // Validar oportunidad si se proporciona
        if (id_oportunidad) {
            const oportunidad = await OportunidadesVenta.findByPk(id_oportunidad);
            if (!oportunidad) {
                return sendResponse(res, 404, false, 'Oportunidad no encontrada');
            }
        }

        const tarea = await TareasCRM.create({
            id_cliente: id_cliente || null,
            id_oportunidad: id_oportunidad || null,
            id_usuario_asignado,
            titulo,
            descripcion,
            tipo_tarea: tipo_tarea || 'otro',
            prioridad: prioridad || 'media',
            fecha_vencimiento
        });

        sendResponse(res, 201, true, 'Tarea creada exitosamente', tarea);
    } catch (error) {
        console.error('Error al crear tarea:', error);
        sendResponse(res, 500, false, 'Error al crear tarea', error.message);
    }
};

export const obtenerTareas = async (req, res) => {
    try {
        const { id_usuario, estado, prioridad } = req.query;
        const where = {};

        if (id_usuario) where.id_usuario_asignado = id_usuario;
        if (estado) where.estado = estado;
        if (prioridad) where.prioridad = prioridad;

        const tareas = await TareasCRM.findAll({
            where,
            include: [
                { model: Cliente, as: 'cliente', attributes: ['id_cliente', 'nombre', 'apellido'] },
                { model: Usuario, as: 'usuarioAsignado', attributes: ['id_usuario', 'nombre_usuario'] },
                { model: OportunidadesVenta, as: 'oportunidad', attributes: ['id_oportunidad', 'titulo'] }
            ],
            order: [['fecha_vencimiento', 'ASC']]
        });

        sendResponse(res, 200, true, 'Tareas obtenidas', tareas);
    } catch (error) {
        console.error('Error al obtener tareas:', error);
        sendResponse(res, 500, false, 'Error al obtener tareas', error.message);
    }
};

export const obtenerTareaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const tarea = await TareasCRM.findByPk(id, {
            include: [
                { model: Cliente, as: 'cliente' },
                { model: Usuario, as: 'usuarioAsignado' },
                { model: OportunidadesVenta, as: 'oportunidad' }
            ]
        });

        if (!tarea) {
            return sendResponse(res, 404, false, 'Tarea no encontrada');
        }

        sendResponse(res, 200, true, 'Tarea obtenida', tarea);
    } catch (error) {
        console.error('Error al obtener tarea:', error);
        sendResponse(res, 500, false, 'Error al obtener tarea', error.message);
    }
};

export const actualizarTarea = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, fecha_completado, notas, prioridad, fecha_vencimiento } = req.body;

        const tarea = await TareasCRM.findByPk(id);
        if (!tarea) {
            return sendResponse(res, 404, false, 'Tarea no encontrada');
        }

        await tarea.update({
            estado: estado || tarea.estado,
            fecha_completado: estado === 'completado' ? new Date() : fecha_completado,
            notas: notas || tarea.notas,
            prioridad: prioridad || tarea.prioridad,
            fecha_vencimiento: fecha_vencimiento || tarea.fecha_vencimiento
        });

        sendResponse(res, 200, true, 'Tarea actualizada', tarea);
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        sendResponse(res, 500, false, 'Error al actualizar tarea', error.message);
    }
};

export const eliminarTarea = async (req, res) => {
    try {
        const { id } = req.params;

        const tarea = await TareasCRM.findByPk(id);
        if (!tarea) {
            return sendResponse(res, 404, false, 'Tarea no encontrada');
        }

        await tarea.destroy();

        sendResponse(res, 200, true, 'Tarea eliminada exitosamente');
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        sendResponse(res, 500, false, 'Error al eliminar tarea', error.message);
    }
};

export const obtenerTareasUsuario = async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const { estado } = req.query;

        const where = { id_usuario_asignado: id_usuario };
        if (estado) where.estado = estado;

        const tareas = await TareasCRM.findAll({
            where,
            include: [
                { model: Cliente, as: 'cliente' },
                { model: OportunidadesVenta, as: 'oportunidad' }
            ],
            order: [['fecha_vencimiento', 'ASC']]
        });

        sendResponse(res, 200, true, 'Tareas del usuario', tareas);
    } catch (error) {
        console.error('Error al obtener tareas del usuario:', error);
        sendResponse(res, 500, false, 'Error al obtener tareas', error.message);
    }
};

export const obtenerTareasPendientes = async (req, res) => {
    try {
        const ahora = new Date();

        const tareas = await TareasCRM.findAll({
            where: {
                estado: ['pendiente', 'en_proceso']
            },
            include: [
                { model: Cliente, as: 'cliente' },
                { model: Usuario, as: 'usuarioAsignado' }
            ],
            order: [
                ['prioridad', 'DESC'],
                ['fecha_vencimiento', 'ASC']
            ]
        });

        // Adicionar información de vencimiento
        const tareasConEstatus = tareas.map(tarea => ({
            ...tarea.toJSON(),
            estado_vencimiento: tarea.fecha_vencimiento < ahora ? 'Vencida' : 
                               tarea.fecha_vencimiento < new Date(ahora.getTime() + 24 * 60 * 60 * 1000) ? 'Urgente' : 'A tiempo'
        }));

        sendResponse(res, 200, true, 'Tareas pendientes', tareasConEstatus);
    } catch (error) {
        console.error('Error al obtener tareas pendientes:', error);
        sendResponse(res, 500, false, 'Error al obtener tareas', error.message);
    }
};
