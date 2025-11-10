# Documentación Swagger - API E-commerce

## 📋 Índice de Endpoints

### 🔐 Autenticación
- **POST** `/api/auth/register` - Registro de nuevo usuario
- **POST** `/api/auth/login` - Iniciar sesión

### 👥 Usuarios
- **GET** `/api/usuario` - Obtener todos los usuarios
- **GET** `/api/usuario/:id` - Obtener usuario por ID
- **POST** `/api/usuario` - Crear usuario
- **PUT** `/api/usuario/:id` - Actualizar usuario
- **DELETE** `/api/usuario/:id` - Eliminar usuario

### 👤 Clientes
- **GET** `/api/cliente` - Obtener todos los clientes
- **GET** `/api/cliente/:id` - Obtener cliente por ID
- **POST** `/api/cliente` - Crear cliente
- **PUT** `/api/cliente/:id` - Actualizar cliente
- **DELETE** `/api/cliente/:id` - Eliminar cliente

### 📦 Productos
- **GET** `/api/product` - Obtener todos los productos
- **GET** `/api/product/:id` - Obtener producto por ID
- **POST** `/api/product` - Crear producto
- **PUT** `/api/product/:id` - Actualizar producto
- **DELETE** `/api/product/:id` - Eliminar producto

### 🏪 Categorías
- **GET** `/api/categoria` - Obtener todas las categorías
- **GET** `/api/categoria/:id` - Obtener categoría por ID
- **POST** `/api/categoria` - Crear categoría
- **PUT** `/api/categoria/:id` - Actualizar categoría
- **DELETE** `/api/categoria/:id` - Eliminar categoría

### 🛒 Carrito de Compras
- **GET** `/api/carrito/:id_usuario` - Obtener carrito del usuario
- **POST** `/api/carrito` - Crear carrito
- **POST** `/api/carrito/:id/producto` - Agregar producto al carrito
- **PUT** `/api/carrito/:id/producto/:id_producto` - Actualizar cantidad de producto
- **DELETE** `/api/carrito/:id/producto/:id_producto` - Eliminar producto del carrito
- **DELETE** `/api/carrito/:id` - Vaciar carrito

### 📮 Órdenes
- **GET** `/api/orden` - Obtener todas las órdenes
- **GET** `/api/orden/:id` - Obtener orden por ID
- **GET** `/api/orden/usuario/:id_usuario` - Obtener órdenes del usuario
- **POST** `/api/orden` - Crear orden
- **PUT** `/api/orden/:id` - Actualizar orden
- **PUT** `/api/orden/:id/estado` - Cambiar estado de la orden
- **DELETE** `/api/orden/:id` - Cancelar orden

### 💳 Pagos
- **GET** `/api/payment` - Obtener todos los pagos
- **GET** `/api/payment/:id` - Obtener pago por ID
- **POST** `/api/payment` - Crear pago
- **PUT** `/api/payment/:id` - Actualizar pago
- **DELETE** `/api/payment/:id` - Eliminar pago

### 📍 Direcciones
- **GET** `/api/direccion` - Obtener todas las direcciones
- **GET** `/api/direccion/:id` - Obtener dirección por ID
- **POST** `/api/direccion` - Crear dirección
- **PUT** `/api/direccion/:id` - Actualizar dirección
- **DELETE** `/api/direccion/:id` - Eliminar dirección

### 🏭 Almacenes (NUEVO)
- **GET** `/api/almacenes` - Obtener todos los almacenes
- **GET** `/api/almacenes/:id` - Obtener almacén por ID
- **POST** `/api/almacenes` - Crear almacén (Admin)
- **PUT** `/api/almacenes/:id` - Actualizar almacén (Admin)
- **DELETE** `/api/almacenes/:id` - Eliminar almacén (Admin)

### 📊 Inventario (NUEVO)
- **GET** `/api/inventario` - Obtener todos los registros
- **GET** `/api/inventario/:id` - Obtener inventario por ID
- **GET** `/api/inventario/stock-bajo` - Obtener productos con stock bajo
- **GET** `/api/inventario/producto/:id_producto/almacen/:id_almacen` - Obtener por producto y almacén
- **POST** `/api/inventario` - Crear registro de inventario
- **PUT** `/api/inventario/:id` - Actualizar inventario
- **PATCH** `/api/inventario/:id/ajustar` - Ajustar cantidad (entrada/salida)
- **DELETE** `/api/inventario/:id` - Eliminar inventario

### 🔄 Movimientos de Inventario (NUEVO)
- **GET** `/api/movimientos-inventario` - Obtener todos los movimientos
- **GET** `/api/movimientos-inventario/:id` - Obtener movimiento por ID
- **POST** `/api/movimientos-inventario` - Registrar movimiento
- **PUT** `/api/movimientos-inventario/:id` - Actualizar movimiento
- **DELETE** `/api/movimientos-inventario/:id` - Eliminar movimiento

### 🏢 Proveedores (NUEVO)
- **GET** `/api/proveedores` - Obtener todos los proveedores
- **GET** `/api/proveedores/:id` - Obtener proveedor por ID
- **POST** `/api/proveedores` - Crear proveedor
- **PUT** `/api/proveedores/:id` - Actualizar proveedor
- **DELETE** `/api/proveedores/:id` - Eliminar proveedor

### 📋 Órdenes de Compra (NUEVO)
- **GET** `/api/ordenes-compra` - Obtener todas las órdenes
- **GET** `/api/ordenes-compra/:id` - Obtener orden por ID
- **GET** `/api/ordenes-compra/proveedor/:id_proveedor` - Obtener por proveedor
- **GET** `/api/ordenes-compra/estado/:estado` - Obtener por estado
- **POST** `/api/ordenes-compra` - Crear orden de compra
- **PUT** `/api/ordenes-compra/:id` - Actualizar orden
- **PUT** `/api/ordenes-compra/:id/estado` - Cambiar estado
- **PUT** `/api/ordenes-compra/:id/entrega` - Registrar entrega
- **DELETE** `/api/ordenes-compra/:id` - Eliminar orden

### 📝 Detalles de Órdenes de Compra (NUEVO)
- **GET** `/api/ordenes-compra-detalle` - Obtener todos
- **GET** `/api/ordenes-compra-detalle/:id` - Obtener por ID
- **GET** `/api/ordenes-compra-detalle/orden/:id_orden` - Obtener por orden
- **GET** `/api/ordenes-compra-detalle/producto/:id_producto` - Obtener por producto
- **POST** `/api/ordenes-compra-detalle` - Crear detalle
- **POST** `/api/ordenes-compra-detalle/orden/:id_orden` - Crear múltiples
- **PUT** `/api/ordenes-compra-detalle/:id` - Actualizar
- **PUT** `/api/ordenes-compra-detalle/:id/recibido` - Registrar recepción
- **DELETE** `/api/ordenes-compra-detalle/:id` - Eliminar

### ⚠️ Alertas de Inventario (NUEVO)
- **GET** `/api/alertas-inventario` - Obtener todas
- **GET** `/api/alertas-inventario/:id` - Obtener por ID
- **GET** `/api/alertas-inventario/inventario/:id_inventario` - Obtener por inventario
- **GET** `/api/alertas-inventario/tipo/:tipo` - Obtener por tipo
- **GET** `/api/alertas-inventario/estado/:estado` - Obtener por estado
- **POST** `/api/alertas-inventario` - Crear alerta
- **PUT** `/api/alertas-inventario/:id` - Actualizar
- **PUT** `/api/alertas-inventario/:id/resolver` - Marcar como resuelta
- **DELETE** `/api/alertas-inventario/:id` - Eliminar

### 💬 Interacciones CRM (NUEVO)
- **GET** `/api/interacciones` - Obtener todas
- **GET** `/api/interacciones/:id` - Obtener por ID
- **GET** `/api/interacciones/cliente/:id_cliente` - Obtener por cliente
- **GET** `/api/interacciones/usuario/:id_usuario` - Obtener por usuario
- **GET** `/api/interacciones/tipo/:tipo` - Obtener por tipo
- **POST** `/api/interacciones` - Crear interacción
- **PUT** `/api/interacciones/:id` - Actualizar
- **PUT** `/api/interacciones/:id/completar` - Marcar como completada
- **DELETE** `/api/interacciones/:id` - Eliminar

### 🎯 Oportunidades de Venta (NUEVO)
- **GET** `/api/oportunidades` - Obtener todas
- **GET** `/api/oportunidades/:id` - Obtener por ID
- **GET** `/api/oportunidades/cliente/:id_cliente` - Obtener por cliente
- **GET** `/api/oportunidades/usuario/:id_usuario` - Obtener por usuario
- **GET** `/api/oportunidades/estado/:estado` - Obtener por estado
- **GET** `/api/oportunidades/etapa/:etapa` - Obtener por etapa
- **POST** `/api/oportunidades` - Crear oportunidad
- **PUT** `/api/oportunidades/:id` - Actualizar
- **PUT** `/api/oportunidades/:id/estado` - Cambiar estado
- **PUT** `/api/oportunidades/:id/etapa` - Cambiar etapa
- **DELETE** `/api/oportunidades/:id` - Eliminar

### ✅ Tareas CRM (NUEVO)
- **GET** `/api/tareas` - Obtener todas
- **GET** `/api/tareas/:id` - Obtener por ID
- **GET** `/api/tareas/usuario/:id_usuario` - Obtener por usuario
- **GET** `/api/tareas/cliente/:id_cliente` - Obtener por cliente
- **GET** `/api/tareas/estado/:estado` - Obtener por estado
- **GET** `/api/tareas/prioridad/:prioridad` - Obtener por prioridad
- **POST** `/api/tareas` - Crear tarea
- **PUT** `/api/tareas/:id` - Actualizar
- **PUT** `/api/tareas/:id/estado` - Cambiar estado
- **PUT** `/api/tareas/:id/completar` - Marcar como completada
- **PUT** `/api/tareas/:id/asignar` - Reasignar tarea
- **DELETE** `/api/tareas/:id` - Eliminar

### 👥 Segmentos de Cliente (NUEVO)
- **GET** `/api/segmentos` - Obtener todos
- **GET** `/api/segmentos/:id` - Obtener por ID
- **GET** `/api/segmentos/cliente/:id_cliente` - Obtener segmentos de cliente
- **GET** `/api/segmentos/activos` - Obtener segmentos activos
- **POST** `/api/segmentos` - Crear segmento
- **POST** `/api/segmentos/:id/clientes` - Agregar clientes
- **PUT** `/api/segmentos/:id` - Actualizar
- **PUT** `/api/segmentos/:id/activar` - Activar
- **PUT** `/api/segmentos/:id/desactivar` - Desactivar
- **DELETE** `/api/segmentos/:id` - Eliminar
- **DELETE** `/api/segmentos/:id/clientes/:id_cliente` - Remover cliente

### 📢 Campañas de Marketing (NUEVO)
- **GET** `/api/campanas` - Obtener todas
- **GET** `/api/campanas/:id` - Obtener por ID
- **GET** `/api/campanas/estado/:estado` - Obtener por estado
- **GET** `/api/campanas/tipo/:tipo` - Obtener por tipo
- **GET** `/api/campanas/:id/resultados` - Obtener métricas
- **POST** `/api/campanas` - Crear campaña
- **PUT** `/api/campanas/:id` - Actualizar
- **PUT** `/api/campanas/:id/activar` - Activar
- **PUT** `/api/campanas/:id/pausar` - Pausar
- **PUT** `/api/campanas/:id/finalizar` - Finalizar
- **DELETE** `/api/campanas/:id` - Eliminar

---

## 🔒 Seguridad

### Autenticación
Todos los endpoints requieren un token JWT en el header `Authorization: Bearer {token}`

### Niveles de Acceso
- **Usuario Regular**: Puede acceder a información de su perfil y sus órdenes
- **Admin**: Acceso completo a todas las funcionalidades (crear/editar/eliminar usuarios, productos, categorías, etc.)

### Headers Requeridos
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## 📊 Respuestas Estándar

### Respuesta Exitosa (2xx)
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {...}
}
```

### Respuesta de Error (4xx, 5xx)
```json
{
  "success": false,
  "message": "Descripción del error",
  "data": null
}
```

---

## 🚀 Ejemplos de Uso

### Registro
```bash
POST /api/auth/register
Content-Type: application/json

{
  "nombre_usuario": "juan_perez",
  "correo_electronico": "juan@example.com",
  "contrasena": "SecurePassword123",
  "nombre": "Juan",
  "apellido": "Pérez",
  "id_rol": 2
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "nombre_usuario": "juan_perez",
  "contrasena": "SecurePassword123"
}
```

### Crear Producto
```bash
POST /api/product
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Laptop",
  "descripcion": "Laptop de alta performance",
  "precio": 1500.00,
  "id_categoria": 1,
  "stock": 50
}
```

### Crear Orden
```bash
POST /api/orden
Authorization: Bearer {token}
Content-Type: application/json

{
  "id_usuario": 1,
  "id_cliente": 1,
  "total": 1500.00,
  "estado": "pendiente"
}
```

### Registrar Movimiento de Inventario
```bash
POST /api/movimientos-inventario
Authorization: Bearer {token}
Content-Type: application/json

{
  "id_inventario": 1,
  "tipo_movimiento": "entrada",
  "cantidad": 100,
  "descripcion": "Compra a proveedor XYZ",
  "id_usuario": 1
}
```

---

## ⚙️ Configuración Swagger

El archivo `app.js` ya contiene la configuración de Swagger:

```javascript
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'E-commerce API',
            version: '1.0.0',
            description: 'API REST completa para E-commerce'
        },
        servers: [
            {
                url: `http://localhost:3000`,
                description: 'Servidor de Desarrollo'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
```

## 📍 Acceder a Swagger

Una vez que la aplicación esté corriendo:

```
http://localhost:3000/api/docs
```

---

## 📝 Notas de Desarrollo

### Rutas Implementadas
✅ Autenticación (Register, Login)
✅ Usuarios
✅ Clientes
✅ Productos y Categorías
✅ Carrito de Compras
✅ Órdenes
✅ Pagos
✅ Direcciones
✅ Almacenes (Nuevo)
✅ Inventario (Nuevo)
✅ Movimientos (Nuevo)
✅ Proveedores (Nuevo)
✅ CRM: Interacciones, Oportunidades, Tareas, Segmentos, Campañas

### Próximos Pasos
- [ ] Implementar lógica en controladores de inventario
- [ ] Crear servicios para validaciones complejas
- [ ] Agregar más ejemplos en Swagger
- [ ] Implementar filtros avanzados
- [ ] Agregar paginación en listados

---

**Última Actualización**: Noviembre 2025
**Versión API**: 1.0.0
