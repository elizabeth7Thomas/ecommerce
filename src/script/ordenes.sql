-- ============================================
-- MIGRACIÓN SEGURA: ESTADOS DE ORDEN
-- Ejecutar DESPUÉS de tener datos en el ecommerce
-- ============================================

-- PASO 1: Verificar si ya existe la columna estado_orden
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ordenes' AND column_name = 'estado_orden'
    ) THEN
        RAISE NOTICE 'Columna estado_orden existe, procederemos con la migración';
    ELSE
        RAISE NOTICE 'Columna estado_orden NO existe, continuando...';
    END IF;
END $$;

-- ============================================
-- PASO 2: Crear tabla de estados (si no existe)
-- ============================================

CREATE TABLE IF NOT EXISTS Orden_Estados (
    id_orden_estado SERIAL PRIMARY KEY,
    codigo_estado VARCHAR(50) NOT NULL UNIQUE,
    nombre_estado VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color_hex VARCHAR(7) DEFAULT '#000000',
    icono VARCHAR(50),
    orden_secuencia INTEGER NOT NULL DEFAULT 0,
    es_estado_final BOOLEAN DEFAULT false,
    es_estado_cancelado BOOLEAN DEFAULT false,
    notificar_cliente BOOLEAN DEFAULT true,
    notificar_admin BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_orden_estados_codigo ON Orden_Estados(codigo_estado);
CREATE INDEX IF NOT EXISTS idx_orden_estados_secuencia ON Orden_Estados(orden_secuencia);
CREATE INDEX IF NOT EXISTS idx_orden_estados_activo ON Orden_Estados(activo);

-- ============================================
-- PASO 3: Insertar estados (si no existen)
-- ============================================

INSERT INTO Orden_Estados (codigo_estado, nombre_estado, descripcion, color_hex, icono, orden_secuencia, es_estado_final, es_estado_cancelado, notificar_cliente, notificar_admin) VALUES
('pendiente', 'Pendiente', 'Orden creada, esperando procesamiento', '#6c757d', 'clock', 1, false, false, true, true),
('pago_pendiente', 'Pago Pendiente', 'Esperando confirmación de pago', '#ffc107', 'credit-card', 2, false, false, true, true),
('pago_confirmado', 'Pago Confirmado', 'Pago recibido y verificado', '#17a2b8', 'check-circle', 3, false, false, true, true),
('procesando', 'Procesando', 'Orden en proceso de preparación', '#007bff', 'cog', 4, false, false, true, false),
('empaquetado', 'Empaquetado', 'Orden empaquetada, lista para envío', '#20c997', 'box', 5, false, false, true, false),
('enviado', 'Enviado', 'Orden enviada al cliente', '#fd7e14', 'truck', 6, false, false, true, false),
('en_transito', 'En Tránsito', 'Orden en camino al destino', '#fd7e14', 'shipping-fast', 7, false, false, true, false),
('en_entrega', 'En Entrega', 'Orden lista para entrega hoy', '#ff6b6b', 'map-marker-alt', 8, false, false, true, false),
('entregado', 'Entregado', 'Orden entregada exitosamente', '#28a745', 'check-double', 9, true, false, true, false),
('completado', 'Completado', 'Orden finalizada sin problemas', '#28a745', 'flag-checkered', 10, true, false, false, false),
('cancelado', 'Cancelado', 'Orden cancelada', '#dc3545', 'times-circle', 99, true, true, true, true),
('reembolsado', 'Reembolsado', 'Orden reembolsada al cliente', '#e83e8c', 'undo', 98, true, true, true, true),
('devolucion', 'En Devolución', 'Cliente solicitó devolución', '#6f42c1', 'exchange-alt', 97, false, false, true, true),
('devuelto', 'Devuelto', 'Producto devuelto', '#6f42c1', 'reply', 96, true, false, true, true),
('fallido', 'Fallido', 'Intento de entrega fallido', '#dc3545', 'exclamation-triangle', 95, false, false, true, true)
ON CONFLICT (codigo_estado) DO NOTHING;

-- ============================================
-- PASO 4: Agregar nueva columna id_estado_orden (si no existe)
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ordenes' AND column_name = 'id_estado_orden'
    ) THEN
        ALTER TABLE Ordenes ADD COLUMN id_estado_orden INTEGER;
        RAISE NOTICE 'Columna id_estado_orden agregada';
    ELSE
        RAISE NOTICE 'Columna id_estado_orden ya existe';
    END IF;
END $$;

-- ============================================
-- PASO 5: MIGRAR DATOS de estado_orden a id_estado_orden
-- ============================================

-- Solo si existe la columna estado_orden antigua
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ordenes' AND column_name = 'estado_orden'
    ) THEN
        -- Migrar datos existentes
        UPDATE Ordenes o
        SET id_estado_orden = (
            SELECT e.id_orden_estado 
            FROM Orden_Estados e
            WHERE e.codigo_estado = o.estado_orden
            LIMIT 1
        )
        WHERE o.id_estado_orden IS NULL;
        
        RAISE NOTICE 'Datos migrados de estado_orden a id_estado_orden';
    END IF;
END $$;

-- ============================================
-- PASO 6: Agregar Foreign Key
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_ordenes_estado' 
        AND table_name = 'ordenes'
    ) THEN
        ALTER TABLE Ordenes
        ADD CONSTRAINT fk_ordenes_estado
            FOREIGN KEY (id_estado_orden) REFERENCES Orden_Estados(id_orden_estado);
        
        RAISE NOTICE 'Foreign key fk_ordenes_estado creada';
    ELSE
        RAISE NOTICE 'Foreign key fk_ordenes_estado ya existe';
    END IF;
END $$;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_ordenes_estado_normalizado ON Ordenes(id_estado_orden);

-- ============================================
-- PASO 7: Agregar columnas adicionales
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ordenes' AND column_name = 'fecha_estado_cambio'
    ) THEN
        ALTER TABLE Ordenes ADD COLUMN fecha_estado_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Columna fecha_estado_cambio agregada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ordenes' AND column_name = 'dias_estimados_entrega'
    ) THEN
        ALTER TABLE Ordenes ADD COLUMN dias_estimados_entrega INTEGER;
        RAISE NOTICE 'Columna dias_estimados_entrega agregada';
    END IF;
END $$;

-- ============================================
-- PASO 8: OPCIONAL - Eliminar columna antigua estado_orden
-- ADVERTENCIA: Solo ejecutar si estás seguro de que la migración funcionó
-- ============================================

-- DESCOMENTAR SOLO SI ESTÁS SEGURO:
-- ALTER TABLE Ordenes DROP CONSTRAINT IF EXISTS ordenes_estado_orden_check;
-- ALTER TABLE Ordenes DROP COLUMN IF EXISTS estado_orden;
-- RAISE NOTICE 'Columna estado_orden eliminada (OPCIONAL)';

-- ============================================
-- PASO 9: Crear tabla de transiciones
-- ============================================

CREATE TABLE IF NOT EXISTS Orden_Estado_Transiciones (
    id_transicion SERIAL PRIMARY KEY,
    id_estado_origen INTEGER NOT NULL,
    id_estado_destino INTEGER NOT NULL,
    requiere_permiso BOOLEAN DEFAULT false,
    rol_requerido VARCHAR(50),
    validacion_requerida BOOLEAN DEFAULT false,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    FOREIGN KEY (id_estado_origen) REFERENCES Orden_Estados(id_orden_estado) ON DELETE CASCADE,
    FOREIGN KEY (id_estado_destino) REFERENCES Orden_Estados(id_orden_estado) ON DELETE CASCADE,
    UNIQUE (id_estado_origen, id_estado_destino)
);

CREATE INDEX IF NOT EXISTS idx_transiciones_origen ON Orden_Estado_Transiciones(id_estado_origen);
CREATE INDEX IF NOT EXISTS idx_transiciones_destino ON Orden_Estado_Transiciones(id_estado_destino);

-- Insertar transiciones permitidas
INSERT INTO Orden_Estado_Transiciones (id_estado_origen, id_estado_destino, requiere_permiso, descripcion) VALUES
(1, 2, false, 'De pendiente a pago pendiente'),
(1, 11, false, 'Cancelar orden pendiente'),
(2, 3, false, 'Confirmar pago'),
(2, 11, false, 'Cancelar por falta de pago'),
(3, 4, false, 'Iniciar procesamiento'),
(3, 11, true, 'Cancelar con pago confirmado'),
(4, 5, false, 'Empaquetar orden'),
(4, 11, true, 'Cancelar orden en proceso'),
(5, 6, false, 'Enviar orden'),
(5, 4, false, 'Volver a procesamiento'),
(6, 7, false, 'Orden en tránsito'),
(6, 15, false, 'Marcar entrega fallida'),
(7, 8, false, 'Orden lista para entrega'),
(7, 15, false, 'Intento de entrega fallido'),
(8, 9, false, 'Confirmar entrega'),
(8, 15, false, 'Entrega fallida'),
(9, 10, false, 'Completar orden'),
(9, 13, false, 'Cliente solicita devolución'),
(10, 13, true, 'Permitir devolución de orden completada'),
(15, 8, false, 'Reintentar entrega'),
(15, 11, true, 'Cancelar tras múltiples fallos'),
(13, 14, false, 'Confirmar devolución recibida'),
(13, 12, true, 'Procesar reembolso'),
(14, 12, false, 'Reembolsar tras devolución')
ON CONFLICT (id_estado_origen, id_estado_destino) DO NOTHING;

-- ============================================
-- PASO 10: Crear tabla de historial
-- ============================================

CREATE TABLE IF NOT EXISTS Orden_Estado_Historial (
    id_historial SERIAL PRIMARY KEY,
    id_orden INTEGER NOT NULL,
    id_estado_anterior INTEGER,
    id_estado_nuevo INTEGER NOT NULL,
    id_usuario INTEGER,
    comentario TEXT,
    metadata JSONB,
    ip_origen VARCHAR(50),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_orden) REFERENCES Ordenes(id_orden) ON DELETE CASCADE,
    FOREIGN KEY (id_estado_anterior) REFERENCES Orden_Estados(id_orden_estado),
    FOREIGN KEY (id_estado_nuevo) REFERENCES Orden_Estados(id_orden_estado),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_historial_orden ON Orden_Estado_Historial(id_orden);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON Orden_Estado_Historial(fecha_cambio);
CREATE INDEX IF NOT EXISTS idx_historial_usuario ON Orden_Estado_Historial(id_usuario);
CREATE INDEX IF NOT EXISTS idx_historial_estado_nuevo ON Orden_Estado_Historial(id_estado_nuevo);

-- ============================================
-- PASO 11: Crear trigger para historial automático
-- ============================================

CREATE OR REPLACE FUNCTION registrar_cambio_estado_orden()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar si el estado cambió
    IF OLD.id_estado_orden IS DISTINCT FROM NEW.id_estado_orden THEN
        INSERT INTO Orden_Estado_Historial (
            id_orden,
            id_estado_anterior,
            id_estado_nuevo,
            comentario
        ) VALUES (
            NEW.id_orden,
            OLD.id_estado_orden,
            NEW.id_estado_orden,
            'Cambio automático de estado'
        );
        
        -- Actualizar fecha de cambio de estado
        NEW.fecha_estado_cambio = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si existe y recrear
DROP TRIGGER IF EXISTS trigger_registrar_cambio_estado ON Ordenes;

CREATE TRIGGER trigger_registrar_cambio_estado
    BEFORE UPDATE ON Ordenes
    FOR EACH ROW
    WHEN (OLD.id_estado_orden IS DISTINCT FROM NEW.id_estado_orden)
    EXECUTE FUNCTION registrar_cambio_estado_orden();

-- ============================================
-- PASO 12: Poblar historial con datos existentes
-- ============================================

-- Registrar estado inicial de todas las órdenes existentes
INSERT INTO Orden_Estado_Historial (id_orden, id_estado_anterior, id_estado_nuevo, comentario)
SELECT 
    o.id_orden,
    NULL,
    o.id_estado_orden,
    'Estado inicial registrado en migración'
FROM Ordenes o
WHERE o.id_estado_orden IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM Orden_Estado_Historial h 
    WHERE h.id_orden = o.id_orden
);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

DO $$ 
DECLARE
    v_ordenes_total INTEGER;
    v_ordenes_migradas INTEGER;
    v_ordenes_sin_migrar INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_ordenes_total FROM Ordenes;
    SELECT COUNT(*) INTO v_ordenes_migradas FROM Ordenes WHERE id_estado_orden IS NOT NULL;
    v_ordenes_sin_migrar := v_ordenes_total - v_ordenes_migradas;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMEN DE MIGRACIÓN';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de órdenes: %', v_ordenes_total;
    RAISE NOTICE 'Órdenes migradas: %', v_ordenes_migradas;
    RAISE NOTICE 'Órdenes sin migrar: %', v_ordenes_sin_migrar;
    RAISE NOTICE '========================================';
    
    IF v_ordenes_sin_migrar > 0 THEN
        RAISE WARNING 'Hay % órdenes sin migrar. Revisar manualmente.', v_ordenes_sin_migrar;
    ELSE
        RAISE NOTICE '✓ Migración completada exitosamente';
    END IF;
END $$;

-- Consulta para verificar datos
SELECT 
    'Orden Estados' as tabla,
    COUNT(*) as registros
FROM Orden_Estados
UNION ALL
SELECT 
    'Transiciones' as tabla,
    COUNT(*) as registros
FROM Orden_Estado_Transiciones
UNION ALL
SELECT 
    'Historial' as tabla,
    COUNT(*) as registros
FROM Orden_Estado_Historial
UNION ALL
SELECT 
    'Ordenes con estado' as tabla,
    COUNT(*) as registros
FROM Ordenes
WHERE id_estado_orden IS NOT NULL;

SELECT '✓ Migración de Estados de Orden completada!' as mensaje;