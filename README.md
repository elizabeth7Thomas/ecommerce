# E-commerce API

API REST completa para la gestión de un sistema de E-commerce con autenticación JWT, carrito de compras, órdenes y pagos.

## 🚀 Características

- ✅ Autenticación con JWT
- ✅ Gestión de usuarios y perfiles
- ✅ Catálogo de productos con categorías
- ✅ Gestión de imágenes de productos
- ✅ Carrito de compras
- ✅ Órdenes de compra con control de stock
- ✅ Sistema de pagos
- ✅ Direcciones de envío
- ✅ Roles de usuario (Cliente/Administrador)
- ✅ Documentación Swagger completa

## 📋 Requisitos Previos

- Node.js >= 14.x
- PostgreSQL >= 12.x
- npm o yarn

## 🔧 Instalación

1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd ecommerce
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
Crear un archivo `.env` en la raíz del proyecto:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce_db
DB_USER=tu_usuario
DB_PASSWORD=tu_password
JWT_SECRET=tu_secreto_jwt_super_seguro
```

4. Crear la base de datos
```bash
# Ejecutar el script SQL
psql -U tu_usuario -d postgres -f src/script/ecommerce.sql
psql -U tu_usuario -d postgres -f src/script/CRM.sql
psql -U tu_usuario -d postgres -f src/script/metodo_pago.sql
psql -U tu_usuario -d postgres -f src/script/ordenes.sql
psql -U tu_usuario -d postgres -f src/script/create-categoria-producto.sql
npm run setup:roles
```

5. Iniciar el servidor
```bash
npm run dev
```

## 📚 Documentación API

Una vez iniciado el servidor, accede a la documentación interactiva de Swagger:

```
http://localhost:3000/api-docs
```

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para autenticación. Para acceder a rutas protegidas:

1. Registra un usuario en `/api/auth/register` o inicia sesión en `/api/auth/login`
2. Obtén el token JWT de la respuesta
3. Incluye el token en el header `Authorization` de tus peticiones:
```
Authorization: Bearer tu_token_jwt
```

## 🛣️ Endpoints Principales

### Autenticación (`/api/auth`)
- `POST /register` - Registrar nuevo usuario
- `POST /login` - Iniciar sesión
- `GET /profile` - Obtener perfil (requiere auth)
- `PUT /profile` - Actualizar perfil (requiere auth)
- `PUT /change-password` - Cambiar contraseña (requiere auth)

### Productos (`/api/productos`)
- `GET /` - Listar productos
- `GET /:id` - Obtener producto por ID
- `POST /` - Crear producto (admin)
- `PUT /:id` - Actualizar producto (admin)
- `DELETE /:id` - Eliminar producto (admin)
- `GET /:id_producto/imagenes` - Listar imágenes del producto
- `POST /:id_producto/imagenes` - Agregar imagen (admin)
- `DELETE /:id_producto/imagenes/:id` - Eliminar imagen (admin)
- `PUT /:id_producto/imagenes/:id/principal` - Establecer imagen principal (admin)

### Categorías (`/api/categorias`)
- `GET /` - Listar categorías
- `POST /` - Crear categoría (admin)
- `PUT /:id` - Actualizar categoría (admin)
- `DELETE /:id` - Eliminar categoría (admin)

### Carrito (`/api/carrito`)
- `GET /` - Obtener mi carrito (requiere auth)
- `POST /` - Agregar producto al carrito (requiere auth)
- `DELETE /:id_producto` - Eliminar producto del carrito (requiere auth)
- `DELETE /clear` - Vaciar carrito (requiere auth)

### Órdenes (`/api/ordenes`)
- `GET /` - Listar mis órdenes (requiere auth)
- `GET /:id` - Obtener orden por ID (requiere auth)
- `POST /` - Crear orden desde carrito (requiere auth)
- `PUT /:id/status` - Actualizar estado de orden (admin)
- `GET /:id_orden/pagos` - Listar pagos de una orden (requiere auth)
- `POST /:id_orden/pagos` - Crear pago (requiere auth)
- `GET /:id_orden/pagos/:id` - Obtener detalle de pago (requiere auth)
- `PUT /:id_orden/pagos/:id/status` - Actualizar estado de pago (admin)

### Clientes (`/api/clientes`)
- `GET /perfil` - Obtener mi perfil de cliente (requiere auth)
- `POST /` - Crear perfil de cliente (requiere auth)
- `PUT /:id` - Actualizar perfil de cliente (requiere auth)
- `GET /:id` - Obtener cliente por ID (admin)
- `DELETE /:id` - Eliminar cliente (admin)

### Direcciones (`/api/direcciones`)
- `GET /` - Listar mis direcciones (requiere auth)
- `GET /:id` - Obtener dirección por ID (requiere auth)
- `POST /` - Crear dirección (requiere auth)
- `PUT /:id` - Actualizar dirección (requiere auth)
- `DELETE /:id` - Eliminar dirección (requiere auth)

## 🏗️ Arquitectura

El proyecto sigue una arquitectura en capas:

```
src/
├── config/          # Configuración (DB, servidor)
├── models/          # Modelos de Sequelize
├── services/        # Lógica de negocio
├── controllers/     # Controladores de rutas
├── routes/          # Definición de rutas y Swagger
├── middlewares/     # Middlewares (auth, validación)
├── utils/           # Utilidades
└── script/          # Scripts SQL
```

### Flujo de una petición:
```
Request → Route → Middleware → Controller → Service → Model → Database
                                                              ↓
Response ← Route ← Controller ← Service ← Model ← Database
```

## 📦 Modelos de Datos

- **Usuario**: Autenticación y roles
- **Cliente**: Perfil del cliente vinculado al usuario
- **Dirección**: Direcciones de envío del cliente
- **Categoría**: Categorías de productos
- **Producto**: Productos del catálogo
- **ProductoImagen**: Imágenes de productos
- **CarritoCompras**: Carrito del usuario
- **CarritoProducto**: Productos en el carrito
- **Orden**: Órdenes de compra
- **OrdenItem**: Items de cada orden
- **Payment**: Pagos de órdenes

## 🔒 Roles y Permisos

### Cliente
- Ver productos y categorías
- Gestionar su carrito
- Crear y ver sus órdenes
- Gestionar su perfil y direcciones
- Realizar pagos

### Administrador
- Todas las acciones de cliente
- Gestionar productos y categorías
- Gestionar imágenes de productos
- Ver todas las órdenes
- Actualizar estados de órdenes y pagos
- Ver todos los clientes

## 🧪 Testing

```bash
npm test
```

## 📝 Notas Importantes

1. **Stock**: Al crear una orden, el stock se reduce automáticamente. Si la orden se cancela, el stock se restaura.
2. **Pagos**: No se permiten pagos duplicados para órdenes ya pagadas. El estado de la orden se sincroniza con el estado del pago.
3. **Carrito**: Cada usuario tiene un carrito activo. Al crear una orden, el carrito se marca como "convertido".
4. **Imágenes principales**: Solo una imagen puede ser principal por producto. Al establecer una nueva principal, la anterior se actualiza automáticamente.
5. **Soft Delete**: Las categorías y productos usan eliminación lógica (campo `activo`).

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Autores

Equipo de Desarrollo E-commerce

## 📧 Contacto

Para soporte o consultas: CHINGA_TU_MADRE@ecommerce.com
