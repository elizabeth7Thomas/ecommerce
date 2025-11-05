import imagenService from '../services/imagen.service.js';
import * as response from '../utils/response.js';

class ImagenController {
    async getImagesByProduct(req, res) {
        try {
            const { id_producto } = req.params;
            const imagenes = await imagenService.getImagesByProduct(id_producto);
            res.status(200).json(response.success(imagenes));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }

    async addImageToProduct(req, res) {
        try {
            const { id_producto } = req.params;
            const { url_imagen, es_principal } = req.body;

            if (!url_imagen) {
                return res.status(400).json(response.badRequest('url_imagen es requerida'));
            }

            const imagen = await imagenService.addImageToProduct(id_producto, { url_imagen, es_principal });
            res.status(201).json(response.created(imagen, 'Imagen agregada exitosamente'));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 400).json(err);
        }
    }

    async deleteImage(req, res) {
        try {
            const { id } = req.params;
            await imagenService.deleteImage(id);
            res.status(200).json(response.noContent('Imagen eliminada exitosamente'));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }

    async setPrincipal(req, res) {
        try {
            const { id } = req.params;
            const imagen = await imagenService.setPrincipal(id);
            res.status(200).json(response.success(imagen, 'Imagen marcada como principal'));
        } catch (error) {
            const err = response.handleError(error);
            res.status(err.statusCode || 400).json(err);
        }
    }
}

export default new ImagenController();