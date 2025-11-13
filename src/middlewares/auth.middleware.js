
import jwt from 'jsonwebtoken';
import 'dotenv/config';

// Middleware para verificar el token JWT
export const verifyToken = (req, res, next) => {
    // Buscar el token en diferentes lugares
    const token = req.headers['x-access-token'] || 
                  req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
        return res.status(403).json({ message: 'No se proveyó un token' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secretkey', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'No autorizado' });
        }
        req.id_usuario = decoded.id_usuario; // Guardamos el id del usuario en el request
        req.id_rol = decoded.id_rol; // Guardamos el id del rol
        req.nombre_rol = decoded.nombre_rol; // Guardamos el nombre del rol
        req.userRol = decoded.nombre_rol; // Mantener por compatibilidad
        next();
    });
};

// Middleware para verificar si el rol es 'administrador'
export const isAdmin = (req, res, next) => {
    if (req.nombre_rol === 'administrador' || req.userRol === 'administrador') {
        next();
        return;
    }
    return res.status(403).json({ message: 'Se requiere rol de Administrador' });
};