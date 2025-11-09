import { OportunidadesVenta, Cliente, Usuario, TareasCRM } from '../models/index.js';
import { sendResponse } from '../utils/response.js';

export const crearOportunidad = async (req, res) => {
    try {
        const { id_cliente, id_usuario_asignado, titulo, descripcion, valor_estimado, probabilidad_cierre, etapa, fecha_cierre_estimada } = req.body;

        // Validar cliente
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

        const oportunidad = await OportunidadesVenta.create({
            id_cliente,
            id_usuario_asignado: id_usuario_asignado || null,
            titulo,
            descripcion,
            valor_estimado: valor_estimado || 0,
            probabilidad_cierre: probabilidad_cierre || 0,
            etapa: etapa || 'prospecto',
            fecha_cierre_estimada
        });

        sendResponse(res, 201, true, 'Oportunidad creada exitosamente', oportunidad);
    } catch (error) {
        console.error('Error al crear oportunidad:', error);
        sendResponse(res, 500, false, 'Error al crear oportunidad', error.message);
    }
};

export const obtenerOportunidades = async (req, res) => {
    try {
        const { id_cliente, etapa, estado } = req.query;
        const where = {};

        if (id_cliente) where.id_cliente = id_cliente;
        if (etapa) where.etapa = etapa;
        if (estado) where.estado = estado;

        const oportunidades = await OportunidadesVenta.findAll({
            where,
            include: [
                { model: Cliente, as: 'cliente', attributes: ['id_cliente', 'nombre', 'apellido'] },
                { model: Usuario, as: 'usuarioAsignado', attributes: ['id_usuario', 'nombre_usuario'] }
            ],
            order: [['fecha_creacion', 'DESC']]
        });

        sendResponse(res, 200, true, 'Oportunidades obtenidas', oportunidades);
    } catch (error) {
        console.error('Error al obtener oportunidades:', error);
        sendResponse(res, 500, false, 'Error al obtener oportunidades', error.message);
    }
};

export const obtenerOportunidadPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const oportunidad = await OportunidadesVenta.findByPk(id, {
            include: [
                { model: Cliente, as: 'cliente' },
                { model: Usuario, as: 'usuarioAsignado' },
                { model: TareasCRM, as: 'tareas' }
            ]
        });

        if (!oportunidad) {
            return sendResponse(res, 404, false, 'Oportunidad no encontrada');
        }

        sendResponse(res, 200, true, 'Oportunidad obtenida', oportunidad);
    } catch (error) {
        console.error('Error al obtener oportunidad:', error);
        sendResponse(res, 500, false, 'Error al obtener oportunidad', error.message);
    }
};

export const actualizarOportunidad = async (req, res) => {
    try {
        const { id } = req.params;
        const { etapa, estado, probabilidad_cierre, valor_estimado, motivo_perdida, fecha_cierre_real } = req.body;

        const oportunidad = await OportunidadesVenta.findByPk(id);
        if (!oportunidad) {
            return sendResponse(res, 404, false, 'Oportunidad no encontrada');
        }

        await oportunidad.update({
            etapa: etapa || oportunidad.etapa,
            estado: estado || oportunidad.estado,
            probabilidad_cierre: probabilidad_cierre !== undefined ? probabilidad_cierre : oportunidad.probabilidad_cierre,
            valor_estimado: valor_estimado !== undefined ? valor_estimado : oportunidad.valor_estimado,
            motivo_perdida: motivo_perdida || oportunidad.motivo_perdida,
            fecha_cierre_real: fecha_cierre_real || oportunidad.fecha_cierre_real
        });

        sendResponse(res, 200, true, 'Oportunidad actualizada', oportunidad);
    } catch (error) {
        console.error('Error al actualizar oportunidad:', error);
        sendResponse(res, 500, false, 'Error al actualizar oportunidad', error.message);
    }
};

export const eliminarOportunidad = async (req, res) => {
    try {
        const { id } = req.params;

        const oportunidad = await OportunidadesVenta.findByPk(id);
        if (!oportunidad) {
            return sendResponse(res, 404, false, 'Oportunidad no encontrada');
        }

        await oportunidad.destroy();

        sendResponse(res, 200, true, 'Oportunidad eliminada exitosamente');
    } catch (error) {
        console.error('Error al eliminar oportunidad:', error);
        sendResponse(res, 500, false, 'Error al eliminar oportunidad', error.message);
    }
};

export const obtenerPipelineVentas = async (req, res) => {
    try {
        const pipeline = await OportunidadesVenta.findAll({
            where: { estado: 'activo' },
            attributes: ['etapa', 'valor_estimado', 'probabilidad_cierre'],
            order: [['etapa', 'ASC']]
        });

        // Agrupar por etapa
        const agrupado = {};
        pipeline.forEach(opp => {
            if (!agrupado[opp.etapa]) {
                agrupado[opp.etapa] = {
                    cantidad: 0,
                    valor_total: 0,
                    probabilidad_promedio: 0
                };
            }
            agrupado[opp.etapa].cantidad++;
            agrupado[opp.etapa].valor_total += parseFloat(opp.valor_estimado || 0);
            agrupado[opp.etapa].probabilidad_promedio += opp.probabilidad_cierre || 0;
        });

        // Calcular promedios
        Object.keys(agrupado).forEach(etapa => {
            agrupado[etapa].probabilidad_promedio = Math.round(
                agrupado[etapa].probabilidad_promedio / agrupado[etapa].cantidad
            );
        });

        sendResponse(res, 200, true, 'Pipeline de ventas', agrupado);
    } catch (error) {
        console.error('Error al obtener pipeline:', error);
        sendResponse(res, 500, false, 'Error al obtener pipeline', error.message);
    }
};
