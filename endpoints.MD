# Endpoints - API REST (Listado por tabla/recurso)

Este archivo lista los endpoints principales que el frontend necesita consumir. Incluye método HTTP, ruta, si requiere autenticación y ejemplos breves de request/response.

NOTA: Incluir el header `Authorization: Bearer {token}` en las rutas marcadas como "(requiere auth)".

---

## 1) Usuarios / Auth
Base: /api/auth

- POST /register  (Registro)
	- Body: { nombre_usuario, correo_electronico, contrasena, nombre_rol? }
	- Response 201: { success, message, data: { id_usuario, nombre_usuario, correo_electronico, id_rol, nombre_rol, token } }

- POST /login  (Login)
	- Body: { correo_electronico, contrasena }
	- Response 200: { success, message, data: { id_usuario, nombre_usuario, correo_electronico, id_rol, nombre_rol, permisos, token } }

- GET /profile  (Obtener perfil) (requiere auth)
	- Response 200: { success, data: { id_usuario, nombre_usuario, correo_electronico, rol: { id_rol, nombre_rol, descripcion, permisos }, fecha_creacion } }

- PUT /profile  (Actualizar perfil) (requiere auth)
	- Body: { nombre_usuario, ... } (no permitir cambiar correo_electronico ni rol)
	- Response 200: { success, message, data: { id_usuario, nombre_usuario, correo_electronico } }

- PUT /change-password  (Cambiar contraseña) (requiere auth)
	- Body: { contrasena_actual, contrasena_nueva }
	- Response 204: No Content

---

## 2) Roles
Base: /api/roles

- GET /  (Listar roles) (público)
	- Response 200: { success, data: [ { id_rol, nombre_rol, descripcion, permisos } ] }

- GET /:id  (Obtener rol por id) (público)
	- Response 200: { success, data: { id_rol, nombre_rol, descripcion, permisos } }

- POST /  (Crear rol) (admin)
	- Body: { nombre_rol, descripcion, permisos }
	- Response 201: { success, data: { ...rol } }

- PUT /:id  (Actualizar rol) (admin)
	- Body: { nombre_rol?, descripcion?, permisos? }
	- Response 200: { success, data: { ...rolActualizado } }

- DELETE /:id  (Eliminar rol) (admin)
	- Response 204: No Content

---

## 3) Clientes
Base: /api/clientes

- GET /perfil  (Obtener mi perfil de cliente) (requiere auth)
	- Response 200: { success, data: { id_cliente, id_usuario, nombre, apellido, telefono, fecha_registro } }

- POST /  (Crear perfil cliente) (requiere auth)
	- Body: { nombre, apellido, telefono }
	- Response 201: { success, data: { ... } }

- PUT /:id  (Actualizar perfil cliente) (requiere auth)
	- Body: { nombre?, apellido?, telefono? }
	- Response 200: { success, data: { ... } }

- GET /:id  (Obtener cliente por id) (admin)
	- Response 200: { success, data: { ... } }

- DELETE /:id  (Eliminar cliente) (admin)
	- Response 204: No Content

---

## 4) Direcciones
Base: /api/direcciones

- GET /  (Listar mis direcciones) (requiere auth)
	- Response 200: { success, data: [ { id_direccion, calle, ciudad, codigo_postal, pais, es_principal } ] }

- GET /:id  (Obtener dirección por id) (requiere auth)
	- Response 200: { success, data: { ... } }

- POST /  (Crear dirección) (requiere auth)
	- Body: { calle, ciudad, codigo_postal, pais, telefono?, es_principal? }
	- Response 201: { success, data: { ... } }

- PUT /:id  (Actualizar dirección) (requiere auth)
	- Body: { calle?, ciudad?, codigo_postal?, pais?, es_principal? }
	- Response 200: { success, data: { ... } }

- DELETE /:id  (Eliminar dirección) (requiere auth)
	- Response 204: No Content

---

## 5) Categorías de producto
Base: /api/categorias

- GET /  (Listar categorías) (público)
	- Response 200: { success, data: [ { id_categoria, nombre_categoria, descripcion } ] }

- POST /  (Crear categoría) (admin)
	- Body: { nombre_categoria, descripcion }
	- Response 201: { success, data: { ... } }

- PUT /:id  (Actualizar categoría) (admin)
	- Response 200: { success, data: { ... } }

- DELETE /:id  (Eliminar categoría) (admin)
	- Response 204: No Content

---

## 6) Productos
Base: /api/productos

- GET /  (Listar productos) (público)
	- Query params opcionales: ?categoria={id_categoria}&?minprecio=&?maxprecio=&?q=
	- Response 200: { success, data: [ { id_producto, nombre_producto, descripcion, precio, stock, categoria: { id_categoria, nombre_categoria }, imagenes: [ { id_imagen, url_imagen, es_principal } ] } ] }

- GET /:id  (Obtener producto por id) (público)
	- Response 200: { success, data: { id_producto, nombre_producto, descripcion, precio, stock, categoria: { id_categoria, nombre_categoria, descripcion }, imagenes: [ { id_imagen, url_imagen, es_principal } ] } }

- POST /  (Crear producto) (admin)
	- Body: { nombre_producto, descripcion, precio, stock, id_categoria }
	- Response 201: { success, data: { id_producto, nombre_producto, precio, stock, id_categoria } }

- PUT /:id  (Actualizar producto) (admin)
	- Response 200: { success, data: { id_producto, nombre_producto, descripcion, precio, stock, id_categoria } }

- DELETE /:id  (Eliminar producto) (admin)
	- Response 204: No Content

- GET /:id_producto/imagenes  (Listar imágenes de producto)
	- Response 200: { success, data: [ { id_imagen, url_imagen, es_principal } ] }

- POST /:id_producto/imagenes  (Agregar imagen) (admin)
	- Body (multipart/form-data): file
	- Response 201: { success, data: { id_imagen, id_producto, url_imagen, es_principal } }

- DELETE /:id_producto/imagenes/:id  (Eliminar imagen) (admin)
	- Response 204: No Content

---

## 7) Imágenes de producto (recurso separado)
Base: /api/imagenes-producto

- (En muchos casos se usa el sub-endpoint en productos, arriba). Si existe ruta dedicada:
- GET /:id
- POST /  (upload)
- DELETE /:id

---

## 8) Carrito de compras
Base: /api/carrito

- GET /  (Obtener mi carrito) (requiere auth)
	- Response 200: { success, data: { id_carrito, id_cliente, estado, productosCarrito: [ { id_carrito_producto, cantidad, precio_unitario, producto: { id_producto, nombre_producto, precio, categoria, imagenes } } ], total_carrito } }

- POST /  (Agregar producto al carrito) (requiere auth)
	- Body: { id_producto, cantidad }
	- Response 201: { success, data: { ...carrito_actualizado } }

- PUT /:id_producto  (Actualizar cantidad) (requiere auth)
	- Body: { cantidad }
	- Response 200: { success, data: { ... } }

- DELETE /:id_producto  (Eliminar producto del carrito) (requiere auth)
	- Response 204: No Content

- DELETE /clear  (Vaciar carrito) (requiere auth)
	- Response 204: No Content

---

## 9) CarritoProductos (si se expone como recurso separado)
Base: /api/carrito-productos

- GET /:id  (Obtener item del carrito)
- POST /  (Crear item)  (recomendado usar /api/carrito)
- PUT /:id  (Actualizar item)
- DELETE /:id  (Eliminar item)

---

## 10) Órdenes
Base: /api/ordenes

- POST /  (Crear orden desde carrito) (requiere auth)
	- Body: { id_direccion, notas_orden? }
	- Response 201: { success, data: { id_orden, numero_orden, id_cliente, estado_orden: 'pendiente', total_orden, fecha_creacion } }

- GET /  (Listar mis órdenes) (requiere auth)
	- Response 200: { success, data: [ { id_orden, numero_orden, estado_orden, total_orden, fecha_creacion } ] }

- GET /:id  (Obtener detalles de orden) (requiere auth)
	- Response 200: { success, data: { id_orden, numero_orden, cliente: { id_cliente, usuario: { nombre_usuario, correo_electronico } }, direccionEnvio: { calle, ciudad, codigo_postal, pais }, items: [ { id_item, id_producto, cantidad, precio_unitario, producto: { nombre_producto, precio } } ], pagos: [ { id_pago, monto, metodo_pago, estado_pago } ], total_orden, estado_orden } }

- PUT /:id/status  (Actualizar estado de orden) (admin)
	- Body: { estado: 'pendiente'|'confirmada'|'enviada'|'completada'|'cancelada' }
	- Response 200: { success, data: { id_orden, estado_orden, fecha_actualizacion } }

---

## 11) OrdenItems (items de la orden)
Base: /api/ordenes/:id_orden/items

- GET /  (Listar items de la orden) (requiere auth)
- POST /  (Agregar item manualmente — rara vez usado)
- PUT /:id  (Actualizar item)
- DELETE /:id  (Eliminar item)

---

## 12) Pagos
Base: /api/ordenes/:id_orden/pagos

- POST /  (Crear pago para orden) (requiere auth)
	- Body: { monto, metodo_pago: 'tarjeta_credito'|'transferencia'|'efectivo', referencia_pago }
	- Response 201: { success, data: { id_pago, id_orden, monto, metodo_pago, estado_pago: 'completado'|'pendiente', fecha_creacion } }

- GET /  (Listar pagos de una orden) (requiere auth)
	- Response 200: { success, data: [ { id_pago, monto, metodo_pago, estado_pago, fecha_creacion } ] }

- GET /:id  (Detalle pago) (requiere auth)
	- Response 200: { success, data: { id_pago, id_orden, monto, metodo_pago, estado_pago, fecha_creacion } }

- PUT /:id/status  (Actualizar estado de pago) (admin)
	- Body: { estado_pago: 'completado'|'pendiente'|'cancelado'|'reembolsado' }
	- Response 200: { success, data: { id_pago, estado_pago, fecha_actualizacion } }

---

## Errores estándar (formato de respuesta)
```
{ "success": false, "error": { "code": "VALIDATION_ERROR"|"NOT_FOUND"|"UNAUTHORIZED"|"FORBIDDEN"|"INTERNAL_ERROR", "message": "Descripción", "statusCode": 400|401|403|404|500 } }
```

---

Si quieres, puedo:
- Filtrar y dejar exactamente 10 tablas si quieres limitar la lista.
- Generar un archivo Postman/Insomnia con todos estos endpoints ya cargados.
- Añadir ejemplos concretos de request/response para cada endpoint (más verboso).


