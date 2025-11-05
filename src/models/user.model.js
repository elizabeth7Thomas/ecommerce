import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const Usuario = sequelize.define('Usuario', {
    id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre_usuario: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    correo_electronico: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    contrasena: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    id_rol: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2 // 2 = cliente (por defecto)
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
}, {
    tableName: 'Usuarios',
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    hooks: {
        beforeCreate: async (usuario) => {
            if (usuario.contrasena) {
                const salt = await bcrypt.genSalt(10);
                usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
            }
        },
        beforeUpdate: async (usuario) => {
            if (usuario.changed('contrasena')) {
                const salt = await bcrypt.genSalt(10);
                usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
            }
        },
    },
});

Usuario.prototype.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.contrasena);
};

export default Usuario;
