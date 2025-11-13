# Explicación de Tablas del E-commerce

Este documento explica la lógica y el propósito de cada tabla en el sistema, usando analogías y ejemplos prácticos para facilitar la comprensión.

---

## 1. El Corazón de la Tienda (E-commerce Básico)
Tablas esenciales para registro, visualización de productos y compras.

| Tabla                | Propósito                                                        | Analogía                              | Ejemplo Práctico                                                                                 |
|----------------------|------------------------------------------------------------------|---------------------------------------|--------------------------------------------------------------------------------------------------|
| Roles                | Define permisos y acciones de cada usuario                       | Tarjeta de identificación de empleado | "Administrador" (todo acceso), "Cliente" (solo compra), "Vendedor" (gestiona productos)         |
| Usuarios             | Lista de inicios de sesión permitidos                            | Lista de acceso al edificio           | Guarda correo y contraseña encriptada; cada usuario tiene un Rol                                 |
| Clientes             | Información personal de quienes compran                          | Agenda de contactos                   | Nombre, apellido, teléfono; vinculado a un Usuario                                               |
| Direcciones          | Libreta de direcciones de cada cliente                           | Libreta de direcciones                | Calles, ciudades y países de envío                                                               |
| Categoria_Producto   | Organiza productos en grupos                                     | Pasillos de supermercado              | "Electrónica", "Ropa", "Hogar"; ayuda a encontrar productos                                      |
| Producto             | Ficha de cada artículo                                           | Etiqueta en el estante                | Nombre, precio, stock, categoría                                                                 |
| Producto_Imagenes    | Álbum de fotos de cada producto                                  | Álbum de fotos                        | Varias fotos para que el cliente vea el producto                                                 |
| Carrito_Compras      | Representa el carrito de compras de un cliente                   | Carrito de supermercado físico        | Contenedor que pertenece a un cliente y espera ser pagado                                        |
| Carrito_Productos    | Lista de productos en el carrito                                 | Lista de artículos en el carrito      | "En el carrito de Juan hay 3 unidades del producto X a tal precio"                              |
| Ordenes              | Recibo o factura de una compra realizada                         | Recibo de compra                      | Quién compró, cuándo, a dónde se envía, total pagado                                             |
| Ordenes_Items        | Detalle de lo comprado en una orden                              | Lista detallada del recibo            | "En la orden #123 se compraron 2 camisas y 1 pantalón"                                          |
| Payments             | Registro de la transacción de pago                               | Comprobante de pago con tarjeta       | Cómo se pagó, si fue exitoso, número de transacción                                              |

---

## 2. Gestión de Clientes (CRM)
Tablas para construir y mantener relaciones con los clientes.

| Tabla                 | Propósito                                                        | Analogía                              | Ejemplo Práctico                                                                                 |
|-----------------------|------------------------------------------------------------------|---------------------------------------|--------------------------------------------------------------------------------------------------|
| Interacciones_Cliente | Historial de conversaciones y contactos con un cliente           | Historial de llamadas y correos       | Registra cada llamada, email o chat para buen seguimiento                                        |
| Oportunidades_Venta   | Seguimiento a posibles grandes ventas o proyectos                | Lista de posibles negocios            | Para clientes importantes con negociaciones grandes                                               |
| Tareas_CRM            | Agenda de tareas para el equipo de ventas                       | Agenda de "To-Dos"                   | "Llamar a Juan Pérez el lunes", "Enviar cotización a María López"                                |
| Segmentos_Cliente     | Etiquetas para agrupar clientes                                 | Etiquetas de colores para carpetas    | "Clientes VIP", "Nuevos", "Inactivos"                                                            |
| Cliente_Segmentos     | Relación entre clientes y sus etiquetas                         | Pegar la etiqueta en la carpeta       | "Juan Pérez pertenece al segmento VIP y al segmento Frecuente"                                   |
| Campanas_Marketing    | Planificador de campañas de publicidad                          | Planificador de eventos               | "Descuentos de Verano", fechas de inicio y fin                                                   |

---

## 3. La Bodega y los Proveedores (Inventario)
Tablas para gestionar stock, bodegas y compras a proveedores.

| Tabla                  | Propósito                                                        | Analogía                              | Ejemplo Práctico                                                                                 |
|------------------------|------------------------------------------------------------------|---------------------------------------|--------------------------------------------------------------------------------------------------|
| Almacenes              | Lista de bodegas físicas                                         | Bodegas o sucursales                  | "Bodega Central", "Bodega Zona 10"                                                               |
| Inventario             | Conteo exacto de cada producto en cada bodega                   | Inventario en el estante              | "En la Bodega Central, del producto 'Laptop Dell', quedan 10 unidades"                           |
| Movimientos_Inventario | Registro de entradas, salidas y movimientos de productos         | Libro de entradas y salidas           | Anota cada compra, venta o movimiento                                                            |
| Proveedores            | Agenda de distribuidores                                         | Agenda de contactos de proveedores    | Información de empresas a las que se compran productos                                           |
| Ordenes_Compra         | Órdenes de compra a proveedores para reabastecimiento            | Orden de compra                       | "Por favor, envíame 100 unidades de la Laptop Dell"                                              |

---

## 4. Casos Especiales (Cotizaciones y Devoluciones)
Tablas para procesos no directos de compra, como presupuestos o devoluciones.

| Tabla         | Propósito                                                        | Analogía                              | Ejemplo Práctico                                                                                 |
|---------------|------------------------------------------------------------------|---------------------------------------|--------------------------------------------------------------------------------------------------|
| Cotizaciones  | Crear presupuestos formales para clientes                        | Presupuesto detallado                 | Oferta personalizada con precios y productos específicos, puede ser aceptada o rechazada          |
| Devoluciones  | Gestionar cuando un cliente quiere devolver un producto          | Formulario de devolución              | Inicia y registra el proceso: motivo, aprobación, productos incluidos                            |
| Reembolsos    | Registro de la devolución de dinero a un cliente                 | Nota de crédito o reembolso           | Confirma que el dinero de una devolución fue enviado de vuelta al cliente                        |

---