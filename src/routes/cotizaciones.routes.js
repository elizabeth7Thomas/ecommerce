import express from 'express';
import CotizacionesController from '../controllers/cotizaciones.controller.js';
import CotizacionesItemsController from '../controllers/cotizacionesItems.controller.js';
import CotizacionesOrdenesController from '../controllers/cotizacionesOrdenes.controller.js';

const router = express.Router();

// Rutas principales de Cotizaciones
router.post('/', CotizacionesController.createCotizacion);
router.get('/', CotizacionesController.getAllCotizaciones);
router.get('/estadisticas/generales', CotizacionesController.getEstadisticasGenerales);
router.get('/numero/:numero', CotizacionesController.getCotizacionByNumero);
router.get('/generar-numero', CotizacionesController.generarNumeroCotizacion);
router.get('/proximas-expiracion', CotizacionesController.getCotizacionesProximasExpiracion);
router.get('/expiradas', CotizacionesController.getCotizacionesExpiradas);
router.get('/cliente/:idCliente', CotizacionesController.getCotizacionesByCliente);
router.get('/usuario/:idUsuario', CotizacionesController.getCotizacionesByUsuario);

// Rutas específicas por ID de cotización
router.get('/:id', CotizacionesController.getCotizacionById);
router.put('/:id', CotizacionesController.updateCotizacion);
router.delete('/:id', CotizacionesController.deleteCotizacion);
router.patch('/:id/estado', CotizacionesController.cambiarEstadoCotizacion);
router.patch('/:id/enviar', CotizacionesController.marcarComoEnviada);
router.patch('/:id/aceptar', CotizacionesController.marcarComoAceptada);
router.patch('/:id/rechazar', CotizacionesController.marcarComoRechazada);
router.patch('/:id/expirada', CotizacionesController.marcarComoExpirada);
router.patch('/:id/montos', CotizacionesController.actualizarMontos);
router.patch('/:id/notas-terminos', CotizacionesController.actualizarNotasTerminos);
router.get('/:id/estadisticas', CotizacionesController.getEstadisticasByCliente);

// Rutas de Items de Cotización (anidadas)
router.post('/:idCotizacion/items', CotizacionesItemsController.agregarItemACotizacion);
router.post('/:idCotizacion/items/multiples', CotizacionesItemsController.agregarMultiplesItems);
router.get('/:idCotizacion/items', CotizacionesItemsController.getItemsByCotizacion);
router.get('/:idCotizacion/items/resumen', CotizacionesItemsController.getResumenCotizacion);
router.get('/:idCotizacion/items/estadisticas', CotizacionesItemsController.getEstadisticasCotizacion);
router.get('/:idCotizacion/items/:idProducto', CotizacionesItemsController.getItemByCotizacionProducto);
router.put('/:idCotizacion/items/:idProducto', CotizacionesItemsController.actualizarCantidad);
router.delete('/:idCotizacion/items/:idProducto', CotizacionesItemsController.eliminarItemEspecifico);
router.delete('/:idCotizacion/items', CotizacionesItemsController.vaciarCotizacion);

// Rutas de Conversión a Órdenes (anidadas)
router.post('/:idCotizacion/convertir', CotizacionesOrdenesController.convertirCotizacionEnOrden);
router.get('/:idCotizacion/orden', CotizacionesOrdenesController.getOrdenByCotizacion);

export default router;