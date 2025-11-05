-- ============================================
-- SCRIPT PARA CREAR LA TABLA CATEGORIA_PRODUCTO
-- SI NO EXISTE
-- ============================================

-- Conectar a la base de datos ecommerce_db
\c ecommerce_db;

-- Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS Categoria_Producto (
    id_categoria SERIAL PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice si no existe
CREATE INDEX IF NOT EXISTS idx_categoria_nombre ON Categoria_Producto(nombre_categoria);

-- Insertar categorías por defecto si la tabla está vacía
INSERT INTO Categoria_Producto (nombre_categoria, descripcion, activo)
VALUES 
    ('Electrónica', 'Dispositivos electrónicos y accesorios', true),
    ('Ropa', 'Vestimenta para hombre y mujer', true),
    ('Hogar', 'Artículos para el hogar', true),
    ('Deportes', 'Equipamiento deportivo', true)
ON CONFLICT (nombre_categoria) DO NOTHING;

-- Verificar que la tabla fue creada
SELECT 'Tabla Categoria_Producto creada exitosamente!' as mensaje;
SELECT COUNT(*) as total_categorias FROM Categoria_Producto;
