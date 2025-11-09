import { SegmentosCliente, ClienteSegmentos, Cliente } from '../models/index.js';
import { sendResponse } from '../utils/response.js';

export const crearSegmento = async (req, res) => {
    try {
        const { nombre_segmento, descripcion, criterios } = req.body;

        const segmento = await SegmentosCliente.create({
            nombre_segmento,
            descripcion,
            criterios: criterios || {}
        });

        sendResponse(res, 201, true, 'Segmento creado exitosamente', segmento);
    } catch (error) {
        console.error('Error al crear segmento:', error);
        sendResponse(res, 500, false, 'Error al crear segmento', error.message);
    }
};

export const obtenerSegmentos = async (req, res) => {
    try {
        const { activo } = req.query;
        const where = {};

        if (activo !== undefined) where.activo = activo === 'true';

        const segmentos = await SegmentosCliente.findAll({
            where,
            order: [['fecha_creacion', 'DESC']]
        });

        sendResponse(res, 200, true, 'Segmentos obtenidos', segmentos);
    } catch (error) {
        console.error('Error al obtener segmentos:', error);
        sendResponse(res, 500, false, 'Error al obtener segmentos', error.message);
    }
};

export const obtenerSegmentoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const segmento = await SegmentosCliente.findByPk(id, {
            include: {
                model: Cliente,
                as: 'clientes',
                through: { attributes: [] }
            }
        });

        if (!segmento) {
            return sendResponse(res, 404, false, 'Segmento no encontrado');
        }

        sendResponse(res, 200, true, 'Segmento obtenido', segmento);
    } catch (error) {
        console.error('Error al obtener segmento:', error);
        sendResponse(res, 500, false, 'Error al obtener segmento', error.message);
    }
};

export const actualizarSegmento = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_segmento, descripcion, criterios, activo } = req.body;

        const segmento = await SegmentosCliente.findByPk(id);
        if (!segmento) {
            return sendResponse(res, 404, false, 'Segmento no encontrado');
        }

        await segmento.update({
            nombre_segmento: nombre_segmento || segmento.nombre_segmento,
            descripcion: descripcion !== undefined ? descripcion : segmento.descripcion,
            criterios: criterios || segmento.criterios,
            activo: activo !== undefined ? activo : segmento.activo
        });

        sendResponse(res, 200, true, 'Segmento actualizado', segmento);
    } catch (error) {
        console.error('Error al actualizar segmento:', error);
        sendResponse(res, 500, false, 'Error al actualizar segmento', error.message);
    }
};

export const eliminarSegmento = async (req, res) => {
    try {
        const { id } = req.params;

        const segmento = await SegmentosCliente.findByPk(id);
        if (!segmento) {
            return sendResponse(res, 404, false, 'Segmento no encontrado');
        }

        await segmento.destroy();

        sendResponse(res, 200, true, 'Segmento eliminado exitosamente');
    } catch (error) {
        console.error('Error al eliminar segmento:', error);
        sendResponse(res, 500, false, 'Error al eliminar segmento', error.message);
    }
};

export const asignarClienteSegmento = async (req, res) => {
    try {
        const { id_cliente, id_segmento } = req.body;

        // Validar cliente
        const cliente = await Cliente.findByPk(id_cliente);
        if (!cliente) {
            return sendResponse(res, 404, false, 'Cliente no encontrado');
        }

        // Validar segmento
        const segmento = await SegmentosCliente.findByPk(id_segmento);
        if (!segmento) {
            return sendResponse(res, 404, false, 'Segmento no encontrado');
        }

        // Verificar si ya existe la relación
        const existe = await ClienteSegmentos.findOne({
            where: { id_cliente, id_segmento }
        });

        if (existe) {
            return sendResponse(res, 400, false, 'El cliente ya está asignado a este segmento');
        }

        const asignacion = await ClienteSegmentos.create({
            id_cliente,
            id_segmento
        });

        sendResponse(res, 201, true, 'Cliente asignado al segmento', asignacion);
    } catch (error) {
        console.error('Error al asignar cliente a segmento:', error);
        sendResponse(res, 500, false, 'Error al asignar cliente', error.message);
    }
};

export const removerClienteSegmento = async (req, res) => {
    try {
        const { id_cliente, id_segmento } = req.body;

        const asignacion = await ClienteSegmentos.findOne({
            where: { id_cliente, id_segmento }
        });

        if (!asignacion) {
            return sendResponse(res, 404, false, 'Asignación no encontrada');
        }

        await asignacion.destroy();

        sendResponse(res, 200, true, 'Cliente removido del segmento');
    } catch (error) {
        console.error('Error al remover cliente de segmento:', error);
        sendResponse(res, 500, false, 'Error al remover cliente', error.message);
    }
};

export const obtenerClientesSegmento = async (req, res) => {
    try {
        const { id } = req.params;

        const segmento = await SegmentosCliente.findByPk(id, {
            include: {
                model: Cliente,
                as: 'clientes',
                attributes: ['id_cliente', 'nombre', 'apellido', 'telefono'],
                through: { attributes: ['fecha_asignacion'] }
            }
        });

        if (!segmento) {
            return sendResponse(res, 404, false, 'Segmento no encontrado');
        }

        sendResponse(res, 200, true, 'Clientes del segmento', segmento.clientes);
    } catch (error) {
        console.error('Error al obtener clientes del segmento:', error);
        sendResponse(res, 500, false, 'Error al obtener clientes', error.message);
    }
};
