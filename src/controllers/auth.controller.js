import userService from '../services/user.service.js';
import rolService from '../services/rol.service.js';
import jwt from 'jsonwebtoken';

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

            res.status(201).json({
                message: 'Usuario registrado exitosamente',
                user: {
                    id_usuario: newUser.id_usuario,
                    nombre_usuario: newUser.nombre_usuario,
                    correo_electronico: newUser.correo_electronico,
                    id_rol: newUser.id_rol,
                    nombre_rol: rol?.nombre_rol || 'cliente'
                },
                token
            });
        } catch (error) {
            console.error('Error en register:', error);
            res.status(400).json({ 
                error: error.message || 'Error al registrar usuario'
            });
        }
    },

    // Login de usuario
    async login(req, res) {
        try {
            const { correo_electronico, contrasena } = req.body;

            if (!correo_electronico || !contrasena) {
                return res.status(400).json({ 
                    error: 'Correo electrónico y contraseña son requeridos' 
                });
            }

            // Buscar usuario por email
            const user = await userService.getUserByEmail(correo_electronico);
            if (!user) {
                return res.status(401).json({ 
                    error: 'Credenciales inválidas' 
                });
            }

            // Verificar contraseña
            const isValidPassword = await user.comparePassword(contrasena);
            if (!isValidPassword) {
                return res.status(401).json({ 
                    error: 'Credenciales inválidas' 
                });
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

            res.json({
                message: 'Login exitoso',
                user: {
                    id_usuario: user.id_usuario,
                    nombre_usuario: user.nombre_usuario,
                    correo_electronico: user.correo_electronico,
                    id_rol: user.id_rol,
                    nombre_rol: rol?.nombre_rol || 'cliente',
                    permisos: rol?.permisos || {}
                },
                token
            });
        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ 
                error: 'Error al iniciar sesión'
            });
        }
    },

    // Obtener perfil del usuario autenticado
    async getProfile(req, res) {
        try {
            const id_usuario = req.id_usuario; // Viene del middleware verifyToken
            const user = await userService.getUserById(id_usuario);

            if (!user) {
                return res.status(404).json({ 
                    error: 'Usuario no encontrado' 
                });
            }

            res.json({
                id_usuario: user.id_usuario,
                nombre_usuario: user.nombre_usuario,
                correo_electronico: user.correo_electronico,
                rol: user.rol,
                fecha_creacion: user.fecha_creacion
            });
        } catch (error) {
            console.error('Error en getProfile:', error);
            res.status(500).json({ 
                error: 'Error al obtener perfil'
            });
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

            res.json({
                message: 'Perfil actualizado exitosamente',
                user: {
                    id_usuario: updatedUser.id_usuario,
                    nombre_usuario: updatedUser.nombre_usuario,
                    correo_electronico: updatedUser.correo_electronico
                }
            });
        } catch (error) {
            console.error('Error en updateProfile:', error);
            res.status(400).json({ 
                error: error.message || 'Error al actualizar perfil'
            });
        }
    },

    // Cambiar contraseña
    async changePassword(req, res) {
        try {
            const id_usuario = req.id_usuario;
            const { contrasena_actual, contrasena_nueva } = req.body;

            if (!contrasena_actual || !contrasena_nueva) {
                return res.status(400).json({ 
                    error: 'Contraseña actual y nueva contraseña son requeridas' 
                });
            }

            // Verificar contraseña actual
            const user = await userService.getUserById(id_usuario);
            const isValidPassword = await user.comparePassword(contrasena_actual);

            if (!isValidPassword) {
                return res.status(401).json({ 
                    error: 'Contraseña actual incorrecta' 
                });
            }

            // Actualizar contraseña
            await userService.updateUser(id_usuario, { contrasena: contrasena_nueva });

            res.json({
                message: 'Contraseña actualizada exitosamente'
            });
        } catch (error) {
            console.error('Error en changePassword:', error);
            res.status(500).json({ 
                error: 'Error al cambiar contraseña'
            });
        }
    }
};

export default authController;
