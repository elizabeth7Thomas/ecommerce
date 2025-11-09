-- ============================================
-- SCRIPT COMPLETO PARA POSTGRESQL E-COMMERCE
-- ============================================

-- Eliminar base de datos si existe (CUIDADO: elimina todos los datos)
DROP DATABASE IF EXISTS ecommerce_db;

-- Crear base de datos
CREATE DATABASE ecommerce_db;

-- Conectar a la base de datos
\c ecommerce_db;

-- ============================================
-- TABLA DE ROLES
-- ============================================
CREATE TABLE Roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    permisos JSONB DEFAULT '{}', -- Permisos en formato JSON
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar roles por defecto
INSERT INTO Roles (nombre_rol, descripcion, permisos) VALUES
('administrador', 'Usuario con permisos administrativos completos', 
 '{"productos": ["crear", "editar", "eliminar", "ver"], "categorias": ["crear", "editar", "eliminar", "ver"], "usuarios": ["ver", "editar", "eliminar"], "ordenes": ["ver", "editar", "cancelar"], "pagos": ["ver", "editar"]}'::jsonb),
('cliente', 'Usuario cliente con permisos básicos', 
 '{"productos": ["ver"], "carrito": ["agregar", "editar", "eliminar", "ver"], "ordenes": ["crear", "ver"], "perfil": ["ver", "editar"]}'::jsonb),
('vendedor', 'Usuario vendedor con permisos de gestión de productos', 
 '{"productos": ["crear", "editar", "ver"], "categorias": ["ver"], "ordenes": ["ver"]}'::jsonb);

-- ============================================
-- TABLA DE USUARIOS
-- ============================================
CREATE TABLE Usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(100) NOT NULL UNIQUE,
    correo_electronico VARCHAR(255) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL, -- Siempre almacenar contraseñas hasheadas
    id_rol INTEGER NOT NULL DEFAULT 2, -- 2 = cliente (por defecto)
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES Roles(id_rol) ON DELETE RESTRICT
);

-- Índices para Usuarios
CREATE INDEX idx_usuarios_correo ON Usuarios(correo_electronico);
CREATE INDEX idx_usuarios_nombre ON Usuarios(nombre_usuario);
CREATE INDEX idx_usuarios_rol ON Usuarios(id_rol);

-- ============================================
-- TABLA DE CLIENTES
-- ============================================
CREATE TABLE Clientes (
    id_cliente SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    telefono VARCHAR(20),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE
);

-- Índice para Clientes
CREATE INDEX idx_clientes_usuario ON Clientes(id_usuario);

-- ============================================
-- TABLA DE DIRECCIONES
-- ============================================
CREATE TABLE Direcciones (
    id_direccion SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL,
    calle VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    estado VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(20) NOT NULL,
    pais VARCHAR(100) NOT NULL,
    es_principal BOOLEAN DEFAULT false,
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE
);

-- Índice para Direcciones
CREATE INDEX idx_direcciones_cliente ON Direcciones(id_cliente);

-- ============================================
-- TABLA DE CATEGORÍAS DE PRODUCTOS
-- ============================================
CREATE TABLE Categoria_Producto (
    id_categoria SERIAL PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA DE PRODUCTOS
-- ============================================
CREATE TABLE Producto (
    id_producto SERIAL PRIMARY KEY,
    id_categoria INTEGER NOT NULL,
    nombre_producto VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria) REFERENCES Categoria_Producto(id_categoria)
);

-- Índices para Productos
CREATE INDEX idx_productos_categoria ON Producto(id_categoria);
CREATE INDEX idx_productos_nombre ON Producto(nombre_producto);
CREATE INDEX idx_productos_precio ON Producto(precio);
CREATE INDEX idx_productos_activo ON Producto(activo);

-- ============================================
-- TABLA DE IMÁGENES DE PRODUCTOS
-- ============================================
CREATE TABLE Producto_Imagenes (
    id_imagen SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL,
    url_imagen VARCHAR(255) NOT NULL,
    es_principal BOOLEAN DEFAULT false,
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto) ON DELETE CASCADE
);

-- Índice para Imágenes
CREATE INDEX idx_imagenes_producto ON Producto_Imagenes(id_producto);

-- ============================================
-- TABLA DEL CARRITO DE COMPRAS
-- ============================================
CREATE TABLE Carrito_Compras (
    id_carrito SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'abandonado', 'convertido')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE
);

-- Índice para Carrito
CREATE INDEX idx_carrito_cliente ON Carrito_Compras(id_cliente);
CREATE INDEX idx_carrito_estado ON Carrito_Compras(estado);

-- ============================================
-- TABLA DE PRODUCTOS DENTRO DEL CARRITO
-- ============================================
CREATE TABLE Carrito_Productos (
    id_carrito_producto SERIAL PRIMARY KEY,
    id_carrito INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_carrito) REFERENCES Carrito_Compras(id_carrito) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto) ON DELETE CASCADE,
    UNIQUE (id_carrito, id_producto) -- Evitar duplicados
);

-- Índices para Carrito_Productos
CREATE INDEX idx_carrito_productos_carrito ON Carrito_Productos(id_carrito);
CREATE INDEX idx_carrito_productos_producto ON Carrito_Productos(id_producto);

-- ============================================
-- TABLA DE ÓRDENES
-- ============================================
CREATE TABLE Ordenes (
    id_orden SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL,
    id_direccion_envio INTEGER NOT NULL,
    fecha_orden TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_orden NUMERIC(10, 2) NOT NULL CHECK (total_orden >= 0),
    estado_orden VARCHAR(50) DEFAULT 'pendiente' 
        CHECK (estado_orden IN ('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado')),
    notas_orden TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente),
    FOREIGN KEY (id_direccion_envio) REFERENCES Direcciones(id_direccion)
);

-- Índices para Órdenes
CREATE INDEX idx_ordenes_cliente ON Ordenes(id_cliente);
CREATE INDEX idx_ordenes_fecha ON Ordenes(fecha_orden);
CREATE INDEX idx_ordenes_estado ON Ordenes(estado_orden);

-- ============================================
-- TABLA DE ÍTEMS DE LA ORDEN
-- ============================================
CREATE TABLE Ordenes_Items (
    id_orden_item SERIAL PRIMARY KEY,
    id_orden INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(10, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    FOREIGN KEY (id_orden) REFERENCES Ordenes(id_orden) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto)
);

-- Índices para Ordenes_Items
CREATE INDEX idx_ordenes_items_orden ON Ordenes_Items(id_orden);
CREATE INDEX idx_ordenes_items_producto ON Ordenes_Items(id_producto);

-- ============================================
-- TABLA DE PAGOS
-- ============================================
CREATE TABLE Payments (
    id_pago SERIAL PRIMARY KEY,
    id_orden INTEGER NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL CHECK (metodo_pago IN ('tarjeta_credito', 'tarjeta_debito', 'paypal', 'transferencia', 'efectivo')),
    monto NUMERIC(10, 2) NOT NULL CHECK (monto >= 0),
    estado_pago VARCHAR(50) NOT NULL DEFAULT 'pendiente'
        CHECK (estado_pago IN ('pendiente', 'procesando', 'completado', 'fallido', 'reembolsado', 'cancelado')),
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaccion_id VARCHAR(255),
    detalles_pago TEXT,
    FOREIGN KEY (id_orden) REFERENCES Ordenes(id_orden)
);

-- Índices para Payments
CREATE INDEX idx_pagos_orden ON Payments(id_orden);
CREATE INDEX idx_pagos_estado ON Payments(estado_pago);
CREATE INDEX idx_pagos_transaccion ON Payments(transaccion_id);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para Usuarios
CREATE TRIGGER trigger_usuarios_actualizacion
    BEFORE UPDATE ON Usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Trigger para Producto
CREATE TRIGGER trigger_producto_actualizacion
    BEFORE UPDATE ON Producto
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Trigger para Carrito_Compras
CREATE TRIGGER trigger_carrito_actualizacion
    BEFORE UPDATE ON Carrito_Compras
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Trigger para Ordenes
CREATE TRIGGER trigger_ordenes_actualizacion
    BEFORE UPDATE ON Ordenes
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- Insertar usuarios de prueba (contraseñas sin hashear - solo para prueba)
INSERT INTO Usuarios (nombre_usuario, correo_electronico, contrasena, id_rol) VALUES
('admin', 'admin@ecommerce.com', '$2b$10$ejemplo_hash_password', 1),
('juan_perez', 'juan@example.com', '$2b$10$ejemplo_hash_password', 2),
('maria_lopez', 'maria@example.com', '$2b$10$ejemplo_hash_password', 2);

-- Insertar clientes
INSERT INTO Clientes (id_usuario, nombre, apellido, telefono) VALUES
(2, 'Juan', 'Pérez', '+502 1234-5678'),
(3, 'María', 'López', '+502 8765-4321');

-- Insertar direcciones
INSERT INTO Direcciones (id_cliente, calle, ciudad, estado, codigo_postal, pais, es_principal) VALUES
(1, 'Calle Principal 123', 'Guatemala', 'Guatemala', '01001', 'Guatemala', true),
(2, 'Avenida Reforma 456', 'Antigua', 'Sacatepéquez', '03001', 'Guatemala', true);

-- Insertar categorías
INSERT INTO Categoria_Producto (nombre_categoria, descripcion) VALUES
('Electrónica', 'Dispositivos electrónicos y accesorios'),
('Ropa', 'Vestimenta para hombre y mujer'),
('Hogar', 'Artículos para el hogar'),
('Deportes', 'Equipamiento deportivo');

-- Insertar productos
INSERT INTO Producto (id_categoria, nombre_producto, descripcion, precio, stock) VALUES
(1, 'Laptop Dell Inspiron 15', 'Laptop con procesador Intel i5, 8GB RAM, 256GB SSD', 4999.99, 10),
(1, 'Mouse Inalámbrico Logitech', 'Mouse ergonómico con sensor óptico', 199.99, 50),
(2, 'Camisa Polo Ralph Lauren', 'Camisa polo 100% algodón', 299.99, 30),
(3, 'Juego de Sábanas King Size', 'Sábanas de algodón egipcio 600 hilos', 599.99, 20),
(4, 'Balón de Fútbol Adidas', 'Balón oficial tamaño 5', 249.99, 15);

-- Insertar imágenes de productos
INSERT INTO Producto_Imagenes (id_producto, url_imagen, es_principal) VALUES
(1, '/images/laptop-dell-1.jpg', true),
(1, '/images/laptop-dell-2.jpg', false),
(2, '/images/mouse-logitech.jpg', true),
(3, '/images/camisa-polo.jpg', true),
(4, '/images/sabanas-king.jpg', true),
(5, '/images/balon-futbol.jpg', true);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de productos con su categoría e imágenes principales
CREATE VIEW vista_productos_completos AS
SELECT 
    p.id_producto,
    p.nombre_producto,
    p.descripcion,
    p.precio,
    p.stock,
    p.activo,
    c.nombre_categoria,
    pi.url_imagen as imagen_principal
FROM Producto p
INNER JOIN Categoria_Producto c ON p.id_categoria = c.id_categoria
LEFT JOIN Producto_Imagenes pi ON p.id_producto = pi.id_producto AND pi.es_principal = true
WHERE p.activo = true;

-- Vista de órdenes con información del cliente
CREATE VIEW vista_ordenes_detalle AS
SELECT 
    o.id_orden,
    o.fecha_orden,
    o.total_orden,
    o.estado_orden,
    cl.nombre || ' ' || cl.apellido as nombre_cliente,
    u.correo_electronico,
    d.calle || ', ' || d.ciudad || ', ' || d.pais as direccion_completa
FROM Ordenes o
INNER JOIN Clientes cl ON o.id_cliente = cl.id_cliente
INNER JOIN Usuarios u ON cl.id_usuario = u.id_usuario
INNER JOIN Direcciones d ON o.id_direccion_envio = d.id_direccion;

-- ============================================
-- PERMISOS (OPCIONAL)
-- ============================================

-- Crear rol para la aplicación
-- CREATE ROLE ecommerce_app WITH LOGIN PASSWORD 'tu_password_seguro';
-- GRANT CONNECT ON DATABASE ecommerce_db TO ecommerce_app;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ecommerce_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ecommerce_app;

-- ============================================
-- COMENTARIOS EN TABLAS
-- ============================================

COMMENT ON TABLE Usuarios IS 'Tabla principal de autenticación y roles';
COMMENT ON TABLE Clientes IS 'Información personal de los clientes';
COMMENT ON TABLE Producto IS 'Catálogo de productos disponibles';
COMMENT ON TABLE Ordenes IS 'Órdenes de compra generadas';
COMMENT ON TABLE Payments IS 'Registro de transacciones de pago';

-- ============================================
-- EXTENSIÓN CRM PARA E-COMMERCE
-- ============================================

-- ============================================
-- 1. TABLA DE INTERACCIONES CON CLIENTES
-- ============================================
CREATE TABLE Interacciones_Cliente (
    id_interaccion SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL,
    id_usuario_asignado INTEGER,
    tipo_interaccion VARCHAR(50) NOT NULL 
        CHECK (tipo_interaccion IN ('llamada', 'email', 'chat', 'reunion', 'nota', 'reclamo', 'consulta')),
    descripcion TEXT NOT NULL,
    resultado VARCHAR(100),
    fecha_interaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    proxima_accion TEXT,
    fecha_proxima_accion DATE,
    estado VARCHAR(30) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'cancelado')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_asignado) REFERENCES Usuarios(id_usuario) ON DELETE SET NULL
);

CREATE INDEX idx_interacciones_cliente ON Interacciones_Cliente(id_cliente);
CREATE INDEX idx_interacciones_usuario ON Interacciones_Cliente(id_usuario_asignado);
CREATE INDEX idx_interacciones_fecha ON Interacciones_Cliente(fecha_interaccion);
CREATE INDEX idx_interacciones_estado ON Interacciones_Cliente(estado);

-- ============================================
-- 2. TABLA DE OPORTUNIDADES DE VENTA (LEADS)
-- ============================================
CREATE TABLE Oportunidades_Venta (
    id_oportunidad SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL,
    id_usuario_asignado INTEGER,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    valor_estimado NUMERIC(10, 2) CHECK (valor_estimado >= 0),
    probabilidad_cierre INTEGER CHECK (probabilidad_cierre BETWEEN 0 AND 100),
    etapa VARCHAR(50) NOT NULL DEFAULT 'prospecto'
        CHECK (etapa IN ('prospecto', 'contactado', 'calificado', 'propuesta', 'negociacion', 'ganado', 'perdido')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre_estimada DATE,
    fecha_cierre_real DATE,
    motivo_perdida TEXT,
    estado VARCHAR(20) DEFAULT 'activo'
        CHECK (estado IN ('activo', 'cerrado', 'cancelado')),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_asignado) REFERENCES Usuarios(id_usuario) ON DELETE SET NULL
);

CREATE INDEX idx_oportunidades_cliente ON Oportunidades_Venta(id_cliente);
CREATE INDEX idx_oportunidades_etapa ON Oportunidades_Venta(etapa);
CREATE INDEX idx_oportunidades_usuario ON Oportunidades_Venta(id_usuario_asignado);
CREATE INDEX idx_oportunidades_estado ON Oportunidades_Venta(estado);

-- ============================================
-- 3. TABLA DE TAREAS/ACTIVIDADES CRM
-- ============================================
CREATE TABLE Tareas_CRM (
    id_tarea SERIAL PRIMARY KEY,
    id_cliente INTEGER,
    id_oportunidad INTEGER,
    id_usuario_asignado INTEGER NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_tarea VARCHAR(50) NOT NULL
        CHECK (tipo_tarea IN ('llamada', 'email', 'reunion', 'seguimiento', 'cotizacion', 'otro')),
    prioridad VARCHAR(20) DEFAULT 'media'
        CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
    fecha_vencimiento TIMESTAMP,
    fecha_completado TIMESTAMP,
    estado VARCHAR(30) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'cancelado')),
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_oportunidad) REFERENCES Oportunidades_Venta(id_oportunidad) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_asignado) REFERENCES Usuarios(id_usuario) ON DELETE RESTRICT
);

CREATE INDEX idx_tareas_cliente ON Tareas_CRM(id_cliente);
CREATE INDEX idx_tareas_usuario ON Tareas_CRM(id_usuario_asignado);
CREATE INDEX idx_tareas_estado ON Tareas_CRM(estado);
CREATE INDEX idx_tareas_vencimiento ON Tareas_CRM(fecha_vencimiento);
CREATE INDEX idx_tareas_oportunidad ON Tareas_CRM(id_oportunidad);

-- ============================================
-- 4. TABLA DE SEGMENTACIÓN DE CLIENTES
-- ============================================
CREATE TABLE Segmentos_Cliente (
    id_segmento SERIAL PRIMARY KEY,
    nombre_segmento VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    criterios JSONB,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación muchos a muchos
CREATE TABLE Cliente_Segmentos (
    id_cliente INTEGER NOT NULL,
    id_segmento INTEGER NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_cliente, id_segmento),
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_segmento) REFERENCES Segmentos_Cliente(id_segmento) ON DELETE CASCADE
);

CREATE INDEX idx_cliente_segmentos_cliente ON Cliente_Segmentos(id_cliente);
CREATE INDEX idx_cliente_segmentos_segmento ON Cliente_Segmentos(id_segmento);

-- ============================================
-- 5. TABLA DE CAMPAÑAS DE MARKETING
-- ============================================
CREATE TABLE Campanas_Marketing (
    id_campana SERIAL PRIMARY KEY,
    nombre_campana VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_campana VARCHAR(50) NOT NULL
        CHECK (tipo_campana IN ('email', 'sms', 'redes_sociales', 'telefonica', 'mixta')),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    presupuesto NUMERIC(10, 2),
    objetivo TEXT,
    estado VARCHAR(30) DEFAULT 'planificada'
        CHECK (estado IN ('planificada', 'activa', 'pausada', 'completada', 'cancelada')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relación de clientes en campañas
CREATE TABLE Campana_Clientes (
    id_campana_cliente SERIAL PRIMARY KEY,
    id_campana INTEGER NOT NULL,
    id_cliente INTEGER NOT NULL,
    fecha_envio TIMESTAMP,
    estado_envio VARCHAR(30) DEFAULT 'pendiente'
        CHECK (estado_envio IN ('pendiente', 'enviado', 'abierto', 'respondido', 'fallido')),
    fecha_apertura TIMESTAMP,
    fecha_respuesta TIMESTAMP,
    notas TEXT,
    UNIQUE (id_campana, id_cliente),
    FOREIGN KEY (id_campana) REFERENCES Campanas_Marketing(id_campana) ON DELETE CASCADE,
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE
);

CREATE INDEX idx_campana_clientes_campana ON Campana_Clientes(id_campana);
CREATE INDEX idx_campana_clientes_cliente ON Campana_Clientes(id_cliente);
CREATE INDEX idx_campana_clientes_estado ON Campana_Clientes(estado_envio);

-- ============================================
-- TRIGGERS PARA TABLAS CRM
-- ============================================

-- Trigger para Interacciones_Cliente
CREATE TRIGGER trigger_interacciones_actualizacion
    BEFORE UPDATE ON Interacciones_Cliente
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Trigger para Oportunidades_Venta
CREATE TRIGGER trigger_oportunidades_actualizacion
    BEFORE UPDATE ON Oportunidades_Venta
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Trigger para Tareas_CRM
CREATE TRIGGER trigger_tareas_actualizacion
    BEFORE UPDATE ON Tareas_CRM
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Trigger para Segmentos_Cliente
CREATE TRIGGER trigger_segmentos_actualizacion
    BEFORE UPDATE ON Segmentos_Cliente
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Trigger para Campanas_Marketing
CREATE TRIGGER trigger_campanas_actualizacion
    BEFORE UPDATE ON Campanas_Marketing
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- ============================================
-- VISTAS CRM ÚTILES
-- ============================================

-- Vista de clientes con actividad reciente
CREATE VIEW vista_clientes_actividad AS
SELECT 
    c.id_cliente,
    c.nombre || ' ' || c.apellido as nombre_completo,
    u.correo_electronico,
    c.telefono,
    COUNT(DISTINCT o.id_orden) as total_ordenes,
    COALESCE(SUM(o.total_orden), 0) as valor_total_compras,
    MAX(o.fecha_orden) as ultima_compra,
    COUNT(DISTINCT i.id_interaccion) as total_interacciones,
    MAX(i.fecha_interaccion) as ultima_interaccion
FROM Clientes c
INNER JOIN Usuarios u ON c.id_usuario = u.id_usuario
LEFT JOIN Ordenes o ON c.id_cliente = o.id_cliente
LEFT JOIN Interacciones_Cliente i ON c.id_cliente = i.id_cliente
GROUP BY c.id_cliente, c.nombre, c.apellido, u.correo_electronico, c.telefono;

-- Vista de pipeline de ventas
CREATE VIEW vista_pipeline_ventas AS
SELECT 
    ov.etapa,
    COUNT(*) as cantidad_oportunidades,
    SUM(ov.valor_estimado) as valor_total,
    AVG(ov.probabilidad_cierre) as probabilidad_promedio,
    COUNT(CASE WHEN ov.fecha_cierre_estimada < CURRENT_DATE THEN 1 END) as vencidas
FROM Oportunidades_Venta ov
WHERE ov.estado = 'activo'
GROUP BY ov.etapa
ORDER BY 
    CASE ov.etapa
        WHEN 'prospecto' THEN 1
        WHEN 'contactado' THEN 2
        WHEN 'calificado' THEN 3
        WHEN 'propuesta' THEN 4
        WHEN 'negociacion' THEN 5
        WHEN 'ganado' THEN 6
        WHEN 'perdido' THEN 7
    END;

-- Vista de tareas pendientes por usuario
CREATE VIEW vista_tareas_pendientes AS
SELECT 
    t.id_tarea,
    t.titulo,
    t.tipo_tarea,
    t.prioridad,
    t.fecha_vencimiento,
    u.nombre_usuario as asignado_a,
    c.nombre || ' ' || c.apellido as cliente,
    CASE 
        WHEN t.fecha_vencimiento < CURRENT_TIMESTAMP THEN 'Vencida'
        WHEN t.fecha_vencimiento < CURRENT_TIMESTAMP + INTERVAL '1 day' THEN 'Urgente'
        ELSE 'A tiempo'
    END as estado_vencimiento
FROM Tareas_CRM t
INNER JOIN Usuarios u ON t.id_usuario_asignado = u.id_usuario
LEFT JOIN Clientes c ON t.id_cliente = c.id_cliente
WHERE t.estado IN ('pendiente', 'en_proceso')
ORDER BY t.prioridad DESC, t.fecha_vencimiento ASC;

-- ============================================
-- DATOS DE EJEMPLO PARA CRM
-- ============================================

-- Insertar segmentos
INSERT INTO Segmentos_Cliente (nombre_segmento, descripcion, criterios) VALUES
('VIP', 'Clientes con compras superiores a Q5000', '{"compras_minimas": 5000}'::jsonb),
('Frecuente', 'Clientes con más de 5 compras', '{"numero_compras": 5}'::jsonb),
('Inactivo', 'Sin compras en los últimos 6 meses', '{"dias_inactividad": 180}'::jsonb),
('Nuevo', 'Cliente registrado hace menos de 30 días', '{"dias_desde_registro": 30}'::jsonb);

-- ============================================
-- COMENTARIOS EN TABLAS CRM
-- ============================================

COMMENT ON TABLE Interacciones_Cliente IS 'Registro de todas las interacciones con clientes (llamadas, emails, etc)';
COMMENT ON TABLE Oportunidades_Venta IS 'Pipeline de ventas y oportunidades de negocio';
COMMENT ON TABLE Tareas_CRM IS 'Gestión de tareas y actividades del equipo de ventas';
COMMENT ON TABLE Segmentos_Cliente IS 'Segmentación de clientes para marketing dirigido';
COMMENT ON TABLE Campanas_Marketing IS 'Campañas de marketing y su gestión';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Verificar tablas creadas
\dt

-- Verificar vistas creadas
\dv

SELECT 'Base de datos ecommerce_db con CRM creada exitosamente!' as mensaje;