import imagenService from '../services/imagen.service.js';

class ImagenController {
    async getImagesByProduct(req, res) {
        try {
            const { id_producto } = req.params;
            const imagenes = await imagenService.getImagesByProduct(id_producto);
            res.status(200).json(imagenes);
        } catch (error) {
            if (error.message === 'Producto no encontrado') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: error.message });
        }
    }

    async addImageToProduct(req, res) {
        try {
            const { id_producto } = req.params;
            const { url_imagen, es_principal } = req.body;

            if (!url_imagen) {
                return res.status(400).json({ message: 'url_imagen es requerida' });
            }

            const imagen = await imagenService.addImageToProduct(id_producto, { url_imagen, es_principal });
            res.status(201).json({ message: 'Imagen agregada exitosamente', imagen });
        } catch (error) {
            if (error.message === 'Producto no encontrado') {
                return res.status(404).json({ message: error.message });
            }
            res.status(400).json({ message: error.message });
        }
    }

    async deleteImage(req, res) {
        try {
            const { id } = req.params;
            await imagenService.deleteImage(id);
            res.status(200).json({ message: 'Imagen eliminada exitosamente' });
        } catch (error) {
            if (error.message === 'Imagen no encontrada') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: error.message });
        }
    }

    async setPrincipal(req, res) {
        try {
            const { id } = req.params;
            const imagen = await imagenService.setPrincipal(id);
            res.status(200).json({ message: 'Imagen marcada como principal', imagen });
        } catch (error) {
            if (error.message === 'Imagen no encontrada') {
                return res.status(404).json({ message: error.message });
            }
            res.status(400).json({ message: error.message });
        }
    }
}

export default new ImagenController();