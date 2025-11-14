// En /src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';
import JWT_CONFIG from '../config/jwt.js';
import { Cliente } from '../models/index.js';

export const verifyToken = async (req, res, next) => {
    try {
        // Obtener token de diferentes fuentes
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : req.headers['x-access-token'] || 
              req.headers['token'];

        console.log('🔐 Token recibido:', token ? 'Presente' : 'Faltante');
        
        if (!token) {
            return res.status(403).json({ 
                success: false,
                message: 'Token de autenticación requerido' 
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, JWT_CONFIG.SECRET);
        console.log('✅ Token decodificado:', decoded);

        // Crear objeto user con datos del token
        const user = {
            id_usuario: decoded.id_usuario || decoded.sub || decoded.userId || decoded.user_id,
            id_rol: decoded.id_rol || decoded.rol || decoded.role || decoded.userRole,
            nombre_rol: decoded.nombre_rol || decoded.rol || decoded.role || decoded.userRole
        };

        // Si es cliente, obtener id_cliente automáticamente
        if (user.nombre_rol === 'cliente') {
            try {
                const cliente = await Cliente.findOne({
                    where: { id_usuario: user.id_usuario },
                    attributes: ['id_cliente']
                });
                
                if (cliente) {
                    user.id_cliente = cliente.id_cliente;
                } else {
                    console.warn(`⚠️ Usuario ${user.id_usuario} con rol cliente no tiene perfil de cliente`);
                }
            } catch (error) {
                console.error('❌ Error al obtener id_cliente:', error.message);
                // No bloqueamos la ejecución, solo loggeamos el error
            }
        }

        // Asignar user al request
        req.user = user;
        
        // Mantener compatibilidad con código existente
        req.id_usuario = user.id_usuario;
        req.id_rol = user.id_rol;
        req.nombre_rol = user.nombre_rol;
        req.userRol = user.nombre_rol;

        next();
    } catch (error) {
        console.error('❌ Error verificando token:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Token expirado' 
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                message: 'Token inválido' 
            });
        }
        
        return res.status(401).json({ 
            success: false,
            message: 'Error de autenticación' 
        });
    }
};

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

// Middleware para verificar si es el propietario o admin
export const isOwnerOrAdmin = (req, res, next) => {
    const { id_usuario, nombre_rol } = req;
    const targetUserId = parseInt(req.params.id_usuario || req.params.id);
    
    if (nombre_rol === 'administrador' || id_usuario === targetUserId) {
        next();
        return;
    }
    
    return res.status(403).json({ 
        success: false,
        message: 'No tienes permisos para realizar esta acción' 
    });
};

// Middleware para verificar permisos específicos
export const hasPermission = (permission) => {
    return (req, res, next) => {
        // Esta función asume que los permisos vienen en req.permisos
        // Deberías cargar los permisos del usuario durante la autenticación
        if (req.nombre_rol === 'administrador') {
            next();
            return;
        }
        
        if (req.permisos && req.permisos[permission]) {
            next();
        } else {
            return res.status(403).json({ 
                success: false,
                message: `Permiso denegado: Se requiere el permiso ${permission}` 
            });
        }
    };
};