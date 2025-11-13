
import jwt from 'jsonwebtoken';
import 'dotenv/config';

// Middleware para verificar el token JWT
export const verifyToken = (req, res, next) => {
    try {
        // Buscar el token en diferentes lugares
        const token = req.headers['x-access-token'] || 
                     req.headers['authorization']?.replace('Bearer ', '') ||
                     req.headers['token'];

        if (!token) {
            return res.status(403).json({ 
                success: false,
                message: 'Token de autenticación requerido' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        
        // Guardar información del usuario en el request
        req.id_usuario = decoded.id_usuario;
        req.id_rol = decoded.id_rol;
        req.nombre_rol = decoded.nombre_rol;
        req.userRol = decoded.nombre_rol; // Para compatibilidad
        
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false,
            message: 'Token inválido o expirado' 
        });
    }
};

// Middleware para verificar si el rol es 'administrador'
export const isAdmin = (req, res, next) => {
    if (req.nombre_rol === 'administrador' || req.userRol === 'administrador') {
        next();
        return;
    }
    return res.status(403).json({ 
        success: false,
        message: 'Se requiere rol de Administrador' 
    });
};

// Middleware para verificar múltiples roles
export const hasRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.nombre_rol) {
            return res.status(403).json({ 
                success: false,
                message: 'Usuario no autenticado' 
            });
        }
        if (allowedRoles.includes(req.nombre_rol)) {
            next();
        } else {
            return res.status(403).json({ 
                success: false,
                message: `Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}` 
            });
        }
    };
};