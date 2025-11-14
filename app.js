// app.js
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import apiRoutes from './src/routes/index.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Config
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'E-commerce API',
            version: '1.0.0',
            description: 'API REST completa para la gestión de un sistema de E-commerce. Incluye autenticación JWT, gestión de productos, carrito de compras, órdenes y pagos.',
            contact: {
                name: 'Equipo de Desarrollo',
                email: 'soporte@ecommerce.com'
            }
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Servidor de Desarrollo'
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Ingresa el token JWT obtenido al iniciar sesión (sin el prefijo "Bearer")'
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


// Rutas Principales
app.get('/', (req, res) => {
    res.send('API E-commerce funcionando!');
});

app.use('/api', apiRoutes);


export default app;