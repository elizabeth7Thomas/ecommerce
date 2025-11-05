-- ============================================
-- SCRIPT COMPLETO PARA POSTGRESQL E-COMMERCE
-- VERSIÓN CORREGIDA
-- ============================================

-- PASO 1: Eliminar base de datos si existe
DROP DATABASE IF EXISTS ecommerce_db;

-- PASO 2: Crear base de datos
CREATE DATABASE ecommerce_db;

-- PASO 3: Conectar a la base de datos (ejecutar en psql: \c ecommerce_db)
-- Si usas un cliente SQL, debes conectarte manualmente a ecommerce_db aquí

-- ============================================
-- ELIMINAR OBJETOS EXISTENTES (por seguridad)
-- ============================================
DROP VIEW IF EXISTS vista_ordenes_detalle CASCADE;
DROP VIEW IF EXISTS vista_productos_completos CASCADE;

DROP TABLE IF EXISTS Payments CASCADE;
DROP TABLE IF EXISTS Ordenes_Items CASCADE;
DROP TABLE IF EXISTS Ordenes CASCADE;
DROP TABLE IF EXISTS Carrito_Productos CASCADE;
DROP TABLE IF EXISTS Carrito_Compras CASCADE;
DROP TABLE IF EXISTS Producto_Imagenes CASCADE;
DROP TABLE IF EXISTS Producto CASCADE;
DROP TABLE IF EXISTS Categoria_Producto CASCADE;
DROP TABLE IF EXISTS Direcciones CASCADE;
DROP TABLE IF EXISTS Clientes CASCADE;
DROP TABLE IF EXISTS Usuarios CASCADE;
DROP TABLE IF EXISTS Roles CASCADE;

-- ============================================
-- TABLA DE ROLES
-- ============================================
CREATE TABLE Roles (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    permisos JSONB DEFAULT '{}',
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
    contrasena VARCHAR(255) NOT NULL,
    id_rol INTEGER NOT NULL DEFAULT 2,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES Roles(id_rol) ON DELETE RESTRICT
);

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
    FOREIGN KEY (id_categoria) REFERENCES Categoria_Producto(id_categoria) ON DELETE RESTRICT
);

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
    UNIQUE (id_carrito, id_producto)
);

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
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE RESTRICT,
    FOREIGN KEY (id_direccion_envio) REFERENCES Direcciones(id_direccion) ON DELETE RESTRICT
);

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
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto) ON DELETE RESTRICT
);

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
    FOREIGN KEY (id_orden) REFERENCES Ordenes(id_orden) ON DELETE RESTRICT
);

CREATE INDEX idx_pagos_orden ON Payments(id_orden);
CREATE INDEX idx_pagos_estado ON Payments(estado_pago);
CREATE INDEX idx_pagos_transaccion ON Payments(transaccion_id);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_usuarios_actualizacion
    BEFORE UPDATE ON Usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trigger_producto_actualizacion
    BEFORE UPDATE ON Producto
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trigger_carrito_actualizacion
    BEFORE UPDATE ON Carrito_Compras
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trigger_ordenes_actualizacion
    BEFORE UPDATE ON Ordenes
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

INSERT INTO Usuarios (nombre_usuario, correo_electronico, contrasena, id_rol) VALUES
('admin', 'admin@ecommerce.com', '$2b$10$ejemplo_hash_password', 1),
('juan_perez', 'juan@example.com', '$2b$10$ejemplo_hash_password', 2),
('maria_lopez', 'maria@example.com', '$2b$10$ejemplo_hash_password', 2);

INSERT INTO Clientes (id_usuario, nombre, apellido, telefono) VALUES
(2, 'Juan', 'Pérez', '+502 1234-5678'),
(3, 'María', 'López', '+502 8765-4321');

INSERT INTO Direcciones (id_cliente, calle, ciudad, estado, codigo_postal, pais, es_principal) VALUES
(1, 'Calle Principal 123', 'Guatemala', 'Guatemala', '01001', 'Guatemala', true),
(2, 'Avenida Reforma 456', 'Antigua', 'Sacatepéquez', '03001', 'Guatemala', true);

INSERT INTO Categoria_Producto (nombre_categoria, descripcion) VALUES
('Electrónica', 'Dispositivos electrónicos y accesorios'),
('Ropa', 'Vestimenta para hombre y mujer'),
('Hogar', 'Artículos para el hogar'),
('Deportes', 'Equipamiento deportivo');

INSERT INTO Producto (id_categoria, nombre_producto, descripcion, precio, stock) VALUES
(1, 'Laptop Dell Inspiron 15', 'Laptop con procesador Intel i5, 8GB RAM, 256GB SSD', 4999.99, 10),
(1, 'Mouse Inalámbrico Logitech', 'Mouse ergonómico con sensor óptico', 199.99, 50),
(2, 'Camisa Polo Ralph Lauren', 'Camisa polo 100% algodón', 299.99, 30),
(3, 'Juego de Sábanas King Size', 'Sábanas de algodón egipcio 600 hilos', 599.99, 20),
(4, 'Balón de Fútbol Adidas', 'Balón oficial tamaño 5', 249.99, 15);

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
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE Usuarios IS 'Tabla principal de autenticación y roles';
COMMENT ON TABLE Clientes IS 'Información personal de los clientes';
COMMENT ON TABLE Producto IS 'Catálogo de productos disponibles';
COMMENT ON TABLE Ordenes IS 'Órdenes de compra generadas';
COMMENT ON TABLE Payments IS 'Registro de transacciones de pago';

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT 'Base de datos ecommerce_db creada exitosamente!' as mensaje;