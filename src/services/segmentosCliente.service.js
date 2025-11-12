import { SegmentosCliente } from '../models/index.js';
import { Op } from 'sequelize';

class SegmentosClienteService {
    /**
     * Validar estructura de criterios JSON
     * @param {Object} criterios - Objeto de criterios
     * @returns {Object}
     */
    validarCriterios(criterios) {
        const errores = [];

        if (!criterios || typeof criterios !== 'object') {
            errores.push('Los criterios deben ser un objeto JSON válido');
            return { valido: false, errores };
        }

        // Validaciones básicas de estructura
        // Puedes personalizar esto según tus necesidades de negocio
        const camposPermitidos = [
            'edad_min', 'edad_max',
            'genero',
            'ciudad', 'departamento', 'pais',
            'nivel_ingresos',
            'compras_min', 'compras_max',
            'monto_min', 'monto_max',
            'frecuencia_compra',
            'fecha_registro_desde', 'fecha_registro_hasta',
            'intereses', 'etiquetas',
            'tipo_cliente',
            'activo_desde_dias',
            'ultima_compra_dias'
        ];

        for (const campo in criterios) {
            if (!camposPermitidos.includes(campo)) {
                errores.push(`Campo no permitido en criterios: ${campo}`);
            }
        }

        // Validar rangos numéricos
        if (criterios.edad_min !== undefined && (typeof criterios.edad_min !== 'number' || criterios.edad_min < 0)) {
            errores.push('edad_min debe ser un número positivo');
        }
        if (criterios.edad_max !== undefined && (typeof criterios.edad_max !== 'number' || criterios.edad_max < 0)) {
            errores.push('edad_max debe ser un número positivo');
        }
        if (criterios.edad_min !== undefined && criterios.edad_max !== undefined && criterios.edad_min > criterios.edad_max) {
            errores.push('edad_min no puede ser mayor que edad_max');
        }

        // Validar montos
        if (criterios.monto_min !== undefined && (typeof criterios.monto_min !== 'number' || criterios.monto_min < 0)) {
            errores.push('monto_min debe ser un número positivo');
        }
        if (criterios.monto_max !== undefined && (typeof criterios.monto_max !== 'number' || criterios.monto_max < 0)) {
            errores.push('monto_max debe ser un número positivo');
        }
        if (criterios.monto_min !== undefined && criterios.monto_max !== undefined && criterios.monto_min > criterios.monto_max) {
            errores.push('monto_min no puede ser mayor que monto_max');
        }

        return {
            valido: errores.length === 0,
            errores
        };
    }

    /**
     * Crear nuevo segmento de cliente
     * @param {Object} data - Datos del segmento
     * @returns {Promise<Object>}
     */
    async createSegmento(data) {
        try {
            // Validar datos requeridos
            if (!data.nombre_segmento?.trim()) {
                throw new Error('El nombre del segmento es requerido');
            }

            // Verificar duplicados por nombre
            const existe = await SegmentosCliente.findOne({
                where: { nombre_segmento: data.nombre_segmento.trim() }
            });

            if (existe) {
                throw new Error('Ya existe un segmento con ese nombre');
            }

            // Validar criterios si se proporcionan
            if (data.criterios) {
                const validacion = this.validarCriterios(data.criterios);
                if (!validacion.valido) {
                    throw new Error(`Criterios inválidos: ${validacion.errores.join(', ')}`);
                }
            }

            // Preparar datos
            const segmentoData = {
                nombre_segmento: data.nombre_segmento.trim(),
                descripcion: data.descripcion?.trim() || null,
                criterios: data.criterios || null,
                activo: data.activo !== undefined ? data.activo : true
            };

            return await SegmentosCliente.create(segmentoData);
        } catch (error) {
            throw new Error(`Error al crear segmento: ${error.message}`);
        }
    }

    /**
     * Obtener todos los segmentos
     * @param {Object} options - Opciones de filtrado
     * @returns {Promise<Array>}
     */
    async getAllSegmentos(options = {}) {
        try {
            const where = {};

            // Filtrar por estado activo
            if (options.activo !== undefined) {
                where.activo = options.activo;
            }

            // Búsqueda por nombre
            if (options.nombre?.trim()) {
                where.nombre_segmento = {
                    [Op.like]: `%${options.nombre.trim()}%`
                };
            }

            // Filtrar por criterios específicos
            if (options.tiene_criterios === true) {
                where.criterios = { [Op.ne]: null };
            } else if (options.tiene_criterios === false) {
                where.criterios = null;
            }

            // Configurar ordenamiento
            const orderField = options.order || 'nombre_segmento';
            const sortDirection = options.sort?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

            return await SegmentosCliente.findAll({
                where,
                order: [[orderField, sortDirection]],
                limit: options.limit,
                offset: options.offset
            });
        } catch (error) {
            throw new Error(`Error al obtener segmentos: ${error.message}`);
        }
    }

    /**
     * Obtener segmento por ID
     * @param {number} id - ID del segmento
     * @returns {Promise<Object>}
     */
    async getSegmentoById(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const segmento = await SegmentosCliente.findByPk(id);

            if (!segmento) {
                throw new Error('Segmento no encontrado');
            }

            return segmento;
        } catch (error) {
            throw new Error(`Error al obtener segmento: ${error.message}`);
        }
    }

    /**
     * Buscar segmento por nombre
     * @param {string} nombre - Nombre del segmento
     * @returns {Promise<Object|null>}
     */
    async getSegmentoByNombre(nombre) {
        try {
            if (!nombre?.trim()) {
                throw new Error('Nombre requerido');
            }

            return await SegmentosCliente.findOne({
                where: { nombre_segmento: nombre.trim() }
            });
        } catch (error) {
            throw new Error(`Error al buscar segmento por nombre: ${error.message}`);
        }
    }

    /**
     * Actualizar segmento
     * @param {number} id - ID del segmento
     * @param {Object} updates - Datos a actualizar
     * @returns {Promise<Object>}
     */
    async updateSegmento(id, updates) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const segmento = await SegmentosCliente.findByPk(id);

            if (!segmento) {
                throw new Error('Segmento no encontrado');
            }

            // Validar nombre si se actualiza
            if (updates.nombre_segmento?.trim()) {
                const existe = await SegmentosCliente.findOne({
                    where: {
                        nombre_segmento: updates.nombre_segmento.trim(),
                        id_segmento: { [Op.ne]: id }
                    }
                });

                if (existe) {
                    throw new Error('Ya existe un segmento con ese nombre');
                }

                updates.nombre_segmento = updates.nombre_segmento.trim();
            }

            // Validar criterios si se actualizan
            if (updates.criterios !== undefined) {
                if (updates.criterios === null) {
                    // Permitir eliminación de criterios
                    updates.criterios = null;
                } else {
                    const validacion = this.validarCriterios(updates.criterios);
                    if (!validacion.valido) {
                        throw new Error(`Criterios inválidos: ${validacion.errores.join(', ')}`);
                    }
                }
            }

            // Limpiar descripción
            if (updates.descripcion !== undefined) {
                updates.descripcion = updates.descripcion?.trim() || null;
            }

            await segmento.update(updates);
            return segmento;
        } catch (error) {
            throw new Error(`Error al actualizar segmento: ${error.message}`);
        }
    }

    /**
     * Actualizar criterios de un segmento
     * @param {number} id - ID del segmento
     * @param {Object} criterios - Nuevos criterios
     * @returns {Promise<Object>}
     */
    async updateCriterios(id, criterios) {
        try {
            const segmento = await this.getSegmentoById(id);

            if (criterios !== null) {
                const validacion = this.validarCriterios(criterios);
                if (!validacion.valido) {
                    throw new Error(`Criterios inválidos: ${validacion.errores.join(', ')}`);
                }
            }

            await segmento.update({ criterios });
            return segmento;
        } catch (error) {
            throw new Error(`Error al actualizar criterios: ${error.message}`);
        }
    }

    /**
     * Agregar criterio específico
     * @param {number} id - ID del segmento
     * @param {string} campo - Campo del criterio
     * @param {*} valor - Valor del criterio
     * @returns {Promise<Object>}
     */
    async agregarCriterio(id, campo, valor) {
        try {
            const segmento = await this.getSegmentoById(id);

            const criteriosActuales = segmento.criterios || {};
            const nuevosCriterios = {
                ...criteriosActuales,
                [campo]: valor
            };

            const validacion = this.validarCriterios(nuevosCriterios);
            if (!validacion.valido) {
                throw new Error(`Criterios inválidos: ${validacion.errores.join(', ')}`);
            }

            await segmento.update({ criterios: nuevosCriterios });
            return segmento;
        } catch (error) {
            throw new Error(`Error al agregar criterio: ${error.message}`);
        }
    }

    /**
     * Eliminar criterio específico
     * @param {number} id - ID del segmento
     * @param {string} campo - Campo del criterio a eliminar
     * @returns {Promise<Object>}
     */
    async eliminarCriterio(id, campo) {
        try {
            const segmento = await this.getSegmentoById(id);

            if (!segmento.criterios || !segmento.criterios[campo]) {
                throw new Error('El criterio no existe');
            }

            const nuevosCriterios = { ...segmento.criterios };
            delete nuevosCriterios[campo];

            await segmento.update({
                criterios: Object.keys(nuevosCriterios).length > 0 ? nuevosCriterios : null
            });

            return segmento;
        } catch (error) {
            throw new Error(`Error al eliminar criterio: ${error.message}`);
        }
    }

    /**
     * Desactivar segmento
     * @param {number} id - ID del segmento
     * @returns {Promise<Object>}
     */
    async desactivarSegmento(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const segmento = await SegmentosCliente.findByPk(id);

            if (!segmento) {
                throw new Error('Segmento no encontrado');
            }

            if (!segmento.activo) {
                throw new Error('El segmento ya está desactivado');
            }

            await segmento.update({ activo: false });
            return segmento;
        } catch (error) {
            throw new Error(`Error al desactivar segmento: ${error.message}`);
        }
    }

    /**
     * Activar segmento
     * @param {number} id - ID del segmento
     * @returns {Promise<Object>}
     */
    async activarSegmento(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const segmento = await SegmentosCliente.findByPk(id);

            if (!segmento) {
                throw new Error('Segmento no encontrado');
            }

            if (segmento.activo) {
                throw new Error('El segmento ya está activo');
            }

            await segmento.update({ activo: true });
            return segmento;
        } catch (error) {
            throw new Error(`Error al activar segmento: ${error.message}`);
        }
    }

    /**
     * Eliminar segmento permanentemente
     * @param {number} id - ID del segmento
     * @returns {Promise<boolean>}
     */
    async deleteSegmento(id) {
        try {
            if (!id || isNaN(id)) {
                throw new Error('ID inválido');
            }

            const segmento = await SegmentosCliente.findByPk(id);

            if (!segmento) {
                throw new Error('Segmento no encontrado');
            }

            await segmento.destroy();
            return true;
        } catch (error) {
            throw new Error(`Error al eliminar segmento: ${error.message}`);
        }
    }

    /**
     * Obtener segmentos activos
     * @returns {Promise<Array>}
     */
    async getSegmentosActivos() {
        try {
            return await this.getAllSegmentos({ activo: true });
        } catch (error) {
            throw new Error(`Error al obtener segmentos activos: ${error.message}`);
        }
    }

    /**
     * Obtener segmentos con criterios definidos
     * @returns {Promise<Array>}
     */
    async getSegmentosConCriterios() {
        try {
            return await this.getAllSegmentos({ tiene_criterios: true });
        } catch (error) {
            throw new Error(`Error al obtener segmentos con criterios: ${error.message}`);
        }
    }

    /**
     * Obtener segmentos sin criterios
     * @returns {Promise<Array>}
     */
    async getSegmentosSinCriterios() {
        try {
            return await this.getAllSegmentos({ tiene_criterios: false });
        } catch (error) {
            throw new Error(`Error al obtener segmentos sin criterios: ${error.message}`);
        }
    }

    /**
     * Buscar segmentos por criterio específico
     * @param {string} campo - Campo del criterio
     * @param {*} valor - Valor del criterio (opcional)
     * @returns {Promise<Array>}
     */
    async buscarPorCriterio(campo, valor = null) {
        try {
            if (!campo?.trim()) {
                throw new Error('El campo es requerido');
            }

            // Usar consulta JSONB para PostgreSQL
            const where = {};

            if (valor !== null) {
                where.criterios = {
                    [Op.contains]: { [campo]: valor }
                };
            } else {
                // Buscar segmentos que tengan este campo definido
                where.criterios = {
                    [Op.ne]: null
                };
            }

            const segmentos = await SegmentosCliente.findAll({ where });

            // Filtrar adicionalmente si solo buscamos por existencia del campo
            if (valor === null) {
                return segmentos.filter(s => s.criterios && campo in s.criterios);
            }

            return segmentos;
        } catch (error) {
            throw new Error(`Error al buscar por criterio: ${error.message}`);
        }
    }

    /**
     * Contar segmentos
     * @param {Object} filters - Filtros opcionales
     * @returns {Promise<number>}
     */
    async countSegmentos(filters = {}) {
        try {
            const where = {};

            if (filters.activo !== undefined) {
                where.activo = filters.activo;
            }

            if (filters.tiene_criterios === true) {
                where.criterios = { [Op.ne]: null };
            } else if (filters.tiene_criterios === false) {
                where.criterios = null;
            }

            return await SegmentosCliente.count({ where });
        } catch (error) {
            throw new Error(`Error al contar segmentos: ${error.message}`);
        }
    }

    /**
     * Verificar si un segmento existe
     * @param {number} id - ID del segmento
     * @returns {Promise<boolean>}
     */
    async exists(id) {
        try {
            if (!id || isNaN(id)) {
                return false;
            }

            const count = await SegmentosCliente.count({
                where: { id_segmento: id }
            });

            return count > 0;
        } catch (error) {
            throw new Error(`Error al verificar existencia de segmento: ${error.message}`);
        }
    }

    /**
     * Obtener estadísticas de criterios
     * @returns {Promise<Object>}
     */
    async getEstadisticasCriterios() {
        try {
            const total = await this.countSegmentos();
            const conCriterios = await this.countSegmentos({ tiene_criterios: true });
            const sinCriterios = await this.countSegmentos({ tiene_criterios: false });
            const activos = await this.countSegmentos({ activo: true });
            const inactivos = await this.countSegmentos({ activo: false });

            return {
                total,
                con_criterios: conCriterios,
                sin_criterios: sinCriterios,
                activos,
                inactivos,
                porcentaje_con_criterios: total > 0 ? ((conCriterios / total) * 100).toFixed(2) : 0
            };
        } catch (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }

    /**
     * Duplicar segmento
     * @param {number} id - ID del segmento a duplicar
     * @param {string} nuevoNombre - Nuevo nombre para el segmento duplicado
     * @returns {Promise<Object>}
     */
    async duplicarSegmento(id, nuevoNombre) {
        try {
            const segmentoOriginal = await this.getSegmentoById(id);

            if (!nuevoNombre?.trim()) {
                throw new Error('Debe proporcionar un nombre para el segmento duplicado');
            }

            // Verificar que el nuevo nombre no exista
            const existe = await this.getSegmentoByNombre(nuevoNombre);
            if (existe) {
                throw new Error('Ya existe un segmento con ese nombre');
            }

            // Crear el duplicado
            return await this.createSegmento({
                nombre_segmento: nuevoNombre.trim(),
                descripcion: segmentoOriginal.descripcion,
                criterios: segmentoOriginal.criterios ? { ...segmentoOriginal.criterios } : null,
                activo: segmentoOriginal.activo
            });
        } catch (error) {
            throw new Error(`Error al duplicar segmento: ${error.message}`);
        }
    }
}

export default new SegmentosClienteService();