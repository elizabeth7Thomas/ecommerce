import OrdenEstado from '../models/OrdenEstado.js'; // Ajusta la ruta a tu modelo

class OrdenEstadoService {
    /**
     * Valida datos antes de crear/actualizar
     */
    async validarDatosEstado(data, idExcluir = null) {
        // Validar código único (excluyendo el actual en updates)
        const whereClause = { codigo_estado: data.codigo_estado };
        if (idExcluir) {
            whereClause.id_orden_estado = { [Op.ne]: idExcluir };
        }
        
        const existente = await OrdenEstado.findOne({ where: whereClause });
        if (existente) {
            throw new Error(`El código de estado '${data.codigo_estado}' ya existe.`);
        }

        // Validar que no sea estado final y cancelado al mismo tiempo
        if (data.es_estado_final && data.es_estado_cancelado) {
            throw new Error('Un estado no puede ser final y cancelado al mismo tiempo.');
        }

        return true;
    }

    async createEstado(data) {
        await this.validarDatosEstado(data);
        return await OrdenEstado.create(data);
    }

    async getAllEstados(includeInactive = false) {
        const whereClause = includeInactive ? {} : { activo: true };
        
        return await OrdenEstado.findAll({
            where: whereClause,
            order: [['orden_secuencia', 'ASC']],
        });
    }

    async getEstadoById(id) {
        const estado = await OrdenEstado.findByPk(id);
        if (!estado) {
            throw new Error('Estado de orden no encontrado.');
        }
        return estado;
    }

    async getEstadoByCodigo(codigo) {
        const estado = await OrdenEstado.findOne({ 
            where: { codigo_estado: codigo } 
        });
        if (!estado) {
            throw new Error(`Estado con código '${codigo}' no encontrado.`);
        }
        return estado;
    }

    async updateEstado(id, data) {
        const estado = await this.getEstadoById(id);
        await this.validarDatosEstado(data, id);
        
        await estado.update(data);
        return estado;
    }

    async deleteEstado(id) {
        const estado = await this.getEstadoById(id);
        
        // 🔥 NUEVO: Validar que no esté en uso antes de desactivar
        const enUso = await this.estadoEnUso(id);
        if (enUso) {
            throw new Error('No se puede desactivar un estado que está en uso por órdenes existentes.');
        }
        
        await estado.update({ activo: false });
        return { message: 'Estado de orden desactivado correctamente.' };
    }

    /**
     * 🔥 NUEVO: Verificar si el estado está siendo usado por alguna orden
     */
    async estadoEnUso(idEstado) {
        // Necesitarías importar el modelo Orden
        // const { Orden } = await import('../models/Orden.js');
        // return await Orden.count({ where: { id_estado_orden: idEstado } }) > 0;
        
        // Por ahora retornamos false hasta que tengas el modelo Orden
        return false;
    }

    /**
     * 🔥 NUEVO: Reactivar un estado desactivado
     */
    async activateEstado(id) {
        const estado = await this.getEstadoById(id);
        await estado.update({ activo: true });
        return { message: 'Estado de orden reactivado correctamente.' };
    }
}

export const ordenEstadoService = new OrdenEstadoService();