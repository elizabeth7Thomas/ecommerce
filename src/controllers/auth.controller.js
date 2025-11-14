// En /src/controllers/auth.controller.js
import userService from '../services/user.service.js';
import clienteService from '../services/cliente.service.js';
import rolService from '../services/rol.service.js';
import jwt from 'jsonwebtoken';
import JWT_CONFIG from '../config/jwt.js';
import * as response from '../utils/response.js';

const authController = {
    // Registro de nuevo usuario
    async register(req, res) {
        try {
            const userData = req.body;
            
            console.log('📝 Datos recibidos para registro:', userData);

            // Validaciones básicas
            if (!userData.nombre_usuario || !userData.correo_electronico || !userData.contrasena) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre de usuario, correo electrónico y contraseña son requeridos'
                });
            }

            // Si se proporciona nombre_rol en lugar de id_rol, obtener el id
            if (userData.nombre_rol && !userData.id_rol) {
                const rol = await rolService.getRolByNombre(userData.nombre_rol);
                if (rol) {
                    userData.id_rol = rol.id_rol;
                }
                delete userData.nombre_rol;
            }
            
            // Si no se especifica rol, usar cliente por defecto (id_rol: 2)
            if (!userData.id_rol) {
                userData.id_rol = 2; // cliente
            }
            
            // Crear usuario
            const newUser = await userService.createUser(userData);
            console.log('✅ Usuario creado:', newUser.id_usuario);
            
            // Si es un cliente (id_rol: 2), crear el perfil de cliente automáticamente
            let clienteData = null;
            if (newUser.id_rol === 2) {
                try {
                    // Verificar que el usuario fue guardado correctamente
                    const userVerify = await userService.getUserById(newUser.id_usuario);
                    if (!userVerify) {
                        throw new Error('El usuario no se guardó correctamente en la base de datos');
                    }
                    
                    clienteData = await clienteService.createCliente({
                        id_usuario: newUser.id_usuario,
                        nombre: userData.nombre || '',
                        apellido: userData.apellido || '',
                        telefono: userData.telefono || null
                    });
                    console.log('✅ Cliente creado:', clienteData.id_cliente);
                } catch (clienteError) {
                    // Si falla la creación del cliente, eliminar el usuario
                    console.error('❌ Error al crear cliente, revertiendo usuario:', clienteError);
                    try {
                        await userService.deleteUser(newUser.id_usuario);
                    } catch (destroyError) {
                        console.error('❌ Error al eliminar usuario fallido:', destroyError);
                    }
                    throw new Error('Error al crear el perfil de cliente. Por favor intenta de nuevo.');
                }
            }
            
            // Obtener el rol completo
            const rol = await rolService.getRolById(newUser.id_rol);
            console.log('✅ Rol obtenido:', rol?.nombre_rol);

            // Generar token JWT
            const tokenPayload = { 
                id_usuario: newUser.id_usuario, 
                id_rol: newUser.id_rol,
                nombre_rol: rol?.nombre_rol || 'cliente'
            };

            console.log('📦 Payload del token:', tokenPayload);

            const token = jwt.sign(
                tokenPayload,
                JWT_CONFIG.SECRET,
                { expiresIn: JWT_CONFIG.EXPIRES_IN }
            );

            console.log('✅ Token generado en register');

            const responseData = {
                id_usuario: newUser.id_usuario,
                nombre_usuario: newUser.nombre_usuario,
                correo_electronico: newUser.correo_electronico,
                id_rol: newUser.id_rol,
                nombre_rol: rol?.nombre_rol || 'cliente',
                token,
                cliente: clienteData || null
            };

            res.status(201).json({
                success: true,
                data: responseData,
                message: 'Usuario y cliente creados exitosamente'
            });
        } catch (error) {
            console.error('❌ Error en register:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Login de usuario
    async login(req, res) {
        try {
            const { correo_electronico, contrasena } = req.body;

            console.log('🔐 Intento de login:', { correo_electronico });

            if (!correo_electronico || !contrasena) {
                return res.status(400).json({
                    success: false,
                    message: 'Correo electrónico y contraseña son requeridos'
                });
            }

            // Buscar usuario por email
            const user = await userService.getUserByEmail(correo_electronico);
            if (!user) {
                console.log('❌ Usuario no encontrado:', correo_electronico);
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            console.log('✅ Usuario encontrado:', user.id_usuario);

            // Verificar contraseña
            const isValidPassword = await user.comparePassword(contrasena);
            if (!isValidPassword) {
                console.log('❌ Contraseña incorrecta para usuario:', user.id_usuario);
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            console.log('✅ Contraseña válida');

            // Obtener el rol completo
            const rol = await rolService.getRolById(user.id_rol);
            console.log('✅ Rol obtenido:', rol?.nombre_rol);

            // Generar token JWT
            const tokenPayload = { 
                id_usuario: user.id_usuario, 
                id_rol: user.id_rol,
                nombre_rol: rol?.nombre_rol || 'cliente'
            };

            console.log('📦 Payload del token:', tokenPayload);

            const token = jwt.sign(
                tokenPayload,
                JWT_CONFIG.SECRET,
                { expiresIn: JWT_CONFIG.EXPIRES_IN }
            );

            console.log('✅ Token generado en login');

            const responseData = {
                id_usuario: user.id_usuario,
                nombre_usuario: user.nombre_usuario,
                correo_electronico: user.correo_electronico,
                id_rol: user.id_rol,
                nombre_rol: rol?.nombre_rol || 'cliente',
                permisos: rol?.permisos || {},
                token
            };

            res.json({
                success: true,
                data: responseData,
                message: 'Login exitoso'
            });
        } catch (error) {
            console.error('❌ Error en login:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Obtener perfil del usuario autenticado
    async getProfile(req, res) {
        try {
            const id_usuario = req.id_usuario;
            console.log('👤 Obteniendo perfil para usuario:', id_usuario);

            const user = await userService.getUserById(id_usuario);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Si no viene el rol incluido, obtenerlo
            const rol = user.rol ? user.rol : await rolService.getRolById(user.id_rol);

            // Obtener datos del cliente si existe
            let clienteData = null;
            if (user.id_rol === 2) { // Si es cliente
                clienteData = await clienteService.getClienteByUsuarioId(id_usuario);
            }

            const profileData = {
                id_usuario: user.id_usuario,
                nombre_usuario: user.nombre_usuario,
                correo_electronico: user.correo_electronico,
                rol: rol,
                cliente: clienteData,
                fecha_creacion: user.fecha_creacion
            };

            res.json({
                success: true,
                data: profileData
            });
        } catch (error) {
            console.error('❌ Error en getProfile:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Actualizar perfil del usuario autenticado
    async updateProfile(req, res) {
        try {
            const id_usuario = req.id_usuario;
            const updates = req.body;

            console.log('✏️ Actualizando perfil para usuario:', id_usuario, updates);

            // No permitir cambiar rol o correo_electronico desde aquí
            delete updates.id_rol;
            delete updates.correo_electronico;

            const updatedUser = await userService.updateUser(id_usuario, updates);

            // Si se actualizan datos de cliente
            if (updates.nombre || updates.apellido || updates.telefono) {
                const cliente = await clienteService.getClienteByUsuarioId(id_usuario);
                if (cliente) {
                    await clienteService.updateCliente(cliente.id_cliente, {
                        nombre: updates.nombre,
                        apellido: updates.apellido,
                        telefono: updates.telefono
                    });
                }
            }

            const responseData = {
                id_usuario: updatedUser.id_usuario,
                nombre_usuario: updatedUser.nombre_usuario,
                correo_electronico: updatedUser.correo_electronico
            };

            res.json({
                success: true,
                data: responseData,
                message: 'Perfil actualizado exitosamente'
            });
        } catch (error) {
            console.error('❌ Error en updateProfile:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    // Cambiar contraseña
    async changePassword(req, res) {
        try {
            const id_usuario = req.id_usuario;
            const { contrasena_actual, contrasena_nueva } = req.body;

            console.log('🔑 Cambiando contraseña para usuario:', id_usuario);

            if (!contrasena_actual || !contrasena_nueva) {
                return res.status(400).json({
                    success: false,
                    message: 'Contraseña actual y nueva contraseña son requeridas'
                });
            }

            // Verificar contraseña actual
            const user = await userService.getUserById(id_usuario);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const isValidPassword = await user.comparePassword(contrasena_actual);

            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Contraseña actual incorrecta'
                });
            }

            // Actualizar contraseña
            await userService.updateUser(id_usuario, { contrasena: contrasena_nueva });

            console.log('✅ Contraseña actualizada exitosamente');

            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });
        } catch (error) {
            console.error('❌ Error en changePassword:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Verificar token (endpoint para validar token)
    async verifyToken(req, res) {
        try {
            const id_usuario = req.id_usuario;
            console.log('✅ Token válido para usuario:', id_usuario);

            const user = await userService.getUserById(id_usuario);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const rol = await rolService.getRolById(user.id_rol);

            res.json({
                success: true,
                data: {
                    id_usuario: user.id_usuario,
                    nombre_usuario: user.nombre_usuario,
                    correo_electronico: user.correo_electronico,
                    id_rol: user.id_rol,
                    nombre_rol: rol?.nombre_rol || 'cliente',
                    permisos: rol?.permisos || {}
                },
                message: 'Token válido'
            });
        } catch (error) {
            console.error('❌ Error en verifyToken:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Refresh token (opcional)
    async refreshToken(req, res) {
        try {
            const id_usuario = req.id_usuario;
            console.log('🔄 Refrescando token para usuario:', id_usuario);

            const user = await userService.getUserById(id_usuario);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const rol = await rolService.getRolById(user.id_rol);

            // Generar nuevo token
            const tokenPayload = { 
                id_usuario: user.id_usuario, 
                id_rol: user.id_rol,
                nombre_rol: rol?.nombre_rol || 'cliente'
            };

            const newToken = jwt.sign(
                tokenPayload,
                JWT_CONFIG.SECRET,
                { expiresIn: JWT_CONFIG.EXPIRES_IN }
            );

            console.log('✅ Nuevo token generado');

            res.json({
                success: true,
                data: {
                    token: newToken,
                    id_usuario: user.id_usuario,
                    nombre_usuario: user.nombre_usuario,
                    nombre_rol: rol?.nombre_rol || 'cliente'
                },
                message: 'Token refrescado exitosamente'
            });
        } catch (error) {
            console.error('❌ Error en refreshToken:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

export default authController;