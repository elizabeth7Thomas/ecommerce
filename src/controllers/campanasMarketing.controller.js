import campanasMarketingService from '../services/campanasMarketing.service.js';
import * as response from '../utils/response.js';

class CampanasMarketingController {
  // CREATE - Crear nueva campaña
  async createCampana(req, res) {
    try {
      const campana = await campanasMarketingService.createCampana(req.body);
      res.status(201).json(response.created(campana, 'Campaña creada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // READ - Obtener campaña por ID
  async getCampanaById(req, res) {
    try {
      const { id } = req.params;
      const campana = await campanasMarketingService.getCampanaById(id);
      res.status(200).json(response.success(campana));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 404).json(err);
    }
  }

  // READ - Obtener todas las campañas
  async getAllCampanas(req, res) {
    try {
      const { page, limit, estado, tipo_campana, search, orderBy, order } = req.query;
      const campanas = await campanasMarketingService.getAllCampanas({
        page,
        limit,
        estado,
        tipo_campana,
        search,
        orderBy,
        order
      });
      res.status(200).json(response.success(campanas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener campañas activas
  async getCampanasActivas(req, res) {
    try {
      const campanas = await campanasMarketingService.getCampanasActivas();
      res.status(200).json(response.success(campanas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // READ - Obtener campañas por fecha
  async getCampanasByFecha(req, res) {
    try {
      const { inicio, fin } = req.query;
      if (!inicio || !fin) {
        return res.status(400).json(response.badRequest('Se requieren las fechas de inicio y fin'));
      }
      
      const campanas = await campanasMarketingService.getCampanasByFecha(inicio, fin);
      res.status(200).json(response.success(campanas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // UPDATE - Actualizar campaña
  async updateCampana(req, res) {
    try {
      const { id } = req.params;
      const campana = await campanasMarketingService.updateCampana(id, req.body);
      res.status(200).json(response.success(campana, 'Campaña actualizada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Cambiar estado de campaña
  async cambiarEstadoCampana(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      
      if (!estado) {
        return res.status(400).json(response.badRequest('El estado es requerido'));
      }

      const campana = await campanasMarketingService.cambiarEstadoCampana(id, estado);
      res.status(200).json(response.success(campana, `Campaña ${estado} exitosamente`));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Activar campaña
  async activarCampana(req, res) {
    try {
      const { id } = req.params;
      const campana = await campanasMarketingService.activarCampana(id);
      res.status(200).json(response.success(campana, 'Campaña activada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Pausar campaña
  async pausarCampana(req, res) {
    try {
      const { id } = req.params;
      const campana = await campanasMarketingService.pausarCampana(id);
      res.status(200).json(response.success(campana, 'Campaña pausada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // UPDATE - Completar campaña
  async completarCampana(req, res) {
    try {
      const { id } = req.params;
      const campana = await campanasMarketingService.completarCampana(id);
      res.status(200).json(response.success(campana, 'Campaña completada exitosamente'));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 400).json(err);
    }
  }

  // DELETE - Eliminar campaña
  async deleteCampana(req, res) {
    try {
      const { id } = req.params;
      const result = await campanasMarketingService.deleteCampana(id);
      res.status(200).json(response.noContent(result.message));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // REPORTES - Estadísticas de campañas
  async getEstadisticas(req, res) {
    try {
      const estadisticas = await campanasMarketingService.getEstadisticasCampanas();
      res.status(200).json(response.success(estadisticas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // REPORTES - Campañas próximas
  async getCampanasProximas(req, res) {
    try {
      const { dias = 7 } = req.query;
      const campanas = await campanasMarketingService.getCampanasProximas(parseInt(dias));
      res.status(200).json(response.success(campanas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }

  // REPORTES - Campañas que necesitan atención
  async getCampanasNecesitanAtencion(req, res) {
    try {
      const campanas = await campanasMarketingService.getCampanasNecesitanAtencion();
      res.status(200).json(response.success(campanas));
    } catch (error) {
      const err = response.handleError(error);
      res.status(err.statusCode || 500).json(err);
    }
  }
}

export default new CampanasMarketingController();