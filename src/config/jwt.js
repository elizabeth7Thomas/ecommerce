// En /src/config/jwt.js
const JWT_CONFIG = {
    SECRET: process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura_aqui_123456789',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h'
};

export default JWT_CONFIG;