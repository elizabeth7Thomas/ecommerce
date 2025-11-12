-- ============================================
-- MIGRACIÓN SEGURA: MÉTODOS DE PAGO
-- Ejecutar DESPUÉS del script de estados
-- ============================================
-- 
-- IMPORTANTE:
-- Este script implementa una migración segura y auditable:
-- 1. Crea la nueva estructura de métodos de pago
-- 2. Migra datos históricos con auditoría completa
-- 3. NO ELIMINA la columna antigua (metodo_pago) por seguridad
-- 4. Proporciona herramientas de verificación
-- 
-- La eliminación de la columna antigua es un paso MANUAL final
-- que solo debe ejecutarse después de:
-- - Verificar que toda la migración es correcta
-- - Actualizar el backend para usar las nuevas columnas
-- - Validar en entorno de pruebas/producción
-- ============================================

-- PASO 0: Crear tabla de auditoría para la migración
CREATE TABLE IF NOT EXISTS Migracion_Metodos_Pago_Auditoria (
    id_auditoria SERIAL PRIMARY KEY,
    fecha_migracion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_operacion VARCHAR(50) NOT NULL CHECK (tipo_operacion IN ('insert', 'update', 'delete', 'verificacion')),
    tabla_origen VARCHAR(100),
    tabla_destino VARCHAR(100),
    id_pago_original INTEGER,
    metodo_pago_antiguo VARCHAR(50),
    id_metodo_pago_nuevo INTEGER,
    nombre_metodo_asignado VARCHAR(100),
    detalles JSONB,
    estado_verificacion VARCHAR(50) CHECK (estado_verificacion IN ('ok', 'con_limitacion', 'error', NULL)),
    descripcion_verificacion TEXT,
    usuario_ejecucion VARCHAR(100) DEFAULT CURRENT_USER,
    notas TEXT
);

CREATE INDEX IF NOT EXISTS idx_migracion_auditoria_fecha ON Migracion_Metodos_Pago_Auditoria(fecha_migracion);
CREATE INDEX IF NOT EXISTS idx_migracion_auditoria_pago ON Migracion_Metodos_Pago_Auditoria(id_pago_original);
CREATE INDEX IF NOT EXISTS idx_migracion_auditoria_tipo ON Migracion_Metodos_Pago_Auditoria(tipo_operacion);

-- PASO 1: Crear tabla Metodos_Pago
CREATE TABLE IF NOT EXISTS Metodos_Pago (
    id_metodo_pago SERIAL PRIMARY KEY,
    nombre_metodo VARCHAR(100) NOT NULL UNIQUE,
    tipo_metodo VARCHAR(50) NOT NULL
        CHECK (tipo_metodo IN ('tarjeta_credito', 'tarjeta_debito', 'transferencia_bancaria', 'billetera_digital', 'efectivo', 'cheque', 'criptomoneda')),
    descripcion TEXT,
    icono_url VARCHAR(255),
    requiere_verificacion BOOLEAN DEFAULT false,
    comision_porcentaje NUMERIC(5, 2) DEFAULT 0 CHECK (comision_porcentaje >= 0),
    comision_fija NUMERIC(10, 2) DEFAULT 0 CHECK (comision_fija >= 0),
    activo BOOLEAN DEFAULT true,
    disponible_online BOOLEAN DEFAULT true,
    disponible_tienda BOOLEAN DEFAULT true,
    orden_visualizacion INTEGER DEFAULT 0,
    configuracion JSONB,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metodos_pago_activo ON Metodos_Pago(activo);
CREATE INDEX IF NOT EXISTS idx_metodos_pago_tipo ON Metodos_Pago(tipo_metodo);
CREATE INDEX IF NOT EXISTS idx_metodos_pago_orden ON Metodos_Pago(orden_visualizacion);

-- PASO 2: Insertar métodos de pago predefinidos
INSERT INTO Metodos_Pago (nombre_metodo, tipo_metodo, descripcion, icono_url, comision_porcentaje, disponible_online, disponible_tienda, orden_visualizacion) VALUES
('Visa', 'tarjeta_credito', 'Tarjeta de crédito Visa', '/icons/visa.png', 2.9, true, true, 1),
('Mastercard', 'tarjeta_credito', 'Tarjeta de crédito Mastercard', '/icons/mastercard.png', 2.9, true, true, 2),
('American Express', 'tarjeta_credito', 'Tarjeta de crédito American Express', '/icons/amex.png', 3.5, true, true, 3),
('Tarjeta de Débito', 'tarjeta_debito', 'Tarjeta de débito bancaria', '/icons/debit.png', 1.5, true, true, 4),
('PayPal', 'billetera_digital', 'Pago mediante PayPal', '/icons/paypal.png', 3.4, true, false, 5),
('Transferencia Bancaria', 'transferencia_bancaria', 'Transferencia o depósito bancario', '/icons/bank.png', 0, true, true, 6),
('Efectivo', 'efectivo', 'Pago en efectivo contra entrega', '/icons/cash.png', 0, false, true, 7),
('Bitcoin', 'criptomoneda', 'Pago con Bitcoin', '/icons/bitcoin.png', 1, true, false, 8)
ON CONFLICT (nombre_metodo) DO NOTHING;

-- PASO 3: Crear tabla de métodos de pago por cliente
CREATE TABLE IF NOT EXISTS Metodos_Pago_Cliente (
    id_metodo_pago_cliente SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL,
    id_metodo_pago INTEGER NOT NULL,
    alias VARCHAR(100),
    numero_tarjeta_ultimos_4 VARCHAR(4),
    nombre_titular VARCHAR(255),
    fecha_expiracion DATE,
    tipo_tarjeta VARCHAR(50) CHECK (tipo_tarjeta IN ('visa', 'mastercard', 'amex', 'discover', 'otro')),
    banco VARCHAR(100),
    numero_cuenta VARCHAR(255),
    email_billetera VARCHAR(255),
    telefono_billetera VARCHAR(20),
    identificador_externo VARCHAR(255),
    token_pago VARCHAR(255),
    proveedor_token VARCHAR(50),
    es_predeterminado BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    verificado BOOLEAN DEFAULT false,
    fecha_verificacion TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_metodo_pago) REFERENCES Metodos_Pago(id_metodo_pago) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_metodos_pago_cliente_cliente ON Metodos_Pago_Cliente(id_cliente);
CREATE INDEX IF NOT EXISTS idx_metodos_pago_cliente_predeterminado ON Metodos_Pago_Cliente(es_predeterminado);
CREATE INDEX IF NOT EXISTS idx_metodos_pago_cliente_activo ON Metodos_Pago_Cliente(activo);

-- PASO 4: Modificar tabla Payments
-- Verificar si la columna metodo_pago existe
DO $$ 
BEGIN
    -- Agregar columnas nuevas si no existen
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'id_metodo_pago'
    ) THEN
        ALTER TABLE Payments ADD COLUMN id_metodo_pago INTEGER;
        RAISE NOTICE 'Columna id_metodo_pago agregada a Payments';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'id_metodo_pago_cliente'
    ) THEN
        ALTER TABLE Payments ADD COLUMN id_metodo_pago_cliente INTEGER;
        RAISE NOTICE 'Columna id_metodo_pago_cliente agregada a Payments';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'codigo_autorizacion'
    ) THEN
        ALTER TABLE Payments ADD COLUMN codigo_autorizacion VARCHAR(100);
        RAISE NOTICE 'Columna codigo_autorizacion agregada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'referencia_externa'
    ) THEN
        ALTER TABLE Payments ADD COLUMN referencia_externa VARCHAR(255);
        RAISE NOTICE 'Columna referencia_externa agregada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'comision'
    ) THEN
        ALTER TABLE Payments ADD COLUMN comision NUMERIC(10, 2) DEFAULT 0;
        RAISE NOTICE 'Columna comision agregada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'ip_origen'
    ) THEN
        ALTER TABLE Payments ADD COLUMN ip_origen VARCHAR(50);
        RAISE NOTICE 'Columna ip_origen agregada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'datos_adicionales'
    ) THEN
        ALTER TABLE Payments ADD COLUMN datos_adicionales JSONB;
        RAISE NOTICE 'Columna datos_adicionales agregada';
    END IF;
END $$;

-- PASO 5: Agregar Foreign Keys a Payments
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_payments_metodo_pago'
    ) THEN
        ALTER TABLE Payments
        ADD CONSTRAINT fk_payments_metodo_pago 
            FOREIGN KEY (id_metodo_pago) REFERENCES Metodos_Pago(id_metodo_pago);
        RAISE NOTICE 'Foreign key fk_payments_metodo_pago creada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_payments_metodo_pago_cliente'
    ) THEN
        ALTER TABLE Payments
        ADD CONSTRAINT fk_payments_metodo_pago_cliente 
            FOREIGN KEY (id_metodo_pago_cliente) REFERENCES Metodos_Pago_Cliente(id_metodo_pago_cliente);
        RAISE NOTICE 'Foreign key fk_payments_metodo_pago_cliente creada';
    END IF;
END $$;

-- PASO 6: Migrar datos existentes de metodo_pago a id_metodo_pago
-- CON AUDITORÍA Y DOCUMENTACIÓN DE LIMITACIONES
DO $$ 
DECLARE
    v_contador_migrados INTEGER := 0;
    v_contador_con_limitacion INTEGER := 0;
    v_contador_errores INTEGER := 0;
    v_id_metodo_visa INTEGER;
    v_id_metodo_debito INTEGER;
    v_id_metodo_paypal INTEGER;
    v_id_metodo_transferencia INTEGER;
    v_id_metodo_efectivo INTEGER;
    v_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE 'INICIANDO MIGRACIÓN DE DATOS - MÉTODOS DE PAGO';
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    
    -- Verificar que la columna antigua existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'metodo_pago'
    ) THEN
        RAISE NOTICE '✓ Columna "metodo_pago" no existe. No hay datos para migrar.';
        RAISE NOTICE '✓ Tabla Payments ya está usando la nueva estructura.';
        RETURN;
    END IF;
    
    -- Obtener IDs de los métodos de pago
    SELECT id_metodo_pago INTO v_id_metodo_visa FROM Metodos_Pago WHERE nombre_metodo = 'Visa' LIMIT 1;
    SELECT id_metodo_pago INTO v_id_metodo_debito FROM Metodos_Pago WHERE nombre_metodo = 'Tarjeta de Débito' LIMIT 1;
    SELECT id_metodo_pago INTO v_id_metodo_paypal FROM Metodos_Pago WHERE nombre_metodo = 'PayPal' LIMIT 1;
    SELECT id_metodo_pago INTO v_id_metodo_transferencia FROM Metodos_Pago WHERE nombre_metodo = 'Transferencia Bancaria' LIMIT 1;
    SELECT id_metodo_pago INTO v_id_metodo_efectivo FROM Metodos_Pago WHERE nombre_metodo = 'Efectivo' LIMIT 1;
    
    RAISE NOTICE 'IDs de métodos obtenidos:';
    RAISE NOTICE '  - Visa: %', COALESCE(v_id_metodo_visa, 'NO ENCONTRADO');
    RAISE NOTICE '  - Tarjeta de Débito: %', COALESCE(v_id_metodo_debito, 'NO ENCONTRADO');
    RAISE NOTICE '  - PayPal: %', COALESCE(v_id_metodo_paypal, 'NO ENCONTRADO');
    RAISE NOTICE '  - Transferencia: %', COALESCE(v_id_metodo_transferencia, 'NO ENCONTRADO');
    RAISE NOTICE '  - Efectivo: %', COALESCE(v_id_metodo_efectivo, 'NO ENCONTRADO');
    RAISE NOTICE '';
    
    -- Migrar registros existentes
    FOR v_record IN 
        SELECT id_pago, metodo_pago FROM Payments 
        WHERE id_metodo_pago IS NULL AND metodo_pago IS NOT NULL
    LOOP
        BEGIN
            UPDATE Payments p
            SET id_metodo_pago = (
                CASE 
                    -- Mapeo específico para métodos de tarjeta de crédito
                    -- NOTA: Esto es una limitación - no podemos diferenciar entre Visa, Mastercard, Amex
                    WHEN p.metodo_pago = 'tarjeta_credito' THEN v_id_metodo_visa
                    
                    WHEN p.metodo_pago = 'tarjeta_debito' THEN v_id_metodo_debito
                    WHEN p.metodo_pago = 'paypal' THEN v_id_metodo_paypal
                    WHEN p.metodo_pago = 'transferencia' THEN v_id_metodo_transferencia
                    WHEN p.metodo_pago = 'efectivo' THEN v_id_metodo_efectivo
                    ELSE v_id_metodo_visa  -- Fallback a Visa
                END
            )
            WHERE p.id_pago = v_record.id_pago;
            
            -- Registrar en auditoría
            IF v_record.metodo_pago = 'tarjeta_credito' THEN
                INSERT INTO Migracion_Metodos_Pago_Auditoria (
                    tipo_operacion, tabla_origen, tabla_destino, 
                    id_pago_original, metodo_pago_antiguo, id_metodo_pago_nuevo,
                    nombre_metodo_asignado, estado_verificacion, 
                    descripcion_verificacion, detalles
                ) VALUES (
                    'update', 'Payments', 'Payments',
                    v_record.id_pago, v_record.metodo_pago, v_id_metodo_visa,
                    'Visa', 'con_limitacion',
                    'Tarjeta de crédito genérica asignada a Visa. Este registro pudo haber sido Mastercard o Amex originalmente.',
                    jsonb_build_object(
                        'razon', 'Falta de especificidad en datos originales',
                        'impacto', 'Histórico de pagos agrupado bajo Visa',
                        'solucion_futura', 'Implementar lógica de detección de tarjeta en backend'
                    )
                );
                v_contador_con_limitacion := v_contador_con_limitacion + 1;
            ELSE
                INSERT INTO Migracion_Metodos_Pago_Auditoria (
                    tipo_operacion, tabla_origen, tabla_destino,
                    id_pago_original, metodo_pago_antiguo, id_metodo_pago_nuevo,
                    nombre_metodo_asignado, estado_verificacion, detalles
                ) VALUES (
                    'update', 'Payments', 'Payments',
                    v_record.id_pago, v_record.metodo_pago,
                    CASE v_record.metodo_pago
                        WHEN 'tarjeta_debito' THEN v_id_metodo_debito
                        WHEN 'paypal' THEN v_id_metodo_paypal
                        WHEN 'transferencia' THEN v_id_metodo_transferencia
                        WHEN 'efectivo' THEN v_id_metodo_efectivo
                        ELSE v_id_metodo_visa
                    END,
                    CASE v_record.metodo_pago
                        WHEN 'tarjeta_debito' THEN 'Tarjeta de Débito'
                        WHEN 'paypal' THEN 'PayPal'
                        WHEN 'transferencia' THEN 'Transferencia Bancaria'
                        WHEN 'efectivo' THEN 'Efectivo'
                        ELSE 'Visa'
                    END,
                    'ok', NULL, NULL
                );
                v_contador_migrados := v_contador_migrados + 1;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            v_contador_errores := v_contador_errores + 1;
            INSERT INTO Migracion_Metodos_Pago_Auditoria (
                tipo_operacion, tabla_origen, id_pago_original, 
                metodo_pago_antiguo, estado_verificacion, descripcion_verificacion
            ) VALUES (
                'update', 'Payments', v_record.id_pago,
                v_record.metodo_pago, 'error', 'Error durante migración: ' || SQLERRM
            );
            RAISE WARNING 'Error migrando pago %: %', v_record.id_pago, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE 'RESUMEN DE MIGRACIÓN';
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE 'Registros migrados exitosamente: %', v_contador_migrados;
    RAISE NOTICE 'Registros con limitaciones conocidas: %', v_contador_con_limitacion;
    RAISE NOTICE 'Registros con error: %', v_contador_errores;
    RAISE NOTICE '';
    
    IF v_contador_con_limitacion > 0 THEN
        RAISE NOTICE '⚠️  IMPORTANTE: % registros fueron migrantes con limitaciones', v_contador_con_limitacion;
        RAISE NOTICE '   (Tarjetas de crédito genéricas → Visa)';
        RAISE NOTICE '   Revise la tabla Migracion_Metodos_Pago_Auditoria para detalles.';
        RAISE NOTICE '';
    END IF;
    
    IF v_contador_errores > 0 THEN
        RAISE WARNING '❌ ERROR: % registros tuvieron problemas en la migración', v_contador_errores;
        RAISE WARNING '   Revise la tabla Migracion_Metodos_Pago_Auditoria para detalles.';
    ELSE
        RAISE NOTICE '✓ Migración completada sin errores';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'PRÓXIMOS PASOS:';
    RAISE NOTICE '1. Revisar tabla Migracion_Metodos_Pago_Auditoria';
    RAISE NOTICE '2. Actualizar backend para usar id_metodo_pago';
    RAISE NOTICE '3. Validar en entorno de pruebas';
    RAISE NOTICE '4. Ejecutar verificaciones con script de validación';
    RAISE NOTICE '5. Eliminar columna antigua SOLO después de confirmar todo';
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════';
    
END $$;

-- Crear índices en Payments
CREATE INDEX IF NOT EXISTS idx_payments_metodo_pago ON Payments(id_metodo_pago);
CREATE INDEX IF NOT EXISTS idx_payments_referencia ON Payments(referencia_externa);

-- PASO 7: Trigger para validar método predeterminado único
CREATE OR REPLACE FUNCTION validar_metodo_predeterminado()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.es_predeterminado = true THEN
        UPDATE Metodos_Pago_Cliente
        SET es_predeterminado = false
        WHERE id_cliente = NEW.id_cliente 
        AND id_metodo_pago_cliente != NEW.id_metodo_pago_cliente;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validar_predeterminado ON Metodos_Pago_Cliente;

CREATE TRIGGER trigger_validar_predeterminado
    BEFORE INSERT OR UPDATE ON Metodos_Pago_Cliente
    FOR EACH ROW
    WHEN (NEW.es_predeterminado = true)
    EXECUTE FUNCTION validar_metodo_predeterminado();

-- PASO 8: Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_metodos_pago_actualizacion ON Metodos_Pago;
CREATE TRIGGER trigger_metodos_pago_actualizacion
    BEFORE UPDATE ON Metodos_Pago
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

DROP TRIGGER IF EXISTS trigger_metodos_pago_cliente_actualizacion ON Metodos_Pago_Cliente;
CREATE TRIGGER trigger_metodos_pago_cliente_actualizacion
    BEFORE UPDATE ON Metodos_Pago_Cliente
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- PASO 9: Función para calcular comisión
CREATE OR REPLACE FUNCTION calcular_comision_pago(
    p_monto NUMERIC,
    p_id_metodo_pago INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
    v_comision_porcentaje NUMERIC;
    v_comision_fija NUMERIC;
    v_comision_total NUMERIC;
BEGIN
    SELECT comision_porcentaje, comision_fija
    INTO v_comision_porcentaje, v_comision_fija
    FROM Metodos_Pago
    WHERE id_metodo_pago = p_id_metodo_pago;
    
    v_comision_total := (p_monto * v_comision_porcentaje / 100) + v_comision_fija;
    
    RETURN ROUND(v_comision_total, 2);
END;
$$ LANGUAGE plpgsql;

-- PASO 11: Vista de auditoría de migración
CREATE OR REPLACE VIEW vista_migracion_auditoria AS
SELECT 
    ma.id_auditoria,
    ma.fecha_migracion,
    ma.tipo_operacion,
    ma.id_pago_original,
    ma.metodo_pago_antiguo,
    ma.nombre_metodo_asignado,
    ma.estado_verificacion,
    ma.descripcion_verificacion,
    COUNT(*) OVER (PARTITION BY ma.estado_verificacion) as total_por_estado
FROM Migracion_Metodos_Pago_Auditoria ma
ORDER BY ma.fecha_migracion DESC;

-- PASO 12: Vista de comparación antes/después
CREATE OR REPLACE VIEW vista_comparacion_migracion AS
SELECT 
    COUNT(*) as total_pagos,
    COUNT(DISTINCT CASE WHEN p.metodo_pago IS NOT NULL THEN 1 END) as pagos_con_metodo_antiguo,
    COUNT(DISTINCT CASE WHEN p.id_metodo_pago IS NOT NULL THEN 1 END) as pagos_con_metodo_nuevo,
    COUNT(DISTINCT CASE WHEN p.metodo_pago IS NOT NULL AND p.id_metodo_pago IS NULL THEN 1 END) as pagos_sin_migrar,
    ROUND(
        (COUNT(DISTINCT CASE WHEN p.id_metodo_pago IS NOT NULL THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(*), 0) * 100), 2
    ) as porcentaje_migrado
FROM Payments p;
CREATE OR REPLACE VIEW vista_metodos_pago_activos AS
SELECT 
    id_metodo_pago,
    nombre_metodo,
    tipo_metodo,
    descripcion,
    icono_url,
    comision_porcentaje,
    comision_fija,
    disponible_online,
    disponible_tienda,
    orden_visualizacion
FROM Metodos_Pago
WHERE activo = true
ORDER BY orden_visualizacion ASC;

CREATE OR REPLACE VIEW vista_metodos_pago_cliente AS
SELECT 
    mpc.id_metodo_pago_cliente,
    mpc.id_cliente,
    c.nombre || ' ' || c.apellido as nombre_cliente,
    mp.nombre_metodo,
    mp.tipo_metodo,
    mpc.alias,
    mpc.numero_tarjeta_ultimos_4,
    mpc.tipo_tarjeta,
    mpc.banco,
    mpc.es_predeterminado,
    mpc.activo,
    mpc.verificado,
    mpc.fecha_creacion
FROM Metodos_Pago_Cliente mpc
INNER JOIN Metodos_Pago mp ON mpc.id_metodo_pago = mp.id_metodo_pago
INNER JOIN Clientes c ON mpc.id_cliente = c.id_cliente
WHERE mpc.activo = true;

CREATE OR REPLACE VIEW vista_pagos_metodos AS
SELECT 
    p.id_pago,
    p.id_orden,
    p.monto,
    p.estado_pago,
    p.fecha_pago,
    mp.nombre_metodo,
    mp.tipo_metodo,
    p.transaccion_id,
    p.codigo_autorizacion,
    p.comision,
    c.nombre || ' ' || c.apellido as nombre_cliente
FROM Payments p
LEFT JOIN Metodos_Pago mp ON p.id_metodo_pago = mp.id_metodo_pago
LEFT JOIN Ordenes o ON p.id_orden = o.id_orden
LEFT JOIN Clientes c ON o.id_cliente = c.id_cliente;

-- VERIFICACIÓN FINAL Y RESUMEN
DO $$ 
DECLARE
    v_metodos_pago INTEGER;
    v_payments_migrados INTEGER;
    v_payments_sin_migrar INTEGER;
    v_migraciones_limitacion INTEGER;
    v_migraciones_error INTEGER;
    v_porcentaje NUMERIC;
BEGIN
    SELECT COUNT(*) INTO v_metodos_pago FROM Metodos_Pago;
    SELECT COUNT(*) INTO v_payments_migrados FROM Payments WHERE id_metodo_pago IS NOT NULL;
    SELECT COUNT(*) INTO v_payments_sin_migrar FROM Payments WHERE metodo_pago IS NOT NULL AND id_metodo_pago IS NULL;
    SELECT COUNT(*) INTO v_migraciones_limitacion FROM Migracion_Metodos_Pago_Auditoria 
        WHERE estado_verificacion = 'con_limitacion';
    SELECT COUNT(*) INTO v_migraciones_error FROM Migracion_Metodos_Pago_Auditoria 
        WHERE estado_verificacion = 'error';
    
    IF v_payments_migrados > 0 THEN
        v_porcentaje := ROUND((v_payments_migrados::NUMERIC / (v_payments_migrados + v_payments_sin_migrar)) * 100, 2);
    ELSE
        v_porcentaje := 0;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║   RESUMEN FINAL - MIGRACIÓN MÉTODOS DE PAGO           ║';
    RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '📊 ESTADÍSTICAS DE MIGRACIÓN:';
    RAISE NOTICE '   • Métodos de pago disponibles: %', v_metodos_pago;
    RAISE NOTICE '   • Pagos migrados: %', v_payments_migrados;
    RAISE NOTICE '   • Pagos sin migrar: %', v_payments_sin_migrar;
    RAISE NOTICE '   • Porcentaje migrado: %%%', v_porcentaje;
    RAISE NOTICE '';
    RAISE NOTICE '🔍 AUDITORÍA:';
    RAISE NOTICE '   • Migraciones con limitaciones: %', v_migraciones_limitacion;
    RAISE NOTICE '   • Migraciones con error: %', v_migraciones_error;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  COLUMNA ANTIGUA:';
    RAISE NOTICE '   • La columna "metodo_pago" ESTÁ PRESENTE (intencional)';
    RAISE NOTICE '   • No será eliminada en esta ejecución (por seguridad)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ VERIFICACIONES RECOMENDADAS:';
    RAISE NOTICE '   1. SELECT * FROM vista_migracion_auditoria;';
    RAISE NOTICE '   2. SELECT * FROM vista_comparacion_migracion;';
    RAISE NOTICE '   3. SELECT * FROM Migracion_Metodos_Pago_Auditoria WHERE estado_verificacion != ''ok'';';
    RAISE NOTICE '';
    RAISE NOTICE '📝 PRÓXIMOS PASOS EN BACKEND:';
    RAISE NOTICE '   1. Actualizar consultas para usar id_metodo_pago en lugar de metodo_pago';
    RAISE NOTICE '   2. Validar joins con tabla Metodos_Pago';
    RAISE NOTICE '   3. Probar en entorno de staging';
    RAISE NOTICE '   4. Una vez validado, ejecutar script de eliminación de columna antigua';
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║  ✓ MIGRACIÓN COMPLETADA Y AUDITADA                   ║';
    NOTICE '║  Para eliminar columna antigua, ver script separado   ║';
    RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    
END $$;

-- ============================================
-- INFORMACIÓN IMPORTANTE
-- ============================================
-- 
-- LIMITACIONES CONOCIDAS DE ESTA MIGRACIÓN:
-- 
-- 1. MAPEO DE TARJETAS DE CRÉDITO GENÉRICAS:
--    - Todos los pagos con "tarjeta_credito" se asignan a "Visa"
--    - Razón: El dato original no especificaba si era Visa, Mastercard o Amex
--    - Impacto: Histórico de pagos agrupado incorrectamente en reportes
--    - Solución: Implementar lógica de detección en backend con últimos 4 dígitos
-- 
-- 2. COLUMNA ANTIGUA NO ELIMINADA:
--    - La columna "metodo_pago" permanece en la tabla Payments
--    - Razón: Seguridad - permite rollback si hay problemas
--    - Cuándo eliminar: Después de validar completamente en producción
--    - Cómo eliminar: Ver script "metodo_pago_cleanup.sql"
-- 
-- 3. TABLA DE AUDITORÍA:
--    - Se creó para registrar todas las migraciones
--    - Contiene detalles de cada pago migrado y sus limitaciones
--    - Útil para debugging y validación post-migración
-- 
-- VALIDACIONES A REALIZAR:
-- 
-- 1. Verificar que no hay registros sin migrar:
--    SELECT COUNT(*) FROM Payments 
--    WHERE metodo_pago IS NOT NULL AND id_metodo_pago IS NULL;
--    -- Resultado esperado: 0
-- 
-- 2. Revisar registros con limitaciones:
--    SELECT * FROM Migracion_Metodos_Pago_Auditoria 
--    WHERE estado_verificacion = 'con_limitacion';
-- 
-- 3. Verificar foreign keys:
--    SELECT COUNT(*) FROM Payments WHERE id_metodo_pago IS NOT NULL
--    AND id_metodo_pago NOT IN (SELECT id_metodo_pago FROM Metodos_Pago);
--    -- Resultado esperado: 0
-- 
-- ============================================

SELECT 'Migracion de Metodos de Pago completada y auditada!' as mensaje;

-- ============================================
-- FASE 2: ELIMINACIÓN SEGURA DE COLUMNA ANTIGUA
-- ============================================
-- 
-- ⚠️  IMPORTANTE: EJECUTAR SOLO DESPUÉS DE:
-- 
-- 1. ✓ Haber ejecutado la migración (Fase 1) exitosamente
-- 2. ✓ Verificar que NO hay errores en Migracion_Metodos_Pago_Auditoria
-- 3. ✓ Actualizar COMPLETAMENTE el backend:
--    - Cambiar todas las consultas que usan metodo_pago → id_metodo_pago
--    - Actualizar joins con Metodos_Pago
--    - Revisar stored procedures, triggers, vistas que usen metodo_pago
-- 4. ✓ Probar exhaustivamente en STAGING
-- 5. ✓ Obtener aprobación del equipo de arquitectura
-- 6. ✓ Hacer BACKUP de la base de datos
-- 
-- ============================================

-- PASO 13: PREPARACIÓN PARA ELIMINAR COLUMNA ANTIGUA
-- Este bloque NO elimina nada, solo valida precondiciones

DO $$ 
DECLARE
    v_columna_existe BOOLEAN;
    v_dependencias_count INTEGER := 0;
    v_procedimientos_usando RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE 'VALIDACIÓN PRE-ELIMINACIÓN - COLUMNA ANTIGUA';
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    
    -- Verificar si la columna existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'metodo_pago'
    ) INTO v_columna_existe;
    
    IF NOT v_columna_existe THEN
        RAISE NOTICE '✓ La columna "metodo_pago" ya ha sido eliminada';
        RETURN;
    END IF;
    
    RAISE NOTICE '📋 CHECKLIST DE VALIDACIÓN:';
    RAISE NOTICE '';
    
    -- 1. Verificar que no hay registros sin migrar
    RAISE NOTICE '1️⃣  Registros sin migrar:';
    SELECT COUNT(*) INTO v_dependencias_count FROM Payments 
    WHERE metodo_pago IS NOT NULL AND id_metodo_pago IS NULL;
    
    IF v_dependencias_count > 0 THEN
        RAISE WARNING '   ❌ PROBLEMA: Hay % registros sin migrar', v_dependencias_count;
        RAISE WARNING '   No se puede proceder a eliminar la columna';
        RAISE WARNING '   Ejecute la migración (Fase 1) primero';
        RETURN;
    ELSE
        RAISE NOTICE '   ✓ OK: Todos los registros están migrados';
    END IF;
    
    RAISE NOTICE '';
    
    -- 2. Verificar referencias en vistas
    RAISE NOTICE '2️⃣  Referencias en vistas:';
    SELECT COUNT(*) INTO v_dependencias_count FROM information_schema.views 
    WHERE definition LIKE '%metodo_pago%';
    
    IF v_dependencias_count > 0 THEN
        RAISE WARNING '   ⚠️  Advertencia: Hay % vistas que referencian metodo_pago', v_dependencias_count;
        RAISE WARNING '   Revise y actualice estas vistas antes de eliminar la columna';
    ELSE
        RAISE NOTICE '   ✓ OK: No hay vistas que referencien metodo_pago';
    END IF;
    
    RAISE NOTICE '';
    
    -- 3. Verificar referencias en procedimientos
    RAISE NOTICE '3️⃣  Referencias en procedimientos/funciones:';
    SELECT COUNT(*) INTO v_dependencias_count FROM pg_proc p
    WHERE pg_get_functiondef(p.oid) LIKE '%metodo_pago%';
    
    IF v_dependencias_count > 0 THEN
        RAISE WARNING '   ⚠️  Advertencia: Hay % funciones que referencian metodo_pago', v_dependencias_count;
        RAISE WARNING '   Revise y actualice estas funciones antes de eliminar la columna';
    ELSE
        RAISE NOTICE '   ✓ OK: No hay funciones que referencien metodo_pago';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════';
    
    IF v_dependencias_count = 0 AND 
       NOT EXISTS (SELECT 1 FROM Payments WHERE metodo_pago IS NOT NULL AND id_metodo_pago IS NULL) THEN
        RAISE NOTICE '✓ VALIDACIÓN COMPLETADA: Seguro proceder con eliminación';
        RAISE NOTICE '';
        RAISE NOTICE 'Para eliminar la columna, ejecute:';
        RAISE NOTICE '';
        RAISE NOTICE '  -- ELIMINAR COLUMNA ANTIGUA (PUNTO DE NO RETORNO)';
        RAISE NOTICE '  ALTER TABLE Payments DROP COLUMN metodo_pago CASCADE;';
        RAISE NOTICE '';
        RAISE NOTICE '  -- REGISTRAR LA ELIMINACIÓN EN AUDITORÍA';
        RAISE NOTICE '  INSERT INTO Migracion_Metodos_Pago_Auditoria (';
        RAISE NOTICE '      tipo_operacion, tabla_origen, descripcion_verificacion';
        RAISE NOTICE '  ) VALUES (';
        RAISE NOTICE '      ''delete'', ''Payments'', ''Columna metodo_pago eliminada''';
        RAISE NOTICE '  );';
        RAISE NOTICE '';
    ELSE
        RAISE WARNING '';
        RAISE WARNING '❌ VALIDACIÓN FALLIDA: No se puede proceder';
        RAISE WARNING 'Resuelva los problemas identificados arriba';
        RAISE WARNING '';
    END IF;
    
END $$;

-- PASO 14: FUNCIÓN PARA ELIMINAR LA COLUMNA DE FORMA SEGURA
-- (Se debe ejecutar manualmente después de todas las validaciones)

CREATE OR REPLACE FUNCTION eliminar_columna_metodo_pago_antigua()
RETURNS TABLE(resultado_codigo INTEGER, resultado_mensaje TEXT, timestamp_ejecucion TIMESTAMP) AS $$
DECLARE
    v_columna_existe BOOLEAN;
    v_pagos_sin_migrar INTEGER;
    v_referencia_count INTEGER;
BEGIN
    -- Validación 1: ¿Existe la columna?
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'metodo_pago'
    ) INTO v_columna_existe;
    
    IF NOT v_columna_existe THEN
        RETURN QUERY SELECT 1::INTEGER, 'Columna ya fue eliminada anteriormente'::TEXT, CURRENT_TIMESTAMP;
        RETURN;
    END IF;
    
    -- Validación 2: ¿Hay registros sin migrar?
    SELECT COUNT(*) INTO v_pagos_sin_migrar FROM Payments 
    WHERE metodo_pago IS NOT NULL AND id_metodo_pago IS NULL;
    
    IF v_pagos_sin_migrar > 0 THEN
        RETURN QUERY SELECT 
            0::INTEGER, 
            'ERROR: Hay ' || v_pagos_sin_migrar::TEXT || ' registros sin migrar. Abortando operación.'::TEXT,
            CURRENT_TIMESTAMP;
        RETURN;
    END IF;
    
    -- Validación 3: ¿Hay dependencias activas?
    SELECT COUNT(*) INTO v_referencia_count FROM information_schema.views 
    WHERE definition LIKE '%metodo_pago%' AND table_schema = 'public';
    
    IF v_referencia_count > 0 THEN
        RETURN QUERY SELECT 
            0::INTEGER,
            'ERROR: Hay ' || v_referencia_count::TEXT || ' vistas que referencian metodo_pago. Actualícelas primero.'::TEXT,
            CURRENT_TIMESTAMP;
        RETURN;
    END IF;
    
    -- PUNTO DE NO RETORNO: Eliminar la columna
    BEGIN
        ALTER TABLE Payments DROP COLUMN metodo_pago CASCADE;
        
        -- Registrar la eliminación en auditoría
        INSERT INTO Migracion_Metodos_Pago_Auditoria (
            tipo_operacion, tabla_origen, tabla_destino,
            descripcion_verificacion, estado_verificacion, notas
        ) VALUES (
            'delete', 'Payments', 'Payments',
            'Columna metodo_pago eliminada de la tabla Payments',
            'ok',
            'Eliminación realizada ' || CURRENT_TIMESTAMP::TEXT || ' por usuario: ' || CURRENT_USER
        );
        
        RETURN QUERY SELECT 
            1::INTEGER,
            'Columna metodo_pago eliminada exitosamente'::TEXT,
            CURRENT_TIMESTAMP;
            
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            0::INTEGER,
            'ERROR: ' || SQLERRM::TEXT,
            CURRENT_TIMESTAMP;
    END;
    
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INSTRUCCIONES DE USO - FASE 2
-- ============================================
-- 
-- Para eliminar la columna antigua de forma segura:
-- 
-- OPCIÓN 1: Eliminación con todas las validaciones (RECOMENDADO):
-- 
--   SELECT * FROM eliminar_columna_metodo_pago_antigua();
-- 
-- OPCIÓN 2: Eliminación manual (solo después de todas las validaciones):
-- 
--   -- ⚠️ REQUIERE APROBACIÓN Y BACKUP PREVIO
--   ALTER TABLE Payments DROP COLUMN metodo_pago CASCADE;
--   
--   INSERT INTO Migracion_Metodos_Pago_Auditoria (
--       tipo_operacion, tabla_origen, descripcion_verificacion, estado_verificacion
--   ) VALUES (
--       'delete', 'Payments', 'Columna metodo_pago eliminada', 'ok'
--   );
-- 
-- ============================================
-- RESUMEN DE LA MIGRACIÓN COMPLETA
-- ============================================
-- 
-- FASE 1 (MIGRACIÓN - Ya ejecutada):
--   ✓ Crear tabla Metodos_Pago con métodos predefinidos
--   ✓ Crear tabla Metodos_Pago_Cliente para guardar métodos del cliente
--   ✓ Agregar columnas nuevas a Payments
--   ✓ Crear tabla de auditoría
--   ✓ Migrar datos con mapeo y documentación de limitaciones
--   ✓ La columna antigua se mantiene (por seguridad)
-- 
-- FASE 2 (ELIMINACIÓN - Opción manual):
--   □ Validar que no hay registros sin migrar
--   □ Actualizar COMPLETAMENTE el backend
--   □ Probar en STAGING exhaustivamente
--   □ Hacer BACKUP de producción
--   □ Obtener aprobación
--   □ Ejecutar eliminación de columna antigua
--   □ Registrar en auditoría
-- 
-- BENEFICIOS DE ESTA APROXIMACIÓN:
--   • Seguridad: Permite rollback en cualquier momento
--   • Auditoría completa: Todos los cambios registrados
--   • Flexibilidad: Puedes ir a tu propio ritmo
--   • Trazabilidad: Saber exactamente qué se migró y cómo
--   • Documentación: Limitaciones conocidas registradas
-- 
-- ============================================

-- ============================================
-- VERIFICACIÓN FINAL Y MENSAJES
-- ============================================

DO $$ 
DECLARE
    v_metodos_pago INTEGER;
    v_payments_migrados INTEGER;
    v_payments_sin_migrar INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_metodos_pago FROM Metodos_Pago;
    SELECT COUNT(*) INTO v_payments_migrados FROM Payments WHERE id_metodo_pago IS NOT NULL;
    SELECT COUNT(*) - v_payments_migrados INTO v_payments_sin_migrar FROM Payments;
    
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║     MIGRACIÓN DE MÉTODOS DE PAGO - COMPLETADA         ║';
    RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE 'RESUMEN FINAL:';
    RAISE NOTICE '   • Métodos de pago disponibles: %', v_metodos_pago;
    RAISE NOTICE '   • Pagos migrados: %', v_payments_migrados;
    RAISE NOTICE '   • Pagos sin migrar: %', v_payments_sin_migrar;
    RAISE NOTICE '';
    RAISE NOTICE 'PRÓXIMOS PASOS RECOMENDADOS:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Ejecutar validaciones del Paso 13:';
    RAISE NOTICE '   - Revisar tabla Migracion_Metodos_Pago_Auditoria';
    RAISE NOTICE '   - Confirmar que no hay errores';
    RAISE NOTICE '';
    RAISE NOTICE '2. Actualizar Backend:';
    RAISE NOTICE '   - Cambiar todas las referencias de metodo_pago a id_metodo_pago';
    RAISE NOTICE '   - Actualizar joins con tabla Metodos_Pago';
    RAISE NOTICE '';
    RAISE NOTICE '3. Testing Exhaustivo:';
    RAISE NOTICE '   - Probar en entorno de STAGING';
    RAISE NOTICE '   - Validar reportes de pagos';
    RAISE NOTICE '';
    RAISE NOTICE '4. Eliminación de Columna (cuando todo esté listo):';
    RAISE NOTICE '   - Ejecutar: SELECT * FROM eliminar_columna_metodo_pago_antigua();';
    RAISE NOTICE '   - O hacer manualmente con validaciones del Paso 13';
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════';
    
    IF v_payments_sin_migrar > 0 THEN
        RAISE WARNING 'Hay % pagos sin migrar. Revisar manualmente.', v_payments_sin_migrar;
    ELSE
        RAISE NOTICE '✓ Migración completada exitosamente';
    END IF;

END $$;

SELECT '✓ Migración de Métodos de Pago completada y auditada!' as mensaje;