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
---

## 13) Almacenes (Inventario)
Base: /api/almacenes

- GET /  (Listar almacenes) (admin)
	- Response 200: { success, data: [ { id_almacen, nombre_almacen, direccion, telefono, responsable, activo } ] }

- GET /:id  (Obtener almacén por id) (admin)
	- Response 200: { success, data: { id_almacen, nombre_almacen, direccion, telefono, responsable, activo } }

- POST /  (Crear almacén) (admin)
	- Body: { nombre_almacen, direccion, telefono, responsable }
	- Response 201: { success, data: { id_almacen, nombre_almacen, direccion, telefono, responsable } }

- PUT /:id  (Actualizar almacén) (admin)
	- Body: { nombre_almacen?, direccion?, telefono?, responsable?, activo? }
	- Response 200: { success, data: { ...almacénActualizado } }

- DELETE /:id  (Eliminar almacén) (admin)
	- Response 204: No Content

---

## 14) Inventario
Base: /api/inventario

- GET /  (Listar inventario) (admin)
	- Query params: ?id_almacen=&?id_producto=&?stock_bajo=true
	- Response 200: { success, data: [ { id_inventario, id_producto, id_almacen, cantidad_actual, cantidad_minima, cantidad_maxima, ubicacion_fisica, producto: { nombre_producto, precio }, almacen: { nombre_almacen } } ] }

- GET /:id  (Obtener item de inventario) (admin)
	- Response 200: { success, data: { id_inventario, id_producto, id_almacen, cantidad_actual, cantidad_minima, ubicacion_fisica } }

- POST /  (Crear item de inventario) (admin)
	- Body: { id_producto, id_almacen, cantidad_actual, cantidad_minima, cantidad_maxima, ubicacion_fisica }
	- Response 201: { success, data: { ...inventario } }

- PUT /:id  (Actualizar item de inventario) (admin)
	- Body: { cantidad_actual?, cantidad_minima?, cantidad_maxima?, ubicacion_fisica? }
	- Response 200: { success, data: { ...inventarioActualizado } }

- DELETE /:id  (Eliminar item de inventario) (admin)
	- Response 204: No Content

---

## 15) Movimientos de Inventario
Base: /api/movimientos-inventario

- GET /  (Listar movimientos) (admin)
	- Query params: ?id_inventario=&?tipo_movimiento=&?fecha_desde=&?fecha_hasta=
	- Response 200: { success, data: [ { id_movimiento, tipo_movimiento, cantidad, cantidad_anterior, cantidad_nueva, id_usuario, fecha_movimiento, motivo, referencia } ] }

- GET /:id  (Obtener movimiento por id) (admin)
	- Response 200: { success, data: { id_movimiento, tipo_movimiento, cantidad, cantidad_anterior, cantidad_nueva, id_usuario, fecha_movimiento, motivo } }

- POST /  (Registrar movimiento de inventario) (admin)
	- Body: { id_inventario, tipo_movimiento, cantidad, id_usuario, motivo, referencia? }
	- Response 201: { success, data: { id_movimiento, cantidad, tipo_movimiento } }

- GET /reporte  (Obtener reporte de movimientos) (admin)
	- Query params: ?fecha_desde=&?fecha_hasta=&?id_almacen=
	- Response 200: { success, data: { totalMovimientos, totalEntradas, totalSalidas, movimientos: [...] } }

---

## 16) Proveedores
Base: /api/proveedores

- GET /  (Listar proveedores) (admin)
	- Response 200: { success, data: [ { id_proveedor, nombre_proveedor, contacto, email, telefono, activo } ] }

- GET /:id  (Obtener proveedor por id) (admin)
	- Response 200: { success, data: { id_proveedor, nombre_proveedor, contacto, email, telefono, direccion, nit, activo } }

- POST /  (Crear proveedor) (admin)
	- Body: { nombre_proveedor, contacto, email, telefono, direccion, nit }
	- Response 201: { success, data: { id_proveedor, nombre_proveedor, contacto, email, telefono } }

- PUT /:id  (Actualizar proveedor) (admin)
	- Body: { nombre_proveedor?, contacto?, email?, telefono?, direccion?, nit?, activo? }
	- Response 200: { success, data: { ...proveedorActualizado } }

- DELETE /:id  (Eliminar proveedor) (admin)
	- Response 204: No Content

---

## 17) Órdenes de Compra
Base: /api/ordenes-compra

- GET /  (Listar órdenes de compra) (admin)
	- Query params: ?id_proveedor=&?estado=&?fecha_desde=
	- Response 200: { success, data: [ { id_orden_compra, numero_orden, id_proveedor, fecha_orden, total_orden, estado } ] }

- GET /:id  (Obtener orden de compra por id) (admin)
	- Response 200: { success, data: { id_orden_compra, numero_orden, proveedor: { nombre_proveedor, email, telefono }, almacen: { nombre_almacen }, items: [ { id_producto, cantidad_ordenada, cantidad_recibida, precio_unitario } ], total_orden, estado } }

- POST /  (Crear orden de compra) (admin)
	- Body: { id_proveedor, id_almacen, items: [ { id_producto, cantidad_ordenada, precio_unitario } ], fecha_entrega_esperada, notas }
	- Response 201: { success, data: { id_orden_compra, numero_orden, total_orden } }

- PUT /:id  (Actualizar orden de compra) (admin)
	- Body: { estado?, fecha_entrega_real?, notas? }
	- Response 200: { success, data: { ...ordenCompraActualizada } }

- PUT /:id/recibir  (Marcar como recibida) (admin)
	- Body: { items: [ { id_detalle, cantidad_recibida } ] }
	- Response 200: { success, data: { id_orden_compra, estado: 'recibida' } }

- DELETE /:id  (Eliminar orden de compra) (admin)
	- Response 204: No Content

---

## 18) Detalles de Órdenes de Compra
Base: /api/ordenes-compra/:id_orden/detalles

- GET /  (Listar detalles de orden de compra)
	- Response 200: { success, data: [ { id_detalle, id_producto, cantidad_ordenada, cantidad_recibida, precio_unitario } ] }

- POST /  (Agregar detalle a orden de compra) (admin)
	- Body: { id_producto, cantidad_ordenada, precio_unitario }
	- Response 201: { success, data: { ...detalle } }

- PUT /:id  (Actualizar detalle) (admin)
	- Response 200: { success, data: { ...detalleActualizado } }

- DELETE /:id  (Eliminar detalle) (admin)
	- Response 204: No Content

---

## 19) Alertas de Inventario
Base: /api/alertas-inventario

- GET /  (Listar alertas) (admin)
	- Query params: ?resuelta=false&?tipo_alerta=stock_bajo
	- Response 200: { success, data: [ { id_alerta, tipo_alerta, mensaje, fecha_alerta, resuelta, producto: { nombre_producto } } ] }

- GET /:id  (Obtener alerta por id) (admin)
	- Response 200: { success, data: { id_alerta, tipo_alerta, mensaje, fecha_alerta, resuelta } }

- PUT /:id/resolver  (Marcar alerta como resuelta) (admin)
	- Body: { nota? }
	- Response 200: { success, data: { id_alerta, resuelta: true } }

- GET /resumen  (Obtener resumen de alertas) (admin)
	- Response 200: { success, data: { totalAlertas, alertasStock, alertasAgotado } }

---

## 20) Interacciones con Clientes (CRM)
Base: /api/interacciones

- GET /  (Listar interacciones) (admin/vendedor)
	- Query params: ?id_cliente=&?estado=&?tipo_interaccion=
	- Response 200: { success, data: [ { id_interaccion, id_cliente, tipo_interaccion, descripcion, resultado, fecha_interaccion, estado } ] }

- GET /:id  (Obtener interacción por id) (admin/vendedor)
	- Response 200: { success, data: { id_interaccion, id_cliente, id_usuario_asignado, tipo_interaccion, descripcion, resultado, fecha_interaccion, proxima_accion, fecha_proxima_accion, estado } }

- POST /  (Crear interacción) (admin/vendedor)
	- Body: { id_cliente, tipo_interaccion, descripcion, resultado?, proxima_accion?, fecha_proxima_accion? }
	- Response 201: { success, data: { id_interaccion, id_cliente, tipo_interaccion } }

- PUT /:id  (Actualizar interacción) (admin/vendedor)
	- Body: { descripcion?, resultado?, estado?, proxima_accion?, fecha_proxima_accion? }
	- Response 200: { success, data: { ...interaccionActualizada } }

- DELETE /:id  (Eliminar interacción) (admin)
	- Response 204: No Content

---

## 21) Oportunidades de Venta (CRM)
Base: /api/oportunidades

- GET /  (Listar oportunidades) (admin/vendedor)
	- Query params: ?etapa=&?id_usuario_asignado=&?estado=activo
	- Response 200: { success, data: [ { id_oportunidad, titulo, cliente: { nombre_completo, email }, valor_estimado, probabilidad_cierre, etapa, fecha_creacion } ] }

- GET /:id  (Obtener oportunidad por id) (admin/vendedor)
	- Response 200: { success, data: { id_oportunidad, titulo, descripcion, id_cliente, id_usuario_asignado, valor_estimado, probabilidad_cierre, etapa, fecha_creacion, fecha_cierre_estimada, motivo_perdida, estado } }

- POST /  (Crear oportunidad) (admin/vendedor)
	- Body: { id_cliente, titulo, descripcion, valor_estimado, probabilidad_cierre, fecha_cierre_estimada }
	- Response 201: { success, data: { id_oportunidad, titulo, etapa: 'prospecto' } }

- PUT /:id  (Actualizar oportunidad) (admin/vendedor)
	- Body: { titulo?, descripcion?, valor_estimado?, probabilidad_cierre?, etapa?, fecha_cierre_estimada?, estado? }
	- Response 200: { success, data: { ...oportunidadActualizada } }

- PUT /:id/etapa  (Cambiar etapa de oportunidad) (admin/vendedor)
	- Body: { etapa, motivo_perdida? }
	- Response 200: { success, data: { id_oportunidad, etapa } }

- DELETE /:id  (Eliminar oportunidad) (admin)
	- Response 204: No Content

- GET /pipeline  (Vista de pipeline de ventas) (admin/vendedor)
	- Response 200: { success, data: { prospecto: 5, contactado: 3, calificado: 2, propuesta: 1, valor_total: 50000 } }

---

## 22) Tareas CRM
Base: /api/tareas

- GET /  (Listar tareas) (admin/vendedor)
	- Query params: ?estado=pendiente&?id_usuario_asignado=&?prioridad=alta
	- Response 200: { success, data: [ { id_tarea, titulo, tipo_tarea, prioridad, fecha_vencimiento, asignado_a: { nombre_usuario }, estado } ] }

- GET /:id  (Obtener tarea por id) (admin/vendedor)
	- Response 200: { success, data: { id_tarea, titulo, descripcion, id_cliente, id_oportunidad, tipo_tarea, prioridad, fecha_vencimiento, estado, notas } }

- POST /  (Crear tarea) (admin/vendedor)
	- Body: { id_usuario_asignado, titulo, descripcion, tipo_tarea, prioridad, fecha_vencimiento, id_cliente?, id_oportunidad? }
	- Response 201: { success, data: { id_tarea, titulo, estado: 'pendiente' } }

- PUT /:id  (Actualizar tarea) (admin/vendedor)
	- Body: { titulo?, descripcion?, prioridad?, fecha_vencimiento?, estado?, notas? }
	- Response 200: { success, data: { ...tareaActualizada } }

- PUT /:id/completar  (Marcar tarea como completada) (admin/vendedor)
	- Body: { notas? }
	- Response 200: { success, data: { id_tarea, estado: 'completado', fecha_completado } }

- DELETE /:id  (Eliminar tarea) (admin)
	- Response 204: No Content

- GET /pendientes  (Obtener mis tareas pendientes) (requiere auth)
	- Response 200: { success, data: [ { id_tarea, titulo, prioridad, fecha_vencimiento } ] }

---

## 23) Segmentos de Clientes (CRM)
Base: /api/segmentos

- GET /  (Listar segmentos) (admin)
	- Response 200: { success, data: [ { id_segmento, nombre_segmento, descripcion, cantidad_clientes, activo } ] }

- GET /:id  (Obtener segmento por id) (admin)
	- Response 200: { success, data: { id_segmento, nombre_segmento, descripcion, criterios, activo, clientes: [ { id_cliente, nombre } ] } }

- POST /  (Crear segmento) (admin)
	- Body: { nombre_segmento, descripcion, criterios }
	- Response 201: { success, data: { id_segmento, nombre_segmento } }

- PUT /:id  (Actualizar segmento) (admin)
	- Body: { nombre_segmento?, descripcion?, criterios?, activo? }
	- Response 200: { success, data: { ...segmentoActualizado } }

- DELETE /:id  (Eliminar segmento) (admin)
	- Response 204: No Content

---

## 24) Cliente-Segmentos (Relación)
Base: /api/cliente-segmentos

- GET /cliente/:id_cliente  (Listar segmentos de cliente)
	- Response 200: { success, data: [ { id_segmento, nombre_segmento } ] }

- POST /  (Asignar cliente a segmento) (admin)
	- Body: { id_cliente, id_segmento }
	- Response 201: { success, data: { id_cliente, id_segmento } }

- DELETE /:id_cliente/:id_segmento  (Remover cliente de segmento) (admin)
	- Response 204: No Content

- POST /asignar-masivo  (Asignar múltiples clientes a segmento) (admin)
	- Body: { id_segmento, id_clientes: [ id1, id2, ... ] }
	- Response 200: { success, message, cantidad_asignados }

---

## 25) Campañas de Marketing (CRM)
Base: /api/campanas

- GET /  (Listar campañas) (admin)
	- Query params: ?estado=activa&?tipo_campana=email
	- Response 200: { success, data: [ { id_campana, nombre_campana, tipo_campana, fecha_inicio, fecha_fin, estado, presupuesto } ] }

- GET /:id  (Obtener campaña por id) (admin)
	- Response 200: { success, data: { id_campana, nombre_campana, descripcion, tipo_campana, fecha_inicio, fecha_fin, presupuesto, objetivo, estado } }

- POST /  (Crear campaña) (admin)
	- Body: { nombre_campana, descripcion, tipo_campana, fecha_inicio, fecha_fin, presupuesto, objetivo }
	- Response 201: { success, data: { id_campana, nombre_campana } }

- PUT /:id  (Actualizar campaña) (admin)
	- Body: { nombre_campana?, descripcion?, estado?, presupuesto? }
	- Response 200: { success, data: { ...campaña Actualizada } }

- DELETE /:id  (Eliminar campaña) (admin)
	- Response 204: No Content

- GET /:id/reporte  (Obtener reporte de campaña) (admin)
	- Response 200: { success, data: { id_campana, total_enviados, total_abiertos, total_respondidos, tasa_apertura, tasa_respuesta } }

---

## 26) Campañas-Clientes (Relación)
Base: /api/campanas/:id_campana/clientes

- GET /  (Listar clientes en campaña)
	- Response 200: { success, data: [ { id_cliente, nombre, estado_envio, fecha_envio, fecha_apertura, fecha_respuesta } ] }

- POST /  (Agregar clientes a campaña) (admin)
	- Body: { id_clientes: [ id1, id2, ... ] }
	- Response 201: { success, message, cantidad_agregados }

- PUT /:id_cliente  (Actualizar estado de envío) (admin)
	- Body: { estado_envio, fecha_apertura?, fecha_respuesta? }
	- Response 200: { success, data: { id_cliente, estado_envio } }

- DELETE /:id_cliente  (Remover cliente de campaña) (admin)
	- Response 204: No Content

- POST /enviar  (Enviar campaña) (admin)
	- Body: { id_campana, id_clientes: [ id1, id2, ... ] o todos: true }
	- Response 200: { success, message, cantidad_enviados }

---

## Errores estándar (formato de respuesta)
```
{ "success": false, "error": { "code": "VALIDATION_ERROR"|"NOT_FOUND"|"UNAUTHORIZED"|"FORBIDDEN"|"INTERNAL_ERROR", "message": "Descripción", "statusCode": 400|401|403|404|500 } }
```

---

## 📊 Resumen de Endpoints por módulo

| Módulo | Endpoints | Estado |
|--------|-----------|--------|
| Autenticación | 5 | ✅ |
| Roles | 5 | ✅ |
| Clientes | 5 | ✅ |
| Direcciones | 5 | ✅ |
| Categorías | 4 | ✅ |
| Productos | 8 | ✅ |
| Imágenes | 3 | ✅ |
| Carrito | 5 | ✅ |
| Órdenes | 5 | ✅ |
| Órdenes Items | 4 | ✅ |
| Pagos | 4 | ✅ |
| **Almacenes** | **5** | **✅ NUEVO** |
| **Inventario** | **5** | **✅ NUEVO** |
| **Movimientos Inventario** | **4** | **✅ NUEVO** |
| **Proveedores** | **5** | **✅ NUEVO** |
| **Órdenes de Compra** | **7** | **✅ NUEVO** |
| **Detalles Órdenes Compra** | **4** | **✅ NUEVO** |
| **Alertas de Inventario** | **4** | **✅ NUEVO** |
| **Interacciones CRM** | **5** | **✅ NUEVO** |
| **Oportunidades de Venta** | **7** | **✅ NUEVO** |
| **Tareas CRM** | **7** | **✅ NUEVO** |
| **Segmentos de Clientes** | **5** | **✅ NUEVO** |
| **Cliente-Segmentos** | **4** | **✅ NUEVO** |
| **Campañas Marketing** | **6** | **✅ NUEVO** |
| **Campañas-Clientes** | **5** | **✅ NUEVO** |
| **TOTAL** | **138 endpoints** | ✅ |

---

**Última actualización**: 10 de Noviembre, 2025
**Versión**: 2.0 Completa con CRM e Inventario
```

---

Si quieres, puedo:
- Filtrar y dejar exactamente 10 tablas si quieres limitar la lista.
- Generar un archivo Postman/Insomnia con todos estos endpoints ya cargados.
- Añadir ejemplos concretos de request/response para cada endpoint (más verboso).


