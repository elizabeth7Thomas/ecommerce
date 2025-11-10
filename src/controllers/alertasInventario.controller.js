import AlertasInventarioService from '../services/alertasInventario.service.js';
import * as response from '../utils/response.js';

class AlertasInventarioController {
  // CREATE - Crear nueva alerta
  async create(req, res) {
    try {
      const { id_inventario, tipo_alerta, mensaje } = req.body;

      // Validación de campos requeridos
      if (!id_inventario || !tipo_alerta) {
        return response.error(
          req,
          res,
          'El inventario y tipo de alerta son requeridos',
          400
        );
      }

      // Validar tipo de alerta
      const tiposValidos = [
        'stock_bajo',
        'stock_agotado',
        'stock_excedido',
        'producto_vencido'
      ];

      if (!tiposValidos.includes(tipo_alerta)) {
        return response.error(
          req,
          res,
          `Tipo de alerta inválido. Válidos: ${tiposValidos.join(', ')}`,
          400
        );
      }

      const alerta = await AlertasInventarioService.createAlerta({
        id_inventario,
        tipo_alerta,
        mensaje: mensaje || '',
        resuelta: false
      });

      return response.success(
        req,
        res,
        alerta,
        'Alerta creada exitosamente',
        201
      );
    } catch (error) {
      console.error('Error al crear alerta:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // READ - Obtener alerta por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return response.error(req, res, 'El ID de la alerta es requerido', 400);
      }

      const alerta = await AlertasInventarioService.getAlertaById(id);

      return response.success(req, res, alerta, 'Alerta obtenida exitosamente');
    } catch (error) {
      console.error('Error al obtener alerta:', error);
      return response.error(req, res, error.message, 404);
    }
  }

  // READ - Obtener todas las alertas con filtros y paginación
  async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        resuelta,
        tipo_alerta,
        id_inventario,
        orderBy = 'fecha_alerta',
        order = 'DESC'
      } = req.query;

      // Parsear booleano para resuelta
      let resuelstaValue = undefined;
      if (resuelta !== undefined && resuelta !== '') {
        resuelstaValue = resuelta === 'true' || resuelta === '1';
      }

      const opciones = {
        page: parseInt(page),
        limit: parseInt(limit),
        resuelta: resuelstaValue,
        tipo_alerta: tipo_alerta || undefined,
        id_inventario: id_inventario || undefined,
        orderBy,
        order
      };

      const resultado = await AlertasInventarioService.getAllAlertas(opciones);

      return response.success(
        req,
        res,
        resultado,
        'Alertas obtenidas exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener alertas:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // READ - Obtener alertas por inventario
  async getByInventario(req, res) {
    try {
      const { id_inventario } = req.params;

      if (!id_inventario) {
        return response.error(
          req,
          res,
          'El ID del inventario es requerido',
          400
        );
      }

      const alertas = await AlertasInventarioService.getAlertasByInventario(
        id_inventario
      );

      return response.success(
        req,
        res,
        alertas,
        'Alertas del inventario obtenidas exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener alertas del inventario:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // READ - Obtener alertas pendientes (alias para getNoResueltas)
  async getNoResueltas(req, res) {
    try {
      const alertas = await AlertasInventarioService.getAlertasPendientes();

      return response.success(
        req,
        res,
        alertas,
        'Alertas pendientes obtenidas exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener alertas pendientes:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // READ - Obtener alertas por tipo
  async getByTipo(req, res) {
    try {
      const { tipo_alerta } = req.params;

      if (!tipo_alerta) {
        return response.error(
          req,
          res,
          'El tipo de alerta es requerido',
          400
        );
      }

      const tiposValidos = [
        'stock_bajo',
        'stock_agotado',
        'stock_excedido',
        'producto_vencido'
      ];

      if (!tiposValidos.includes(tipo_alerta)) {
        return response.error(
          req,
          res,
          `Tipo de alerta inválido. Válidos: ${tiposValidos.join(', ')}`,
          400
        );
      }

      const { page = 1, limit = 10 } = req.query;

      const resultado = await AlertasInventarioService.getAllAlertas({
        page: parseInt(page),
        limit: parseInt(limit),
        tipo_alerta
      });

      return response.success(
        req,
        res,
        resultado,
        'Alertas del tipo obtenidas exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener alertas por tipo:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // UPDATE - Actualizar alerta
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return response.error(req, res, 'El ID de la alerta es requerido', 400);
      }

      if (Object.keys(updateData).length === 0) {
        return response.error(req, res, 'No hay datos para actualizar', 400);
      }

      // Validar tipo de alerta si se proporciona
      if (updateData.tipo_alerta) {
        const tiposValidos = [
          'stock_bajo',
          'stock_agotado',
          'stock_excedido',
          'producto_vencido'
        ];

        if (!tiposValidos.includes(updateData.tipo_alerta)) {
          return response.error(
            req,
            res,
            `Tipo de alerta inválido. Válidos: ${tiposValidos.join(', ')}`,
            400
          );
        }
      }

      const alerta = await AlertasInventarioService.updateAlerta(
        id,
        updateData
      );

      return response.success(
        req,
        res,
        alerta,
        'Alerta actualizada exitosamente'
      );
    } catch (error) {
      console.error('Error al actualizar alerta:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // UPDATE - Marcar alerta como resuelta
  async marcarResuelto(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return response.error(req, res, 'El ID de la alerta es requerido', 400);
      }

      const alerta = await AlertasInventarioService.markAsResuelta(id);

      return response.success(
        req,
        res,
        alerta,
        'Alerta marcada como resuelta exitosamente'
      );
    } catch (error) {
      console.error('Error al marcar alerta como resuelta:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // DELETE - Eliminar alerta
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return response.error(req, res, 'El ID de la alerta es requerido', 400);
      }

      const resultado = await AlertasInventarioService.deleteAlerta(id);

      return response.success(
        req,
        res,
        resultado,
        'Alerta eliminada exitosamente'
      );
    } catch (error) {
      console.error('Error al eliminar alerta:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // DELETE - Eliminar alertas por inventario
  async deleteByInventario(req, res) {
    try {
      const { id_inventario } = req.params;

      if (!id_inventario) {
        return response.error(
          req,
          res,
          'El ID del inventario es requerido',
          400
        );
      }

      const resultado =
        await AlertasInventarioService.deleteAlertasByInventario(
          id_inventario
        );

      return response.success(
        req,
        res,
        resultado,
        'Alertas eliminadas exitosamente'
      );
    } catch (error) {
      console.error('Error al eliminar alertas:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // Métodos específicos de negocio
  async crearAlertaStockBajo(req, res) {
    try {
      const { id_inventario, mensaje } = req.body;

      if (!id_inventario) {
        return response.error(
          req,
          res,
          'El ID del inventario es requerido',
          400
        );
      }

      const alerta = await AlertasInventarioService.crearAlertaStockBajo(
        id_inventario,
        mensaje || 'Stock bajo detectado'
      );

      return response.success(
        req,
        res,
        alerta,
        'Alerta de stock bajo creada exitosamente',
        201
      );
    } catch (error) {
      console.error('Error al crear alerta de stock bajo:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  async crearAlertaStockAgotado(req, res) {
    try {
      const { id_inventario, mensaje } = req.body;

      if (!id_inventario) {
        return response.error(
          req,
          res,
          'El ID del inventario es requerido',
          400
        );
      }

      const alerta = await AlertasInventarioService.crearAlertaStockAgotado(
        id_inventario,
        mensaje || 'Stock agotado'
      );

      return response.success(
        req,
        res,
        alerta,
        'Alerta de stock agotado creada exitosamente',
        201
      );
    } catch (error) {
      console.error('Error al crear alerta de stock agotado:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  async crearAlertaStockExcedido(req, res) {
    try {
      const { id_inventario, mensaje } = req.body;

      if (!id_inventario) {
        return response.error(
          req,
          res,
          'El ID del inventario es requerido',
          400
        );
      }

      const alerta = await AlertasInventarioService.crearAlertaStockExcedido(
        id_inventario,
        mensaje || 'Stock excedido'
      );

      return response.success(
        req,
        res,
        alerta,
        'Alerta de stock excedido creada exitosamente',
        201
      );
    } catch (error) {
      console.error('Error al crear alerta de stock excedido:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  async crearAlertaProductoVencido(req, res) {
    try {
      const { id_inventario, mensaje } = req.body;

      if (!id_inventario) {
        return response.error(
          req,
          res,
          'El ID del inventario es requerido',
          400
        );
      }

      const alerta = await AlertasInventarioService.crearAlertaProductoVencido(
        id_inventario,
        mensaje || 'Producto vencido'
      );

      return response.success(
        req,
        res,
        alerta,
        'Alerta de producto vencido creada exitosamente',
        201
      );
    } catch (error) {
      console.error('Error al crear alerta de producto vencido:', error);
      return response.error(req, res, error.message, 500);
    }
  }

  // Obtener estadísticas
  async getEstadisticas(req, res) {
    try {
      const estadisticas =
        await AlertasInventarioService.getEstadisticasAlertas();

      return response.success(
        req,
        res,
        estadisticas,
        'Estadísticas obtenidas exitosamente'
      );
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return response.error(req, res, error.message, 500);
    }
  }
}

export default new AlertasInventarioController();
