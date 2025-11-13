import express from 'express';
import CotizacionesOrdenesController from '../controllers/cotizacionesOrdenes.controller.js';

const router = express.Router();

// Rutas independientes para Conversiones Cotización-Orden
router.post('/', CotizacionesOrdenesController.createCotizacionOrden);
router.get('/', CotizacionesOrdenesController.getAllRelaciones);
router.get('/estadisticas', CotizacionesOrdenesController.getEstadisticasConversiones);
router.get('/historial', CotizacionesOrdenesController.getHistorialConversiones);
router.get('/recientes', CotizacionesOrdenesController.getConversionesRecientes);
router.get('/por-fecha', CotizacionesOrdenesController.getConversionesByFecha);
router.get('/tasa-conversion', CotizacionesOrdenesController.getTasaConversion);
router.post('/reasignar', CotizacionesOrdenesController.reasignarOrdenACotizacion);
router.patch('/actualizar-estados-expirados', CotizacionesOrdenesController.actualizarEstadosExpirados);

// Rutas específicas por cotización u orden
router.get('/cotizacion/:idCotizacion', CotizacionesOrdenesController.getOrdenByCotizacion);
router.get('/orden/:idOrden', CotizacionesOrdenesController.getCotizacionByOrden);
router.get('/verificar/cotizacion/:idCotizacion', CotizacionesOrdenesController.verificarCotizacionConvertida);
router.get('/verificar/orden/:idOrden', CotizacionesOrdenesController.verificarOrdenDeCotizacion);

// Rutas específicas por relación completa
router.get('/:idCotizacion/:idOrden', CotizacionesOrdenesController.getRelacionByIds);
router.put('/:idCotizacion/:idOrden', CotizacionesOrdenesController.actualizarFechaConversion);
router.delete('/:idCotizacion/:idOrden', CotizacionesOrdenesController.deleteRelacion);
router.delete('/cotizacion/:idCotizacion', CotizacionesOrdenesController.deleteRelacionesByCotizacion);
router.delete('/orden/:idOrden', CotizacionesOrdenesController.deleteRelacionesByOrden);

export default router;