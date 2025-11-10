import userService from '../services/user.service.js';
import clienteService from '../services/cliente.service.js';
import rolService from '../services/rol.service.js';
import jwt from 'jsonwebtoken';
import * as response from '../utils/response.js';

const authController = {
    // Registro de nuevo usuario
    async register(req, res) {
        try {
            const userData = req.body;
            
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
            
            const newUser = await userService.createUser(userData);
            
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
                } catch (clienteError) {
                    // Si falla la creación del cliente, eliminar el usuario
                    console.error('Error al crear cliente, revertiendo usuario:', clienteError);
                    try {
                        await newUser.destroy();
                    } catch (destroyError) {
                        console.error('Error al eliminar usuario fallido:', destroyError);
                    }
                    throw new Error('Error al crear el perfil de cliente. Por favor intenta de nuevo.');
                }
            }
            
            // Obtener el rol completo
            const rol = await rolService.getRolById(newUser.id_rol);

            // Generar token JWT
            const token = jwt.sign(
                { 
                    id_usuario: newUser.id_usuario, 
                    id_rol: newUser.id_rol,
                    nombre_rol: rol?.nombre_rol || 'cliente'
                },
                process.env.JWT_SECRET || 'secretkey',
                { expiresIn: '24h' }
            );

            const responseData = {
                id_usuario: newUser.id_usuario,
                nombre_usuario: newUser.nombre_usuario,
                correo_electronico: newUser.correo_electronico,
                id_rol: newUser.id_rol,
                nombre_rol: rol?.nombre_rol || 'cliente',
                token,
                cliente: clienteData || null
            };

            res.status(201).json(response.created(responseData, 'Usuario y cliente creados exitosamente'));
        } catch (error) {
            console.error('Error en register:', error);
            const err = response.handleError(error);
            res.status(err.statusCode).json(err);
        }
    },

    // Login de usuario
    async login(req, res) {
        try {
            const { correo_electronico, contrasena } = req.body;

            if (!correo_electronico || !contrasena) {
                return res.status(400).json(response.badRequest('Correo electrónico y contraseña son requeridos'));
            }

            // Buscar usuario por email
            const user = await userService.getUserByEmail(correo_electronico);
            if (!user) {
                return res.status(401).json(response.unauthorized('Credenciales inválidas'));
            }

            // Verificar contraseña
            const isValidPassword = await user.comparePassword(contrasena);
            if (!isValidPassword) {
                return res.status(401).json(response.unauthorized('Credenciales inválidas'));
            }

            // Obtener el rol completo
            const rol = await rolService.getRolById(user.id_rol);

            // Generar token JWT
            const token = jwt.sign(
                { 
                    id_usuario: user.id_usuario, 
                    id_rol: user.id_rol,
                    nombre_rol: rol?.nombre_rol || 'cliente'
                },
                process.env.JWT_SECRET || 'secretkey',
                { expiresIn: '24h' }
            );

            const responseData = {
                id_usuario: user.id_usuario,
                nombre_usuario: user.nombre_usuario,
                correo_electronico: user.correo_electronico,
                id_rol: user.id_rol,
                nombre_rol: rol?.nombre_rol || 'cliente',
                permisos: rol?.permisos || {},
                token
            };

            res.json(response.success(responseData, 'Login exitoso'));
        } catch (error) {
            console.error('Error en login:', error);
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    },

    // Obtener perfil del usuario autenticado
    async getProfile(req, res) {
        try {
            const id_usuario = req.id_usuario; // Viene del middleware verifyToken
            const user = await userService.getUserById(id_usuario);

            if (!user) {
                return res.status(404).json(response.notFound('Usuario no encontrado'));
            }

            // Si no viene el rol incluido, obtenerlo
            const rol = user.rol ? user.rol : await rolService.getRolById(user.id_rol);

            const profileData = {
                id_usuario: user.id_usuario,
                nombre_usuario: user.nombre_usuario,
                correo_electronico: user.correo_electronico,
                rol: rol,
                fecha_creacion: user.fecha_creacion
            };

            res.json(response.success(profileData));
        } catch (error) {
            console.error('Error en getProfile:', error);
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    },

    // Actualizar perfil del usuario autenticado
    async updateProfile(req, res) {
        try {
            const id_usuario = req.id_usuario;
            const updates = req.body;

            // No permitir cambiar rol o correo_electronico desde aquí
            delete updates.rol;
            delete updates.correo_electronico;

            const updatedUser = await userService.updateUser(id_usuario, updates);

            const responseData = {
                id_usuario: updatedUser.id_usuario,
                nombre_usuario: updatedUser.nombre_usuario,
                correo_electronico: updatedUser.correo_electronico
            };

            res.json(response.success(responseData, 'Perfil actualizado exitosamente'));
        } catch (error) {
            console.error('Error en updateProfile:', error);
            const err = response.handleError(error);
            res.status(err.statusCode || 400).json(err);
        }
    },

    // Cambiar contraseña
    async changePassword(req, res) {
        try {
            const id_usuario = req.id_usuario;
            const { contrasena_actual, contrasena_nueva } = req.body;

            if (!contrasena_actual || !contrasena_nueva) {
                return res.status(400).json(response.badRequest('Contraseña actual y nueva contraseña son requeridas'));
            }

            // Verificar contraseña actual
            const user = await userService.getUserById(id_usuario);
            if (!user) {
                return res.status(404).json(response.notFound('Usuario no encontrado'));
            }

            const isValidPassword = await user.comparePassword(contrasena_actual);

            if (!isValidPassword) {
                return res.status(401).json(response.unauthorized('Contraseña actual incorrecta'));
            }

            // Actualizar contraseña
            await userService.updateUser(id_usuario, { contrasena: contrasena_nueva });

            res.json(response.noContent('Contraseña actualizada exitosamente'));
        } catch (error) {
            console.error('Error en changePassword:', error);
            const err = response.handleError(error);
            res.status(err.statusCode || 500).json(err);
        }
    }
};

export default authController;
