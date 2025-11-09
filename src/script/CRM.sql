-- ============================================
-- EXTENSIÓN CRM + INVENTARIO PARA E-COMMERCE
-- ============================================

-- ============================================
-- TABLAS DE INVENTARIO
-- ============================================

-- Tabla de almacenes/bodegas
CREATE TABLE Almacenes (
    id_almacen SERIAL PRIMARY KEY,
    nombre_almacen VARCHAR(100) NOT NULL UNIQUE,
    direccion TEXT,
    telefono VARCHAR(20),
    responsable VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de inventario por almacén
CREATE TABLE Inventario (
    id_inventario SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL,
    id_almacen INTEGER NOT NULL,
    cantidad_actual INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_actual >= 0),
    cantidad_minima INTEGER DEFAULT 10, -- Stock mínimo para alertas
    cantidad_maxima INTEGER DEFAULT 1000, -- Stock máximo
    ubicacion_fisica VARCHAR(50), -- Ej: Pasillo A, Estante 3
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto) ON DELETE CASCADE,
    FOREIGN KEY (id_almacen) REFERENCES Almacenes(id_almacen) ON DELETE CASCADE,
    UNIQUE (id_producto, id_almacen)
);

CREATE INDEX idx_inventario_producto ON Inventario(id_producto);
CREATE INDEX idx_inventario_almacen ON Inventario(id_almacen);

-- Tabla de movimientos de inventario (historial)
CREATE TABLE Movimientos_Inventario (
    id_movimiento SERIAL PRIMARY KEY,
    id_inventario INTEGER NOT NULL,
    tipo_movimiento VARCHAR(30) NOT NULL 
        CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste', 'transferencia', 'devolucion')),
    cantidad INTEGER NOT NULL,
    cantidad_anterior INTEGER NOT NULL,
    cantidad_nueva INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL, -- Quien realizó el movimiento
    id_orden INTEGER, -- Si es por una orden
    motivo TEXT,
    referencia VARCHAR(100), -- Número de factura, guía, etc.
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_inventario) REFERENCES Inventario(id_inventario) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario),
    FOREIGN KEY (id_orden) REFERENCES Ordenes(id_orden)
);

CREATE INDEX idx_movimientos_inventario ON Movimientos_Inventario(id_inventario);
CREATE INDEX idx_movimientos_fecha ON Movimientos_Inventario(fecha_movimiento);
CREATE INDEX idx_movimientos_tipo ON Movimientos_Inventario(tipo_movimiento);

-- Tabla de proveedores
CREATE TABLE Proveedores (
    id_proveedor SERIAL PRIMARY KEY,
    nombre_proveedor VARCHAR(255) NOT NULL,
    contacto VARCHAR(100),
    email VARCHAR(255),
    telefono VARCHAR(20),
    direccion TEXT,
    nit VARCHAR(20),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de órdenes de compra a proveedores
CREATE TABLE Ordenes_Compra (
    id_orden_compra SERIAL PRIMARY KEY,
    id_proveedor INTEGER NOT NULL,
    id_almacen INTEGER NOT NULL, -- Almacén destino
    id_usuario INTEGER NOT NULL, -- Usuario que creó la orden
    numero_orden VARCHAR(50) UNIQUE,
    fecha_orden TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega_esperada DATE,
    fecha_entrega_real DATE,
    total_orden NUMERIC(10, 2) NOT NULL CHECK (total_orden >= 0),
    estado VARCHAR(30) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'aprobada', 'enviada', 'recibida', 'cancelada')),
    notas TEXT,
    FOREIGN KEY (id_proveedor) REFERENCES Proveedores(id_proveedor),
    FOREIGN KEY (id_almacen) REFERENCES Almacenes(id_almacen),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

CREATE INDEX idx_ordenes_compra_proveedor ON Ordenes_Compra(id_proveedor);
CREATE INDEX idx_ordenes_compra_estado ON Ordenes_Compra(estado);

-- Detalle de órdenes de compra
CREATE TABLE Ordenes_Compra_Detalle (
    id_detalle SERIAL PRIMARY KEY,
    id_orden_compra INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad_ordenada INTEGER NOT NULL CHECK (cantidad_ordenada > 0),
    cantidad_recibida INTEGER DEFAULT 0 CHECK (cantidad_recibida >= 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(10, 2) GENERATED ALWAYS AS (cantidad_ordenada * precio_unitario) STORED,
    FOREIGN KEY (id_orden_compra) REFERENCES Ordenes_Compra(id_orden_compra) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto)
);

-- Tabla de alertas de inventario
CREATE TABLE Alertas_Inventario (
    id_alerta SERIAL PRIMARY KEY,
    id_inventario INTEGER NOT NULL,
    tipo_alerta VARCHAR(30) NOT NULL
        CHECK (tipo_alerta IN ('stock_bajo', 'stock_agotado', 'stock_excedido', 'producto_vencido')),
    mensaje TEXT NOT NULL,
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resuelta BOOLEAN DEFAULT false,
    fecha_resolucion TIMESTAMP,
    FOREIGN KEY (id_inventario) REFERENCES Inventario(id_inventario) ON DELETE CASCADE
);

CREATE INDEX idx_alertas_inventario ON Alertas_Inventario(id_inventario);
CREATE INDEX idx_alertas_resuelta ON Alertas_Inventario(resuelta);

-- ============================================
-- TABLAS CRM
-- ============================================

-- Tabla de interacciones con clientes
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
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_asignado) REFERENCES Usuarios(id_usuario)
);

CREATE INDEX idx_interacciones_cliente ON Interacciones_Cliente(id_cliente);
CREATE INDEX idx_interacciones_usuario ON Interacciones_Cliente(id_usuario_asignado);
CREATE INDEX idx_interacciones_fecha ON Interacciones_Cliente(fecha_interaccion);

-- Tabla de oportunidades de venta
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
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_asignado) REFERENCES Usuarios(id_usuario)
);

CREATE INDEX idx_oportunidades_cliente ON Oportunidades_Venta(id_cliente);
CREATE INDEX idx_oportunidades_etapa ON Oportunidades_Venta(etapa);

-- Tabla de tareas CRM
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
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_oportunidad) REFERENCES Oportunidades_Venta(id_oportunidad) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_asignado) REFERENCES Usuarios(id_usuario)
);

CREATE INDEX idx_tareas_usuario ON Tareas_CRM(id_usuario_asignado);
CREATE INDEX idx_tareas_vencimiento ON Tareas_CRM(fecha_vencimiento);

-- Tabla de segmentos de clientes
CREATE TABLE Segmentos_Cliente (
    id_segmento SERIAL PRIMARY KEY,
    nombre_segmento VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    criterios JSONB,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Cliente_Segmentos (
    id_cliente INTEGER NOT NULL,
    id_segmento INTEGER NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_cliente, id_segmento),
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_segmento) REFERENCES Segmentos_Cliente(id_segmento) ON DELETE CASCADE
);

-- Tabla de campañas de marketing
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
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Campana_Clientes (
    id_campana INTEGER NOT NULL,
    id_cliente INTEGER NOT NULL,
    fecha_envio TIMESTAMP,
    estado_envio VARCHAR(30) DEFAULT 'pendiente'
        CHECK (estado_envio IN ('pendiente', 'enviado', 'abierto', 'respondido', 'fallido')),
    fecha_apertura TIMESTAMP,
    fecha_respuesta TIMESTAMP,
    notas TEXT,
    PRIMARY KEY (id_campana, id_cliente),
    FOREIGN KEY (id_campana) REFERENCES Campanas_Marketing(id_campana) ON DELETE CASCADE,
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE
);

-- ============================================
-- FUNCIONES Y TRIGGERS PARA INVENTARIO
-- ============================================

-- Función para actualizar stock automáticamente cuando se crea una orden
CREATE OR REPLACE FUNCTION actualizar_stock_orden()
RETURNS TRIGGER AS $$
DECLARE
    v_almacen_principal INTEGER;
BEGIN
    -- Obtener el almacén principal (puedes ajustar esta lógica)
    SELECT id_almacen INTO v_almacen_principal FROM Almacenes WHERE activo = true LIMIT 1;
    
    -- Actualizar inventario
    UPDATE Inventario 
    SET cantidad_actual = cantidad_actual - NEW.cantidad
    WHERE id_producto = NEW.id_producto 
    AND id_almacen = v_almacen_principal;
    
    -- Registrar movimiento
    INSERT INTO Movimientos_Inventario (
        id_inventario, 
        tipo_movimiento, 
        cantidad, 
        cantidad_anterior, 
        cantidad_nueva, 
        id_usuario, 
        id_orden,
        motivo
    )
    SELECT 
        i.id_inventario,
        'salida',
        NEW.cantidad,
        i.cantidad_actual + NEW.cantidad,
        i.cantidad_actual,
        1, -- Usuario del sistema
        NEW.id_orden,
        'Venta - Orden #' || NEW.id_orden
    FROM Inventario i
    WHERE i.id_producto = NEW.id_producto AND i.id_almacen = v_almacen_principal;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_stock_orden
    AFTER INSERT ON Ordenes_Items
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_orden();

-- Función para generar alertas de stock bajo
CREATE OR REPLACE FUNCTION verificar_alertas_inventario()
RETURNS TRIGGER AS $$
BEGIN
    -- Alerta de stock bajo
    IF NEW.cantidad_actual <= NEW.cantidad_minima AND NEW.cantidad_actual > 0 THEN
        INSERT INTO Alertas_Inventario (id_inventario, tipo_alerta, mensaje)
        VALUES (NEW.id_inventario, 'stock_bajo', 
                'Stock bajo: ' || NEW.cantidad_actual || ' unidades disponibles');
    END IF;
    
    -- Alerta de stock agotado
    IF NEW.cantidad_actual = 0 THEN
        INSERT INTO Alertas_Inventario (id_inventario, tipo_alerta, mensaje)
        VALUES (NEW.id_inventario, 'stock_agotado', 
                'Producto agotado en almacén');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_alertas_inventario
    AFTER UPDATE ON Inventario
    FOR EACH ROW
    WHEN (OLD.cantidad_actual IS DISTINCT FROM NEW.cantidad_actual)
    EXECUTE FUNCTION verificar_alertas_inventario();

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inventario_actualizacion
    BEFORE UPDATE ON Inventario
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de inventario consolidado
CREATE VIEW vista_inventario_consolidado AS
SELECT 
    p.id_producto,
    p.nombre_producto,
    c.nombre_categoria,
    a.nombre_almacen,
    i.cantidad_actual,
    i.cantidad_minima,
    i.ubicacion_fisica,
    p.precio,
    (i.cantidad_actual * p.precio) as valor_inventario,
    CASE 
        WHEN i.cantidad_actual = 0 THEN 'Agotado'
        WHEN i.cantidad_actual <= i.cantidad_minima THEN 'Stock Bajo'
        WHEN i.cantidad_actual > i.cantidad_maxima THEN 'Sobrestock'
        ELSE 'Normal'
    END as estado_stock
FROM Inventario i
INNER JOIN Producto p ON i.id_producto = p.id_producto
INNER JOIN Categoria_Producto c ON p.id_categoria = c.id_categoria
INNER JOIN Almacenes a ON i.id_almacen = a.id_almacen
WHERE p.activo = true;

-- Vista de productos con bajo stock
CREATE VIEW vista_productos_bajo_stock AS
SELECT 
    p.id_producto,
    p.nombre_producto,
    a.nombre_almacen,
    i.cantidad_actual,
    i.cantidad_minima,
    (i.cantidad_minima - i.cantidad_actual) as cantidad_faltante
FROM Inventario i
INNER JOIN Producto p ON i.id_producto = p.id_producto
INNER JOIN Almacenes a ON i.id_almacen = a.id_almacen
WHERE i.cantidad_actual <= i.cantidad_minima
ORDER BY i.cantidad_actual ASC;

-- Vista de movimientos recientes
CREATE VIEW vista_movimientos_recientes AS
SELECT 
    m.id_movimiento,
    m.tipo_movimiento,
    m.cantidad,
    m.fecha_movimiento,
    p.nombre_producto,
    a.nombre_almacen,
    u.nombre_usuario as usuario,
    m.motivo,
    m.referencia
FROM Movimientos_Inventario m
INNER JOIN Inventario i ON m.id_inventario = i.id_inventario
INNER JOIN Producto p ON i.id_producto = p.id_producto
INNER JOIN Almacenes a ON i.id_almacen = a.id_almacen
INNER JOIN Usuarios u ON m.id_usuario = u.id_usuario
ORDER BY m.fecha_movimiento DESC;

-- Vista de clientes con actividad (CRM)
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

-- Vista de pipeline de ventas (CRM)
CREATE VIEW vista_pipeline_ventas AS
SELECT 
    ov.etapa,
    COUNT(*) as cantidad_oportunidades,
    SUM(ov.valor_estimado) as valor_total,
    AVG(ov.probabilidad_cierre) as probabilidad_promedio,
    COUNT(CASE WHEN ov.fecha_cierre_estimada < CURRENT_DATE THEN 1 END) as vencidas
FROM Oportunidades_Venta ov
WHERE ov.estado = 'activo'
GROUP BY ov.etapa;

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

-- Insertar almacenes
INSERT INTO Almacenes (nombre_almacen, direccion, responsable) VALUES
('Almacén Central', 'Zona 10, Ciudad de Guatemala', 'Carlos Méndez'),
('Bodega Auxiliar', 'Zona 12, Ciudad de Guatemala', 'Ana Rodríguez');

-- Insertar proveedores
INSERT INTO Proveedores (nombre_proveedor, contacto, email, telefono, nit) VALUES
('Distribuidora Tech GT', 'Juan López', 'ventas@techgt.com', '+502 2345-6789', '12345678-9'),
('Importaciones Express', 'María García', 'info@impexpress.com', '+502 2987-6543', '98765432-1');

-- Insertar inventario inicial
INSERT INTO Inventario (id_producto, id_almacen, cantidad_actual, cantidad_minima, ubicacion_fisica) VALUES
(1, 1, 10, 5, 'A-01'),
(2, 1, 50, 10, 'A-02'),
(3, 1, 30, 15, 'B-01'),
(4, 1, 20, 10, 'B-02'),
(5, 1, 15, 5, 'C-01');

-- Insertar segmentos CRM
INSERT INTO Segmentos_Cliente (nombre_segmento, descripcion) VALUES
('VIP', 'Clientes con compras superiores a Q5000'),
('Frecuente', 'Clientes con más de 5 compras'),
('Inactivo', 'Sin compras en los últimos 6 meses'),
('Nuevo', 'Cliente registrado hace menos de 30 días');

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE Almacenes IS 'Almacenes o bodegas del negocio';
COMMENT ON TABLE Inventario IS 'Control de stock por producto y almacén';
COMMENT ON TABLE Movimientos_Inventario IS 'Historial de todos los movimientos de inventario';
COMMENT ON TABLE Proveedores IS 'Catálogo de proveedores';
COMMENT ON TABLE Ordenes_Compra IS 'Órdenes de compra a proveedores';
COMMENT ON TABLE Alertas_Inventario IS 'Alertas automáticas de inventario';

SELECT 'Base de datos con CRM e Inventario creada exitosamente!' as mensaje;