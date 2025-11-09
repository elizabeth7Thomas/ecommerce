import { CampanasMarketing, CampanaClientes, Cliente } from '../models/index.js';
import { sendResponse } from '../utils/response.js';

export const crearCampana = async (req, res) => {
    try {
        const { nombre_campana, descripcion, tipo_campana, fecha_inicio, fecha_fin, presupuesto, objetivo } = req.body;

        const campana = await CampanasMarketing.create({
            nombre_campana,
            descripcion,
            tipo_campana: tipo_campana || 'email',
            fecha_inicio,
            fecha_fin,
            presupuesto: presupuesto || 0,
            objetivo
        });

        sendResponse(res, 201, true, 'Campaña creada exitosamente', campana);
    } catch (error) {
        console.error('Error al crear campaña:', error);
        sendResponse(res, 500, false, 'Error al crear campaña', error.message);
    }
};

export const obtenerCampanas = async (req, res) => {
    try {
        const { estado, tipo_campana } = req.query;
        const where = {};

        if (estado) where.estado = estado;
        if (tipo_campana) where.tipo_campana = tipo_campana;

        const campanas = await CampanasMarketing.findAll({
            where,
            order: [['fecha_inicio', 'DESC']]
        });

        sendResponse(res, 200, true, 'Campañas obtenidas', campanas);
    } catch (error) {
        console.error('Error al obtener campañas:', error);
        sendResponse(res, 500, false, 'Error al obtener campañas', error.message);
    }
};

export const obtenerCampanaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const campana = await CampanasMarketing.findByPk(id, {
            include: {
                model: CampanaClientes,
                as: 'clientesCampana',
                include: { model: Cliente, as: 'cliente', attributes: ['id_cliente', 'nombre', 'apellido'] }
            }
        });

        if (!campana) {
            return sendResponse(res, 404, false, 'Campaña no encontrada');
        }

        sendResponse(res, 200, true, 'Campaña obtenida', campana);
    } catch (error) {
        console.error('Error al obtener campaña:', error);
        sendResponse(res, 500, false, 'Error al obtener campaña', error.message);
    }
};

export const actualizarCampana = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_campana, descripcion, estado, fecha_fin, presupuesto, objetivo } = req.body;

        const campana = await CampanasMarketing.findByPk(id);
        if (!campana) {
            return sendResponse(res, 404, false, 'Campaña no encontrada');
        }

        await campana.update({
            nombre_campana: nombre_campana || campana.nombre_campana,
            descripcion: descripcion !== undefined ? descripcion : campana.descripcion,
            estado: estado || campana.estado,
            fecha_fin: fecha_fin || campana.fecha_fin,
            presupuesto: presupuesto !== undefined ? presupuesto : campana.presupuesto,
            objetivo: objetivo || campana.objetivo
        });

        sendResponse(res, 200, true, 'Campaña actualizada', campana);
    } catch (error) {
        console.error('Error al actualizar campaña:', error);
        sendResponse(res, 500, false, 'Error al actualizar campaña', error.message);
    }
};

export const eliminarCampana = async (req, res) => {
    try {
        const { id } = req.params;

        const campana = await CampanasMarketing.findByPk(id);
        if (!campana) {
            return sendResponse(res, 404, false, 'Campaña no encontrada');
        }

        await campana.destroy();

        sendResponse(res, 200, true, 'Campaña eliminada exitosamente');
    } catch (error) {
        console.error('Error al eliminar campaña:', error);
        sendResponse(res, 500, false, 'Error al eliminar campaña', error.message);
    }
};

export const agregarClienteCampana = async (req, res) => {
    try {
        const { id_campana, id_cliente } = req.body;

        // Validar campaña
        const campana = await CampanasMarketing.findByPk(id_campana);
        if (!campana) {
            return sendResponse(res, 404, false, 'Campaña no encontrada');
        }

        // Validar cliente
        const cliente = await Cliente.findByPk(id_cliente);
        if (!cliente) {
            return sendResponse(res, 404, false, 'Cliente no encontrado');
        }

        // Verificar si ya existe
        const existe = await CampanaClientes.findOne({
            where: { id_campana, id_cliente }
        });

        if (existe) {
            return sendResponse(res, 400, false, 'El cliente ya está en esta campaña');
        }

        const campanaCliente = await CampanaClientes.create({
            id_campana,
            id_cliente
        });

        sendResponse(res, 201, true, 'Cliente agregado a campaña', campanaCliente);
    } catch (error) {
        console.error('Error al agregar cliente a campaña:', error);
        sendResponse(res, 500, false, 'Error al agregar cliente', error.message);
    }
};

export const actualizarEstadoEnvioCampana = async (req, res) => {
    try {
        const { id_campana_cliente } = req.params;
        const { estado_envio, fecha_apertura, fecha_respuesta, notas } = req.body;

        const campanaCliente = await CampanaClientes.findByPk(id_campana_cliente);
        if (!campanaCliente) {
            return sendResponse(res, 404, false, 'Registro de campaña-cliente no encontrado');
        }

        await campanaCliente.update({
            estado_envio: estado_envio || campanaCliente.estado_envio,
            fecha_apertura: fecha_apertura || campanaCliente.fecha_apertura,
            fecha_respuesta: fecha_respuesta || campanaCliente.fecha_respuesta,
            notas: notas || campanaCliente.notas,
            fecha_envio: estado_envio === 'enviado' ? new Date() : campanaCliente.fecha_envio
        });

        sendResponse(res, 200, true, 'Estado de envío actualizado', campanaCliente);
    } catch (error) {
        console.error('Error al actualizar estado de envío:', error);
        sendResponse(res, 500, false, 'Error al actualizar estado', error.message);
    }
};

export const obtenerEstadisticasCampana = async (req, res) => {
    try {
        const { id } = req.params;

        const campana = await CampanasMarketing.findByPk(id);
        if (!campana) {
            return sendResponse(res, 404, false, 'Campaña no encontrada');
        }

        const clientesCampana = await CampanaClientes.findAll({
            where: { id_campana: id }
        });

        const estadisticas = {
            total_clientes: clientesCampana.length,
            enviados: clientesCampana.filter(c => c.estado_envio === 'enviado').length,
            abiertos: clientesCampana.filter(c => c.estado_envio === 'abierto').length,
            respondidos: clientesCampana.filter(c => c.estado_envio === 'respondido').length,
            fallidos: clientesCampana.filter(c => c.estado_envio === 'fallido').length,
            pendientes: clientesCampana.filter(c => c.estado_envio === 'pendiente').length
        };

        // Calcular porcentajes
        if (estadisticas.total_clientes > 0) {
            estadisticas.porcentaje_apertura = ((estadisticas.abiertos / estadisticas.total_clientes) * 100).toFixed(2);
            estadisticas.porcentaje_respuesta = ((estadisticas.respondidos / estadisticas.total_clientes) * 100).toFixed(2);
        }

        sendResponse(res, 200, true, 'Estadísticas de campaña', estadisticas);
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        sendResponse(res, 500, false, 'Error al obtener estadísticas', error.message);
    }
};

export const removerClienteCampana = async (req, res) => {
    try {
        const { id } = req.params;

        const campanaCliente = await CampanaClientes.findByPk(id);
        if (!campanaCliente) {
            return sendResponse(res, 404, false, 'Registro no encontrado');
        }

        await campanaCliente.destroy();

        sendResponse(res, 200, true, 'Cliente removido de la campaña');
    } catch (error) {
        console.error('Error al remover cliente:', error);
        sendResponse(res, 500, false, 'Error al remover cliente', error.message);
    }
};
