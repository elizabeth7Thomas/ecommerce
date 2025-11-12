import TareasCRM from '../models/tareasCRM.model.js';
import Cliente from '../models/cliente.model.js';
import Usuario from '../models/usuario.model.js';
import OportunidadesVenta from '../models/oportunidadesVenta.model.js';
import { Op } from 'sequelize';

class TareasCRMService {
    /**
     * Crear una nueva tarea
     */
    static async crearTarea(dataTarea) {
        try {
            const tarea = await TareasCRM.create(dataTarea);
            return {
                success: true,
                message: 'Tarea creada correctamente',
                data: tarea
            };
        } catch (error) {
            throw {
                success: false,
                message: 'Error al crear la tarea',
                error: error.message
            };
        }
    }

    /**
     * Obtener todas las tareas con paginación y filtros
     */
    static async obtenerTareas(filtros = {}, pagina = 1, limite = 10) {
        try {
            const offset = (pagina - 1) * limite;
            const where = {};

            if (filtros.id_cliente) where.id_cliente = filtros.id_cliente;
            if (filtros.id_usuario_asignado) where.id_usuario_asignado = filtros.id_usuario_asignado;
            if (filtros.estado) where.estado = filtros.estado;
            if (filtros.tipo_tarea) where.tipo_tarea = filtros.tipo_tarea;
            if (filtros.prioridad) where.prioridad = filtros.prioridad;

            const { count, rows } = await TareasCRM.findAndCountAll({
                where,
                include: [
                    {
                        model: Cliente,
                        attributes: ['id_cliente', 'nombre', 'email'],
                        required: false
                    },
                    {
                        model: Usuario,
                        attributes: ['id_usuario', 'nombre', 'email'],
                        as: 'usuarioAsignado',
                        required: false
                    },
                    {
                        model: OportunidadesVenta,
                        attributes: ['id_oportunidad', 'etapa'],
                        required: false
                    }
                ],
                limit: limite,
                offset: offset,
                order: [['fecha_vencimiento', 'ASC']],
                subQuery: false
            });

            return {
                success: true,
                data: rows,
                pagination: {
                    total: count,
                    pagina,
                    limite,
                    totalPaginas: Math.ceil(count / limite)
                }
            };
        } catch (error) {
            throw {
                success: false,
                message: 'Error al obtener tareas',
                error: error.message
            };
        }
    }

    /**
     * Obtener una tarea por ID
     */
    static async obtenerTareaPorId(id_tarea) {
        try {
            const tarea = await TareasCRM.findByPk(id_tarea, {
                include: [
                    {
                        model: Cliente,
                        attributes: ['id_cliente', 'nombre', 'email', 'telefono'],
                        required: false
                    },
                    {
                        model: Usuario,
                        attributes: ['id_usuario', 'nombre', 'email'],
                        as: 'usuarioAsignado',
                        required: false
                    },
                    {
                        model: OportunidadesVenta,
                        attributes: ['id_oportunidad', 'titulo', 'etapa', 'monto_estimado'],
                        required: false
                    }
                ]
            });

            if (!tarea) {
                throw {
                    success: false,
                    message: 'Tarea no encontrada',
                    statusCode: 404
                };
            }

            return {
                success: true,
                data: tarea
            };
        } catch (error) {
            throw {
                success: false,
                message: 'Error al obtener la tarea',
                error: error.message
            };
        }
    }

    /**
     * Actualizar una tarea
     */
    static async actualizarTarea(id_tarea, dataTarea) {
        try {
            const tarea = await TareasCRM.findByPk(id_tarea);

            if (!tarea) {
                throw {
                    success: false,
                    message: 'Tarea no encontrada',
                    statusCode: 404
                };
            }

            await tarea.update(dataTarea);

            return {
                success: true,
                message: 'Tarea actualizada correctamente',
                data: tarea
            };
        } catch (error) {
            throw {
                success: false,
                message: 'Error al actualizar la tarea',
                error: error.message
            };
        }
    }

    /**
     * Cambiar el estado de una tarea
     */
    static async cambiarEstado(id_tarea, nuevoEstado) {
        try {
            const estadosValidos = ['pendiente', 'en_proceso', 'completado', 'cancelado'];

            if (!estadosValidos.includes(nuevoEstado)) {
                throw {
                    success: false,
                    message: `Estado inválido. Estados válidos: ${estadosValidos.join(', ')}`
                };
            }

            const tarea = await TareasCRM.findByPk(id_tarea);

            if (!tarea) {
                throw {
                    success: false,
                    message: 'Tarea no encontrada',
                    statusCode: 404
                };
            }

            const actualizacion = { estado: nuevoEstado };

            // Si el estado es completado, registrar la fecha de completado
            if (nuevoEstado === 'completado') {
                actualizacion.fecha_completado = new Date();
            }

            await tarea.update(actualizacion);

            return {
                success: true,
                message: `Tarea marcada como ${nuevoEstado}`,
                data: tarea
            };
        } catch (error) {
            throw {
                success: false,
                message: 'Error al cambiar el estado de la tarea',
                error: error.message
            };
        }
    }

    /**
     * Eliminar una tarea
     */
    static async eliminarTarea(id_tarea) {
        try {
            const tarea = await TareasCRM.findByPk(id_tarea);

            if (!tarea) {
                throw {
                    success: false,
                    message: 'Tarea no encontrada',
                    statusCode: 404
                };
            }

            await tarea.destroy();

            return {
                success: true,
                message: 'Tarea eliminada correctamente'
            };
        } catch (error) {
            throw {
                success: false,
                message: 'Error al eliminar la tarea',
                error: error.message
            };
        }
    }

    /**
     * Obtener tareas por usuario asignado
     */
    static async obtenerTareasPorUsuario(id_usuario, estado = null) {
        try {
            const where = { id_usuario_asignado: id_usuario };

            if (estado) {
                where.estado = estado;
            }

            const tareas = await TareasCRM.findAll({
                where,
                include: [
                    {
                        model: Cliente,
                        attributes: ['id_cliente', 'nombre', 'email'],
                        required: false
                    },
                    {
                        model: OportunidadesVenta,
                        attributes: ['id_oportunidad', 'titulo'],
                        required: false
                    }
                ],
                order: [['fecha_vencimiento', 'ASC']]
            });

            return {
                success: true,
                data: tareas
            };
        } catch (error) {
            throw {
                success: false,
                message: 'Error al obtener tareas del usuario',
                error: error.message
            };
        }
    }

    /**
     * Obtener tareas por cliente
     */
    static async obtenerTareasPorCliente(id_cliente) {
        try {
            const tareas = await TareasCRM.findAll({
                where: { id_cliente },
                include: [
                    {
                        model: Usuario,
                        attributes: ['id_usuario', 'nombre', 'email'],
                        as: 'usuarioAsignado',
                        required: false
                    },
                    {
                        model: OportunidadesVenta,
                        attributes: ['id_oportunidad', 'titulo', 'etapa'],
                        required: false
                    }
                ],
                order: [['fecha_vencimiento', 'ASC']]
            });

            return {
                success: true,
                data: tareas
            };
        } catch (error) {
            throw {
                success: false,
                message: 'Error al obtener tareas del cliente',
                error: error.message
            };
        }
    }

    /**
     * Obtener tareas por oportunidad
     */
    static async obtenerTareasPorOportunidad(id_oportunidad) {
        try {
            const tareas = await TareasCRM.findAll({
                where: { id_oportunidad },
                include: [
                    {
                        model: Cliente,
                        attributes: ['id_cliente', 'nombre', 'email'],
                        required: false
                    },
                    {
                        model: Usuario,
                        attributes: ['id_usuario', 'nombre', 'email'],
                        as: 'usuarioAsignado',
                        required: false
                    }
                ],
                order: [['fecha_vencimiento', 'ASC']]
            });

            return {
                success: true,
                data: tareas
            };
        } catch (error) {
            throw {
                success: false,
                message: 'Error al obtener tareas de la oportunidad',
                error: error.message
            };
        }
    }

    /**
     * Obtener tareas vencidas o próximas a vencer
     */
    static async obtenerTareasVencidas(diasAnticipacion = 3) {
        try {
            const hoy = new Date();
            const fechaLimite = new Date(hoy.getTime() + diasAnticipacion * 24 * 60 * 60 * 1000);

            const tareas = await TareasCRM.findAll({
                where: {
                    estado: {
                        [Op.in]: ['pendiente', 'en_proceso']
                    },
                    fecha_vencimiento: {
                        [Op.lte]: fechaLimite,
                        [Op.gte]: hoy
                    }
                },
                include: [
                    {
                        model: Cliente,
                        attributes: ['id_cliente', 'nombre'],
                        required: false
                    },
                    {
                        model: Usuario,
                        attributes: ['id_usuario', 'nombre', 'email'],
                        as: 'usuarioAsignado',
                        required: false
                    }
                ],
                order: [['fecha_vencimiento', 'ASC']]
            });

            return {
                success: true,
                data: tareas,
                cantidad: tareas.length
            };
        } catch (error) {
            throw {
                success: false,
                message: 'Error al obtener tareas vencidas',
                error: error.message
            };
        }
    }

    /**
     * Obtener estadísticas de tareas
     */
    static async obtenerEstadisticas(id_usuario = null) {
        try {
            const where = id_usuario ? { id_usuario_asignado: id_usuario } : {};

            const estadisticas = await TareasCRM.findAll({
                where,
                attributes: ['estado', 'tipo_tarea', 'prioridad'],
                raw: true
            });

            const resultado = {
                total: estadisticas.length,
                porEstado: {},
                porTipo: {},
                porPrioridad: {}
            };

            // Contar por estado
            estadisticas.forEach(tarea => {
                resultado.porEstado[tarea.estado] = (resultado.porEstado[tarea.estado] || 0) + 1;
                resultado.porTipo[tarea.tipo_tarea] = (resultado.porTipo[tarea.tipo_tarea] || 0) + 1;
                resultado.porPrioridad[tarea.prioridad] = (resultado.porPrioridad[tarea.prioridad] || 0) + 1;
            });

            return {
                success: true,
                data: resultado
            };
        } catch (error) {
            throw {
                success: false,
                message: 'Error al obtener estadísticas',
                error: error.message
            };
        }
    }

    /**
     * Asignar tarea a un usuario
     */
    static async asignarTarea(id_tarea, id_usuario_asignado) {
        try {
            const tarea = await TareasCRM.findByPk(id_tarea);

            if (!tarea) {
                throw {
                    success: false,
                    message: 'Tarea no encontrada',
                    statusCode: 404
                };
            }

            // Verificar que el usuario exista
            const usuario = await Usuario.findByPk(id_usuario_asignado);
            if (!usuario) {
                throw {
                    success: false,
                    message: 'Usuario no encontrado',
                    statusCode: 404
                };
            }

            await tarea.update({ id_usuario_asignado });

            return {
                success: true,
                message: 'Tarea asignada correctamente',
                data: tarea
            };
        } catch (error) {
            throw {
                success: false,
                message: 'Error al asignar la tarea',
                error: error.message
            };
        }
    }
}

export default TareasCRMService;
