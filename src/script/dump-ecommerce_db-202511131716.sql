--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-11-13 17:16:34

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 310 (class 1255 OID 71667)
-- Name: actualizar_fecha_modificacion(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.actualizar_fecha_modificacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_fecha_modificacion() OWNER TO postgres;

--
-- TOC entry 329 (class 1255 OID 72098)
-- Name: actualizar_stock_orden(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.actualizar_stock_orden() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_almacen_principal INTEGER;
    v_cantidad_anterior INTEGER;
BEGIN
    -- Obtener almac‚n principal de forma m s robusta
    SELECT id_almacen INTO v_almacen_principal 
    FROM Almacenes 
    WHERE activo = true 
    ORDER BY id_almacen 
    LIMIT 1;
    
    IF v_almacen_principal IS NULL THEN
        RAISE EXCEPTION 'No hay almac‚n activo configurado';
    END IF;
    
    -- Obtener cantidad anterior
    SELECT cantidad_actual INTO v_cantidad_anterior
    FROM Inventario
    WHERE id_producto = NEW.id_producto 
    AND id_almacen = v_almacen_principal;
    
    IF v_cantidad_anterior IS NULL THEN
        RAISE EXCEPTION 'Producto no existe en inventario';
    END IF;
    
    IF v_cantidad_anterior < NEW.cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente. Disponible: %, Solicitado: %', 
                        v_cantidad_anterior, NEW.cantidad;
    END IF;
    
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
        v_cantidad_anterior,
        v_cantidad_anterior - NEW.cantidad,
        COALESCE(NEW.id_usuario_modificacion, 1), -- Usar usuario de la orden si existe
        NEW.id_orden,
        'Venta - Orden #' || NEW.id_orden
    FROM Inventario i
    WHERE i.id_producto = NEW.id_producto 
    AND i.id_almacen = v_almacen_principal;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_stock_orden() OWNER TO postgres;

--
-- TOC entry 315 (class 1255 OID 72349)
-- Name: calcular_comision_pago(numeric, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calcular_comision_pago(p_monto numeric, p_id_metodo_pago integer) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.calcular_comision_pago(p_monto numeric, p_id_metodo_pago integer) OWNER TO postgres;

--
-- TOC entry 330 (class 1255 OID 72494)
-- Name: convertir_cotizacion_a_orden(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.convertir_cotizacion_a_orden(p_id_cotizacion integer, p_id_usuario integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_cotizacion RECORD;
    v_nueva_orden INTEGER;
BEGIN
    -- Verificar que la cotizaci¢n existe y est  en estado v lido
    SELECT * INTO v_cotizacion
    FROM Cotizaciones 
    WHERE id_cotizacion = p_id_cotizacion;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cotizaci¢n no encontrada';
    END IF;
    
    IF v_cotizacion.estado != 'aceptada' THEN
        RAISE EXCEPTION 'Solo se pueden convertir cotizaciones aceptadas';
    END IF;
    
    -- Crear nueva orden
    INSERT INTO Ordenes (
        id_cliente,
        id_usuario_creador,
        total_orden,
        estado_orden,
        fecha_orden
    ) VALUES (
        v_cotizacion.id_cliente,
        p_id_usuario,
        v_cotizacion.total,
        'pendiente',
        CURRENT_TIMESTAMP
    ) RETURNING id_orden INTO v_nueva_orden;
    
    -- Copiar items de cotizaci¢n a orden
    INSERT INTO Ordenes_Items (
        id_orden,
        id_producto,
        cantidad,
        precio_unitario
    )
    SELECT 
        v_nueva_orden,
        id_producto,
        cantidad,
        precio_unitario
    FROM Cotizaciones_Items
    WHERE id_cotizacion = p_id_cotizacion;
    
    -- Registrar la conversi¢n
    INSERT INTO Cotizaciones_Ordenes (id_cotizacion, id_orden)
    VALUES (p_id_cotizacion, v_nueva_orden);
    
    -- Actualizar estado de la cotizaci¢n
    UPDATE Cotizaciones 
    SET estado = 'convertida'
    WHERE id_cotizacion = p_id_cotizacion;
    
    RETURN v_nueva_orden;
END;
$$;


ALTER FUNCTION public.convertir_cotizacion_a_orden(p_id_cotizacion integer, p_id_usuario integer) OWNER TO postgres;

--
-- TOC entry 327 (class 1255 OID 72373)
-- Name: eliminar_columna_metodo_pago_antigua(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.eliminar_columna_metodo_pago_antigua() RETURNS TABLE(resultado_codigo integer, resultado_mensaje text, timestamp_ejecucion timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_columna_existe BOOLEAN;
    v_pagos_sin_migrar INTEGER;
    v_referencia_count INTEGER;
BEGIN
    -- ValidaciÃ³n 1: Â¿Existe la columna?
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'metodo_pago'
    ) INTO v_columna_existe;
    
    IF NOT v_columna_existe THEN
        RETURN QUERY SELECT 1::INTEGER, 'Columna ya fue eliminada anteriormente'::TEXT, CURRENT_TIMESTAMP;
        RETURN;
    END IF;
    
    -- ValidaciÃ³n 2: Â¿Hay registros sin migrar?
    SELECT COUNT(*) INTO v_pagos_sin_migrar FROM Payments 
    WHERE metodo_pago IS NOT NULL AND id_metodo_pago IS NULL;
    
    IF v_pagos_sin_migrar > 0 THEN
        RETURN QUERY SELECT 
            0::INTEGER, 
            'ERROR: Hay ' || v_pagos_sin_migrar::TEXT || ' registros sin migrar. Abortando operaciÃ³n.'::TEXT,
            CURRENT_TIMESTAMP;
        RETURN;
    END IF;
    
    -- ValidaciÃ³n 3: Â¿Hay dependencias activas?
    SELECT COUNT(*) INTO v_referencia_count FROM information_schema.views 
    WHERE definition LIKE '%metodo_pago%' AND table_schema = 'public';
    
    IF v_referencia_count > 0 THEN
        RETURN QUERY SELECT 
            0::INTEGER,
            'ERROR: Hay ' || v_referencia_count::TEXT || ' vistas que referencian metodo_pago. ActualÃ­celas primero.'::TEXT,
            CURRENT_TIMESTAMP;
        RETURN;
    END IF;
    
    -- PUNTO DE NO RETORNO: Eliminar la columna
    BEGIN
        ALTER TABLE Payments DROP COLUMN metodo_pago CASCADE;
        
        -- Registrar la eliminaciÃ³n en auditorÃ­a
        INSERT INTO Migracion_Metodos_Pago_Auditoria (
            tipo_operacion, tabla_origen, tabla_destino,
            descripcion_verificacion, estado_verificacion, notas
        ) VALUES (
            'delete', 'Payments', 'Payments',
            'Columna metodo_pago eliminada de la tabla Payments',
            'ok',
            'EliminaciÃ³n realizada ' || CURRENT_TIMESTAMP::TEXT || ' por usuario: ' || CURRENT_USER
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
$$;


ALTER FUNCTION public.eliminar_columna_metodo_pago_antigua() OWNER TO postgres;

--
-- TOC entry 313 (class 1255 OID 72258)
-- Name: generar_numero_devolucion(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generar_numero_devolucion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.generar_numero_devolucion() OWNER TO postgres;

--
-- TOC entry 328 (class 1255 OID 72464)
-- Name: registrar_cambio_estado_orden(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.registrar_cambio_estado_orden() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Solo registrar si el estado cambiÃ³
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
            'Cambio automÃ¡tico de estado'
        );
        
        -- Actualizar fecha de cambio de estado
        NEW.fecha_estado_cambio = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.registrar_cambio_estado_orden() OWNER TO postgres;

--
-- TOC entry 314 (class 1255 OID 72345)
-- Name: validar_metodo_predeterminado(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_metodo_predeterminado() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.es_predeterminado = true THEN
        UPDATE Metodos_Pago_Cliente
        SET es_predeterminado = false
        WHERE id_cliente = NEW.id_cliente 
        AND id_metodo_pago_cliente != NEW.id_metodo_pago_cliente;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validar_metodo_predeterminado() OWNER TO postgres;

--
-- TOC entry 311 (class 1255 OID 72100)
-- Name: verificar_alertas_inventario(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.verificar_alertas_inventario() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
                'Producto agotado en almacÃ©n');
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.verificar_alertas_inventario() OWNER TO postgres;

--
-- TOC entry 312 (class 1255 OID 72118)
-- Name: verificar_cotizacion_expirada(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.verificar_cotizacion_expirada() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.fecha_expiracion IS NOT NULL AND NEW.fecha_expiracion < CURRENT_DATE 
       AND NEW.estado IN ('borrador', 'enviada') THEN
        NEW.estado := 'expirada';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.verificar_cotizacion_expirada() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 272 (class 1259 OID 72004)
-- Name: alertas_inventario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alertas_inventario (
    id_alerta integer NOT NULL,
    id_inventario integer NOT NULL,
    tipo_alerta character varying(30) NOT NULL,
    mensaje text NOT NULL,
    fecha_alerta timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    resuelta boolean DEFAULT false,
    fecha_resolucion timestamp without time zone,
    CONSTRAINT alertas_inventario_tipo_alerta_check CHECK (((tipo_alerta)::text = ANY ((ARRAY['stock_bajo'::character varying, 'stock_agotado'::character varying, 'stock_excedido'::character varying, 'producto_vencido'::character varying])::text[])))
);


ALTER TABLE public.alertas_inventario OWNER TO postgres;

--
-- TOC entry 5728 (class 0 OID 0)
-- Dependencies: 272
-- Name: TABLE alertas_inventario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.alertas_inventario IS 'Alertas automÃ¡ticas de inventario';


--
-- TOC entry 271 (class 1259 OID 72003)
-- Name: alertas_inventario_id_alerta_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alertas_inventario_id_alerta_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alertas_inventario_id_alerta_seq OWNER TO postgres;

--
-- TOC entry 5729 (class 0 OID 0)
-- Dependencies: 271
-- Name: alertas_inventario_id_alerta_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alertas_inventario_id_alerta_seq OWNED BY public.alertas_inventario.id_alerta;


--
-- TOC entry 260 (class 1259 OID 71871)
-- Name: almacenes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.almacenes (
    id_almacen integer NOT NULL,
    nombre_almacen character varying(100) NOT NULL,
    direccion text,
    telefono character varying(20),
    responsable character varying(100),
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.almacenes OWNER TO postgres;

--
-- TOC entry 5730 (class 0 OID 0)
-- Dependencies: 260
-- Name: TABLE almacenes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.almacenes IS 'Almacenes o bodegas del negocio';


--
-- TOC entry 259 (class 1259 OID 71870)
-- Name: almacenes_id_almacen_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.almacenes_id_almacen_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.almacenes_id_almacen_seq OWNER TO postgres;

--
-- TOC entry 5731 (class 0 OID 0)
-- Dependencies: 259
-- Name: almacenes_id_almacen_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.almacenes_id_almacen_seq OWNED BY public.almacenes.id_almacen;


--
-- TOC entry 255 (class 1259 OID 71825)
-- Name: campana_clientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campana_clientes (
    id_campana_cliente integer NOT NULL,
    id_campana integer NOT NULL,
    id_cliente integer NOT NULL,
    fecha_envio timestamp without time zone,
    estado_envio character varying(30) DEFAULT 'pendiente'::character varying,
    fecha_apertura timestamp without time zone,
    fecha_respuesta timestamp without time zone,
    notas text,
    CONSTRAINT campana_clientes_estado_envio_check CHECK (((estado_envio)::text = ANY ((ARRAY['pendiente'::character varying, 'enviado'::character varying, 'abierto'::character varying, 'respondido'::character varying, 'fallido'::character varying])::text[])))
);


ALTER TABLE public.campana_clientes OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 71824)
-- Name: campana_clientes_id_campana_cliente_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.campana_clientes_id_campana_cliente_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.campana_clientes_id_campana_cliente_seq OWNER TO postgres;

--
-- TOC entry 5732 (class 0 OID 0)
-- Dependencies: 254
-- Name: campana_clientes_id_campana_cliente_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.campana_clientes_id_campana_cliente_seq OWNED BY public.campana_clientes.id_campana_cliente;


--
-- TOC entry 253 (class 1259 OID 71811)
-- Name: campanas_marketing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campanas_marketing (
    id_campana integer NOT NULL,
    nombre_campana character varying(255) NOT NULL,
    descripcion text,
    tipo_campana character varying(50) NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date,
    presupuesto numeric(10,2),
    objetivo text,
    estado character varying(30) DEFAULT 'planificada'::character varying,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT campanas_marketing_estado_check CHECK (((estado)::text = ANY ((ARRAY['planificada'::character varying, 'activa'::character varying, 'pausada'::character varying, 'completada'::character varying, 'cancelada'::character varying])::text[]))),
    CONSTRAINT campanas_marketing_tipo_campana_check CHECK (((tipo_campana)::text = ANY ((ARRAY['email'::character varying, 'sms'::character varying, 'redes_sociales'::character varying, 'telefonica'::character varying, 'mixta'::character varying])::text[])))
);


ALTER TABLE public.campanas_marketing OWNER TO postgres;

--
-- TOC entry 5733 (class 0 OID 0)
-- Dependencies: 253
-- Name: TABLE campanas_marketing; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.campanas_marketing IS 'CampaÃ±as de marketing y su gestiÃ³n';


--
-- TOC entry 252 (class 1259 OID 71810)
-- Name: campanas_marketing_id_campana_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.campanas_marketing_id_campana_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.campanas_marketing_id_campana_seq OWNER TO postgres;

--
-- TOC entry 5734 (class 0 OID 0)
-- Dependencies: 252
-- Name: campanas_marketing_id_campana_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.campanas_marketing_id_campana_seq OWNED BY public.campanas_marketing.id_campana;


--
-- TOC entry 232 (class 1259 OID 71555)
-- Name: carrito_compras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carrito_compras (
    id_carrito integer NOT NULL,
    id_cliente integer NOT NULL,
    estado character varying(20) DEFAULT 'activo'::character varying,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT carrito_compras_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'abandonado'::character varying, 'convertido'::character varying])::text[])))
);


ALTER TABLE public.carrito_compras OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 71554)
-- Name: carrito_compras_id_carrito_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.carrito_compras_id_carrito_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.carrito_compras_id_carrito_seq OWNER TO postgres;

--
-- TOC entry 5735 (class 0 OID 0)
-- Dependencies: 231
-- Name: carrito_compras_id_carrito_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.carrito_compras_id_carrito_seq OWNED BY public.carrito_compras.id_carrito;


--
-- TOC entry 234 (class 1259 OID 71573)
-- Name: carrito_productos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carrito_productos (
    id_carrito_producto integer NOT NULL,
    id_carrito integer NOT NULL,
    id_producto integer NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    fecha_agregado timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT carrito_productos_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT carrito_productos_precio_unitario_check CHECK ((precio_unitario >= (0)::numeric))
);


ALTER TABLE public.carrito_productos OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 71572)
-- Name: carrito_productos_id_carrito_producto_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.carrito_productos_id_carrito_producto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.carrito_productos_id_carrito_producto_seq OWNER TO postgres;

--
-- TOC entry 5736 (class 0 OID 0)
-- Dependencies: 233
-- Name: carrito_productos_id_carrito_producto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.carrito_productos_id_carrito_producto_seq OWNED BY public.carrito_productos.id_carrito_producto;


--
-- TOC entry 226 (class 1259 OID 71504)
-- Name: categoria_producto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categoria_producto (
    id_categoria integer NOT NULL,
    nombre_categoria character varying(100) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categoria_producto OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 71503)
-- Name: categoria_producto_id_categoria_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categoria_producto_id_categoria_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categoria_producto_id_categoria_seq OWNER TO postgres;

--
-- TOC entry 5737 (class 0 OID 0)
-- Dependencies: 225
-- Name: categoria_producto_id_categoria_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categoria_producto_id_categoria_seq OWNED BY public.categoria_producto.id_categoria;


--
-- TOC entry 251 (class 1259 OID 71792)
-- Name: cliente_segmentos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cliente_segmentos (
    id_cliente integer NOT NULL,
    id_segmento integer NOT NULL,
    fecha_asignacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cliente_segmentos OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 71475)
-- Name: clientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clientes (
    id_cliente integer NOT NULL,
    id_usuario integer NOT NULL,
    nombre character varying(100),
    apellido character varying(100),
    telefono character varying(20)
);


ALTER TABLE public.clientes OWNER TO postgres;

--
-- TOC entry 5738 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE clientes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.clientes IS 'InformaciÃ³n personal de los clientes';


--
-- TOC entry 221 (class 1259 OID 71474)
-- Name: clientes_id_cliente_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clientes_id_cliente_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clientes_id_cliente_seq OWNER TO postgres;

--
-- TOC entry 5739 (class 0 OID 0)
-- Dependencies: 221
-- Name: clientes_id_cliente_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clientes_id_cliente_seq OWNED BY public.clientes.id_cliente;


--
-- TOC entry 274 (class 1259 OID 72028)
-- Name: cotizaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cotizaciones (
    id_cotizacion integer NOT NULL,
    id_cliente integer NOT NULL,
    id_usuario_creador integer NOT NULL,
    numero_cotizacion character varying(50) NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion date,
    estado character varying(20) DEFAULT 'borrador'::character varying,
    subtotal numeric(10,2) DEFAULT 0,
    impuestos numeric(10,2) DEFAULT 0,
    total numeric(10,2) DEFAULT 0,
    notas text,
    terminos_condiciones text,
    CONSTRAINT cotizaciones_estado_check CHECK (((estado)::text = ANY ((ARRAY['borrador'::character varying, 'enviada'::character varying, 'aceptada'::character varying, 'rechazada'::character varying, 'expirada'::character varying])::text[])))
);


ALTER TABLE public.cotizaciones OWNER TO postgres;

--
-- TOC entry 5740 (class 0 OID 0)
-- Dependencies: 274
-- Name: TABLE cotizaciones; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.cotizaciones IS 'Cotizaciones de ventas para clientes';


--
-- TOC entry 282 (class 1259 OID 72121)
-- Name: cotizaciones_auditoria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cotizaciones_auditoria (
    id_auditoria integer NOT NULL,
    id_cotizacion integer NOT NULL,
    estado_anterior character varying(20),
    estado_nuevo character varying(20),
    usuario_cambio integer,
    fecha_cambio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    razon text
);


ALTER TABLE public.cotizaciones_auditoria OWNER TO postgres;

--
-- TOC entry 281 (class 1259 OID 72120)
-- Name: cotizaciones_auditoria_id_auditoria_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cotizaciones_auditoria_id_auditoria_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cotizaciones_auditoria_id_auditoria_seq OWNER TO postgres;

--
-- TOC entry 5741 (class 0 OID 0)
-- Dependencies: 281
-- Name: cotizaciones_auditoria_id_auditoria_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cotizaciones_auditoria_id_auditoria_seq OWNED BY public.cotizaciones_auditoria.id_auditoria;


--
-- TOC entry 273 (class 1259 OID 72027)
-- Name: cotizaciones_id_cotizacion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cotizaciones_id_cotizacion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cotizaciones_id_cotizacion_seq OWNER TO postgres;

--
-- TOC entry 5742 (class 0 OID 0)
-- Dependencies: 273
-- Name: cotizaciones_id_cotizacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cotizaciones_id_cotizacion_seq OWNED BY public.cotizaciones.id_cotizacion;


--
-- TOC entry 276 (class 1259 OID 72058)
-- Name: cotizaciones_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cotizaciones_items (
    id_cotizacion_item integer NOT NULL,
    id_cotizacion integer NOT NULL,
    id_producto integer NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    descuento_porcentaje numeric(5,2) DEFAULT 0,
    subtotal numeric(10,2) GENERATED ALWAYS AS ((((cantidad)::numeric * precio_unitario) * ((1)::numeric - (descuento_porcentaje / (100)::numeric)))) STORED,
    CONSTRAINT cotizaciones_items_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT cotizaciones_items_descuento_porcentaje_check CHECK (((descuento_porcentaje >= (0)::numeric) AND (descuento_porcentaje <= (100)::numeric))),
    CONSTRAINT cotizaciones_items_precio_unitario_check CHECK ((precio_unitario >= (0)::numeric))
);


ALTER TABLE public.cotizaciones_items OWNER TO postgres;

--
-- TOC entry 5743 (class 0 OID 0)
-- Dependencies: 276
-- Name: TABLE cotizaciones_items; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.cotizaciones_items IS 'Items detallados de cotizaciones';


--
-- TOC entry 275 (class 1259 OID 72057)
-- Name: cotizaciones_items_id_cotizacion_item_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cotizaciones_items_id_cotizacion_item_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cotizaciones_items_id_cotizacion_item_seq OWNER TO postgres;

--
-- TOC entry 5744 (class 0 OID 0)
-- Dependencies: 275
-- Name: cotizaciones_items_id_cotizacion_item_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cotizaciones_items_id_cotizacion_item_seq OWNED BY public.cotizaciones_items.id_cotizacion_item;


--
-- TOC entry 277 (class 1259 OID 72081)
-- Name: cotizaciones_ordenes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cotizaciones_ordenes (
    id_cotizacion integer NOT NULL,
    id_orden integer NOT NULL,
    fecha_conversion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cotizaciones_ordenes OWNER TO postgres;

--
-- TOC entry 5745 (class 0 OID 0)
-- Dependencies: 277
-- Name: TABLE cotizaciones_ordenes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.cotizaciones_ordenes IS 'ConversiÃ³n de cotizaciones a Ã³rdenes de venta';


--
-- TOC entry 284 (class 1259 OID 72141)
-- Name: devoluciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.devoluciones (
    id_devolucion integer NOT NULL,
    id_orden integer NOT NULL,
    id_cliente integer NOT NULL,
    numero_devolucion character varying(50) NOT NULL,
    fecha_solicitud timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobo_cliente timestamp without time zone,
    fecha_aprobacion timestamp without time zone,
    fecha_rechazo timestamp without time zone,
    fecha_completada timestamp without time zone,
    estado character varying(30) DEFAULT 'solicitada'::character varying,
    tipo_devolucion character varying(20) NOT NULL,
    motivo character varying(100) NOT NULL,
    motivo_detalle text,
    metodo_reembolso character varying(50),
    monto_total_devolucion numeric(10,2) DEFAULT 0,
    monto_aprobado numeric(10,2) DEFAULT 0,
    costo_envio_devolucion numeric(10,2) DEFAULT 0,
    quien_cubre_envio character varying(20) DEFAULT 'cliente'::character varying,
    guia_devolucion character varying(100),
    transportista_devolucion character varying(50),
    notas_internas text,
    notas_cliente text,
    evidencia_imagenes jsonb,
    id_usuario_aprobo integer,
    CONSTRAINT devoluciones_estado_check CHECK (((estado)::text = ANY ((ARRAY['solicitada'::character varying, 'aprobada'::character varying, 'rechazada'::character varying, 'en_proceso'::character varying, 'completada'::character varying, 'cancelada'::character varying])::text[]))),
    CONSTRAINT devoluciones_metodo_reembolso_check CHECK (((metodo_reembolso)::text = ANY ((ARRAY['original'::character varying, 'credito_tienda'::character varying, 'transferencia'::character varying, 'efectivo'::character varying])::text[]))),
    CONSTRAINT devoluciones_motivo_check CHECK (((motivo)::text = ANY ((ARRAY['producto_danado'::character varying, 'producto_incorrecto'::character varying, 'no_cumple_esperanzas'::character varying, 'talla_incorrecta'::character varying, 'color_incorrecto'::character varying, 'arrepentimiento'::character varying, 'otro'::character varying])::text[]))),
    CONSTRAINT devoluciones_quien_cubre_envio_check CHECK (((quien_cubre_envio)::text = ANY ((ARRAY['cliente'::character varying, 'empresa'::character varying])::text[]))),
    CONSTRAINT devoluciones_tipo_devolucion_check CHECK (((tipo_devolucion)::text = ANY ((ARRAY['devolucion_total'::character varying, 'devolucion_parcial'::character varying, 'cambio_producto'::character varying])::text[])))
);


ALTER TABLE public.devoluciones OWNER TO postgres;

--
-- TOC entry 5746 (class 0 OID 0)
-- Dependencies: 284
-- Name: TABLE devoluciones; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.devoluciones IS 'Solicitudes de devoluciÃ³n y cambios de productos';


--
-- TOC entry 283 (class 1259 OID 72140)
-- Name: devoluciones_id_devolucion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.devoluciones_id_devolucion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.devoluciones_id_devolucion_seq OWNER TO postgres;

--
-- TOC entry 5747 (class 0 OID 0)
-- Dependencies: 283
-- Name: devoluciones_id_devolucion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.devoluciones_id_devolucion_seq OWNED BY public.devoluciones.id_devolucion;


--
-- TOC entry 286 (class 1259 OID 72182)
-- Name: devoluciones_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.devoluciones_items (
    id_devolucion_item integer NOT NULL,
    id_devolucion integer NOT NULL,
    id_orden_item integer NOT NULL,
    id_producto integer NOT NULL,
    cantidad_solicitada integer NOT NULL,
    cantidad_aprobada integer DEFAULT 0,
    precio_unitario numeric(10,2) NOT NULL,
    motivo_item character varying(100),
    estado_item character varying(30) DEFAULT 'pendiente'::character varying,
    condicion_producto character varying(50),
    accion_tomar character varying(50),
    fecha_recibido timestamp without time zone,
    fecha_inspeccion timestamp without time zone,
    notas_inspeccion text,
    CONSTRAINT devoluciones_items_accion_tomar_check CHECK (((accion_tomar)::text = ANY ((ARRAY['reembolsar'::character varying, 'reponer'::character varying, 'credito'::character varying, 'reparar'::character varying, 'desechar'::character varying])::text[]))),
    CONSTRAINT devoluciones_items_cantidad_aprobada_check CHECK ((cantidad_aprobada >= 0)),
    CONSTRAINT devoluciones_items_cantidad_solicitada_check CHECK ((cantidad_solicitada > 0)),
    CONSTRAINT devoluciones_items_condicion_producto_check CHECK (((condicion_producto)::text = ANY ((ARRAY['nuevo'::character varying, 'como_nuevo'::character varying, 'usado'::character varying, 'danado'::character varying, 'defectuoso'::character varying])::text[]))),
    CONSTRAINT devoluciones_items_estado_item_check CHECK (((estado_item)::text = ANY ((ARRAY['pendiente'::character varying, 'aprobado'::character varying, 'rechazado'::character varying, 'recibido'::character varying, 'inspeccionado'::character varying, 'reembolsado'::character varying])::text[])))
);


ALTER TABLE public.devoluciones_items OWNER TO postgres;

--
-- TOC entry 5748 (class 0 OID 0)
-- Dependencies: 286
-- Name: TABLE devoluciones_items; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.devoluciones_items IS 'Items individuales incluidos en una devoluciÃ³n';


--
-- TOC entry 285 (class 1259 OID 72181)
-- Name: devoluciones_items_id_devolucion_item_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.devoluciones_items_id_devolucion_item_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.devoluciones_items_id_devolucion_item_seq OWNER TO postgres;

--
-- TOC entry 5749 (class 0 OID 0)
-- Dependencies: 285
-- Name: devoluciones_items_id_devolucion_item_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.devoluciones_items_id_devolucion_item_seq OWNED BY public.devoluciones_items.id_devolucion_item;


--
-- TOC entry 224 (class 1259 OID 71488)
-- Name: direcciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.direcciones (
    id_direccion integer NOT NULL,
    id_cliente integer NOT NULL,
    calle character varying(255) NOT NULL,
    ciudad character varying(100) NOT NULL,
    estado character varying(100) NOT NULL,
    codigo_postal character varying(20) NOT NULL,
    pais character varying(100) NOT NULL,
    es_principal boolean DEFAULT false
);


ALTER TABLE public.direcciones OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 71487)
-- Name: direcciones_id_direccion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.direcciones_id_direccion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.direcciones_id_direccion_seq OWNER TO postgres;

--
-- TOC entry 5750 (class 0 OID 0)
-- Dependencies: 223
-- Name: direcciones_id_direccion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.direcciones_id_direccion_seq OWNED BY public.direcciones.id_direccion;


--
-- TOC entry 244 (class 1259 OID 71683)
-- Name: interacciones_cliente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interacciones_cliente (
    id_interaccion integer NOT NULL,
    id_cliente integer NOT NULL,
    id_usuario_asignado integer,
    tipo_interaccion character varying(50) NOT NULL,
    descripcion text NOT NULL,
    resultado character varying(100),
    fecha_interaccion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    proxima_accion text,
    fecha_proxima_accion date,
    estado character varying(30) DEFAULT 'pendiente'::character varying,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT interacciones_cliente_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'en_proceso'::character varying, 'completado'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT interacciones_cliente_tipo_interaccion_check CHECK (((tipo_interaccion)::text = ANY ((ARRAY['llamada'::character varying, 'email'::character varying, 'chat'::character varying, 'reunion'::character varying, 'nota'::character varying, 'reclamo'::character varying, 'consulta'::character varying])::text[])))
);


ALTER TABLE public.interacciones_cliente OWNER TO postgres;

--
-- TOC entry 5751 (class 0 OID 0)
-- Dependencies: 244
-- Name: TABLE interacciones_cliente; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.interacciones_cliente IS 'Registro de todas las interacciones con clientes (llamadas, emails, etc)';


--
-- TOC entry 243 (class 1259 OID 71682)
-- Name: interacciones_cliente_id_interaccion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.interacciones_cliente_id_interaccion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interacciones_cliente_id_interaccion_seq OWNER TO postgres;

--
-- TOC entry 5752 (class 0 OID 0)
-- Dependencies: 243
-- Name: interacciones_cliente_id_interaccion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interacciones_cliente_id_interaccion_seq OWNED BY public.interacciones_cliente.id_interaccion;


--
-- TOC entry 262 (class 1259 OID 71884)
-- Name: inventario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventario (
    id_inventario integer NOT NULL,
    id_producto integer NOT NULL,
    id_almacen integer NOT NULL,
    cantidad_actual integer DEFAULT 0 NOT NULL,
    cantidad_minima integer DEFAULT 10,
    cantidad_maxima integer DEFAULT 1000,
    ubicacion_fisica character varying(50),
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT inventario_cantidad_actual_check CHECK ((cantidad_actual >= 0))
);


ALTER TABLE public.inventario OWNER TO postgres;

--
-- TOC entry 5753 (class 0 OID 0)
-- Dependencies: 262
-- Name: TABLE inventario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.inventario IS 'Control de stock por producto y almacÃ©n';


--
-- TOC entry 261 (class 1259 OID 71883)
-- Name: inventario_id_inventario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inventario_id_inventario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventario_id_inventario_seq OWNER TO postgres;

--
-- TOC entry 5754 (class 0 OID 0)
-- Dependencies: 261
-- Name: inventario_id_inventario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inventario_id_inventario_seq OWNED BY public.inventario.id_inventario;


--
-- TOC entry 294 (class 1259 OID 72279)
-- Name: metodos_pago; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metodos_pago (
    id_metodo_pago integer NOT NULL,
    nombre_metodo character varying(100) NOT NULL,
    tipo_metodo character varying(50) NOT NULL,
    descripcion text,
    icono_url character varying(255),
    requiere_verificacion boolean DEFAULT false,
    comision_porcentaje numeric(5,2) DEFAULT 0,
    comision_fija numeric(10,2) DEFAULT 0,
    activo boolean DEFAULT true,
    disponible_online boolean DEFAULT true,
    disponible_tienda boolean DEFAULT true,
    orden_visualizacion integer DEFAULT 0,
    configuracion jsonb,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT metodos_pago_comision_fija_check CHECK ((comision_fija >= (0)::numeric)),
    CONSTRAINT metodos_pago_comision_porcentaje_check CHECK ((comision_porcentaje >= (0)::numeric)),
    CONSTRAINT metodos_pago_tipo_metodo_check CHECK (((tipo_metodo)::text = ANY ((ARRAY['tarjeta_credito'::character varying, 'tarjeta_debito'::character varying, 'transferencia_bancaria'::character varying, 'billetera_digital'::character varying, 'efectivo'::character varying, 'cheque'::character varying, 'criptomoneda'::character varying])::text[])))
);


ALTER TABLE public.metodos_pago OWNER TO postgres;

--
-- TOC entry 296 (class 1259 OID 72305)
-- Name: metodos_pago_cliente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metodos_pago_cliente (
    id_metodo_pago_cliente integer NOT NULL,
    id_cliente integer NOT NULL,
    id_metodo_pago integer NOT NULL,
    alias character varying(100),
    numero_tarjeta_ultimos_4 character varying(4),
    nombre_titular character varying(255),
    fecha_expiracion date,
    tipo_tarjeta character varying(50),
    banco character varying(100),
    numero_cuenta character varying(255),
    email_billetera character varying(255),
    telefono_billetera character varying(20),
    identificador_externo character varying(255),
    token_pago character varying(255),
    proveedor_token character varying(50),
    es_predeterminado boolean DEFAULT false,
    activo boolean DEFAULT true,
    verificado boolean DEFAULT false,
    fecha_verificacion timestamp without time zone,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT metodos_pago_cliente_tipo_tarjeta_check CHECK (((tipo_tarjeta)::text = ANY ((ARRAY['visa'::character varying, 'mastercard'::character varying, 'amex'::character varying, 'discover'::character varying, 'otro'::character varying])::text[])))
);


ALTER TABLE public.metodos_pago_cliente OWNER TO postgres;

--
-- TOC entry 295 (class 1259 OID 72304)
-- Name: metodos_pago_cliente_id_metodo_pago_cliente_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.metodos_pago_cliente_id_metodo_pago_cliente_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.metodos_pago_cliente_id_metodo_pago_cliente_seq OWNER TO postgres;

--
-- TOC entry 5755 (class 0 OID 0)
-- Dependencies: 295
-- Name: metodos_pago_cliente_id_metodo_pago_cliente_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.metodos_pago_cliente_id_metodo_pago_cliente_seq OWNED BY public.metodos_pago_cliente.id_metodo_pago_cliente;


--
-- TOC entry 293 (class 1259 OID 72278)
-- Name: metodos_pago_id_metodo_pago_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.metodos_pago_id_metodo_pago_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.metodos_pago_id_metodo_pago_seq OWNER TO postgres;

--
-- TOC entry 5756 (class 0 OID 0)
-- Dependencies: 293
-- Name: metodos_pago_id_metodo_pago_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.metodos_pago_id_metodo_pago_seq OWNED BY public.metodos_pago.id_metodo_pago;


--
-- TOC entry 292 (class 1259 OID 72263)
-- Name: migracion_metodos_pago_auditoria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migracion_metodos_pago_auditoria (
    id_auditoria integer NOT NULL,
    fecha_migracion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tipo_operacion character varying(50) NOT NULL,
    tabla_origen character varying(100),
    tabla_destino character varying(100),
    id_pago_original integer,
    metodo_pago_antiguo character varying(50),
    id_metodo_pago_nuevo integer,
    nombre_metodo_asignado character varying(100),
    detalles jsonb,
    estado_verificacion character varying(50),
    descripcion_verificacion text,
    usuario_ejecucion character varying(100) DEFAULT CURRENT_USER,
    notas text,
    CONSTRAINT migracion_metodos_pago_auditoria_estado_verificacion_check CHECK (((estado_verificacion)::text = ANY ((ARRAY['ok'::character varying, 'con_limitacion'::character varying, 'error'::character varying, NULL::character varying])::text[]))),
    CONSTRAINT migracion_metodos_pago_auditoria_tipo_operacion_check CHECK (((tipo_operacion)::text = ANY ((ARRAY['insert'::character varying, 'update'::character varying, 'delete'::character varying, 'verificacion'::character varying])::text[])))
);


ALTER TABLE public.migracion_metodos_pago_auditoria OWNER TO postgres;

--
-- TOC entry 291 (class 1259 OID 72262)
-- Name: migracion_metodos_pago_auditoria_id_auditoria_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migracion_metodos_pago_auditoria_id_auditoria_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migracion_metodos_pago_auditoria_id_auditoria_seq OWNER TO postgres;

--
-- TOC entry 5757 (class 0 OID 0)
-- Dependencies: 291
-- Name: migracion_metodos_pago_auditoria_id_auditoria_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migracion_metodos_pago_auditoria_id_auditoria_seq OWNED BY public.migracion_metodos_pago_auditoria.id_auditoria;


--
-- TOC entry 264 (class 1259 OID 71910)
-- Name: movimientos_inventario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movimientos_inventario (
    id_movimiento integer NOT NULL,
    id_inventario integer NOT NULL,
    tipo_movimiento character varying(30) NOT NULL,
    cantidad integer NOT NULL,
    cantidad_anterior integer NOT NULL,
    cantidad_nueva integer NOT NULL,
    id_usuario integer NOT NULL,
    id_orden integer,
    motivo text,
    referencia character varying(100),
    fecha_movimiento timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT movimientos_inventario_tipo_movimiento_check CHECK (((tipo_movimiento)::text = ANY ((ARRAY['entrada'::character varying, 'salida'::character varying, 'ajuste'::character varying, 'transferencia'::character varying, 'devolucion'::character varying])::text[])))
);


ALTER TABLE public.movimientos_inventario OWNER TO postgres;

--
-- TOC entry 5758 (class 0 OID 0)
-- Dependencies: 264
-- Name: TABLE movimientos_inventario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.movimientos_inventario IS 'Historial de todos los movimientos de inventario';


--
-- TOC entry 263 (class 1259 OID 71909)
-- Name: movimientos_inventario_id_movimiento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.movimientos_inventario_id_movimiento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.movimientos_inventario_id_movimiento_seq OWNER TO postgres;

--
-- TOC entry 5759 (class 0 OID 0)
-- Dependencies: 263
-- Name: movimientos_inventario_id_movimiento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.movimientos_inventario_id_movimiento_seq OWNED BY public.movimientos_inventario.id_movimiento;


--
-- TOC entry 246 (class 1259 OID 71712)
-- Name: oportunidades_venta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.oportunidades_venta (
    id_oportunidad integer NOT NULL,
    id_cliente integer NOT NULL,
    id_usuario_asignado integer,
    titulo character varying(255) NOT NULL,
    descripcion text,
    valor_estimado numeric(10,2),
    probabilidad_cierre integer,
    etapa character varying(50) DEFAULT 'prospecto'::character varying NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre_estimada date,
    fecha_cierre_real date,
    motivo_perdida text,
    estado character varying(20) DEFAULT 'activo'::character varying,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT oportunidades_venta_estado_check CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'cerrado'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT oportunidades_venta_etapa_check CHECK (((etapa)::text = ANY ((ARRAY['prospecto'::character varying, 'contactado'::character varying, 'calificado'::character varying, 'propuesta'::character varying, 'negociacion'::character varying, 'ganado'::character varying, 'perdido'::character varying])::text[]))),
    CONSTRAINT oportunidades_venta_probabilidad_cierre_check CHECK (((probabilidad_cierre >= 0) AND (probabilidad_cierre <= 100))),
    CONSTRAINT oportunidades_venta_valor_estimado_check CHECK ((valor_estimado >= (0)::numeric))
);


ALTER TABLE public.oportunidades_venta OWNER TO postgres;

--
-- TOC entry 5760 (class 0 OID 0)
-- Dependencies: 246
-- Name: TABLE oportunidades_venta; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.oportunidades_venta IS 'Pipeline de ventas y oportunidades de negocio';


--
-- TOC entry 245 (class 1259 OID 71711)
-- Name: oportunidades_venta_id_oportunidad_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.oportunidades_venta_id_oportunidad_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oportunidades_venta_id_oportunidad_seq OWNER TO postgres;

--
-- TOC entry 5761 (class 0 OID 0)
-- Dependencies: 245
-- Name: oportunidades_venta_id_oportunidad_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.oportunidades_venta_id_oportunidad_seq OWNED BY public.oportunidades_venta.id_oportunidad;


--
-- TOC entry 307 (class 1259 OID 72431)
-- Name: orden_estado_historial; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orden_estado_historial (
    id_historial integer NOT NULL,
    id_orden integer NOT NULL,
    id_estado_anterior integer,
    id_estado_nuevo integer NOT NULL,
    id_usuario integer,
    comentario text,
    metadata jsonb,
    ip_origen character varying(50),
    fecha_cambio timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.orden_estado_historial OWNER TO postgres;

--
-- TOC entry 306 (class 1259 OID 72430)
-- Name: orden_estado_historial_id_historial_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orden_estado_historial_id_historial_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orden_estado_historial_id_historial_seq OWNER TO postgres;

--
-- TOC entry 5762 (class 0 OID 0)
-- Dependencies: 306
-- Name: orden_estado_historial_id_historial_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orden_estado_historial_id_historial_seq OWNED BY public.orden_estado_historial.id_historial;


--
-- TOC entry 305 (class 1259 OID 72405)
-- Name: orden_estado_transiciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orden_estado_transiciones (
    id_transicion integer NOT NULL,
    id_estado_origen integer NOT NULL,
    id_estado_destino integer NOT NULL,
    requiere_permiso boolean DEFAULT false,
    rol_requerido character varying(50),
    validacion_requerida boolean DEFAULT false,
    descripcion text,
    activo boolean DEFAULT true
);


ALTER TABLE public.orden_estado_transiciones OWNER TO postgres;

--
-- TOC entry 304 (class 1259 OID 72404)
-- Name: orden_estado_transiciones_id_transicion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orden_estado_transiciones_id_transicion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orden_estado_transiciones_id_transicion_seq OWNER TO postgres;

--
-- TOC entry 5763 (class 0 OID 0)
-- Dependencies: 304
-- Name: orden_estado_transiciones_id_transicion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orden_estado_transiciones_id_transicion_seq OWNED BY public.orden_estado_transiciones.id_transicion;


--
-- TOC entry 303 (class 1259 OID 72375)
-- Name: orden_estados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orden_estados (
    id_orden_estado integer NOT NULL,
    codigo_estado character varying(50) NOT NULL,
    nombre_estado character varying(100) NOT NULL,
    descripcion text,
    color_hex character varying(7) DEFAULT '#000000'::character varying,
    icono character varying(50),
    orden_secuencia integer DEFAULT 0 NOT NULL,
    es_estado_final boolean DEFAULT false,
    es_estado_cancelado boolean DEFAULT false,
    notificar_cliente boolean DEFAULT true,
    notificar_admin boolean DEFAULT false,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.orden_estados OWNER TO postgres;

--
-- TOC entry 302 (class 1259 OID 72374)
-- Name: orden_estados_id_orden_estado_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orden_estados_id_orden_estado_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orden_estados_id_orden_estado_seq OWNER TO postgres;

--
-- TOC entry 5764 (class 0 OID 0)
-- Dependencies: 302
-- Name: orden_estados_id_orden_estado_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orden_estados_id_orden_estado_seq OWNED BY public.orden_estados.id_orden_estado;


--
-- TOC entry 236 (class 1259 OID 71597)
-- Name: ordenes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ordenes (
    id_orden integer NOT NULL,
    id_cliente integer NOT NULL,
    id_direccion_envio integer NOT NULL,
    fecha_orden timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total_orden numeric(10,2) NOT NULL,
    estado_orden character varying(50) DEFAULT 'pendiente'::character varying,
    notas_orden text,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id_estado_orden integer,
    fecha_estado_cambio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    dias_estimados_entrega integer,
    CONSTRAINT ordenes_estado_orden_check CHECK (((estado_orden)::text = ANY ((ARRAY['pendiente'::character varying, 'procesando'::character varying, 'enviado'::character varying, 'entregado'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT ordenes_total_orden_check CHECK ((total_orden >= (0)::numeric))
);


ALTER TABLE public.ordenes OWNER TO postgres;

--
-- TOC entry 5765 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE ordenes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.ordenes IS 'Ã“rdenes de compra generadas';


--
-- TOC entry 268 (class 1259 OID 71950)
-- Name: ordenes_compra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ordenes_compra (
    id_orden_compra integer NOT NULL,
    id_proveedor integer NOT NULL,
    id_almacen integer NOT NULL,
    id_usuario integer NOT NULL,
    numero_orden character varying(50),
    fecha_orden timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega_esperada date,
    fecha_entrega_real date,
    total_orden numeric(10,2) NOT NULL,
    estado character varying(30) DEFAULT 'pendiente'::character varying,
    notas text,
    CONSTRAINT ordenes_compra_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'aprobada'::character varying, 'enviada'::character varying, 'recibida'::character varying, 'cancelada'::character varying])::text[]))),
    CONSTRAINT ordenes_compra_total_orden_check CHECK ((total_orden >= (0)::numeric))
);


ALTER TABLE public.ordenes_compra OWNER TO postgres;

--
-- TOC entry 5766 (class 0 OID 0)
-- Dependencies: 268
-- Name: TABLE ordenes_compra; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.ordenes_compra IS 'Ã“rdenes de compra a proveedores';


--
-- TOC entry 270 (class 1259 OID 71982)
-- Name: ordenes_compra_detalle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ordenes_compra_detalle (
    id_detalle integer NOT NULL,
    id_orden_compra integer NOT NULL,
    id_producto integer NOT NULL,
    cantidad_ordenada integer NOT NULL,
    cantidad_recibida integer DEFAULT 0,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) GENERATED ALWAYS AS (((cantidad_ordenada)::numeric * precio_unitario)) STORED,
    CONSTRAINT ordenes_compra_detalle_cantidad_ordenada_check CHECK ((cantidad_ordenada > 0)),
    CONSTRAINT ordenes_compra_detalle_cantidad_recibida_check CHECK ((cantidad_recibida >= 0)),
    CONSTRAINT ordenes_compra_detalle_precio_unitario_check CHECK ((precio_unitario >= (0)::numeric))
);


ALTER TABLE public.ordenes_compra_detalle OWNER TO postgres;

--
-- TOC entry 269 (class 1259 OID 71981)
-- Name: ordenes_compra_detalle_id_detalle_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ordenes_compra_detalle_id_detalle_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ordenes_compra_detalle_id_detalle_seq OWNER TO postgres;

--
-- TOC entry 5767 (class 0 OID 0)
-- Dependencies: 269
-- Name: ordenes_compra_detalle_id_detalle_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ordenes_compra_detalle_id_detalle_seq OWNED BY public.ordenes_compra_detalle.id_detalle;


--
-- TOC entry 267 (class 1259 OID 71949)
-- Name: ordenes_compra_id_orden_compra_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ordenes_compra_id_orden_compra_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ordenes_compra_id_orden_compra_seq OWNER TO postgres;

--
-- TOC entry 5768 (class 0 OID 0)
-- Dependencies: 267
-- Name: ordenes_compra_id_orden_compra_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ordenes_compra_id_orden_compra_seq OWNED BY public.ordenes_compra.id_orden_compra;


--
-- TOC entry 235 (class 1259 OID 71596)
-- Name: ordenes_id_orden_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ordenes_id_orden_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ordenes_id_orden_seq OWNER TO postgres;

--
-- TOC entry 5769 (class 0 OID 0)
-- Dependencies: 235
-- Name: ordenes_id_orden_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ordenes_id_orden_seq OWNED BY public.ordenes.id_orden;


--
-- TOC entry 238 (class 1259 OID 71624)
-- Name: ordenes_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ordenes_items (
    id_orden_item integer NOT NULL,
    id_orden integer NOT NULL,
    id_producto integer NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) GENERATED ALWAYS AS (((cantidad)::numeric * precio_unitario)) STORED,
    CONSTRAINT ordenes_items_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT ordenes_items_precio_unitario_check CHECK ((precio_unitario >= (0)::numeric))
);


ALTER TABLE public.ordenes_items OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 71623)
-- Name: ordenes_items_id_orden_item_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ordenes_items_id_orden_item_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ordenes_items_id_orden_item_seq OWNER TO postgres;

--
-- TOC entry 5770 (class 0 OID 0)
-- Dependencies: 237
-- Name: ordenes_items_id_orden_item_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ordenes_items_id_orden_item_seq OWNED BY public.ordenes_items.id_orden_item;


--
-- TOC entry 240 (class 1259 OID 71646)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id_pago integer NOT NULL,
    id_orden integer NOT NULL,
    metodo_pago character varying(50) NOT NULL,
    monto numeric(10,2) NOT NULL,
    estado_pago character varying(50) DEFAULT 'pendiente'::character varying NOT NULL,
    fecha_pago timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    transaccion_id character varying(255),
    detalles_pago text,
    id_metodo_pago integer,
    id_metodo_pago_cliente integer,
    codigo_autorizacion character varying(100),
    referencia_externa character varying(255),
    comision numeric(10,2) DEFAULT 0,
    ip_origen character varying(50),
    datos_adicionales jsonb,
    CONSTRAINT payments_estado_pago_check CHECK (((estado_pago)::text = ANY ((ARRAY['pendiente'::character varying, 'procesando'::character varying, 'completado'::character varying, 'fallido'::character varying, 'reembolsado'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT payments_metodo_pago_check CHECK (((metodo_pago)::text = ANY ((ARRAY['tarjeta_credito'::character varying, 'tarjeta_debito'::character varying, 'paypal'::character varying, 'transferencia'::character varying, 'efectivo'::character varying])::text[]))),
    CONSTRAINT payments_monto_check CHECK ((monto >= (0)::numeric))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 5771 (class 0 OID 0)
-- Dependencies: 240
-- Name: TABLE payments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.payments IS 'Registro de transacciones de pago';


--
-- TOC entry 239 (class 1259 OID 71645)
-- Name: payments_id_pago_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_pago_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_pago_seq OWNER TO postgres;

--
-- TOC entry 5772 (class 0 OID 0)
-- Dependencies: 239
-- Name: payments_id_pago_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_pago_seq OWNED BY public.payments.id_pago;


--
-- TOC entry 288 (class 1259 OID 72235)
-- Name: politicas_devolucion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.politicas_devolucion (
    id_politica integer NOT NULL,
    nombre_politica character varying(100) NOT NULL,
    descripcion text,
    dias_devolucion integer DEFAULT 30 NOT NULL,
    productos_permitidos jsonb,
    condiciones_aceptacion text,
    metodo_reembolso_default character varying(50),
    costo_envio_cliente boolean DEFAULT true,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.politicas_devolucion OWNER TO postgres;

--
-- TOC entry 5773 (class 0 OID 0)
-- Dependencies: 288
-- Name: TABLE politicas_devolucion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.politicas_devolucion IS 'PolÃ­ticas de devoluciÃ³n configurables del sistema';


--
-- TOC entry 287 (class 1259 OID 72234)
-- Name: politicas_devolucion_id_politica_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.politicas_devolucion_id_politica_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.politicas_devolucion_id_politica_seq OWNER TO postgres;

--
-- TOC entry 5774 (class 0 OID 0)
-- Dependencies: 287
-- Name: politicas_devolucion_id_politica_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.politicas_devolucion_id_politica_seq OWNED BY public.politicas_devolucion.id_politica;


--
-- TOC entry 228 (class 1259 OID 71517)
-- Name: producto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.producto (
    id_producto integer NOT NULL,
    id_categoria integer NOT NULL,
    nombre_producto character varying(255) NOT NULL,
    descripcion text,
    precio numeric(10,2) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT producto_precio_check CHECK ((precio >= (0)::numeric)),
    CONSTRAINT producto_stock_check CHECK ((stock >= 0))
);


ALTER TABLE public.producto OWNER TO postgres;

--
-- TOC entry 5775 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE producto; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.producto IS 'CatÃ¡logo de productos disponibles';


--
-- TOC entry 227 (class 1259 OID 71516)
-- Name: producto_id_producto_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.producto_id_producto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.producto_id_producto_seq OWNER TO postgres;

--
-- TOC entry 5776 (class 0 OID 0)
-- Dependencies: 227
-- Name: producto_id_producto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.producto_id_producto_seq OWNED BY public.producto.id_producto;


--
-- TOC entry 230 (class 1259 OID 71541)
-- Name: producto_imagenes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.producto_imagenes (
    id_imagen integer NOT NULL,
    id_producto integer NOT NULL,
    url_imagen character varying(255) NOT NULL,
    es_principal boolean DEFAULT false
);


ALTER TABLE public.producto_imagenes OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 71540)
-- Name: producto_imagenes_id_imagen_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.producto_imagenes_id_imagen_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.producto_imagenes_id_imagen_seq OWNER TO postgres;

--
-- TOC entry 5777 (class 0 OID 0)
-- Dependencies: 229
-- Name: producto_imagenes_id_imagen_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.producto_imagenes_id_imagen_seq OWNED BY public.producto_imagenes.id_imagen;


--
-- TOC entry 266 (class 1259 OID 71939)
-- Name: proveedores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proveedores (
    id_proveedor integer NOT NULL,
    nombre_proveedor character varying(255) NOT NULL,
    contacto character varying(100),
    email character varying(255),
    telefono character varying(20),
    direccion text,
    nit character varying(20),
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.proveedores OWNER TO postgres;

--
-- TOC entry 5778 (class 0 OID 0)
-- Dependencies: 266
-- Name: TABLE proveedores; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.proveedores IS 'CatÃ¡logo de proveedores';


--
-- TOC entry 265 (class 1259 OID 71938)
-- Name: proveedores_id_proveedor_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.proveedores_id_proveedor_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proveedores_id_proveedor_seq OWNER TO postgres;

--
-- TOC entry 5779 (class 0 OID 0)
-- Dependencies: 265
-- Name: proveedores_id_proveedor_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proveedores_id_proveedor_seq OWNED BY public.proveedores.id_proveedor;


--
-- TOC entry 218 (class 1259 OID 71435)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id_rol integer NOT NULL,
    nombre_rol character varying(50) NOT NULL,
    descripcion text,
    permisos jsonb DEFAULT '{}'::jsonb,
    activo boolean DEFAULT true,
    fecha_creacion timestamp with time zone NOT NULL,
    fecha_actualizacion timestamp with time zone NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 71434)
-- Name: roles_id_rol_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_rol_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_rol_seq OWNER TO postgres;

--
-- TOC entry 5780 (class 0 OID 0)
-- Dependencies: 217
-- Name: roles_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_rol_seq OWNED BY public.roles.id_rol;


--
-- TOC entry 250 (class 1259 OID 71779)
-- Name: segmentos_cliente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.segmentos_cliente (
    id_segmento integer NOT NULL,
    nombre_segmento character varying(100) NOT NULL,
    descripcion text,
    criterios jsonb,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.segmentos_cliente OWNER TO postgres;

--
-- TOC entry 5781 (class 0 OID 0)
-- Dependencies: 250
-- Name: TABLE segmentos_cliente; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.segmentos_cliente IS 'SegmentaciÃ³n de clientes para marketing dirigido';


--
-- TOC entry 249 (class 1259 OID 71778)
-- Name: segmentos_cliente_id_segmento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.segmentos_cliente_id_segmento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.segmentos_cliente_id_segmento_seq OWNER TO postgres;

--
-- TOC entry 5782 (class 0 OID 0)
-- Dependencies: 249
-- Name: segmentos_cliente_id_segmento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.segmentos_cliente_id_segmento_seq OWNED BY public.segmentos_cliente.id_segmento;


--
-- TOC entry 248 (class 1259 OID 71743)
-- Name: tareas_crm; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tareas_crm (
    id_tarea integer NOT NULL,
    id_cliente integer,
    id_oportunidad integer,
    id_usuario_asignado integer NOT NULL,
    titulo character varying(255) NOT NULL,
    descripcion text,
    tipo_tarea character varying(50) NOT NULL,
    prioridad character varying(20) DEFAULT 'media'::character varying,
    fecha_vencimiento timestamp without time zone,
    fecha_completado timestamp without time zone,
    estado character varying(30) DEFAULT 'pendiente'::character varying,
    notas text,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tareas_crm_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'en_proceso'::character varying, 'completado'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT tareas_crm_prioridad_check CHECK (((prioridad)::text = ANY ((ARRAY['baja'::character varying, 'media'::character varying, 'alta'::character varying, 'urgente'::character varying])::text[]))),
    CONSTRAINT tareas_crm_tipo_tarea_check CHECK (((tipo_tarea)::text = ANY ((ARRAY['llamada'::character varying, 'email'::character varying, 'reunion'::character varying, 'seguimiento'::character varying, 'cotizacion'::character varying, 'otro'::character varying])::text[])))
);


ALTER TABLE public.tareas_crm OWNER TO postgres;

--
-- TOC entry 5783 (class 0 OID 0)
-- Dependencies: 248
-- Name: TABLE tareas_crm; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.tareas_crm IS 'GestiÃ³n de tareas y actividades del equipo de ventas';


--
-- TOC entry 247 (class 1259 OID 71742)
-- Name: tareas_crm_id_tarea_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tareas_crm_id_tarea_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tareas_crm_id_tarea_seq OWNER TO postgres;

--
-- TOC entry 5784 (class 0 OID 0)
-- Dependencies: 247
-- Name: tareas_crm_id_tarea_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tareas_crm_id_tarea_seq OWNED BY public.tareas_crm.id_tarea;


--
-- TOC entry 220 (class 1259 OID 71450)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id_usuario integer NOT NULL,
    nombre_usuario character varying(100) NOT NULL,
    correo_electronico character varying(255) NOT NULL,
    contrasena character varying(255) NOT NULL,
    id_rol integer DEFAULT 2 NOT NULL,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 5785 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE usuarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.usuarios IS 'Tabla principal de autenticaciÃ³n y roles';


--
-- TOC entry 219 (class 1259 OID 71449)
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_usuario_seq OWNER TO postgres;

--
-- TOC entry 5786 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_usuario_seq OWNED BY public.usuarios.id_usuario;


--
-- TOC entry 256 (class 1259 OID 71855)
-- Name: vista_clientes_actividad; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_clientes_actividad AS
 SELECT c.id_cliente,
    (((c.nombre)::text || ' '::text) || (c.apellido)::text) AS nombre_completo,
    u.correo_electronico,
    c.telefono,
    count(DISTINCT o.id_orden) AS total_ordenes,
    COALESCE(sum(o.total_orden), (0)::numeric) AS valor_total_compras,
    max(o.fecha_orden) AS ultima_compra,
    count(DISTINCT i.id_interaccion) AS total_interacciones,
    max(i.fecha_interaccion) AS ultima_interaccion
   FROM (((public.clientes c
     JOIN public.usuarios u ON ((c.id_usuario = u.id_usuario)))
     LEFT JOIN public.ordenes o ON ((c.id_cliente = o.id_cliente)))
     LEFT JOIN public.interacciones_cliente i ON ((c.id_cliente = i.id_cliente)))
  GROUP BY c.id_cliente, c.nombre, c.apellido, u.correo_electronico, c.telefono;


ALTER VIEW public.vista_clientes_actividad OWNER TO postgres;

--
-- TOC entry 298 (class 1259 OID 72354)
-- Name: vista_comparacion_migracion; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_comparacion_migracion AS
 SELECT count(*) AS total_pagos,
    count(DISTINCT
        CASE
            WHEN (metodo_pago IS NOT NULL) THEN 1
            ELSE NULL::integer
        END) AS pagos_con_metodo_antiguo,
    count(DISTINCT
        CASE
            WHEN (id_metodo_pago IS NOT NULL) THEN 1
            ELSE NULL::integer
        END) AS pagos_con_metodo_nuevo,
    count(DISTINCT
        CASE
            WHEN ((metodo_pago IS NOT NULL) AND (id_metodo_pago IS NULL)) THEN 1
            ELSE NULL::integer
        END) AS pagos_sin_migrar,
    round((((count(DISTINCT
        CASE
            WHEN (id_metodo_pago IS NOT NULL) THEN 1
            ELSE NULL::integer
        END))::numeric / (NULLIF(count(*), 0))::numeric) * (100)::numeric), 2) AS porcentaje_migrado
   FROM public.payments p;


ALTER VIEW public.vista_comparacion_migracion OWNER TO postgres;

--
-- TOC entry 289 (class 1259 OID 72248)
-- Name: vista_devoluciones_detalle; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_devoluciones_detalle AS
SELECT
    NULL::integer AS id_devolucion,
    NULL::character varying(50) AS numero_devolucion,
    NULL::timestamp without time zone AS fecha_solicitud,
    NULL::character varying(30) AS estado,
    NULL::character varying(20) AS tipo_devolucion,
    NULL::character varying(100) AS motivo,
    NULL::numeric(10,2) AS monto_total_devolucion,
    NULL::numeric(10,2) AS monto_aprobado,
    NULL::integer AS id_orden,
    NULL::numeric(10,2) AS total_orden_original,
    NULL::integer AS id_cliente,
    NULL::text AS nombre_cliente,
    NULL::character varying(255) AS correo_electronico,
    NULL::bigint AS total_items,
    NULL::bigint AS cantidad_total_solicitada,
    NULL::bigint AS cantidad_total_aprobada,
    NULL::text AS estado_general;


ALTER VIEW public.vista_devoluciones_detalle OWNER TO postgres;

--
-- TOC entry 290 (class 1259 OID 72253)
-- Name: vista_devoluciones_items_detalle; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_devoluciones_items_detalle AS
 SELECT di.id_devolucion_item,
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
    oi.cantidad AS cantidad_original,
    ((di.cantidad_solicitada)::numeric * di.precio_unitario) AS monto_solicitado,
    ((di.cantidad_aprobada)::numeric * di.precio_unitario) AS monto_aprobado
   FROM (((public.devoluciones_items di
     JOIN public.devoluciones d ON ((di.id_devolucion = d.id_devolucion)))
     JOIN public.producto p ON ((di.id_producto = p.id_producto)))
     JOIN public.ordenes_items oi ON ((di.id_orden_item = oi.id_orden_item)));


ALTER VIEW public.vista_devoluciones_items_detalle OWNER TO postgres;

--
-- TOC entry 278 (class 1259 OID 72103)
-- Name: vista_inventario_consolidado; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_inventario_consolidado AS
 SELECT p.id_producto,
    p.nombre_producto,
    c.nombre_categoria,
    a.nombre_almacen,
    i.cantidad_actual,
    i.cantidad_minima,
    i.ubicacion_fisica,
    p.precio,
    ((i.cantidad_actual)::numeric * p.precio) AS valor_inventario,
        CASE
            WHEN (i.cantidad_actual = 0) THEN 'Agotado'::text
            WHEN (i.cantidad_actual <= i.cantidad_minima) THEN 'Stock Bajo'::text
            WHEN (i.cantidad_actual > i.cantidad_maxima) THEN 'Sobrestock'::text
            ELSE 'Normal'::text
        END AS estado_stock
   FROM (((public.inventario i
     JOIN public.producto p ON ((i.id_producto = p.id_producto)))
     JOIN public.categoria_producto c ON ((p.id_categoria = c.id_categoria)))
     JOIN public.almacenes a ON ((i.id_almacen = a.id_almacen)))
  WHERE (p.activo = true);


ALTER VIEW public.vista_inventario_consolidado OWNER TO postgres;

--
-- TOC entry 309 (class 1259 OID 72500)
-- Name: vista_inventario_por_categoria; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_inventario_por_categoria AS
 SELECT cp.nombre_categoria,
    count(DISTINCT i.id_producto) AS total_productos,
    sum(i.cantidad_actual) AS stock_total,
    sum(((i.cantidad_actual)::numeric * p.precio)) AS valor_total,
    avg(i.cantidad_actual) AS stock_promedio,
    count(
        CASE
            WHEN (i.cantidad_actual <= i.cantidad_minima) THEN 1
            ELSE NULL::integer
        END) AS productos_bajo_stock,
    count(
        CASE
            WHEN (i.cantidad_actual = 0) THEN 1
            ELSE NULL::integer
        END) AS productos_agotados
   FROM ((public.inventario i
     JOIN public.producto p ON ((i.id_producto = p.id_producto)))
     JOIN public.categoria_producto cp ON ((p.id_categoria = cp.id_categoria)))
  GROUP BY cp.id_categoria, cp.nombre_categoria;


ALTER VIEW public.vista_inventario_por_categoria OWNER TO postgres;

--
-- TOC entry 299 (class 1259 OID 72359)
-- Name: vista_metodos_pago_activos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_metodos_pago_activos AS
 SELECT id_metodo_pago,
    nombre_metodo,
    tipo_metodo,
    descripcion,
    icono_url,
    comision_porcentaje,
    comision_fija,
    disponible_online,
    disponible_tienda,
    orden_visualizacion
   FROM public.metodos_pago
  WHERE (activo = true)
  ORDER BY orden_visualizacion;


ALTER VIEW public.vista_metodos_pago_activos OWNER TO postgres;

--
-- TOC entry 300 (class 1259 OID 72363)
-- Name: vista_metodos_pago_cliente; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_metodos_pago_cliente AS
 SELECT mpc.id_metodo_pago_cliente,
    mpc.id_cliente,
    (((c.nombre)::text || ' '::text) || (c.apellido)::text) AS nombre_cliente,
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
   FROM ((public.metodos_pago_cliente mpc
     JOIN public.metodos_pago mp ON ((mpc.id_metodo_pago = mp.id_metodo_pago)))
     JOIN public.clientes c ON ((mpc.id_cliente = c.id_cliente)))
  WHERE (mpc.activo = true);


ALTER VIEW public.vista_metodos_pago_cliente OWNER TO postgres;

--
-- TOC entry 297 (class 1259 OID 72350)
-- Name: vista_migracion_auditoria; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_migracion_auditoria AS
 SELECT id_auditoria,
    fecha_migracion,
    tipo_operacion,
    id_pago_original,
    metodo_pago_antiguo,
    nombre_metodo_asignado,
    estado_verificacion,
    descripcion_verificacion,
    count(*) OVER (PARTITION BY estado_verificacion) AS total_por_estado
   FROM public.migracion_metodos_pago_auditoria ma
  ORDER BY fecha_migracion DESC;


ALTER VIEW public.vista_migracion_auditoria OWNER TO postgres;

--
-- TOC entry 280 (class 1259 OID 72113)
-- Name: vista_movimientos_recientes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_movimientos_recientes AS
 SELECT m.id_movimiento,
    m.tipo_movimiento,
    m.cantidad,
    m.fecha_movimiento,
    p.nombre_producto,
    a.nombre_almacen,
    u.nombre_usuario AS usuario,
    m.motivo,
    m.referencia
   FROM ((((public.movimientos_inventario m
     JOIN public.inventario i ON ((m.id_inventario = i.id_inventario)))
     JOIN public.producto p ON ((i.id_producto = p.id_producto)))
     JOIN public.almacenes a ON ((i.id_almacen = a.id_almacen)))
     JOIN public.usuarios u ON ((m.id_usuario = u.id_usuario)))
  ORDER BY m.fecha_movimiento DESC;


ALTER VIEW public.vista_movimientos_recientes OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 71677)
-- Name: vista_ordenes_detalle; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_ordenes_detalle AS
 SELECT o.id_orden,
    o.fecha_orden,
    o.total_orden,
    o.estado_orden,
    (((cl.nombre)::text || ' '::text) || (cl.apellido)::text) AS nombre_cliente,
    u.correo_electronico,
    (((((d.calle)::text || ', '::text) || (d.ciudad)::text) || ', '::text) || (d.pais)::text) AS direccion_completa
   FROM (((public.ordenes o
     JOIN public.clientes cl ON ((o.id_cliente = cl.id_cliente)))
     JOIN public.usuarios u ON ((cl.id_usuario = u.id_usuario)))
     JOIN public.direcciones d ON ((o.id_direccion_envio = d.id_direccion)));


ALTER VIEW public.vista_ordenes_detalle OWNER TO postgres;

--
-- TOC entry 301 (class 1259 OID 72368)
-- Name: vista_pagos_metodos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_pagos_metodos AS
 SELECT p.id_pago,
    p.id_orden,
    p.monto,
    p.estado_pago,
    p.fecha_pago,
    mp.nombre_metodo,
    mp.tipo_metodo,
    p.transaccion_id,
    p.codigo_autorizacion,
    p.comision,
    (((c.nombre)::text || ' '::text) || (c.apellido)::text) AS nombre_cliente
   FROM (((public.payments p
     LEFT JOIN public.metodos_pago mp ON ((p.id_metodo_pago = mp.id_metodo_pago)))
     LEFT JOIN public.ordenes o ON ((p.id_orden = o.id_orden)))
     LEFT JOIN public.clientes c ON ((o.id_cliente = c.id_cliente)));


ALTER VIEW public.vista_pagos_metodos OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 71860)
-- Name: vista_pipeline_ventas; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_pipeline_ventas AS
 SELECT etapa,
    count(*) AS cantidad_oportunidades,
    sum(valor_estimado) AS valor_total,
    avg(probabilidad_cierre) AS probabilidad_promedio,
    count(
        CASE
            WHEN (fecha_cierre_estimada < CURRENT_DATE) THEN 1
            ELSE NULL::integer
        END) AS vencidas
   FROM public.oportunidades_venta ov
  WHERE ((estado)::text = 'activo'::text)
  GROUP BY etapa
  ORDER BY
        CASE etapa
            WHEN 'prospecto'::text THEN 1
            WHEN 'contactado'::text THEN 2
            WHEN 'calificado'::text THEN 3
            WHEN 'propuesta'::text THEN 4
            WHEN 'negociacion'::text THEN 5
            WHEN 'ganado'::text THEN 6
            WHEN 'perdido'::text THEN 7
            ELSE NULL::integer
        END;


ALTER VIEW public.vista_pipeline_ventas OWNER TO postgres;

--
-- TOC entry 279 (class 1259 OID 72108)
-- Name: vista_productos_bajo_stock; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_productos_bajo_stock AS
 SELECT p.id_producto,
    p.nombre_producto,
    a.nombre_almacen,
    i.cantidad_actual,
    i.cantidad_minima,
    (i.cantidad_minima - i.cantidad_actual) AS cantidad_faltante
   FROM ((public.inventario i
     JOIN public.producto p ON ((i.id_producto = p.id_producto)))
     JOIN public.almacenes a ON ((i.id_almacen = a.id_almacen)))
  WHERE (i.cantidad_actual <= i.cantidad_minima)
  ORDER BY i.cantidad_actual;


ALTER VIEW public.vista_productos_bajo_stock OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 71672)
-- Name: vista_productos_completos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_productos_completos AS
 SELECT p.id_producto,
    p.nombre_producto,
    p.descripcion,
    p.precio,
    p.stock,
    p.activo,
    c.nombre_categoria,
    pi.url_imagen AS imagen_principal
   FROM ((public.producto p
     JOIN public.categoria_producto c ON ((p.id_categoria = c.id_categoria)))
     LEFT JOIN public.producto_imagenes pi ON (((p.id_producto = pi.id_producto) AND (pi.es_principal = true))))
  WHERE (p.activo = true);


ALTER VIEW public.vista_productos_completos OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 71865)
-- Name: vista_tareas_pendientes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_tareas_pendientes AS
 SELECT t.id_tarea,
    t.titulo,
    t.tipo_tarea,
    t.prioridad,
    t.fecha_vencimiento,
    u.nombre_usuario AS asignado_a,
    (((c.nombre)::text || ' '::text) || (c.apellido)::text) AS cliente,
        CASE
            WHEN (t.fecha_vencimiento < CURRENT_TIMESTAMP) THEN 'Vencida'::text
            WHEN (t.fecha_vencimiento < (CURRENT_TIMESTAMP + '1 day'::interval)) THEN 'Urgente'::text
            ELSE 'A tiempo'::text
        END AS estado_vencimiento
   FROM ((public.tareas_crm t
     JOIN public.usuarios u ON ((t.id_usuario_asignado = u.id_usuario)))
     LEFT JOIN public.clientes c ON ((t.id_cliente = c.id_cliente)))
  WHERE ((t.estado)::text = ANY ((ARRAY['pendiente'::character varying, 'en_proceso'::character varying])::text[]))
  ORDER BY t.prioridad DESC, t.fecha_vencimiento;


ALTER VIEW public.vista_tareas_pendientes OWNER TO postgres;

--
-- TOC entry 308 (class 1259 OID 72495)
-- Name: vista_ventas_por_segmento; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_ventas_por_segmento AS
 SELECT sc.nombre_segmento,
    count(DISTINCT c.id_cliente) AS total_clientes,
    count(DISTINCT o.id_orden) AS total_ordenes,
    COALESCE(sum(o.total_orden), (0)::numeric) AS ventas_totales,
    avg(o.total_orden) AS ticket_promedio,
    max(o.fecha_orden) AS ultima_venta
   FROM (((public.segmentos_cliente sc
     LEFT JOIN public.cliente_segmentos cs ON ((sc.id_segmento = cs.id_segmento)))
     LEFT JOIN public.clientes c ON ((cs.id_cliente = c.id_cliente)))
     LEFT JOIN public.ordenes o ON ((c.id_cliente = o.id_cliente)))
  WHERE (sc.activo = true)
  GROUP BY sc.id_segmento, sc.nombre_segmento;


ALTER VIEW public.vista_ventas_por_segmento OWNER TO postgres;

--
-- TOC entry 5091 (class 2604 OID 72007)
-- Name: alertas_inventario id_alerta; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertas_inventario ALTER COLUMN id_alerta SET DEFAULT nextval('public.alertas_inventario_id_alerta_seq'::regclass);


--
-- TOC entry 5072 (class 2604 OID 71874)
-- Name: almacenes id_almacen; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.almacenes ALTER COLUMN id_almacen SET DEFAULT nextval('public.almacenes_id_almacen_seq'::regclass);


--
-- TOC entry 5070 (class 2604 OID 71828)
-- Name: campana_clientes id_campana_cliente; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campana_clientes ALTER COLUMN id_campana_cliente SET DEFAULT nextval('public.campana_clientes_id_campana_cliente_seq'::regclass);


--
-- TOC entry 5066 (class 2604 OID 71814)
-- Name: campanas_marketing id_campana; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campanas_marketing ALTER COLUMN id_campana SET DEFAULT nextval('public.campanas_marketing_id_campana_seq'::regclass);


--
-- TOC entry 5029 (class 2604 OID 71558)
-- Name: carrito_compras id_carrito; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_compras ALTER COLUMN id_carrito SET DEFAULT nextval('public.carrito_compras_id_carrito_seq'::regclass);


--
-- TOC entry 5033 (class 2604 OID 71576)
-- Name: carrito_productos id_carrito_producto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_productos ALTER COLUMN id_carrito_producto SET DEFAULT nextval('public.carrito_productos_id_carrito_producto_seq'::regclass);


--
-- TOC entry 5019 (class 2604 OID 71507)
-- Name: categoria_producto id_categoria; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria_producto ALTER COLUMN id_categoria SET DEFAULT nextval('public.categoria_producto_id_categoria_seq'::regclass);


--
-- TOC entry 5016 (class 2604 OID 71478)
-- Name: clientes id_cliente; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id_cliente SET DEFAULT nextval('public.clientes_id_cliente_seq'::regclass);


--
-- TOC entry 5094 (class 2604 OID 72031)
-- Name: cotizaciones id_cotizacion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones ALTER COLUMN id_cotizacion SET DEFAULT nextval('public.cotizaciones_id_cotizacion_seq'::regclass);


--
-- TOC entry 5104 (class 2604 OID 72124)
-- Name: cotizaciones_auditoria id_auditoria; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones_auditoria ALTER COLUMN id_auditoria SET DEFAULT nextval('public.cotizaciones_auditoria_id_auditoria_seq'::regclass);


--
-- TOC entry 5100 (class 2604 OID 72061)
-- Name: cotizaciones_items id_cotizacion_item; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones_items ALTER COLUMN id_cotizacion_item SET DEFAULT nextval('public.cotizaciones_items_id_cotizacion_item_seq'::regclass);


--
-- TOC entry 5106 (class 2604 OID 72144)
-- Name: devoluciones id_devolucion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devoluciones ALTER COLUMN id_devolucion SET DEFAULT nextval('public.devoluciones_id_devolucion_seq'::regclass);


--
-- TOC entry 5113 (class 2604 OID 72185)
-- Name: devoluciones_items id_devolucion_item; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devoluciones_items ALTER COLUMN id_devolucion_item SET DEFAULT nextval('public.devoluciones_items_id_devolucion_item_seq'::regclass);


--
-- TOC entry 5017 (class 2604 OID 71491)
-- Name: direcciones id_direccion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direcciones ALTER COLUMN id_direccion SET DEFAULT nextval('public.direcciones_id_direccion_seq'::regclass);


--
-- TOC entry 5046 (class 2604 OID 71686)
-- Name: interacciones_cliente id_interaccion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones_cliente ALTER COLUMN id_interaccion SET DEFAULT nextval('public.interacciones_cliente_id_interaccion_seq'::regclass);


--
-- TOC entry 5075 (class 2604 OID 71887)
-- Name: inventario id_inventario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario ALTER COLUMN id_inventario SET DEFAULT nextval('public.inventario_id_inventario_seq'::regclass);


--
-- TOC entry 5125 (class 2604 OID 72282)
-- Name: metodos_pago id_metodo_pago; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metodos_pago ALTER COLUMN id_metodo_pago SET DEFAULT nextval('public.metodos_pago_id_metodo_pago_seq'::regclass);


--
-- TOC entry 5135 (class 2604 OID 72308)
-- Name: metodos_pago_cliente id_metodo_pago_cliente; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metodos_pago_cliente ALTER COLUMN id_metodo_pago_cliente SET DEFAULT nextval('public.metodos_pago_cliente_id_metodo_pago_cliente_seq'::regclass);


--
-- TOC entry 5122 (class 2604 OID 72266)
-- Name: migracion_metodos_pago_auditoria id_auditoria; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migracion_metodos_pago_auditoria ALTER COLUMN id_auditoria SET DEFAULT nextval('public.migracion_metodos_pago_auditoria_id_auditoria_seq'::regclass);


--
-- TOC entry 5080 (class 2604 OID 71913)
-- Name: movimientos_inventario id_movimiento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario ALTER COLUMN id_movimiento SET DEFAULT nextval('public.movimientos_inventario_id_movimiento_seq'::regclass);


--
-- TOC entry 5051 (class 2604 OID 71715)
-- Name: oportunidades_venta id_oportunidad; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oportunidades_venta ALTER COLUMN id_oportunidad SET DEFAULT nextval('public.oportunidades_venta_id_oportunidad_seq'::regclass);


--
-- TOC entry 5155 (class 2604 OID 72434)
-- Name: orden_estado_historial id_historial; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orden_estado_historial ALTER COLUMN id_historial SET DEFAULT nextval('public.orden_estado_historial_id_historial_seq'::regclass);


--
-- TOC entry 5151 (class 2604 OID 72408)
-- Name: orden_estado_transiciones id_transicion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orden_estado_transiciones ALTER COLUMN id_transicion SET DEFAULT nextval('public.orden_estado_transiciones_id_transicion_seq'::regclass);


--
-- TOC entry 5141 (class 2604 OID 72378)
-- Name: orden_estados id_orden_estado; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orden_estados ALTER COLUMN id_orden_estado SET DEFAULT nextval('public.orden_estados_id_orden_estado_seq'::regclass);


--
-- TOC entry 5035 (class 2604 OID 71600)
-- Name: ordenes id_orden; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes ALTER COLUMN id_orden SET DEFAULT nextval('public.ordenes_id_orden_seq'::regclass);


--
-- TOC entry 5085 (class 2604 OID 71953)
-- Name: ordenes_compra id_orden_compra; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_compra ALTER COLUMN id_orden_compra SET DEFAULT nextval('public.ordenes_compra_id_orden_compra_seq'::regclass);


--
-- TOC entry 5088 (class 2604 OID 71985)
-- Name: ordenes_compra_detalle id_detalle; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_compra_detalle ALTER COLUMN id_detalle SET DEFAULT nextval('public.ordenes_compra_detalle_id_detalle_seq'::regclass);


--
-- TOC entry 5040 (class 2604 OID 71627)
-- Name: ordenes_items id_orden_item; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_items ALTER COLUMN id_orden_item SET DEFAULT nextval('public.ordenes_items_id_orden_item_seq'::regclass);


--
-- TOC entry 5042 (class 2604 OID 71649)
-- Name: payments id_pago; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id_pago SET DEFAULT nextval('public.payments_id_pago_seq'::regclass);


--
-- TOC entry 5116 (class 2604 OID 72238)
-- Name: politicas_devolucion id_politica; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.politicas_devolucion ALTER COLUMN id_politica SET DEFAULT nextval('public.politicas_devolucion_id_politica_seq'::regclass);


--
-- TOC entry 5022 (class 2604 OID 71520)
-- Name: producto id_producto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto ALTER COLUMN id_producto SET DEFAULT nextval('public.producto_id_producto_seq'::regclass);


--
-- TOC entry 5027 (class 2604 OID 71544)
-- Name: producto_imagenes id_imagen; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_imagenes ALTER COLUMN id_imagen SET DEFAULT nextval('public.producto_imagenes_id_imagen_seq'::regclass);


--
-- TOC entry 5082 (class 2604 OID 71942)
-- Name: proveedores id_proveedor; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores ALTER COLUMN id_proveedor SET DEFAULT nextval('public.proveedores_id_proveedor_seq'::regclass);


--
-- TOC entry 5008 (class 2604 OID 71438)
-- Name: roles id_rol; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id_rol SET DEFAULT nextval('public.roles_id_rol_seq'::regclass);


--
-- TOC entry 5061 (class 2604 OID 71782)
-- Name: segmentos_cliente id_segmento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.segmentos_cliente ALTER COLUMN id_segmento SET DEFAULT nextval('public.segmentos_cliente_id_segmento_seq'::regclass);


--
-- TOC entry 5056 (class 2604 OID 71746)
-- Name: tareas_crm id_tarea; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tareas_crm ALTER COLUMN id_tarea SET DEFAULT nextval('public.tareas_crm_id_tarea_seq'::regclass);


--
-- TOC entry 5011 (class 2604 OID 71453)
-- Name: usuarios id_usuario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuarios_id_usuario_seq'::regclass);


--
-- TOC entry 5697 (class 0 OID 72004)
-- Dependencies: 272
-- Data for Name: alertas_inventario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alertas_inventario (id_alerta, id_inventario, tipo_alerta, mensaje, fecha_alerta, resuelta, fecha_resolucion) FROM stdin;
\.


--
-- TOC entry 5685 (class 0 OID 71871)
-- Dependencies: 260
-- Data for Name: almacenes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.almacenes (id_almacen, nombre_almacen, direccion, telefono, responsable, activo, fecha_creacion) FROM stdin;
1	AlmacÃ©n Central	Zona 10, Ciudad de Guatemala	\N	Carlos MÃ©ndez	t	2025-11-13 04:24:01.131233
2	Bodega Auxiliar	Zona 12, Ciudad de Guatemala	\N	Ana RodrÃ­guez	t	2025-11-13 04:24:01.131233
\.


--
-- TOC entry 5683 (class 0 OID 71825)
-- Dependencies: 255
-- Data for Name: campana_clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.campana_clientes (id_campana_cliente, id_campana, id_cliente, fecha_envio, estado_envio, fecha_apertura, fecha_respuesta, notas) FROM stdin;
\.


--
-- TOC entry 5681 (class 0 OID 71811)
-- Dependencies: 253
-- Data for Name: campanas_marketing; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.campanas_marketing (id_campana, nombre_campana, descripcion, tipo_campana, fecha_inicio, fecha_fin, presupuesto, objetivo, estado, fecha_creacion, fecha_actualizacion) FROM stdin;
\.


--
-- TOC entry 5662 (class 0 OID 71555)
-- Dependencies: 232
-- Data for Name: carrito_compras; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.carrito_compras (id_carrito, id_cliente, estado, fecha_creacion, fecha_actualizacion) FROM stdin;
\.


--
-- TOC entry 5664 (class 0 OID 71573)
-- Dependencies: 234
-- Data for Name: carrito_productos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.carrito_productos (id_carrito_producto, id_carrito, id_producto, cantidad, precio_unitario, fecha_agregado) FROM stdin;
\.


--
-- TOC entry 5656 (class 0 OID 71504)
-- Dependencies: 226
-- Data for Name: categoria_producto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categoria_producto (id_categoria, nombre_categoria, descripcion, activo, fecha_creacion) FROM stdin;
1	ElectrÃ³nica	Dispositivos electrÃ³nicos y accesorios	t	2025-11-13 04:23:53.736721
2	Ropa	Vestimenta para hombre y mujer	t	2025-11-13 04:23:53.736721
3	Hogar	ArtÃ­culos para el hogar	t	2025-11-13 04:23:53.736721
4	Deportes	Equipamiento deportivo	t	2025-11-13 04:23:53.736721
\.


--
-- TOC entry 5679 (class 0 OID 71792)
-- Dependencies: 251
-- Data for Name: cliente_segmentos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cliente_segmentos (id_cliente, id_segmento, fecha_asignacion) FROM stdin;
\.


--
-- TOC entry 5652 (class 0 OID 71475)
-- Dependencies: 222
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clientes (id_cliente, id_usuario, nombre, apellido, telefono) FROM stdin;
1	2	Juan	PÃ©rez	+502 1234-5678
2	3	MarÃ­a	LÃ³pez	+502 8765-4321
\.


--
-- TOC entry 5699 (class 0 OID 72028)
-- Dependencies: 274
-- Data for Name: cotizaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cotizaciones (id_cotizacion, id_cliente, id_usuario_creador, numero_cotizacion, fecha_creacion, fecha_expiracion, estado, subtotal, impuestos, total, notas, terminos_condiciones) FROM stdin;
1	1	1	COT-202511-0001	2025-11-13 10:55:34.543	2025-12-31	borrador	0.00	0.00	0.00	Cotización para cliente corporativo	\N
2	1	1	COT-202511-0002	2025-11-13 22:59:04.403	2025-12-31	borrador	0.00	0.00	0.00	Cotización para cliente corporativo	\N
\.


--
-- TOC entry 5704 (class 0 OID 72121)
-- Dependencies: 282
-- Data for Name: cotizaciones_auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cotizaciones_auditoria (id_auditoria, id_cotizacion, estado_anterior, estado_nuevo, usuario_cambio, fecha_cambio, razon) FROM stdin;
\.


--
-- TOC entry 5701 (class 0 OID 72058)
-- Dependencies: 276
-- Data for Name: cotizaciones_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cotizaciones_items (id_cotizacion_item, id_cotizacion, id_producto, cantidad, precio_unitario, descuento_porcentaje) FROM stdin;
1	1	5	2	4999.99	10.00
\.


--
-- TOC entry 5702 (class 0 OID 72081)
-- Dependencies: 277
-- Data for Name: cotizaciones_ordenes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cotizaciones_ordenes (id_cotizacion, id_orden, fecha_conversion) FROM stdin;
\.


--
-- TOC entry 5706 (class 0 OID 72141)
-- Dependencies: 284
-- Data for Name: devoluciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.devoluciones (id_devolucion, id_orden, id_cliente, numero_devolucion, fecha_solicitud, fecha_aprobo_cliente, fecha_aprobacion, fecha_rechazo, fecha_completada, estado, tipo_devolucion, motivo, motivo_detalle, metodo_reembolso, monto_total_devolucion, monto_aprobado, costo_envio_devolucion, quien_cubre_envio, guia_devolucion, transportista_devolucion, notas_internas, notas_cliente, evidencia_imagenes, id_usuario_aprobo) FROM stdin;
\.


--
-- TOC entry 5708 (class 0 OID 72182)
-- Dependencies: 286
-- Data for Name: devoluciones_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.devoluciones_items (id_devolucion_item, id_devolucion, id_orden_item, id_producto, cantidad_solicitada, cantidad_aprobada, precio_unitario, motivo_item, estado_item, condicion_producto, accion_tomar, fecha_recibido, fecha_inspeccion, notas_inspeccion) FROM stdin;
\.


--
-- TOC entry 5654 (class 0 OID 71488)
-- Dependencies: 224
-- Data for Name: direcciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.direcciones (id_direccion, id_cliente, calle, ciudad, estado, codigo_postal, pais, es_principal) FROM stdin;
1	1	Calle Principal 123	Guatemala	Guatemala	01001	Guatemala	t
2	2	Avenida Reforma 456	Antigua	SacatepÃ©quez	03001	Guatemala	t
\.


--
-- TOC entry 5672 (class 0 OID 71683)
-- Dependencies: 244
-- Data for Name: interacciones_cliente; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interacciones_cliente (id_interaccion, id_cliente, id_usuario_asignado, tipo_interaccion, descripcion, resultado, fecha_interaccion, proxima_accion, fecha_proxima_accion, estado, fecha_creacion, fecha_actualizacion) FROM stdin;
\.


--
-- TOC entry 5687 (class 0 OID 71884)
-- Dependencies: 262
-- Data for Name: inventario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventario (id_inventario, id_producto, id_almacen, cantidad_actual, cantidad_minima, cantidad_maxima, ubicacion_fisica, fecha_actualizacion) FROM stdin;
1	1	1	10	5	1000	A-01	2025-11-13 04:24:01.138674
2	2	1	50	10	1000	A-02	2025-11-13 04:24:01.138674
3	3	1	30	15	1000	B-01	2025-11-13 04:24:01.138674
4	4	1	20	10	1000	B-02	2025-11-13 04:24:01.138674
5	5	1	15	5	1000	C-01	2025-11-13 04:24:01.138674
\.


--
-- TOC entry 5714 (class 0 OID 72279)
-- Dependencies: 294
-- Data for Name: metodos_pago; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metodos_pago (id_metodo_pago, nombre_metodo, tipo_metodo, descripcion, icono_url, requiere_verificacion, comision_porcentaje, comision_fija, activo, disponible_online, disponible_tienda, orden_visualizacion, configuracion, fecha_creacion, fecha_actualizacion) FROM stdin;
1	Visa	tarjeta_credito	Tarjeta de crÃ©dito Visa	/icons/visa.png	f	2.90	0.00	t	t	t	1	\N	2025-11-13 04:24:27.430494	2025-11-13 04:24:27.430494
2	Mastercard	tarjeta_credito	Tarjeta de crÃ©dito Mastercard	/icons/mastercard.png	f	2.90	0.00	t	t	t	2	\N	2025-11-13 04:24:27.430494	2025-11-13 04:24:27.430494
3	American Express	tarjeta_credito	Tarjeta de crÃ©dito American Express	/icons/amex.png	f	3.50	0.00	t	t	t	3	\N	2025-11-13 04:24:27.430494	2025-11-13 04:24:27.430494
4	Tarjeta de DÃ©bito	tarjeta_debito	Tarjeta de dÃ©bito bancaria	/icons/debit.png	f	1.50	0.00	t	t	t	4	\N	2025-11-13 04:24:27.430494	2025-11-13 04:24:27.430494
5	PayPal	billetera_digital	Pago mediante PayPal	/icons/paypal.png	f	3.40	0.00	t	t	f	5	\N	2025-11-13 04:24:27.430494	2025-11-13 04:24:27.430494
6	Transferencia Bancaria	transferencia_bancaria	Transferencia o depÃ³sito bancario	/icons/bank.png	f	0.00	0.00	t	t	t	6	\N	2025-11-13 04:24:27.430494	2025-11-13 04:24:27.430494
7	Efectivo	efectivo	Pago en efectivo contra entrega	/icons/cash.png	f	0.00	0.00	t	f	t	7	\N	2025-11-13 04:24:27.430494	2025-11-13 04:24:27.430494
8	Bitcoin	criptomoneda	Pago con Bitcoin	/icons/bitcoin.png	f	1.00	0.00	t	t	f	8	\N	2025-11-13 04:24:27.430494	2025-11-13 04:24:27.430494
\.


--
-- TOC entry 5716 (class 0 OID 72305)
-- Dependencies: 296
-- Data for Name: metodos_pago_cliente; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metodos_pago_cliente (id_metodo_pago_cliente, id_cliente, id_metodo_pago, alias, numero_tarjeta_ultimos_4, nombre_titular, fecha_expiracion, tipo_tarjeta, banco, numero_cuenta, email_billetera, telefono_billetera, identificador_externo, token_pago, proveedor_token, es_predeterminado, activo, verificado, fecha_verificacion, fecha_creacion, fecha_actualizacion) FROM stdin;
\.


--
-- TOC entry 5712 (class 0 OID 72263)
-- Dependencies: 292
-- Data for Name: migracion_metodos_pago_auditoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migracion_metodos_pago_auditoria (id_auditoria, fecha_migracion, tipo_operacion, tabla_origen, tabla_destino, id_pago_original, metodo_pago_antiguo, id_metodo_pago_nuevo, nombre_metodo_asignado, detalles, estado_verificacion, descripcion_verificacion, usuario_ejecucion, notas) FROM stdin;
\.


--
-- TOC entry 5689 (class 0 OID 71910)
-- Dependencies: 264
-- Data for Name: movimientos_inventario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.movimientos_inventario (id_movimiento, id_inventario, tipo_movimiento, cantidad, cantidad_anterior, cantidad_nueva, id_usuario, id_orden, motivo, referencia, fecha_movimiento) FROM stdin;
\.


--
-- TOC entry 5674 (class 0 OID 71712)
-- Dependencies: 246
-- Data for Name: oportunidades_venta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.oportunidades_venta (id_oportunidad, id_cliente, id_usuario_asignado, titulo, descripcion, valor_estimado, probabilidad_cierre, etapa, fecha_creacion, fecha_cierre_estimada, fecha_cierre_real, motivo_perdida, estado, fecha_actualizacion) FROM stdin;
\.


--
-- TOC entry 5722 (class 0 OID 72431)
-- Dependencies: 307
-- Data for Name: orden_estado_historial; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orden_estado_historial (id_historial, id_orden, id_estado_anterior, id_estado_nuevo, id_usuario, comentario, metadata, ip_origen, fecha_cambio) FROM stdin;
\.


--
-- TOC entry 5720 (class 0 OID 72405)
-- Dependencies: 305
-- Data for Name: orden_estado_transiciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orden_estado_transiciones (id_transicion, id_estado_origen, id_estado_destino, requiere_permiso, rol_requerido, validacion_requerida, descripcion, activo) FROM stdin;
1	1	2	f	\N	f	De pendiente a pago pendiente	t
2	1	11	f	\N	f	Cancelar orden pendiente	t
3	2	3	f	\N	f	Confirmar pago	t
4	2	11	f	\N	f	Cancelar por falta de pago	t
5	3	4	f	\N	f	Iniciar procesamiento	t
6	3	11	t	\N	f	Cancelar con pago confirmado	t
7	4	5	f	\N	f	Empaquetar orden	t
8	4	11	t	\N	f	Cancelar orden en proceso	t
9	5	6	f	\N	f	Enviar orden	t
10	5	4	f	\N	f	Volver a procesamiento	t
11	6	7	f	\N	f	Orden en trÃ¡nsito	t
12	6	15	f	\N	f	Marcar entrega fallida	t
13	7	8	f	\N	f	Orden lista para entrega	t
14	7	15	f	\N	f	Intento de entrega fallido	t
15	8	9	f	\N	f	Confirmar entrega	t
16	8	15	f	\N	f	Entrega fallida	t
17	9	10	f	\N	f	Completar orden	t
18	9	13	f	\N	f	Cliente solicita devoluciÃ³n	t
19	10	13	t	\N	f	Permitir devoluciÃ³n de orden completada	t
20	15	8	f	\N	f	Reintentar entrega	t
21	15	11	t	\N	f	Cancelar tras mÃºltiples fallos	t
22	13	14	f	\N	f	Confirmar devoluciÃ³n recibida	t
23	13	12	t	\N	f	Procesar reembolso	t
24	14	12	f	\N	f	Reembolsar tras devoluciÃ³n	t
\.


--
-- TOC entry 5718 (class 0 OID 72375)
-- Dependencies: 303
-- Data for Name: orden_estados; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orden_estados (id_orden_estado, codigo_estado, nombre_estado, descripcion, color_hex, icono, orden_secuencia, es_estado_final, es_estado_cancelado, notificar_cliente, notificar_admin, activo, fecha_creacion, fecha_actualizacion) FROM stdin;
1	pendiente	Pendiente	Orden creada, esperando procesamiento	#6c757d	clock	1	f	f	t	t	t	2025-11-13 04:24:36.888207	2025-11-13 04:24:36.888207
2	pago_pendiente	Pago Pendiente	Esperando confirmaciÃ³n de pago	#ffc107	credit-card	2	f	f	t	t	t	2025-11-13 04:24:36.888207	2025-11-13 04:24:36.888207
3	pago_confirmado	Pago Confirmado	Pago recibido y verificado	#17a2b8	check-circle	3	f	f	t	t	t	2025-11-13 04:24:36.888207	2025-11-13 04:24:36.888207
4	procesando	Procesando	Orden en proceso de preparaciÃ³n	#007bff	cog	4	f	f	t	f	t	2025-11-13 04:24:36.888207	2025-11-13 04:24:36.888207
5	empaquetado	Empaquetado	Orden empaquetada, lista para envÃ­o	#20c997	box	5	f	f	t	f	t	2025-11-13 04:24:36.888207	2025-11-13 04:24:36.888207
6	enviado	Enviado	Orden enviada al cliente	#fd7e14	truck	6	f	f	t	f	t	2025-11-13 04:24:36.888207	2025-11-13 04:24:36.888207
7	en_transito	En TrÃ¡nsito	Orden en camino al destino	#fd7e14	shipping-fast	7	f	f	t	f	t	2025-11-13 04:24:36.888207	2025-11-13 04:24:36.888207
8	en_entrega	En Entrega	Orden lista para entrega hoy	#ff6b6b	map-marker-alt	8	f	f	t	f	t	2025-11-13 04:24:36.888207	2025-11-13 04:24:36.888207
9	entregado	Entregado	Orden entregada exitosamente	#28a745	check-double	9	t	f	t	f	t	2025-11-13 04:24:36.888207	2025-11-13 04:24:36.888207
10	completado	Completado	Orden finalizada sin problemas	#28a745	flag-checkered	10	t	f	f	f	t	2025-11-13 04:24:36.888207	2025-11-13 04:24:36.888207
11	cancelado	Cancelado	Orden cancelada	#dc3545	times-circle	99	t	t	t	t	t	2025-11-13 04:24:36.888207	2025-11-13 04:24:36.888207
12	reembolsado	Reembolsado	Orden reembolsada al cliente	#e83e8c	undo	98	t	t	t	t	t	2025-11-13 04:24:36.888207	2025-11-13 04:24:36.888207
13	devolucion	En DevoluciÃ³n	Cliente solicitÃ³ devoluciÃ³n	#6f42c1	exchange-alt	97	f	f	t	t	t	2025-11-13 04:24:36.888207	2025-11-13 04:24:36.888207
14	devuelto	Devuelto	Producto devuelto	#6f42c1	reply	96	t	f	t	t	t	2025-11-13 04:24:36.888207	2025-11-13 04:24:36.888207
15	fallido	Fallido	Intento de entrega fallido	#dc3545	exclamation-triangle	95	f	f	t	t	t	2025-11-13 04:24:36.888207	2025-11-13 04:24:36.888207
\.


--
-- TOC entry 5666 (class 0 OID 71597)
-- Dependencies: 236
-- Data for Name: ordenes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ordenes (id_orden, id_cliente, id_direccion_envio, fecha_orden, total_orden, estado_orden, notas_orden, fecha_actualizacion, id_estado_orden, fecha_estado_cambio, dias_estimados_entrega) FROM stdin;
\.


--
-- TOC entry 5693 (class 0 OID 71950)
-- Dependencies: 268
-- Data for Name: ordenes_compra; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ordenes_compra (id_orden_compra, id_proveedor, id_almacen, id_usuario, numero_orden, fecha_orden, fecha_entrega_esperada, fecha_entrega_real, total_orden, estado, notas) FROM stdin;
\.


--
-- TOC entry 5695 (class 0 OID 71982)
-- Dependencies: 270
-- Data for Name: ordenes_compra_detalle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ordenes_compra_detalle (id_detalle, id_orden_compra, id_producto, cantidad_ordenada, cantidad_recibida, precio_unitario) FROM stdin;
\.


--
-- TOC entry 5668 (class 0 OID 71624)
-- Dependencies: 238
-- Data for Name: ordenes_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ordenes_items (id_orden_item, id_orden, id_producto, cantidad, precio_unitario) FROM stdin;
\.


--
-- TOC entry 5670 (class 0 OID 71646)
-- Dependencies: 240
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id_pago, id_orden, metodo_pago, monto, estado_pago, fecha_pago, transaccion_id, detalles_pago, id_metodo_pago, id_metodo_pago_cliente, codigo_autorizacion, referencia_externa, comision, ip_origen, datos_adicionales) FROM stdin;
\.


--
-- TOC entry 5710 (class 0 OID 72235)
-- Dependencies: 288
-- Data for Name: politicas_devolucion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.politicas_devolucion (id_politica, nombre_politica, descripcion, dias_devolucion, productos_permitidos, condiciones_aceptacion, metodo_reembolso_default, costo_envio_cliente, activo, fecha_creacion, fecha_actualizacion) FROM stdin;
\.


--
-- TOC entry 5658 (class 0 OID 71517)
-- Dependencies: 228
-- Data for Name: producto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.producto (id_producto, id_categoria, nombre_producto, descripcion, precio, stock, activo, fecha_creacion, fecha_actualizacion) FROM stdin;
1	1	Laptop Dell Inspiron 15	Laptop con procesador Intel i5, 8GB RAM, 256GB SSD	4999.99	10	t	2025-11-13 04:23:53.739238	2025-11-13 04:23:53.739238
2	1	Mouse InalÃ¡mbrico Logitech	Mouse ergonÃ³mico con sensor Ã³ptico	199.99	50	t	2025-11-13 04:23:53.739238	2025-11-13 04:23:53.739238
3	2	Camisa Polo Ralph Lauren	Camisa polo 100% algodÃ³n	299.99	30	t	2025-11-13 04:23:53.739238	2025-11-13 04:23:53.739238
4	3	Juego de SÃ¡banas King Size	SÃ¡banas de algodÃ³n egipcio 600 hilos	599.99	20	t	2025-11-13 04:23:53.739238	2025-11-13 04:23:53.739238
5	4	BalÃ³n de FÃºtbol Adidas	BalÃ³n oficial tamaÃ±o 5	249.99	15	t	2025-11-13 04:23:53.739238	2025-11-13 04:23:53.739238
\.


--
-- TOC entry 5660 (class 0 OID 71541)
-- Dependencies: 230
-- Data for Name: producto_imagenes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.producto_imagenes (id_imagen, id_producto, url_imagen, es_principal) FROM stdin;
1	1	/images/laptop-dell-1.jpg	t
2	1	/images/laptop-dell-2.jpg	f
3	2	/images/mouse-logitech.jpg	t
4	3	/images/camisa-polo.jpg	t
5	4	/images/sabanas-king.jpg	t
6	5	/images/balon-futbol.jpg	t
\.


--
-- TOC entry 5691 (class 0 OID 71939)
-- Dependencies: 266
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proveedores (id_proveedor, nombre_proveedor, contacto, email, telefono, direccion, nit, activo, fecha_creacion) FROM stdin;
1	Distribuidora Tech GT	Juan LÃ³pez	ventas@techgt.com	+502 2345-6789	\N	12345678-9	t	2025-11-13 04:24:01.134721
2	Importaciones Express	MarÃ­a GarcÃ­a	info@impexpress.com	+502 2987-6543	\N	98765432-1	t	2025-11-13 04:24:01.134721
\.


--
-- TOC entry 5648 (class 0 OID 71435)
-- Dependencies: 218
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id_rol, nombre_rol, descripcion, permisos, activo, fecha_creacion, fecha_actualizacion) FROM stdin;
1	administrador	Usuario con permisos administrativos completos	{"pagos": ["ver", "editar"], "ordenes": ["ver", "editar", "cancelar"], "usuarios": ["ver", "editar", "eliminar"], "productos": ["crear", "editar", "eliminar", "ver"], "categorias": ["crear", "editar", "eliminar", "ver"]}	t	2025-11-12 22:23:53.571683-06	2025-11-12 22:23:53.571683-06
2	cliente	Usuario cliente con permisos bÃ¡sicos	{"perfil": ["ver", "editar"], "carrito": ["agregar", "editar", "eliminar", "ver"], "ordenes": ["crear", "ver"], "productos": ["ver"]}	t	2025-11-12 22:23:53.571683-06	2025-11-12 22:23:53.571683-06
3	vendedor	Usuario vendedor con permisos de gestiÃ³n de productos	{"ordenes": ["ver"], "productos": ["crear", "editar", "ver"], "categorias": ["ver"]}	t	2025-11-12 22:23:53.571683-06	2025-11-12 22:23:53.571683-06
\.


--
-- TOC entry 5678 (class 0 OID 71779)
-- Dependencies: 250
-- Data for Name: segmentos_cliente; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.segmentos_cliente (id_segmento, nombre_segmento, descripcion, criterios, activo, fecha_creacion, fecha_actualizacion) FROM stdin;
1	VIP	Clientes con compras superiores a Q5000	{"compras_minimas": 5000}	t	2025-11-13 04:23:53.885152	2025-11-13 04:23:53.885152
2	Frecuente	Clientes con mÃ¡s de 5 compras	{"numero_compras": 5}	t	2025-11-13 04:23:53.885152	2025-11-13 04:23:53.885152
3	Inactivo	Sin compras en los Ãºltimos 6 meses	{"dias_inactividad": 180}	t	2025-11-13 04:23:53.885152	2025-11-13 04:23:53.885152
4	Nuevo	Cliente registrado hace menos de 30 dÃ­as	{"dias_desde_registro": 30}	t	2025-11-13 04:23:53.885152	2025-11-13 04:23:53.885152
\.


--
-- TOC entry 5676 (class 0 OID 71743)
-- Dependencies: 248
-- Data for Name: tareas_crm; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tareas_crm (id_tarea, id_cliente, id_oportunidad, id_usuario_asignado, titulo, descripcion, tipo_tarea, prioridad, fecha_vencimiento, fecha_completado, estado, notas, fecha_creacion, fecha_actualizacion) FROM stdin;
\.


--
-- TOC entry 5650 (class 0 OID 71450)
-- Dependencies: 220
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id_usuario, nombre_usuario, correo_electronico, contrasena, id_rol, activo, fecha_creacion, fecha_actualizacion) FROM stdin;
1	admin	admin@ecommerce.com	$2b$10$ejemplo_hash_password	1	t	2025-11-13 04:23:53.719279	2025-11-13 04:23:53.719279
2	juan_perez	juan@example.com	$2b$10$ejemplo_hash_password	2	t	2025-11-13 04:23:53.719279	2025-11-13 04:23:53.719279
3	maria_lopez	maria@example.com	$2b$10$ejemplo_hash_password	2	t	2025-11-13 04:23:53.719279	2025-11-13 04:23:53.719279
4	superadmin	superadmin@ecommerce.com	$2a$10$azvCE/fSUm4gkzRfdLhZMuVSAxNrt7Rei3yFw44S18HuoojB9T0ES	1	t	2025-11-13 10:50:35.589	2025-11-13 10:50:35.589
\.


--
-- TOC entry 5787 (class 0 OID 0)
-- Dependencies: 271
-- Name: alertas_inventario_id_alerta_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alertas_inventario_id_alerta_seq', 1, false);


--
-- TOC entry 5788 (class 0 OID 0)
-- Dependencies: 259
-- Name: almacenes_id_almacen_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.almacenes_id_almacen_seq', 2, true);


--
-- TOC entry 5789 (class 0 OID 0)
-- Dependencies: 254
-- Name: campana_clientes_id_campana_cliente_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.campana_clientes_id_campana_cliente_seq', 1, false);


--
-- TOC entry 5790 (class 0 OID 0)
-- Dependencies: 252
-- Name: campanas_marketing_id_campana_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.campanas_marketing_id_campana_seq', 1, false);


--
-- TOC entry 5791 (class 0 OID 0)
-- Dependencies: 231
-- Name: carrito_compras_id_carrito_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carrito_compras_id_carrito_seq', 1, false);


--
-- TOC entry 5792 (class 0 OID 0)
-- Dependencies: 233
-- Name: carrito_productos_id_carrito_producto_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carrito_productos_id_carrito_producto_seq', 1, false);


--
-- TOC entry 5793 (class 0 OID 0)
-- Dependencies: 225
-- Name: categoria_producto_id_categoria_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categoria_producto_id_categoria_seq', 8, true);


--
-- TOC entry 5794 (class 0 OID 0)
-- Dependencies: 221
-- Name: clientes_id_cliente_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clientes_id_cliente_seq', 2, true);


--
-- TOC entry 5795 (class 0 OID 0)
-- Dependencies: 281
-- Name: cotizaciones_auditoria_id_auditoria_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cotizaciones_auditoria_id_auditoria_seq', 1, false);


--
-- TOC entry 5796 (class 0 OID 0)
-- Dependencies: 273
-- Name: cotizaciones_id_cotizacion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cotizaciones_id_cotizacion_seq', 2, true);


--
-- TOC entry 5797 (class 0 OID 0)
-- Dependencies: 275
-- Name: cotizaciones_items_id_cotizacion_item_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cotizaciones_items_id_cotizacion_item_seq', 1, true);


--
-- TOC entry 5798 (class 0 OID 0)
-- Dependencies: 283
-- Name: devoluciones_id_devolucion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.devoluciones_id_devolucion_seq', 1, false);


--
-- TOC entry 5799 (class 0 OID 0)
-- Dependencies: 285
-- Name: devoluciones_items_id_devolucion_item_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.devoluciones_items_id_devolucion_item_seq', 1, false);


--
-- TOC entry 5800 (class 0 OID 0)
-- Dependencies: 223
-- Name: direcciones_id_direccion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.direcciones_id_direccion_seq', 2, true);


--
-- TOC entry 5801 (class 0 OID 0)
-- Dependencies: 243
-- Name: interacciones_cliente_id_interaccion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interacciones_cliente_id_interaccion_seq', 1, false);


--
-- TOC entry 5802 (class 0 OID 0)
-- Dependencies: 261
-- Name: inventario_id_inventario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inventario_id_inventario_seq', 5, true);


--
-- TOC entry 5803 (class 0 OID 0)
-- Dependencies: 295
-- Name: metodos_pago_cliente_id_metodo_pago_cliente_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.metodos_pago_cliente_id_metodo_pago_cliente_seq', 1, false);


--
-- TOC entry 5804 (class 0 OID 0)
-- Dependencies: 293
-- Name: metodos_pago_id_metodo_pago_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.metodos_pago_id_metodo_pago_seq', 8, true);


--
-- TOC entry 5805 (class 0 OID 0)
-- Dependencies: 291
-- Name: migracion_metodos_pago_auditoria_id_auditoria_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migracion_metodos_pago_auditoria_id_auditoria_seq', 1, false);


--
-- TOC entry 5806 (class 0 OID 0)
-- Dependencies: 263
-- Name: movimientos_inventario_id_movimiento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.movimientos_inventario_id_movimiento_seq', 1, false);


--
-- TOC entry 5807 (class 0 OID 0)
-- Dependencies: 245
-- Name: oportunidades_venta_id_oportunidad_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.oportunidades_venta_id_oportunidad_seq', 1, false);


--
-- TOC entry 5808 (class 0 OID 0)
-- Dependencies: 306
-- Name: orden_estado_historial_id_historial_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orden_estado_historial_id_historial_seq', 1, false);


--
-- TOC entry 5809 (class 0 OID 0)
-- Dependencies: 304
-- Name: orden_estado_transiciones_id_transicion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orden_estado_transiciones_id_transicion_seq', 24, true);


--
-- TOC entry 5810 (class 0 OID 0)
-- Dependencies: 302
-- Name: orden_estados_id_orden_estado_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orden_estados_id_orden_estado_seq', 15, true);


--
-- TOC entry 5811 (class 0 OID 0)
-- Dependencies: 269
-- Name: ordenes_compra_detalle_id_detalle_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ordenes_compra_detalle_id_detalle_seq', 1, false);


--
-- TOC entry 5812 (class 0 OID 0)
-- Dependencies: 267
-- Name: ordenes_compra_id_orden_compra_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ordenes_compra_id_orden_compra_seq', 1, false);


--
-- TOC entry 5813 (class 0 OID 0)
-- Dependencies: 235
-- Name: ordenes_id_orden_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ordenes_id_orden_seq', 1, false);


--
-- TOC entry 5814 (class 0 OID 0)
-- Dependencies: 237
-- Name: ordenes_items_id_orden_item_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ordenes_items_id_orden_item_seq', 1, false);


--
-- TOC entry 5815 (class 0 OID 0)
-- Dependencies: 239
-- Name: payments_id_pago_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_pago_seq', 1, false);


--
-- TOC entry 5816 (class 0 OID 0)
-- Dependencies: 287
-- Name: politicas_devolucion_id_politica_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.politicas_devolucion_id_politica_seq', 1, false);


--
-- TOC entry 5817 (class 0 OID 0)
-- Dependencies: 227
-- Name: producto_id_producto_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.producto_id_producto_seq', 5, true);


--
-- TOC entry 5818 (class 0 OID 0)
-- Dependencies: 229
-- Name: producto_imagenes_id_imagen_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.producto_imagenes_id_imagen_seq', 6, true);


--
-- TOC entry 5819 (class 0 OID 0)
-- Dependencies: 265
-- Name: proveedores_id_proveedor_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proveedores_id_proveedor_seq', 2, true);


--
-- TOC entry 5820 (class 0 OID 0)
-- Dependencies: 217
-- Name: roles_id_rol_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_rol_seq', 3, true);


--
-- TOC entry 5821 (class 0 OID 0)
-- Dependencies: 249
-- Name: segmentos_cliente_id_segmento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.segmentos_cliente_id_segmento_seq', 5, true);


--
-- TOC entry 5822 (class 0 OID 0)
-- Dependencies: 247
-- Name: tareas_crm_id_tarea_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tareas_crm_id_tarea_seq', 1, false);


--
-- TOC entry 5823 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 4, true);


--
-- TOC entry 5333 (class 2606 OID 72014)
-- Name: alertas_inventario alertas_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertas_inventario
    ADD CONSTRAINT alertas_inventario_pkey PRIMARY KEY (id_alerta);


--
-- TOC entry 5308 (class 2606 OID 71882)
-- Name: almacenes almacenes_nombre_almacen_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.almacenes
    ADD CONSTRAINT almacenes_nombre_almacen_key UNIQUE (nombre_almacen);


--
-- TOC entry 5310 (class 2606 OID 71880)
-- Name: almacenes almacenes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.almacenes
    ADD CONSTRAINT almacenes_pkey PRIMARY KEY (id_almacen);


--
-- TOC entry 5301 (class 2606 OID 71836)
-- Name: campana_clientes campana_clientes_id_campana_id_cliente_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campana_clientes
    ADD CONSTRAINT campana_clientes_id_campana_id_cliente_key UNIQUE (id_campana, id_cliente);


--
-- TOC entry 5303 (class 2606 OID 71834)
-- Name: campana_clientes campana_clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campana_clientes
    ADD CONSTRAINT campana_clientes_pkey PRIMARY KEY (id_campana_cliente);


--
-- TOC entry 5299 (class 2606 OID 71823)
-- Name: campanas_marketing campanas_marketing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campanas_marketing
    ADD CONSTRAINT campanas_marketing_pkey PRIMARY KEY (id_campana);


--
-- TOC entry 5245 (class 2606 OID 71564)
-- Name: carrito_compras carrito_compras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_compras
    ADD CONSTRAINT carrito_compras_pkey PRIMARY KEY (id_carrito);


--
-- TOC entry 5249 (class 2606 OID 71583)
-- Name: carrito_productos carrito_productos_id_carrito_id_producto_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_productos
    ADD CONSTRAINT carrito_productos_id_carrito_id_producto_key UNIQUE (id_carrito, id_producto);


--
-- TOC entry 5251 (class 2606 OID 71581)
-- Name: carrito_productos carrito_productos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_productos
    ADD CONSTRAINT carrito_productos_pkey PRIMARY KEY (id_carrito_producto);


--
-- TOC entry 5231 (class 2606 OID 71515)
-- Name: categoria_producto categoria_producto_nombre_categoria_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria_producto
    ADD CONSTRAINT categoria_producto_nombre_categoria_key UNIQUE (nombre_categoria);


--
-- TOC entry 5233 (class 2606 OID 71513)
-- Name: categoria_producto categoria_producto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria_producto
    ADD CONSTRAINT categoria_producto_pkey PRIMARY KEY (id_categoria);


--
-- TOC entry 5295 (class 2606 OID 71797)
-- Name: cliente_segmentos cliente_segmentos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cliente_segmentos
    ADD CONSTRAINT cliente_segmentos_pkey PRIMARY KEY (id_cliente, id_segmento);


--
-- TOC entry 5225 (class 2606 OID 71480)
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id_cliente);


--
-- TOC entry 5351 (class 2606 OID 72129)
-- Name: cotizaciones_auditoria cotizaciones_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones_auditoria
    ADD CONSTRAINT cotizaciones_auditoria_pkey PRIMARY KEY (id_auditoria);


--
-- TOC entry 5344 (class 2606 OID 72068)
-- Name: cotizaciones_items cotizaciones_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones_items
    ADD CONSTRAINT cotizaciones_items_pkey PRIMARY KEY (id_cotizacion_item);


--
-- TOC entry 5337 (class 2606 OID 72043)
-- Name: cotizaciones cotizaciones_numero_cotizacion_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_numero_cotizacion_key UNIQUE (numero_cotizacion);


--
-- TOC entry 5348 (class 2606 OID 72086)
-- Name: cotizaciones_ordenes cotizaciones_ordenes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones_ordenes
    ADD CONSTRAINT cotizaciones_ordenes_pkey PRIMARY KEY (id_cotizacion);


--
-- TOC entry 5339 (class 2606 OID 72041)
-- Name: cotizaciones cotizaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_pkey PRIMARY KEY (id_cotizacion);


--
-- TOC entry 5361 (class 2606 OID 72196)
-- Name: devoluciones_items devoluciones_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devoluciones_items
    ADD CONSTRAINT devoluciones_items_pkey PRIMARY KEY (id_devolucion_item);


--
-- TOC entry 5353 (class 2606 OID 72161)
-- Name: devoluciones devoluciones_numero_devolucion_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devoluciones
    ADD CONSTRAINT devoluciones_numero_devolucion_key UNIQUE (numero_devolucion);


--
-- TOC entry 5355 (class 2606 OID 72159)
-- Name: devoluciones devoluciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devoluciones
    ADD CONSTRAINT devoluciones_pkey PRIMARY KEY (id_devolucion);


--
-- TOC entry 5228 (class 2606 OID 71496)
-- Name: direcciones direcciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direcciones
    ADD CONSTRAINT direcciones_pkey PRIMARY KEY (id_direccion);


--
-- TOC entry 5276 (class 2606 OID 71696)
-- Name: interacciones_cliente interacciones_cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones_cliente
    ADD CONSTRAINT interacciones_cliente_pkey PRIMARY KEY (id_interaccion);


--
-- TOC entry 5314 (class 2606 OID 71896)
-- Name: inventario inventario_id_producto_id_almacen_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT inventario_id_producto_id_almacen_key UNIQUE (id_producto, id_almacen);


--
-- TOC entry 5316 (class 2606 OID 71894)
-- Name: inventario inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT inventario_pkey PRIMARY KEY (id_inventario);


--
-- TOC entry 5383 (class 2606 OID 72318)
-- Name: metodos_pago_cliente metodos_pago_cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metodos_pago_cliente
    ADD CONSTRAINT metodos_pago_cliente_pkey PRIMARY KEY (id_metodo_pago_cliente);


--
-- TOC entry 5376 (class 2606 OID 72300)
-- Name: metodos_pago metodos_pago_nombre_metodo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metodos_pago
    ADD CONSTRAINT metodos_pago_nombre_metodo_key UNIQUE (nombre_metodo);


--
-- TOC entry 5378 (class 2606 OID 72298)
-- Name: metodos_pago metodos_pago_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metodos_pago
    ADD CONSTRAINT metodos_pago_pkey PRIMARY KEY (id_metodo_pago);


--
-- TOC entry 5371 (class 2606 OID 72274)
-- Name: migracion_metodos_pago_auditoria migracion_metodos_pago_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migracion_metodos_pago_auditoria
    ADD CONSTRAINT migracion_metodos_pago_auditoria_pkey PRIMARY KEY (id_auditoria);


--
-- TOC entry 5321 (class 2606 OID 71919)
-- Name: movimientos_inventario movimientos_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_pkey PRIMARY KEY (id_movimiento);


--
-- TOC entry 5282 (class 2606 OID 71727)
-- Name: oportunidades_venta oportunidades_venta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oportunidades_venta
    ADD CONSTRAINT oportunidades_venta_pkey PRIMARY KEY (id_oportunidad);


--
-- TOC entry 5402 (class 2606 OID 72439)
-- Name: orden_estado_historial orden_estado_historial_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orden_estado_historial
    ADD CONSTRAINT orden_estado_historial_pkey PRIMARY KEY (id_historial);


--
-- TOC entry 5394 (class 2606 OID 72417)
-- Name: orden_estado_transiciones orden_estado_transiciones_id_estado_origen_id_estado_destin_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orden_estado_transiciones
    ADD CONSTRAINT orden_estado_transiciones_id_estado_origen_id_estado_destin_key UNIQUE (id_estado_origen, id_estado_destino);


--
-- TOC entry 5396 (class 2606 OID 72415)
-- Name: orden_estado_transiciones orden_estado_transiciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orden_estado_transiciones
    ADD CONSTRAINT orden_estado_transiciones_pkey PRIMARY KEY (id_transicion);


--
-- TOC entry 5388 (class 2606 OID 72393)
-- Name: orden_estados orden_estados_codigo_estado_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orden_estados
    ADD CONSTRAINT orden_estados_codigo_estado_key UNIQUE (codigo_estado);


--
-- TOC entry 5390 (class 2606 OID 72391)
-- Name: orden_estados orden_estados_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orden_estados
    ADD CONSTRAINT orden_estados_pkey PRIMARY KEY (id_orden_estado);


--
-- TOC entry 5331 (class 2606 OID 71992)
-- Name: ordenes_compra_detalle ordenes_compra_detalle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_compra_detalle
    ADD CONSTRAINT ordenes_compra_detalle_pkey PRIMARY KEY (id_detalle);


--
-- TOC entry 5327 (class 2606 OID 71963)
-- Name: ordenes_compra ordenes_compra_numero_orden_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_numero_orden_key UNIQUE (numero_orden);


--
-- TOC entry 5329 (class 2606 OID 71961)
-- Name: ordenes_compra ordenes_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_pkey PRIMARY KEY (id_orden_compra);


--
-- TOC entry 5263 (class 2606 OID 71632)
-- Name: ordenes_items ordenes_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_items
    ADD CONSTRAINT ordenes_items_pkey PRIMARY KEY (id_orden_item);


--
-- TOC entry 5259 (class 2606 OID 71609)
-- Name: ordenes ordenes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes
    ADD CONSTRAINT ordenes_pkey PRIMARY KEY (id_orden);


--
-- TOC entry 5270 (class 2606 OID 71658)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id_pago);


--
-- TOC entry 5366 (class 2606 OID 72247)
-- Name: politicas_devolucion politicas_devolucion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.politicas_devolucion
    ADD CONSTRAINT politicas_devolucion_pkey PRIMARY KEY (id_politica);


--
-- TOC entry 5243 (class 2606 OID 71547)
-- Name: producto_imagenes producto_imagenes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_imagenes
    ADD CONSTRAINT producto_imagenes_pkey PRIMARY KEY (id_imagen);


--
-- TOC entry 5240 (class 2606 OID 71530)
-- Name: producto producto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_pkey PRIMARY KEY (id_producto);


--
-- TOC entry 5323 (class 2606 OID 71948)
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id_proveedor);


--
-- TOC entry 5210 (class 2606 OID 72470)
-- Name: roles roles_nombre_rol_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_rol_key UNIQUE (nombre_rol);


--
-- TOC entry 5212 (class 2606 OID 72472)
-- Name: roles roles_nombre_rol_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_rol_key1 UNIQUE (nombre_rol);


--
-- TOC entry 5214 (class 2606 OID 71446)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id_rol);


--
-- TOC entry 5291 (class 2606 OID 71791)
-- Name: segmentos_cliente segmentos_cliente_nombre_segmento_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.segmentos_cliente
    ADD CONSTRAINT segmentos_cliente_nombre_segmento_key UNIQUE (nombre_segmento);


--
-- TOC entry 5293 (class 2606 OID 71789)
-- Name: segmentos_cliente segmentos_cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.segmentos_cliente
    ADD CONSTRAINT segmentos_cliente_pkey PRIMARY KEY (id_segmento);


--
-- TOC entry 5289 (class 2606 OID 71757)
-- Name: tareas_crm tareas_crm_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tareas_crm
    ADD CONSTRAINT tareas_crm_pkey PRIMARY KEY (id_tarea);


--
-- TOC entry 5219 (class 2606 OID 71465)
-- Name: usuarios usuarios_correo_electronico_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_electronico_key UNIQUE (correo_electronico);


--
-- TOC entry 5221 (class 2606 OID 71463)
-- Name: usuarios usuarios_nombre_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_nombre_usuario_key UNIQUE (nombre_usuario);


--
-- TOC entry 5223 (class 2606 OID 71461)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 5334 (class 1259 OID 72020)
-- Name: idx_alertas_inventario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alertas_inventario ON public.alertas_inventario USING btree (id_inventario);


--
-- TOC entry 5335 (class 1259 OID 72021)
-- Name: idx_alertas_resuelta; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alertas_resuelta ON public.alertas_inventario USING btree (resuelta);


--
-- TOC entry 5304 (class 1259 OID 71847)
-- Name: idx_campana_clientes_campana; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campana_clientes_campana ON public.campana_clientes USING btree (id_campana);


--
-- TOC entry 5305 (class 1259 OID 71848)
-- Name: idx_campana_clientes_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campana_clientes_cliente ON public.campana_clientes USING btree (id_cliente);


--
-- TOC entry 5306 (class 1259 OID 71849)
-- Name: idx_campana_clientes_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campana_clientes_estado ON public.campana_clientes USING btree (estado_envio);


--
-- TOC entry 5246 (class 1259 OID 71570)
-- Name: idx_carrito_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_carrito_cliente ON public.carrito_compras USING btree (id_cliente);


--
-- TOC entry 5247 (class 1259 OID 71571)
-- Name: idx_carrito_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_carrito_estado ON public.carrito_compras USING btree (estado);


--
-- TOC entry 5252 (class 1259 OID 71594)
-- Name: idx_carrito_productos_carrito; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_carrito_productos_carrito ON public.carrito_productos USING btree (id_carrito);


--
-- TOC entry 5253 (class 1259 OID 71595)
-- Name: idx_carrito_productos_producto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_carrito_productos_producto ON public.carrito_productos USING btree (id_producto);


--
-- TOC entry 5234 (class 1259 OID 72466)
-- Name: idx_categoria_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categoria_nombre ON public.categoria_producto USING btree (nombre_categoria);


--
-- TOC entry 5296 (class 1259 OID 71808)
-- Name: idx_cliente_segmentos_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cliente_segmentos_cliente ON public.cliente_segmentos USING btree (id_cliente);


--
-- TOC entry 5297 (class 1259 OID 71809)
-- Name: idx_cliente_segmentos_segmento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cliente_segmentos_segmento ON public.cliente_segmentos USING btree (id_segmento);


--
-- TOC entry 5226 (class 1259 OID 71486)
-- Name: idx_clientes_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clientes_usuario ON public.clientes USING btree (id_usuario);


--
-- TOC entry 5340 (class 1259 OID 72054)
-- Name: idx_cotizaciones_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cotizaciones_cliente ON public.cotizaciones USING btree (id_cliente);


--
-- TOC entry 5341 (class 1259 OID 72055)
-- Name: idx_cotizaciones_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cotizaciones_estado ON public.cotizaciones USING btree (estado);


--
-- TOC entry 5342 (class 1259 OID 72056)
-- Name: idx_cotizaciones_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cotizaciones_fecha ON public.cotizaciones USING btree (fecha_creacion);


--
-- TOC entry 5345 (class 1259 OID 72079)
-- Name: idx_cotizaciones_items_cotizacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cotizaciones_items_cotizacion ON public.cotizaciones_items USING btree (id_cotizacion);


--
-- TOC entry 5346 (class 1259 OID 72080)
-- Name: idx_cotizaciones_items_producto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cotizaciones_items_producto ON public.cotizaciones_items USING btree (id_producto);


--
-- TOC entry 5349 (class 1259 OID 72097)
-- Name: idx_cotizaciones_ordenes; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cotizaciones_ordenes ON public.cotizaciones_ordenes USING btree (id_orden);


--
-- TOC entry 5356 (class 1259 OID 72178)
-- Name: idx_devoluciones_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_devoluciones_cliente ON public.devoluciones USING btree (id_cliente);


--
-- TOC entry 5357 (class 1259 OID 72179)
-- Name: idx_devoluciones_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_devoluciones_estado ON public.devoluciones USING btree (estado);


--
-- TOC entry 5358 (class 1259 OID 72180)
-- Name: idx_devoluciones_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_devoluciones_fecha ON public.devoluciones USING btree (fecha_solicitud);


--
-- TOC entry 5362 (class 1259 OID 72212)
-- Name: idx_devoluciones_items_devolucion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_devoluciones_items_devolucion ON public.devoluciones_items USING btree (id_devolucion);


--
-- TOC entry 5363 (class 1259 OID 72214)
-- Name: idx_devoluciones_items_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_devoluciones_items_estado ON public.devoluciones_items USING btree (estado_item);


--
-- TOC entry 5364 (class 1259 OID 72213)
-- Name: idx_devoluciones_items_producto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_devoluciones_items_producto ON public.devoluciones_items USING btree (id_producto);


--
-- TOC entry 5359 (class 1259 OID 72177)
-- Name: idx_devoluciones_orden; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_devoluciones_orden ON public.devoluciones USING btree (id_orden);


--
-- TOC entry 5229 (class 1259 OID 71502)
-- Name: idx_direcciones_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_direcciones_cliente ON public.direcciones USING btree (id_cliente);


--
-- TOC entry 5397 (class 1259 OID 72463)
-- Name: idx_historial_estado_nuevo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_estado_nuevo ON public.orden_estado_historial USING btree (id_estado_nuevo);


--
-- TOC entry 5398 (class 1259 OID 72461)
-- Name: idx_historial_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_fecha ON public.orden_estado_historial USING btree (fecha_cambio);


--
-- TOC entry 5399 (class 1259 OID 72460)
-- Name: idx_historial_orden; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_orden ON public.orden_estado_historial USING btree (id_orden);


--
-- TOC entry 5400 (class 1259 OID 72462)
-- Name: idx_historial_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_usuario ON public.orden_estado_historial USING btree (id_usuario);


--
-- TOC entry 5241 (class 1259 OID 71553)
-- Name: idx_imagenes_producto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_imagenes_producto ON public.producto_imagenes USING btree (id_producto);


--
-- TOC entry 5271 (class 1259 OID 71707)
-- Name: idx_interacciones_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_interacciones_cliente ON public.interacciones_cliente USING btree (id_cliente);


--
-- TOC entry 5272 (class 1259 OID 71710)
-- Name: idx_interacciones_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_interacciones_estado ON public.interacciones_cliente USING btree (estado);


--
-- TOC entry 5273 (class 1259 OID 71709)
-- Name: idx_interacciones_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_interacciones_fecha ON public.interacciones_cliente USING btree (fecha_interaccion);


--
-- TOC entry 5274 (class 1259 OID 71708)
-- Name: idx_interacciones_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_interacciones_usuario ON public.interacciones_cliente USING btree (id_usuario_asignado);


--
-- TOC entry 5311 (class 1259 OID 71908)
-- Name: idx_inventario_almacen; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventario_almacen ON public.inventario USING btree (id_almacen);


--
-- TOC entry 5312 (class 1259 OID 71907)
-- Name: idx_inventario_producto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventario_producto ON public.inventario USING btree (id_producto);


--
-- TOC entry 5372 (class 1259 OID 72301)
-- Name: idx_metodos_pago_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metodos_pago_activo ON public.metodos_pago USING btree (activo);


--
-- TOC entry 5379 (class 1259 OID 72331)
-- Name: idx_metodos_pago_cliente_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metodos_pago_cliente_activo ON public.metodos_pago_cliente USING btree (activo);


--
-- TOC entry 5380 (class 1259 OID 72329)
-- Name: idx_metodos_pago_cliente_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metodos_pago_cliente_cliente ON public.metodos_pago_cliente USING btree (id_cliente);


--
-- TOC entry 5381 (class 1259 OID 72330)
-- Name: idx_metodos_pago_cliente_predeterminado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metodos_pago_cliente_predeterminado ON public.metodos_pago_cliente USING btree (es_predeterminado);


--
-- TOC entry 5373 (class 1259 OID 72303)
-- Name: idx_metodos_pago_orden; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metodos_pago_orden ON public.metodos_pago USING btree (orden_visualizacion);


--
-- TOC entry 5374 (class 1259 OID 72302)
-- Name: idx_metodos_pago_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metodos_pago_tipo ON public.metodos_pago USING btree (tipo_metodo);


--
-- TOC entry 5367 (class 1259 OID 72275)
-- Name: idx_migracion_auditoria_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_migracion_auditoria_fecha ON public.migracion_metodos_pago_auditoria USING btree (fecha_migracion);


--
-- TOC entry 5368 (class 1259 OID 72276)
-- Name: idx_migracion_auditoria_pago; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_migracion_auditoria_pago ON public.migracion_metodos_pago_auditoria USING btree (id_pago_original);


--
-- TOC entry 5369 (class 1259 OID 72277)
-- Name: idx_migracion_auditoria_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_migracion_auditoria_tipo ON public.migracion_metodos_pago_auditoria USING btree (tipo_operacion);


--
-- TOC entry 5317 (class 1259 OID 71936)
-- Name: idx_movimientos_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_movimientos_fecha ON public.movimientos_inventario USING btree (fecha_movimiento);


--
-- TOC entry 5318 (class 1259 OID 71935)
-- Name: idx_movimientos_inventario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_movimientos_inventario ON public.movimientos_inventario USING btree (id_inventario);


--
-- TOC entry 5319 (class 1259 OID 71937)
-- Name: idx_movimientos_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_movimientos_tipo ON public.movimientos_inventario USING btree (tipo_movimiento);


--
-- TOC entry 5277 (class 1259 OID 71738)
-- Name: idx_oportunidades_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_oportunidades_cliente ON public.oportunidades_venta USING btree (id_cliente);


--
-- TOC entry 5278 (class 1259 OID 71741)
-- Name: idx_oportunidades_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_oportunidades_estado ON public.oportunidades_venta USING btree (estado);


--
-- TOC entry 5279 (class 1259 OID 71739)
-- Name: idx_oportunidades_etapa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_oportunidades_etapa ON public.oportunidades_venta USING btree (etapa);


--
-- TOC entry 5280 (class 1259 OID 71740)
-- Name: idx_oportunidades_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_oportunidades_usuario ON public.oportunidades_venta USING btree (id_usuario_asignado);


--
-- TOC entry 5384 (class 1259 OID 72396)
-- Name: idx_orden_estados_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orden_estados_activo ON public.orden_estados USING btree (activo);


--
-- TOC entry 5385 (class 1259 OID 72394)
-- Name: idx_orden_estados_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orden_estados_codigo ON public.orden_estados USING btree (codigo_estado);


--
-- TOC entry 5386 (class 1259 OID 72395)
-- Name: idx_orden_estados_secuencia; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orden_estados_secuencia ON public.orden_estados USING btree (orden_secuencia);


--
-- TOC entry 5254 (class 1259 OID 71620)
-- Name: idx_ordenes_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ordenes_cliente ON public.ordenes USING btree (id_cliente);


--
-- TOC entry 5324 (class 1259 OID 71980)
-- Name: idx_ordenes_compra_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ordenes_compra_estado ON public.ordenes_compra USING btree (estado);


--
-- TOC entry 5325 (class 1259 OID 71979)
-- Name: idx_ordenes_compra_proveedor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ordenes_compra_proveedor ON public.ordenes_compra USING btree (id_proveedor);


--
-- TOC entry 5255 (class 1259 OID 71622)
-- Name: idx_ordenes_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ordenes_estado ON public.ordenes USING btree (estado_orden);


--
-- TOC entry 5256 (class 1259 OID 72402)
-- Name: idx_ordenes_estado_normalizado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ordenes_estado_normalizado ON public.ordenes USING btree (id_estado_orden);


--
-- TOC entry 5257 (class 1259 OID 71621)
-- Name: idx_ordenes_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ordenes_fecha ON public.ordenes USING btree (fecha_orden);


--
-- TOC entry 5260 (class 1259 OID 71643)
-- Name: idx_ordenes_items_orden; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ordenes_items_orden ON public.ordenes_items USING btree (id_orden);


--
-- TOC entry 5261 (class 1259 OID 71644)
-- Name: idx_ordenes_items_producto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ordenes_items_producto ON public.ordenes_items USING btree (id_producto);


--
-- TOC entry 5264 (class 1259 OID 71665)
-- Name: idx_pagos_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagos_estado ON public.payments USING btree (estado_pago);


--
-- TOC entry 5265 (class 1259 OID 71664)
-- Name: idx_pagos_orden; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagos_orden ON public.payments USING btree (id_orden);


--
-- TOC entry 5266 (class 1259 OID 71666)
-- Name: idx_pagos_transaccion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagos_transaccion ON public.payments USING btree (transaccion_id);


--
-- TOC entry 5267 (class 1259 OID 72343)
-- Name: idx_payments_metodo_pago; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_metodo_pago ON public.payments USING btree (id_metodo_pago);


--
-- TOC entry 5268 (class 1259 OID 72344)
-- Name: idx_payments_referencia; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_referencia ON public.payments USING btree (referencia_externa);


--
-- TOC entry 5235 (class 1259 OID 71539)
-- Name: idx_productos_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_activo ON public.producto USING btree (activo);


--
-- TOC entry 5236 (class 1259 OID 71536)
-- Name: idx_productos_categoria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_categoria ON public.producto USING btree (id_categoria);


--
-- TOC entry 5237 (class 1259 OID 71537)
-- Name: idx_productos_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_nombre ON public.producto USING btree (nombre_producto);


--
-- TOC entry 5238 (class 1259 OID 71538)
-- Name: idx_productos_precio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_precio ON public.producto USING btree (precio);


--
-- TOC entry 5283 (class 1259 OID 71773)
-- Name: idx_tareas_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tareas_cliente ON public.tareas_crm USING btree (id_cliente);


--
-- TOC entry 5284 (class 1259 OID 71775)
-- Name: idx_tareas_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tareas_estado ON public.tareas_crm USING btree (estado);


--
-- TOC entry 5285 (class 1259 OID 71777)
-- Name: idx_tareas_oportunidad; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tareas_oportunidad ON public.tareas_crm USING btree (id_oportunidad);


--
-- TOC entry 5286 (class 1259 OID 71774)
-- Name: idx_tareas_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tareas_usuario ON public.tareas_crm USING btree (id_usuario_asignado);


--
-- TOC entry 5287 (class 1259 OID 71776)
-- Name: idx_tareas_vencimiento; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tareas_vencimiento ON public.tareas_crm USING btree (fecha_vencimiento);


--
-- TOC entry 5391 (class 1259 OID 72429)
-- Name: idx_transiciones_destino; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transiciones_destino ON public.orden_estado_transiciones USING btree (id_estado_destino);


--
-- TOC entry 5392 (class 1259 OID 72428)
-- Name: idx_transiciones_origen; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transiciones_origen ON public.orden_estado_transiciones USING btree (id_estado_origen);


--
-- TOC entry 5215 (class 1259 OID 71471)
-- Name: idx_usuarios_correo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_correo ON public.usuarios USING btree (correo_electronico);


--
-- TOC entry 5216 (class 1259 OID 71472)
-- Name: idx_usuarios_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_nombre ON public.usuarios USING btree (nombre_usuario);


--
-- TOC entry 5217 (class 1259 OID 71473)
-- Name: idx_usuarios_rol; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuarios_rol ON public.usuarios USING btree (id_rol);


--
-- TOC entry 5638 (class 2618 OID 72251)
-- Name: vista_devoluciones_detalle _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW public.vista_devoluciones_detalle AS
 SELECT d.id_devolucion,
    d.numero_devolucion,
    d.fecha_solicitud,
    d.estado,
    d.tipo_devolucion,
    d.motivo,
    d.monto_total_devolucion,
    d.monto_aprobado,
    o.id_orden,
    o.total_orden AS total_orden_original,
    c.id_cliente,
    (((c.nombre)::text || ' '::text) || (c.apellido)::text) AS nombre_cliente,
    u.correo_electronico,
    count(di.id_devolucion_item) AS total_items,
    sum(di.cantidad_solicitada) AS cantidad_total_solicitada,
    sum(di.cantidad_aprobada) AS cantidad_total_aprobada,
        CASE
            WHEN (d.fecha_completada IS NOT NULL) THEN 'Completada'::text
            WHEN ((d.estado)::text = 'rechazada'::text) THEN 'Rechazada'::text
            WHEN ((d.estado)::text = 'aprobada'::text) THEN 'En proceso'::text
            ELSE 'Pendiente'::text
        END AS estado_general
   FROM ((((public.devoluciones d
     JOIN public.ordenes o ON ((d.id_orden = o.id_orden)))
     JOIN public.clientes c ON ((d.id_cliente = c.id_cliente)))
     JOIN public.usuarios u ON ((c.id_usuario = u.id_usuario)))
     LEFT JOIN public.devoluciones_items di ON ((d.id_devolucion = di.id_devolucion)))
  GROUP BY d.id_devolucion, o.id_orden, c.id_cliente, u.correo_electronico;


--
-- TOC entry 5471 (class 2620 OID 72099)
-- Name: ordenes_items trigger_actualizar_stock_orden; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_actualizar_stock_orden AFTER INSERT ON public.ordenes_items FOR EACH ROW EXECUTE FUNCTION public.actualizar_stock_orden();


--
-- TOC entry 5477 (class 2620 OID 72101)
-- Name: inventario trigger_alertas_inventario; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_alertas_inventario AFTER UPDATE ON public.inventario FOR EACH ROW WHEN ((old.cantidad_actual IS DISTINCT FROM new.cantidad_actual)) EXECUTE FUNCTION public.verificar_alertas_inventario();


--
-- TOC entry 5476 (class 2620 OID 71854)
-- Name: campanas_marketing trigger_campanas_actualizacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_campanas_actualizacion BEFORE UPDATE ON public.campanas_marketing FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- TOC entry 5468 (class 2620 OID 71670)
-- Name: carrito_compras trigger_carrito_actualizacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_carrito_actualizacion BEFORE UPDATE ON public.carrito_compras FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- TOC entry 5479 (class 2620 OID 72119)
-- Name: cotizaciones trigger_cotizacion_expirada; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_cotizacion_expirada BEFORE UPDATE ON public.cotizaciones FOR EACH ROW EXECUTE FUNCTION public.verificar_cotizacion_expirada();


--
-- TOC entry 5480 (class 2620 OID 72259)
-- Name: devoluciones trigger_generar_numero_devolucion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_generar_numero_devolucion BEFORE INSERT ON public.devoluciones FOR EACH ROW EXECUTE FUNCTION public.generar_numero_devolucion();


--
-- TOC entry 5472 (class 2620 OID 71850)
-- Name: interacciones_cliente trigger_interacciones_actualizacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_interacciones_actualizacion BEFORE UPDATE ON public.interacciones_cliente FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- TOC entry 5478 (class 2620 OID 72102)
-- Name: inventario trigger_inventario_actualizacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_inventario_actualizacion BEFORE UPDATE ON public.inventario FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- TOC entry 5482 (class 2620 OID 72347)
-- Name: metodos_pago trigger_metodos_pago_actualizacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_metodos_pago_actualizacion BEFORE UPDATE ON public.metodos_pago FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- TOC entry 5483 (class 2620 OID 72348)
-- Name: metodos_pago_cliente trigger_metodos_pago_cliente_actualizacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_metodos_pago_cliente_actualizacion BEFORE UPDATE ON public.metodos_pago_cliente FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- TOC entry 5473 (class 2620 OID 71851)
-- Name: oportunidades_venta trigger_oportunidades_actualizacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_oportunidades_actualizacion BEFORE UPDATE ON public.oportunidades_venta FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- TOC entry 5469 (class 2620 OID 71671)
-- Name: ordenes trigger_ordenes_actualizacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_ordenes_actualizacion BEFORE UPDATE ON public.ordenes FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- TOC entry 5481 (class 2620 OID 72260)
-- Name: politicas_devolucion trigger_politicas_devolucion_actualizacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_politicas_devolucion_actualizacion BEFORE UPDATE ON public.politicas_devolucion FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- TOC entry 5467 (class 2620 OID 71669)
-- Name: producto trigger_producto_actualizacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_producto_actualizacion BEFORE UPDATE ON public.producto FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- TOC entry 5470 (class 2620 OID 72465)
-- Name: ordenes trigger_registrar_cambio_estado; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_registrar_cambio_estado BEFORE UPDATE ON public.ordenes FOR EACH ROW WHEN ((old.id_estado_orden IS DISTINCT FROM new.id_estado_orden)) EXECUTE FUNCTION public.registrar_cambio_estado_orden();


--
-- TOC entry 5475 (class 2620 OID 71853)
-- Name: segmentos_cliente trigger_segmentos_actualizacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_segmentos_actualizacion BEFORE UPDATE ON public.segmentos_cliente FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- TOC entry 5474 (class 2620 OID 71852)
-- Name: tareas_crm trigger_tareas_actualizacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_tareas_actualizacion BEFORE UPDATE ON public.tareas_crm FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- TOC entry 5466 (class 2620 OID 71668)
-- Name: usuarios trigger_usuarios_actualizacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_usuarios_actualizacion BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_modificacion();


--
-- TOC entry 5484 (class 2620 OID 72346)
-- Name: metodos_pago_cliente trigger_validar_predeterminado; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_validar_predeterminado BEFORE INSERT OR UPDATE ON public.metodos_pago_cliente FOR EACH ROW WHEN ((new.es_predeterminado = true)) EXECUTE FUNCTION public.validar_metodo_predeterminado();


--
-- TOC entry 5442 (class 2606 OID 72015)
-- Name: alertas_inventario alertas_inventario_id_inventario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alertas_inventario
    ADD CONSTRAINT alertas_inventario_id_inventario_fkey FOREIGN KEY (id_inventario) REFERENCES public.inventario(id_inventario) ON DELETE CASCADE;


--
-- TOC entry 5428 (class 2606 OID 71837)
-- Name: campana_clientes campana_clientes_id_campana_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campana_clientes
    ADD CONSTRAINT campana_clientes_id_campana_fkey FOREIGN KEY (id_campana) REFERENCES public.campanas_marketing(id_campana) ON DELETE CASCADE;


--
-- TOC entry 5429 (class 2606 OID 71842)
-- Name: campana_clientes campana_clientes_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campana_clientes
    ADD CONSTRAINT campana_clientes_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente) ON DELETE CASCADE;


--
-- TOC entry 5408 (class 2606 OID 71565)
-- Name: carrito_compras carrito_compras_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_compras
    ADD CONSTRAINT carrito_compras_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente) ON DELETE CASCADE;


--
-- TOC entry 5409 (class 2606 OID 71584)
-- Name: carrito_productos carrito_productos_id_carrito_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_productos
    ADD CONSTRAINT carrito_productos_id_carrito_fkey FOREIGN KEY (id_carrito) REFERENCES public.carrito_compras(id_carrito) ON DELETE CASCADE;


--
-- TOC entry 5410 (class 2606 OID 71589)
-- Name: carrito_productos carrito_productos_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_productos
    ADD CONSTRAINT carrito_productos_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto) ON DELETE CASCADE;


--
-- TOC entry 5426 (class 2606 OID 71798)
-- Name: cliente_segmentos cliente_segmentos_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cliente_segmentos
    ADD CONSTRAINT cliente_segmentos_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente) ON DELETE CASCADE;


--
-- TOC entry 5427 (class 2606 OID 71803)
-- Name: cliente_segmentos cliente_segmentos_id_segmento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cliente_segmentos
    ADD CONSTRAINT cliente_segmentos_id_segmento_fkey FOREIGN KEY (id_segmento) REFERENCES public.segmentos_cliente(id_segmento) ON DELETE CASCADE;


--
-- TOC entry 5404 (class 2606 OID 71481)
-- Name: clientes clientes_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE;


--
-- TOC entry 5450 (class 2606 OID 72130)
-- Name: cotizaciones_auditoria cotizaciones_auditoria_id_cotizacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones_auditoria
    ADD CONSTRAINT cotizaciones_auditoria_id_cotizacion_fkey FOREIGN KEY (id_cotizacion) REFERENCES public.cotizaciones(id_cotizacion) ON DELETE CASCADE;


--
-- TOC entry 5451 (class 2606 OID 72135)
-- Name: cotizaciones_auditoria cotizaciones_auditoria_usuario_cambio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones_auditoria
    ADD CONSTRAINT cotizaciones_auditoria_usuario_cambio_fkey FOREIGN KEY (usuario_cambio) REFERENCES public.usuarios(id_usuario);


--
-- TOC entry 5443 (class 2606 OID 72044)
-- Name: cotizaciones cotizaciones_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente) ON DELETE CASCADE;


--
-- TOC entry 5444 (class 2606 OID 72049)
-- Name: cotizaciones cotizaciones_id_usuario_creador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_id_usuario_creador_fkey FOREIGN KEY (id_usuario_creador) REFERENCES public.usuarios(id_usuario) ON DELETE RESTRICT;


--
-- TOC entry 5446 (class 2606 OID 72069)
-- Name: cotizaciones_items cotizaciones_items_id_cotizacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones_items
    ADD CONSTRAINT cotizaciones_items_id_cotizacion_fkey FOREIGN KEY (id_cotizacion) REFERENCES public.cotizaciones(id_cotizacion) ON DELETE CASCADE;


--
-- TOC entry 5447 (class 2606 OID 72074)
-- Name: cotizaciones_items cotizaciones_items_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones_items
    ADD CONSTRAINT cotizaciones_items_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto) ON DELETE RESTRICT;


--
-- TOC entry 5448 (class 2606 OID 72087)
-- Name: cotizaciones_ordenes cotizaciones_ordenes_id_cotizacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones_ordenes
    ADD CONSTRAINT cotizaciones_ordenes_id_cotizacion_fkey FOREIGN KEY (id_cotizacion) REFERENCES public.cotizaciones(id_cotizacion) ON DELETE CASCADE;


--
-- TOC entry 5449 (class 2606 OID 72092)
-- Name: cotizaciones_ordenes cotizaciones_ordenes_id_orden_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones_ordenes
    ADD CONSTRAINT cotizaciones_ordenes_id_orden_fkey FOREIGN KEY (id_orden) REFERENCES public.ordenes(id_orden) ON DELETE CASCADE;


--
-- TOC entry 5452 (class 2606 OID 72167)
-- Name: devoluciones devoluciones_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devoluciones
    ADD CONSTRAINT devoluciones_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente);


--
-- TOC entry 5453 (class 2606 OID 72162)
-- Name: devoluciones devoluciones_id_orden_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devoluciones
    ADD CONSTRAINT devoluciones_id_orden_fkey FOREIGN KEY (id_orden) REFERENCES public.ordenes(id_orden);


--
-- TOC entry 5454 (class 2606 OID 72172)
-- Name: devoluciones devoluciones_id_usuario_aprobo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devoluciones
    ADD CONSTRAINT devoluciones_id_usuario_aprobo_fkey FOREIGN KEY (id_usuario_aprobo) REFERENCES public.usuarios(id_usuario);


--
-- TOC entry 5455 (class 2606 OID 72197)
-- Name: devoluciones_items devoluciones_items_id_devolucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devoluciones_items
    ADD CONSTRAINT devoluciones_items_id_devolucion_fkey FOREIGN KEY (id_devolucion) REFERENCES public.devoluciones(id_devolucion) ON DELETE CASCADE;


--
-- TOC entry 5456 (class 2606 OID 72202)
-- Name: devoluciones_items devoluciones_items_id_orden_item_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devoluciones_items
    ADD CONSTRAINT devoluciones_items_id_orden_item_fkey FOREIGN KEY (id_orden_item) REFERENCES public.ordenes_items(id_orden_item);


--
-- TOC entry 5457 (class 2606 OID 72207)
-- Name: devoluciones_items devoluciones_items_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devoluciones_items
    ADD CONSTRAINT devoluciones_items_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto);


--
-- TOC entry 5405 (class 2606 OID 71497)
-- Name: direcciones direcciones_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direcciones
    ADD CONSTRAINT direcciones_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente) ON DELETE CASCADE;


--
-- TOC entry 5445 (class 2606 OID 72489)
-- Name: cotizaciones fk_cotizaciones_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT fk_cotizaciones_usuario FOREIGN KEY (id_usuario_creador) REFERENCES public.usuarios(id_usuario);


--
-- TOC entry 5432 (class 2606 OID 72484)
-- Name: movimientos_inventario fk_movimientos_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT fk_movimientos_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


--
-- TOC entry 5436 (class 2606 OID 72479)
-- Name: ordenes_compra fk_ordenes_compra_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT fk_ordenes_compra_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


--
-- TOC entry 5411 (class 2606 OID 72397)
-- Name: ordenes fk_ordenes_estado; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes
    ADD CONSTRAINT fk_ordenes_estado FOREIGN KEY (id_estado_orden) REFERENCES public.orden_estados(id_orden_estado);


--
-- TOC entry 5416 (class 2606 OID 72333)
-- Name: payments fk_payments_metodo_pago; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_metodo_pago FOREIGN KEY (id_metodo_pago) REFERENCES public.metodos_pago(id_metodo_pago);


--
-- TOC entry 5417 (class 2606 OID 72338)
-- Name: payments fk_payments_metodo_pago_cliente; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_metodo_pago_cliente FOREIGN KEY (id_metodo_pago_cliente) REFERENCES public.metodos_pago_cliente(id_metodo_pago_cliente);


--
-- TOC entry 5419 (class 2606 OID 71697)
-- Name: interacciones_cliente interacciones_cliente_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones_cliente
    ADD CONSTRAINT interacciones_cliente_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente) ON DELETE CASCADE;


--
-- TOC entry 5420 (class 2606 OID 71702)
-- Name: interacciones_cliente interacciones_cliente_id_usuario_asignado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones_cliente
    ADD CONSTRAINT interacciones_cliente_id_usuario_asignado_fkey FOREIGN KEY (id_usuario_asignado) REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL;


--
-- TOC entry 5430 (class 2606 OID 71902)
-- Name: inventario inventario_id_almacen_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT inventario_id_almacen_fkey FOREIGN KEY (id_almacen) REFERENCES public.almacenes(id_almacen) ON DELETE CASCADE;


--
-- TOC entry 5431 (class 2606 OID 71897)
-- Name: inventario inventario_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT inventario_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto) ON DELETE CASCADE;


--
-- TOC entry 5458 (class 2606 OID 72319)
-- Name: metodos_pago_cliente metodos_pago_cliente_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metodos_pago_cliente
    ADD CONSTRAINT metodos_pago_cliente_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente) ON DELETE CASCADE;


--
-- TOC entry 5459 (class 2606 OID 72324)
-- Name: metodos_pago_cliente metodos_pago_cliente_id_metodo_pago_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metodos_pago_cliente
    ADD CONSTRAINT metodos_pago_cliente_id_metodo_pago_fkey FOREIGN KEY (id_metodo_pago) REFERENCES public.metodos_pago(id_metodo_pago) ON DELETE RESTRICT;


--
-- TOC entry 5433 (class 2606 OID 71920)
-- Name: movimientos_inventario movimientos_inventario_id_inventario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_id_inventario_fkey FOREIGN KEY (id_inventario) REFERENCES public.inventario(id_inventario) ON DELETE CASCADE;


--
-- TOC entry 5434 (class 2606 OID 71930)
-- Name: movimientos_inventario movimientos_inventario_id_orden_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_id_orden_fkey FOREIGN KEY (id_orden) REFERENCES public.ordenes(id_orden);


--
-- TOC entry 5435 (class 2606 OID 71925)
-- Name: movimientos_inventario movimientos_inventario_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


--
-- TOC entry 5421 (class 2606 OID 71728)
-- Name: oportunidades_venta oportunidades_venta_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oportunidades_venta
    ADD CONSTRAINT oportunidades_venta_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente) ON DELETE CASCADE;


--
-- TOC entry 5422 (class 2606 OID 71733)
-- Name: oportunidades_venta oportunidades_venta_id_usuario_asignado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oportunidades_venta
    ADD CONSTRAINT oportunidades_venta_id_usuario_asignado_fkey FOREIGN KEY (id_usuario_asignado) REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL;


--
-- TOC entry 5462 (class 2606 OID 72445)
-- Name: orden_estado_historial orden_estado_historial_id_estado_anterior_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orden_estado_historial
    ADD CONSTRAINT orden_estado_historial_id_estado_anterior_fkey FOREIGN KEY (id_estado_anterior) REFERENCES public.orden_estados(id_orden_estado);


--
-- TOC entry 5463 (class 2606 OID 72450)
-- Name: orden_estado_historial orden_estado_historial_id_estado_nuevo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orden_estado_historial
    ADD CONSTRAINT orden_estado_historial_id_estado_nuevo_fkey FOREIGN KEY (id_estado_nuevo) REFERENCES public.orden_estados(id_orden_estado);


--
-- TOC entry 5464 (class 2606 OID 72440)
-- Name: orden_estado_historial orden_estado_historial_id_orden_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orden_estado_historial
    ADD CONSTRAINT orden_estado_historial_id_orden_fkey FOREIGN KEY (id_orden) REFERENCES public.ordenes(id_orden) ON DELETE CASCADE;


--
-- TOC entry 5465 (class 2606 OID 72455)
-- Name: orden_estado_historial orden_estado_historial_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orden_estado_historial
    ADD CONSTRAINT orden_estado_historial_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL;


--
-- TOC entry 5460 (class 2606 OID 72423)
-- Name: orden_estado_transiciones orden_estado_transiciones_id_estado_destino_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orden_estado_transiciones
    ADD CONSTRAINT orden_estado_transiciones_id_estado_destino_fkey FOREIGN KEY (id_estado_destino) REFERENCES public.orden_estados(id_orden_estado) ON DELETE CASCADE;


--
-- TOC entry 5461 (class 2606 OID 72418)
-- Name: orden_estado_transiciones orden_estado_transiciones_id_estado_origen_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orden_estado_transiciones
    ADD CONSTRAINT orden_estado_transiciones_id_estado_origen_fkey FOREIGN KEY (id_estado_origen) REFERENCES public.orden_estados(id_orden_estado) ON DELETE CASCADE;


--
-- TOC entry 5440 (class 2606 OID 71993)
-- Name: ordenes_compra_detalle ordenes_compra_detalle_id_orden_compra_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_compra_detalle
    ADD CONSTRAINT ordenes_compra_detalle_id_orden_compra_fkey FOREIGN KEY (id_orden_compra) REFERENCES public.ordenes_compra(id_orden_compra) ON DELETE CASCADE;


--
-- TOC entry 5441 (class 2606 OID 71998)
-- Name: ordenes_compra_detalle ordenes_compra_detalle_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_compra_detalle
    ADD CONSTRAINT ordenes_compra_detalle_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto);


--
-- TOC entry 5437 (class 2606 OID 71969)
-- Name: ordenes_compra ordenes_compra_id_almacen_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_id_almacen_fkey FOREIGN KEY (id_almacen) REFERENCES public.almacenes(id_almacen);


--
-- TOC entry 5438 (class 2606 OID 71964)
-- Name: ordenes_compra ordenes_compra_id_proveedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_id_proveedor_fkey FOREIGN KEY (id_proveedor) REFERENCES public.proveedores(id_proveedor);


--
-- TOC entry 5439 (class 2606 OID 71974)
-- Name: ordenes_compra ordenes_compra_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_compra
    ADD CONSTRAINT ordenes_compra_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


--
-- TOC entry 5412 (class 2606 OID 71610)
-- Name: ordenes ordenes_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes
    ADD CONSTRAINT ordenes_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente);


--
-- TOC entry 5413 (class 2606 OID 71615)
-- Name: ordenes ordenes_id_direccion_envio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes
    ADD CONSTRAINT ordenes_id_direccion_envio_fkey FOREIGN KEY (id_direccion_envio) REFERENCES public.direcciones(id_direccion);


--
-- TOC entry 5414 (class 2606 OID 71633)
-- Name: ordenes_items ordenes_items_id_orden_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_items
    ADD CONSTRAINT ordenes_items_id_orden_fkey FOREIGN KEY (id_orden) REFERENCES public.ordenes(id_orden) ON DELETE CASCADE;


--
-- TOC entry 5415 (class 2606 OID 71638)
-- Name: ordenes_items ordenes_items_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes_items
    ADD CONSTRAINT ordenes_items_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto);


--
-- TOC entry 5418 (class 2606 OID 71659)
-- Name: payments payments_id_orden_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_id_orden_fkey FOREIGN KEY (id_orden) REFERENCES public.ordenes(id_orden);


--
-- TOC entry 5406 (class 2606 OID 71531)
-- Name: producto producto_id_categoria_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto
    ADD CONSTRAINT producto_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.categoria_producto(id_categoria);


--
-- TOC entry 5407 (class 2606 OID 71548)
-- Name: producto_imagenes producto_imagenes_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_imagenes
    ADD CONSTRAINT producto_imagenes_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.producto(id_producto) ON DELETE CASCADE;


--
-- TOC entry 5423 (class 2606 OID 71758)
-- Name: tareas_crm tareas_crm_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tareas_crm
    ADD CONSTRAINT tareas_crm_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clientes(id_cliente) ON DELETE CASCADE;


--
-- TOC entry 5424 (class 2606 OID 71763)
-- Name: tareas_crm tareas_crm_id_oportunidad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tareas_crm
    ADD CONSTRAINT tareas_crm_id_oportunidad_fkey FOREIGN KEY (id_oportunidad) REFERENCES public.oportunidades_venta(id_oportunidad) ON DELETE CASCADE;


--
-- TOC entry 5425 (class 2606 OID 71768)
-- Name: tareas_crm tareas_crm_id_usuario_asignado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tareas_crm
    ADD CONSTRAINT tareas_crm_id_usuario_asignado_fkey FOREIGN KEY (id_usuario_asignado) REFERENCES public.usuarios(id_usuario) ON DELETE RESTRICT;


--
-- TOC entry 5403 (class 2606 OID 71466)
-- Name: usuarios usuarios_id_rol_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol) ON DELETE RESTRICT;


-- Completed on 2025-11-13 17:16:34

--
-- PostgreSQL database dump complete
--

