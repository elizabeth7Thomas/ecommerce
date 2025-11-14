import { ordenEstadoService } from '../services/OrdenEstadoService.js';

class OrdenEstadoController {

    async create(req, res) {
        try {
            const { codigo_estado, nombre_estado } = req.body;
            if (!codigo_estado || !nombre_estado) {
                return res.status(400).json({
                    success: false,
                    message: 'El código y el nombre del estado son requeridos.',
                    code: 'CAMPOS_REQUERIDOS'
                });
            }

            const nuevoEstado = await ordenEstadoService.createEstado(req.body);
            res.status(201).json({
                success: true,
                data: nuevoEstado,
                message: 'Estado de orden creado exitosamente.'
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
                code: 'ERROR_CREACION_ESTADO'
            });
        }
    }

    async findAll(req, res) {
        try {
            const estados = await ordenEstadoService.getAllEstados();
            res.status(200).json({
                success: true,
                data: estados
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al recuperar los estados de orden.',
                code: 'ERROR_SERVIDOR'
            });
        }
    }

    async findOne(req, res) {
        try {
            const { id } = req.params;
            const estado = await ordenEstadoService.getEstadoById(id);
            res.status(200).json({
                success: true,
                data: estado
            });

        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message,
                code: 'ESTADO_NO_ENCONTRADO'
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const estadoActualizado = await ordenEstadoService.updateEstado(id, req.body);
            res.status(200).json({
                success: true,
                data: estadoActualizado,
                message: 'Estado de orden actualizado exitosamente.'
            });

        } catch (error) {
            const statusCode = error.message.includes('encontrado') ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                message: error.message,
                code: 'ERROR_ACTUALIZACION_ESTADO'
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const result = await ordenEstadoService.deleteEstado(id);
            res.status(200).json({
                success: true,
                message: result.message
            });

        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message,
                code: 'ERROR_ELIMINACION_ESTADO'
            });
        }
    }
}

export default new OrdenEstadoController();