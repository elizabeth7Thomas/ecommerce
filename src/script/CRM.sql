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
-- TABLAS DE COTIZACIONES
-- ============================================

-- Tabla para cotizaciones
CREATE TABLE Cotizaciones (
    id_cotizacion SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL,
    id_usuario_creador INTEGER NOT NULL,
    numero_cotizacion VARCHAR(50) UNIQUE NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATE,
    estado VARCHAR(20) DEFAULT 'borrador' 
        CHECK (estado IN ('borrador', 'enviada', 'aceptada', 'rechazada', 'expirada')),
    subtotal NUMERIC(10,2) DEFAULT 0,
    impuestos NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) DEFAULT 0,
    notas TEXT,
    terminos_condiciones TEXT,
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_creador) REFERENCES Usuarios(id_usuario) ON DELETE RESTRICT
);

CREATE INDEX idx_cotizaciones_cliente ON Cotizaciones(id_cliente);
CREATE INDEX idx_cotizaciones_estado ON Cotizaciones(estado);
CREATE INDEX idx_cotizaciones_fecha ON Cotizaciones(fecha_creacion);

-- Items de cotización
CREATE TABLE Cotizaciones_Items (
    id_cotizacion_item SERIAL PRIMARY KEY,
    id_cotizacion INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
    descuento_porcentaje NUMERIC(5,2) DEFAULT 0 CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
    subtotal NUMERIC(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario * (1 - descuento_porcentaje/100)) STORED,
    FOREIGN KEY (id_cotizacion) REFERENCES Cotizaciones(id_cotizacion) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto) ON DELETE RESTRICT
);

CREATE INDEX idx_cotizaciones_items_cotizacion ON Cotizaciones_Items(id_cotizacion);
CREATE INDEX idx_cotizaciones_items_producto ON Cotizaciones_Items(id_producto);

-- Conversión de cotización a orden
CREATE TABLE Cotizaciones_Ordenes (
    id_cotizacion INTEGER PRIMARY KEY,
    id_orden INTEGER NOT NULL,
    fecha_conversion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cotizacion) REFERENCES Cotizaciones(id_cotizacion) ON DELETE CASCADE,
    FOREIGN KEY (id_orden) REFERENCES Ordenes(id_orden) ON DELETE CASCADE
);

CREATE INDEX idx_cotizaciones_ordenes ON Cotizaciones_Ordenes(id_orden);

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
COMMENT ON TABLE Cotizaciones IS 'Cotizaciones de ventas para clientes';
COMMENT ON TABLE Cotizaciones_Items IS 'Items detallados de cotizaciones';
COMMENT ON TABLE Cotizaciones_Ordenes IS 'Conversión de cotizaciones a órdenes de venta';

-- ============================================
-- FUNCIONES PARA COTIZACIONES
-- ============================================

-- Función para actualizar estado de cotización expirada
CREATE OR REPLACE FUNCTION verificar_cotizacion_expirada()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fecha_expiracion IS NOT NULL AND NEW.fecha_expiracion < CURRENT_DATE 
       AND NEW.estado IN ('borrador', 'enviada') THEN
        NEW.estado := 'expirada';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cotizacion_expirada
    BEFORE UPDATE ON Cotizaciones
    FOR EACH ROW
    EXECUTE FUNCTION verificar_cotizacion_expirada();

-- Función para registrar auditoría de cambios de estado
CREATE TABLE IF NOT EXISTS Cotizaciones_Auditoria (
    id_auditoria SERIAL PRIMARY KEY,
    id_cotizacion INTEGER NOT NULL,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20),
    usuario_cambio INTEGER,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    razon TEXT,
    FOREIGN KEY (id_cotizacion) REFERENCES Cotizaciones(id_cotizacion) ON DELETE CASCADE,
    FOREIGN KEY (usuario_cambio) REFERENCES Usuarios(id_usuario)
);

-- ============================================
-- TABLAS DE DEVOLUCIONES Y REEMBOLSOS
-- ============================================

-- ============================================
-- TABLA DE SOLICITUDES DE DEVOLUCIÓN
-- ============================================
CREATE TABLE Devoluciones (
    id_devolucion SERIAL PRIMARY KEY,
    id_orden INTEGER NOT NULL,
    id_cliente INTEGER NOT NULL,
    numero_devolucion VARCHAR(50) UNIQUE NOT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobo_cliente TIMESTAMP,
    fecha_aprobacion TIMESTAMP,
    fecha_rechazo TIMESTAMP,
    fecha_completada TIMESTAMP,
    estado VARCHAR(30) DEFAULT 'solicitada' 
        CHECK (estado IN ('solicitada', 'aprobada', 'rechazada', 'en_proceso', 'completada', 'cancelada')),
    tipo_devolucion VARCHAR(20) NOT NULL 
        CHECK (tipo_devolucion IN ('devolucion_total', 'devolucion_parcial', 'cambio_producto')),
    motivo VARCHAR(100) NOT NULL 
        CHECK (motivo IN ('producto_danado', 'producto_incorrecto', 'no_cumple_esperanzas', 'talla_incorrecta', 'color_incorrecto', 'arrepentimiento', 'otro')),
    motivo_detalle TEXT,
    metodo_reembolso VARCHAR(50) 
        CHECK (metodo_reembolso IN ('original', 'credito_tienda', 'transferencia', 'efectivo')),
    monto_total_devolucion NUMERIC(10,2) DEFAULT 0,
    monto_aprobado NUMERIC(10,2) DEFAULT 0,
    costo_envio_devolucion NUMERIC(10,2) DEFAULT 0,
    quien_cubre_envio VARCHAR(20) DEFAULT 'cliente' 
        CHECK (quien_cubre_envio IN ('cliente', 'empresa')),
    guia_devolucion VARCHAR(100),
    transportista_devolucion VARCHAR(50),
    notas_internas TEXT,
    notas_cliente TEXT,
    evidencia_imagenes JSONB,
    id_usuario_aprobo INTEGER,
    FOREIGN KEY (id_orden) REFERENCES Ordenes(id_orden),
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente),
    FOREIGN KEY (id_usuario_aprobo) REFERENCES Usuarios(id_usuario)
);

CREATE INDEX idx_devoluciones_orden ON Devoluciones(id_orden);
CREATE INDEX idx_devoluciones_cliente ON Devoluciones(id_cliente);
CREATE INDEX idx_devoluciones_estado ON Devoluciones(estado);
CREATE INDEX idx_devoluciones_fecha ON Devoluciones(fecha_solicitud);

-- ============================================
-- TABLA DE ÍTEMS PARA DEVOLUCIÓN
-- ============================================
CREATE TABLE Devoluciones_Items (
    id_devolucion_item SERIAL PRIMARY KEY,
    id_devolucion INTEGER NOT NULL,
    id_orden_item INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad_solicitada INTEGER NOT NULL CHECK (cantidad_solicitada > 0),
    cantidad_aprobada INTEGER DEFAULT 0 CHECK (cantidad_aprobada >= 0),
    precio_unitario NUMERIC(10,2) NOT NULL,
    motivo_item VARCHAR(100),
    estado_item VARCHAR(30) DEFAULT 'pendiente'
        CHECK (estado_item IN ('pendiente', 'aprobado', 'rechazado', 'recibido', 'inspeccionado', 'reembolsado')),
    condicion_producto VARCHAR(50)
        CHECK (condicion_producto IN ('nuevo', 'como_nuevo', 'usado', 'danado', 'defectuoso')),
    accion_tomar VARCHAR(50)
        CHECK (accion_tomar IN ('reembolsar', 'reponer', 'credito', 'reparar', 'desechar')),
    fecha_recibido TIMESTAMP,
    fecha_inspeccion TIMESTAMP,
    notas_inspeccion TEXT,
    FOREIGN KEY (id_devolucion) REFERENCES Devoluciones(id_devolucion) ON DELETE CASCADE,
    FOREIGN KEY (id_orden_item) REFERENCES Ordenes_Items(id_orden_item),
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto)
);

CREATE INDEX idx_devoluciones_items_devolucion ON Devoluciones_Items(id_devolucion);
CREATE INDEX idx_devoluciones_items_producto ON Devoluciones_Items(id_producto);
CREATE INDEX idx_devoluciones_items_estado ON Devoluciones_Items(estado_item);

-- ============================================
-- TABLA DE REEMBOLSOS
-- ============================================
CREATE TABLE Reembolsos (
    id_reembolso SERIAL PRIMARY KEY,
    id_devolucion INTEGER NOT NULL,
    id_metodo_pago INTEGER,
    monto_reembolso NUMERIC(10,2) NOT NULL CHECK (monto_reembolso > 0),
    moneda VARCHAR(3) DEFAULT 'GTQ',
    estado_reembolso VARCHAR(30) DEFAULT 'pendiente'
        CHECK (estado_reembolso IN ('pendiente', 'procesando', 'completado', 'fallido', 'revertido')),
    fecha_solicitud_reembolso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_procesamiento TIMESTAMP,
    fecha_completado TIMESTAMP,
    transaccion_reembolso_id VARCHAR(255),
    motivo_fallo TEXT,
    id_usuario_aprobo_reembolso INTEGER,
    notas_reembolso TEXT,
    FOREIGN KEY (id_devolucion) REFERENCES Devoluciones(id_devolucion),
    FOREIGN KEY (id_metodo_pago) REFERENCES Metodos_Pago(id_metodo_pago),
    FOREIGN KEY (id_usuario_aprobo_reembolso) REFERENCES Usuarios(id_usuario)
);

CREATE INDEX idx_reembolsos_devolucion ON Reembolsos(id_devolucion);
CREATE INDEX idx_reembolsos_estado ON Reembolsos(estado_reembolso);
CREATE INDEX idx_reembolsos_fecha ON Reembolsos(fecha_solicitud_reembolso);

-- ============================================
-- TABLA DE POLÍTICAS DE DEVOLUCIÓN
-- ============================================
CREATE TABLE Politicas_Devolucion (
    id_politica SERIAL PRIMARY KEY,
    nombre_politica VARCHAR(100) NOT NULL,
    descripcion TEXT,
    dias_devolucion INTEGER NOT NULL DEFAULT 30,
    productos_permitidos JSONB,
    condiciones_aceptacion TEXT,
    metodo_reembolso_default VARCHAR(50),
    costo_envio_cliente BOOLEAN DEFAULT true,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- VISTA DE DEVOLUCIONES CON DETALLES
-- ============================================
CREATE VIEW vista_devoluciones_detalle AS
SELECT 
    d.id_devolucion,
    d.numero_devolucion,
    d.fecha_solicitud,
    d.estado,
    d.tipo_devolucion,
    d.motivo,
    d.monto_total_devolucion,
    d.monto_aprobado,
    o.id_orden,
    o.total_orden as total_orden_original,
    c.id_cliente,
    c.nombre || ' ' || c.apellido as nombre_cliente,
    u.correo_electronico,
    COUNT(di.id_devolucion_item) as total_items,
    SUM(di.cantidad_solicitada) as cantidad_total_solicitada,
    SUM(di.cantidad_aprobada) as cantidad_total_aprobada,
    CASE 
        WHEN d.fecha_completada IS NOT NULL THEN 'Completada'
        WHEN d.estado = 'rechazada' THEN 'Rechazada'
        WHEN d.estado = 'aprobada' THEN 'En proceso'
        ELSE 'Pendiente'
    END as estado_general
FROM Devoluciones d
INNER JOIN Ordenes o ON d.id_orden = o.id_orden
INNER JOIN Clientes c ON d.id_cliente = c.id_cliente
INNER JOIN Usuarios u ON c.id_usuario = u.id_usuario
LEFT JOIN Devoluciones_Items di ON d.id_devolucion = di.id_devolucion
GROUP BY d.id_devolucion, o.id_orden, c.id_cliente, u.correo_electronico;

-- ============================================
-- VISTA DE ITEMS PARA DEVOLUCIÓN
-- ============================================
CREATE VIEW vista_devoluciones_items_detalle AS
SELECT 
    di.id_devolucion_item,
    di.id_devolucion,
    d.numero_devolucion,
    di.id_producto,
    p.nombre_producto,
    di.cantidad_solicitada,
    di.cantidad_aprobada,
    di.precio_unitario,
    di.motivo_item,
    di.estado_item,
    di.condicion_producto,
    di.accion_tomar,
    oi.cantidad as cantidad_original,
    (di.cantidad_solicitada * di.precio_unitario) as monto_solicitado,
    (di.cantidad_aprobada * di.precio_unitario) as monto_aprobado
FROM Devoluciones_Items di
INNER JOIN Devoluciones d ON di.id_devolucion = d.id_devolucion
INNER JOIN Producto p ON di.id_producto = p.id_producto
INNER JOIN Ordenes_Items oi ON di.id_orden_item = oi.id_orden_item;

-- ============================================
-- VISTA DE REEMBOLSOS PENDIENTES
-- ============================================
CREATE VIEW vista_reembolsos_pendientes AS
SELECT 
    r.id_reembolso,
    r.monto_reembolso,
    r.estado_reembolso,
    r.fecha_solicitud_reembolso,
    d.numero_devolucion,
    d.id_orden,
    c.nombre || ' ' || c.apellido as cliente,
    mp.nombre_metodo as metodo_pago,
    u.nombre_usuario as aprobado_por
FROM Reembolsos r
INNER JOIN Devoluciones d ON r.id_devolucion = d.id_devolucion
INNER JOIN Clientes c ON d.id_cliente = c.id_cliente
LEFT JOIN Metodos_Pago mp ON r.id_metodo_pago = mp.id_metodo_pago
LEFT JOIN Usuarios u ON r.id_usuario_aprobo_reembolso = u.id_usuario
WHERE r.estado_reembolso IN ('pendiente', 'procesando');

-- ============================================
-- TRIGGERS PARA DEVOLUCIONES
-- ============================================

-- Función para generar número de devolución
CREATE OR REPLACE FUNCTION generar_numero_devolucion()
RETURNS TRIGGER AS $$
DECLARE
    v_count INTEGER;
    v_numero VARCHAR;
BEGIN
    IF NEW.numero_devolucion IS NULL THEN
        SELECT COUNT(*) + 1 INTO v_count FROM Devoluciones;
        NEW.numero_devolucion := 'DEV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(v_count::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_numero_devolucion
    BEFORE INSERT ON Devoluciones
    FOR EACH ROW
    EXECUTE FUNCTION generar_numero_devolucion();

-- Función para actualizar política de devoluciones
CREATE TRIGGER trigger_politicas_devolucion_actualizacion
    BEFORE UPDATE ON Politicas_Devolucion
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE Devoluciones IS 'Solicitudes de devolución y cambios de productos';
COMMENT ON TABLE Devoluciones_Items IS 'Items individuales incluidos en una devolución';
COMMENT ON TABLE Reembolsos IS 'Reembolsos de dinero asociados a devoluciones';
COMMENT ON TABLE Politicas_Devolucion IS 'Políticas de devolución configurables del sistema';

SELECT 'Base de datos con CRM, Inventario, Cotizaciones y Devoluciones creada exitosamente!' as mensaje;