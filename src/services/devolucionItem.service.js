import Devoluciones from '../models/devoluciones.model.js';
import Devoluciones_Items from '../models/devolucionesItems.model.js';
import Reembolsos from '../models/reembolsos.model.js';
import Politicas_Devolucion from '../models/politicasDevolucion.model.js';
import Orden from '../models/ordenes.model.js';
import Cliente from '../models/cliente.model.js';
import Producto from '../models/producto.model.js';
import OrdenesItems from '../models/ordenesItems.model.js'; // Renombrado a OrdenesItems para evitar conflicto con el modelo Orden
import Usuario from '../models/usuario.model.js'; // Asumiendo que tienes un modelo Usuario

import sequelize from '../config/database.js';
import { Op } from 'sequelize'; // Importar Op para operadores de Sequelize

/**
 * @function generarNumeroDevolucion
 * @description Genera un número de devolución único basado en la fecha y un contador diario.
 * @returns {string} Número de devolución único.
 */
export const generarNumeroDevolucion = async () => {
    const fecha = new Date();
    const hoy = fecha.toISOString().split('T')[0]; // YYYY-MM-DD

    const count = await Devoluciones.count({
        where: {
            fecha_solicitud: {
                [Op.gte]: new Date(hoy), // Mayor o igual que el inicio del día
                [Op.lt]: new Date(new Date(hoy).setDate(fecha.getDate() + 1)) // Menor que el inicio del siguiente día
            }
        }
    });

    const numero = String(count + 1).padStart(5, '0');
    return `DEV-${hoy.replace(/-/g, '')}-${numero}`;
};

/**
 * @function crearSolicitudDevolucion
 * @description Crea una nueva solicitud de devolución y la guarda en la base de datos.
 * @param {number} id_orden - ID de la orden asociada a la devolución.
 * @param {number} id_cliente - ID del cliente que solicita la devolución.
 * @param {object} datos - Objeto con los datos de la devolución.
 * @param {string} datos.tipo_devolucion - Tipo de devolución ('devolucion_total', 'devolucion_parcial', 'cambio_producto').
 * @param {string} datos.motivo - Motivo principal de la devolución.
 * @param {string} [datos.motivo_detalle] - Detalles adicionales del motivo.
 * @param {string} [datos.metodo_reembolso] - Método preferido de reembolso.
 * @param {string} [datos.notas_cliente] - Notas del cliente sobre la devolución.
 * @param {JSONB} [datos.evidencia_imagenes] - JSON con URLs o referencias a imágenes de evidencia.
 * @returns {Devoluciones} La instancia de la devolución creada.
 * @throws {Error} Si la orden no se encuentra o hay un error en la transacción.
 */
export const crearSolicitudDevolucion = async (id_orden, id_cliente, datos) => {
    const transaction = await sequelize.transaction();

    try {
        const orden = await Orden.findByPk(id_orden, { transaction });
        if (!orden) {
            throw new Error('Orden no encontrada.');
        }

        if (orden.id_cliente !== id_cliente) {
            throw new Error('El cliente no es el propietario de esta orden.');
        }

        const elegibilidad = await verificarElegibilidadDevolucion(id_orden);
        if (!elegibilidad.elegible) {
            throw new Error(`La orden no es elegible para devolución: ${elegibilidad.razon}`);
        }

        const numero_devolucion = await generarNumeroDevolucion();

        const devolucion = await Devoluciones.create({
            id_orden,
            id_cliente,
            numero_devolucion,
            tipo_devolucion: datos.tipo_devolucion,
            motivo: datos.motivo,
            motivo_detalle: datos.motivo_detalle,
            metodo_reembolso: datos.metodo_reembolso,
            notas_cliente: datos.notas_cliente,
            evidencia_imagenes: datos.evidencia_imagenes || null,
            estado: 'solicitada',
            fecha_solicitud: new Date(),
            // Otros campos como costo_envio_devolucion, quien_cubre_envio se pueden establecer aquí o en una etapa posterior.
        }, { transaction });

        // Si se proporcionan ítems en la creación inicial
        if (datos.items && Array.isArray(datos.items) && datos.items.length > 0) {
            for (const itemData of datos.items) {
                // Verificar que el id_orden_item realmente pertenece a esta orden
                const ordenItem = await OrdenesItems.findOne({
                    where: { id_orden_item: itemData.id_orden_item, id_orden: id_orden },
                    transaction
                });
                if (!ordenItem) {
                    throw new Error(`Item de orden ${itemData.id_orden_item} no encontrado o no pertenece a la orden ${id_orden}.`);
                }
                if (itemData.cantidad_solicitada > ordenItem.cantidad) {
                    throw new Error(`Cantidad solicitada para el item ${itemData.id_orden_item} excede la cantidad comprada.`);
                }

                await Devoluciones_Items.create({
                    id_devolucion: devolucion.id_devolucion,
                    id_orden_item: itemData.id_orden_item,
                    id_producto: ordenItem.id_producto, // Asegura que se usa el ID de producto de la orden original
                    cantidad_solicitada: itemData.cantidad_solicitada,
                    precio_unitario: ordenItem.precio_unitario, // Precio del momento de la compra
                    motivo_item: itemData.motivo_item,
                    estado_item: 'pendiente'
                }, { transaction });
            }
            await recalcularMontosDevolucion(devolucion.id_devolucion, transaction);
        }

        await transaction.commit();
        return devolucion;
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al crear solicitud de devolución: ${error.message}`);
    }
};

/**
 * @function agregarItemDevolucion
 * @description Agrega un item a una solicitud de devolución existente.
 * @param {number} id_devolucion - ID de la devolución a la que se agregará el item.
 * @param {number} id_orden_item - ID del item de la orden original.
 * @param {number} cantidad_solicitada - Cantidad del producto a devolver.
 * @param {string} [motivo_item] - Motivo específico para este item.
 * @returns {Devoluciones_Items} La instancia del item de devolución creado.
 * @throws {Error} Si la devolución no existe, no está en estado 'solicitada', el item de la orden no existe, o la cantidad excede la comprada.
 */
export const agregarItemDevolucion = async (id_devolucion, id_orden_item, cantidad_solicitada, motivo_item) => {
    const transaction = await sequelize.transaction();

    try {
        const devolucion = await Devoluciones.findByPk(id_devolucion, { transaction });
        if (!devolucion) {
            throw new Error('Devolución no encontrada.');
        }

        if (devolucion.estado !== 'solicitada') {
            throw new Error('Solo se pueden agregar ítems a devoluciones en estado "solicitada".');
        }

        const ordenItem = await OrdenesItems.findByPk(id_orden_item, { transaction });
        if (!ordenItem) {
            throw new Error('Item de orden original no encontrado.');
        }
        if (ordenItem.id_orden !== devolucion.id_orden) {
            throw new Error('El item de la orden no pertenece a la orden de esta devolución.');
        }

        // Verificar que la cantidad solicitada no exceda la cantidad original en la orden
        const itemsDevueltosExistentes = await Devoluciones_Items.sum('cantidad_solicitada', {
            where: { id_devolucion: id_devolucion, id_orden_item: id_orden_item },
            transaction
        });

        if ((itemsDevueltosExistentes || 0) + cantidad_solicitada > ordenItem.cantidad) {
            throw new Error(`La cantidad total solicitada para el item ${id_orden_item} excede la cantidad comprada (${ordenItem.cantidad}).`);
        }

        const item = await Devoluciones_Items.create({
            id_devolucion,
            id_orden_item,
            id_producto: ordenItem.id_producto,
            cantidad_solicitada,
            precio_unitario: ordenItem.precio_unitario,
            motivo_item,
            estado_item: 'pendiente'
        }, { transaction });

        await recalcularMontosDevolucion(id_devolucion, transaction);

        await transaction.commit();
        return item;
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al agregar item de devolución: ${error.message}`);
    }
};

/**
 * @function eliminarItemDevolucion
 * @description Elimina un item de una solicitud de devolución.
 * @param {number} id_devolucion_item - ID del item de devolución a eliminar.
 * @returns {boolean} True si se eliminó correctamente.
 * @throws {Error} Si el item no existe o la devolución no está en estado 'solicitada'.
 */
export const eliminarItemDevolucion = async (id_devolucion_item) => {
    const transaction = await sequelize.transaction();
    try {
        const item = await Devoluciones_Items.findByPk(id_devolucion_item, { transaction, include: [{ model: Devoluciones, as: 'devolucion' }] });

        if (!item) {
            throw new Error('Ítem de devolución no encontrado.');
        }
        if (item.devolucion.estado !== 'solicitada') {
            throw new Error('No se pueden eliminar ítems de devoluciones que no están en estado "solicitada".');
        }

        await item.destroy({ transaction });
        await recalcularMontosDevolucion(item.id_devolucion, transaction);

        await transaction.commit();
        return true;
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al eliminar item de devolución: ${error.message}`);
    }
};

/**
 * @function actualizarItemDevolucion
 * @description Actualiza la cantidad solicitada o el motivo de un item de devolución.
 * @param {number} id_devolucion_item - ID del item de devolución a actualizar.
 * @param {object} updates - Objeto con los campos a actualizar (cantidad_solicitada, motivo_item).
 * @returns {Devoluciones_Items} La instancia actualizada del item de devolución.
 * @throws {Error} Si el item no existe, la devolución no está en estado 'solicitada', o la cantidad excede la comprada.
 */
export const actualizarItemDevolucion = async (id_devolucion_item, updates) => {
    const transaction = await sequelize.transaction();
    try {
        const item = await Devoluciones_Items.findByPk(id_devolucion_item, { transaction, include: [{ model: Devoluciones, as: 'devolucion' }, { model: OrdenesItems, as: 'ordenItem' }] });

        if (!item) {
            throw new Error('Ítem de devolución no encontrado.');
        }
        if (item.devolucion.estado !== 'solicitada') {
            throw new Error('No se pueden actualizar ítems de devoluciones que no están en estado "solicitada".');
        }

        if (updates.cantidad_solicitada !== undefined) {
            if (updates.cantidad_solicitada <= 0) {
                throw new Error('La cantidad solicitada debe ser mayor que cero.');
            }
            // Verificar que la nueva cantidad no exceda la cantidad original en la orden
            const otrosItemsDevueltos = await Devoluciones_Items.sum('cantidad_solicitada', {
                where: {
                    id_devolucion: item.id_devolucion,
                    id_orden_item: item.id_orden_item,
                    id_devolucion_item: { [Op.ne]: id_devolucion_item } // Excluir el item actual
                },
                transaction
            });

            if ((otrosItemsDevueltos || 0) + updates.cantidad_solicitada > item.ordenItem.cantidad) {
                throw new Error(`La cantidad total solicitada para el item ${item.id_orden_item} excede la cantidad comprada (${item.ordenItem.cantidad}).`);
            }
        }

        await item.update(updates, { transaction });
        await recalcularMontosDevolucion(item.id_devolucion, transaction);

        await transaction.commit();
        return item;
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al actualizar item de devolución: ${error.message}`);
    }
};


/**
 * @function recalcularMontosDevolucion
 * @description Recalcula el monto total de la devolución sumando los precios de sus ítems.
 * @param {number} id_devolucion - ID de la devolución.
 * @param {object} [transaction] - Objeto de transacción de Sequelize.
 * @throws {Error} Si hay un error al recalcular los montos.
 */
export const recalcularMontosDevolucion = async (id_devolucion, transaction = null) => {
    try {
        const items = await Devoluciones_Items.findAll({
            where: { id_devolucion },
            transaction
        });

        const monto_total = items.reduce((sum, item) => {
            return sum + (item.cantidad_solicitada * parseFloat(item.precio_unitario || 0));
        }, 0);

        await Devoluciones.update(
            { monto_total_devolucion: monto_total.toFixed(2) },
            { where: { id_devolucion }, transaction }
        );
    } catch (error) {
        throw new Error(`Error al recalcular montos: ${error.message}`);
    }
};

/**
 * @function obtenerDevolucion
 * @description Obtiene una solicitud de devolución completa, incluyendo sus ítems, orden, cliente y reembolsos.
 * @param {number} id_devolucion - ID de la devolución a buscar.
 * @returns {Devoluciones} La instancia de la devolución con sus relaciones.
 * @throws {Error} Si hay un error al obtener la devolución.
 */
export const obtenerDevolucion = async (id_devolucion) => {
    try {
        const devolucion = await Devoluciones.findByPk(id_devolucion, {
            include: [
                {
                    model: Devoluciones_Items,
                    as: 'items',
                    include: [
                        { model: Producto, as: 'producto' },
                        { model: OrdenesItems, as: 'ordenItem' }
                    ]
                },
                {
                    model: Orden,
                    as: 'orden',
                    include: [
                        { model: Cliente, as: 'cliente' },
                        { model: Usuario, as: 'usuario' } // Asumiendo que Orden tiene relación con Usuario
                    ]
                },
                { model: Cliente, as: 'cliente' }, // El cliente directo de la devolución
                { model: Reembolsos, as: 'reembolsos' },
                { model: Usuario, as: 'usuarioAprobador' }
            ]
        });
        if (!devolucion) {
            throw new Error('Devolución no encontrada.');
        }
        return devolucion;
    } catch (error) {
        throw new Error(`Error al obtener devolución: ${error.message}`);
    }
};

/**
 * @function listarDevolucionesCliente
 * @description Lista todas las devoluciones de un cliente, opcionalmente filtradas por estado.
 * @param {number} id_cliente - ID del cliente.
 * @param {string} [estado] - Estado de la devolución para filtrar (e.g., 'solicitada', 'aprobada').
 * @returns {Array<Devoluciones>} Lista de devoluciones.
 * @throws {Error} Si hay un error al listar las devoluciones.
 */
export const listarDevolucionesCliente = async (id_cliente, estado = null) => {
    try {
        const where = { id_cliente };
        if (estado) {
            where.estado = estado;
        }

        const devoluciones = await Devoluciones.findAll({
            where,
            include: [
                {
                    model: Devoluciones_Items,
                    as: 'items',
                    include: [Producto]
                },
                {
                    model: Orden,
                    as: 'orden'
                }
            ],
            order: [['fecha_solicitud', 'DESC']]
        });

        return devoluciones;
    } catch (error) {
        throw new Error(`Error al listar devoluciones del cliente: ${error.message}`);
    }
};

/**
 * @function listarDevolucionesOrden
 * @description Lista todas las devoluciones asociadas a una orden específica.
 * @param {number} id_orden - ID de la orden.
 * @returns {Array<Devoluciones>} Lista de devoluciones.
 * @throws {Error} Si hay un error al listar las devoluciones.
 */
export const listarDevolucionesOrden = async (id_orden) => {
    try {
        const devoluciones = await Devoluciones.findAll({
            where: { id_orden },
            include: [
                {
                    model: Devoluciones_Items,
                    as: 'items',
                    include: [Producto]
                }
            ],
            order: [['fecha_solicitud', 'DESC']]
        });

        return devoluciones;
    } catch (error) {
        throw new Error(`Error al listar devoluciones de la orden: ${error.message}`);
    }
};

/**
 * @function aprobarDevolucion
 * @description Aprueba una solicitud de devolución, actualiza su estado y los ítems aprobados.
 * @param {number} id_devolucion - ID de la devolución a aprobar.
 * @param {number} id_usuario - ID del usuario que aprueba la devolución.
 * @param {object} datos - Objeto con datos de aprobación.
 * @param {object} [datos.items_aprobados] - Objeto donde las claves son id_devolucion_item y los valores son las cantidades aprobadas.
 * @param {string} [datos.notas_internas] - Notas internas para la aprobación.
 * @returns {Devoluciones} La instancia actualizada de la devolución.
 * @throws {Error} Si la devolución no existe, no está en estado 'solicitada', o hay un error en la transacción.
 */
export const aprobarDevolucion = async (id_devolucion, id_usuario, datos) => {
    const transaction = await sequelize.transaction();

    try {
        const devolucion = await Devoluciones.findByPk(id_devolucion, { transaction });

        if (!devolucion) {
            throw new Error('Devolución no encontrada.');
        }

        if (devolucion.estado !== 'solicitada') {
            throw new Error('Solo se pueden aprobar devoluciones en estado "solicitada".');
        }

        const items = await Devoluciones_Items.findAll({
            where: { id_devolucion },
            transaction
        });

        let monto_aprobado = 0;
        let allItemsApproved = true;

        for (const item of items) {
            let cantidad_aprobada = item.cantidad_solicitada; // Por defecto se aprueba todo lo solicitado
            let estado_item = 'aprobado';

            if (datos.items_aprobados && datos.items_aprobados[item.id_devolucion_item] !== undefined) {
                cantidad_aprobada = datos.items_aprobados[item.id_devolucion_item];
                if (cantidad_aprobada === 0) {
                    estado_item = 'rechazado'; // Si se aprueba 0, es un rechazo de ese ítem
                    allItemsApproved = false;
                } else if (cantidad_aprobada > item.cantidad_solicitada) {
                    throw new Error(`Cantidad aprobada para el item ${item.id_devolucion_item} excede la cantidad solicitada.`);
                }
            } else {
                // Si no se especificó para este ítem, se aprueba la cantidad solicitada por defecto
            }

            await item.update({
                cantidad_aprobada,
                estado_item
            }, { transaction });

            monto_aprobado += cantidad_aprobada * parseFloat(item.precio_unitario || 0);
        }

        // Si todos los ítems fueron aprobados, y el monto es igual al solicitado, la devolución es "aprobada"
        // Si hay ítems rechazados o cantidades parciales, la devolución podría ir a "en_proceso" o un estado más granular.
        // Aquí mantendremos la lógica de que si se aprueba al menos algo, pasa a 'aprobada'
        await devolucion.update({
            estado: 'aprobada',
            monto_aprobado: monto_aprobado.toFixed(2),
            fecha_aprobacion: new Date(),
            id_usuario_aprobo: id_usuario,
            notas_internas: datos.notas_internas || null
        }, { transaction });

        await transaction.commit();
        return await obtenerDevolucion(id_devolucion);
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al aprobar devolución: ${error.message}`);
    }
};

/**
 * @function rechazarDevolucion
 * @description Rechaza una solicitud de devolución.
 * @param {number} id_devolucion - ID de la devolución a rechazar.
 * @param {number} id_usuario - ID del usuario que rechaza la devolución.
 * @param {string} razon - Razón del rechazo.
 * @returns {Devoluciones} La instancia actualizada de la devolución.
 * @throws {Error} Si la devolución no existe, no está en estado 'solicitada', o hay un error en la transacción.
 */
export const rechazarDevolucion = async (id_devolucion, id_usuario, razon) => {
    const transaction = await sequelize.transaction();

    try {
        const devolucion = await Devoluciones.findByPk(id_devolucion, { transaction });

        if (!devolucion) {
            throw new Error('Devolución no encontrada.');
        }

        if (devolucion.estado !== 'solicitada') {
            throw new Error('Solo se pueden rechazar devoluciones en estado "solicitada".');
        }

        await devolucion.update({
            estado: 'rechazada',
            fecha_rechazo: new Date(),
            id_usuario_aprobo: id_usuario,
            notas_internas: razon
        }, { transaction });

        // Opcionalmente, podrías actualizar el estado de todos los Devoluciones_Items a 'rechazado' aquí.
        await Devoluciones_Items.update(
            { estado_item: 'rechazado' },
            { where: { id_devolucion }, transaction }
        );

        await transaction.commit();
        return await obtenerDevolucion(id_devolucion);
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al rechazar devolución: ${error.message}`);
    }
};

/**
 * @function registrarRecepcionDevolucion
 * @description Registra la recepción física de los ítems de una devolución.
 * @param {number} id_devolucion - ID de la devolución.
 * @param {object} datos - Objeto con datos de recepción.
 * @param {object} datos.items_recibidos - Objeto donde las claves son id_devolucion_item y los valores son la cantidad recibida.
 * @param {object} [datos.condiciones] - Objeto donde las claves son id_devolucion_item y los valores son la condición del producto.
 * @param {string} [datos.guia_devolucion] - Número de guía de la empresa de transporte.
 * @param {string} [datos.transportista] - Nombre de la empresa de transporte.
 * @returns {Devoluciones} La instancia actualizada de la devolución.
 * @throws {Error} Si la devolución no existe, no está en estado 'aprobada', o hay un error en la transacción.
 */
export const registrarRecepcionDevolucion = async (id_devolucion, datos) => {
    const transaction = await sequelize.transaction();

    try {
        const devolucion = await Devoluciones.findByPk(id_devolucion, { transaction });

        if (!devolucion) {
            throw new Error('Devolución no encontrada.');
        }

        if (devolucion.estado !== 'aprobada') {
            throw new Error('Solo se puede registrar la recepción de devoluciones aprobadas.');
        }

        let allItemsReceived = true;
        const itemsAprobados = await Devoluciones_Items.findAll({
            where: { id_devolucion, estado_item: 'aprobado' },
            transaction
        });

        for (const item of itemsAprobados) {
            const cantidad_recibida = datos.items_recibidos[item.id_devolucion_item];
            if (cantidad_recibida === undefined || cantidad_recibida < 0 || cantidad_recibida > item.cantidad_aprobada) {
                // Podrías manejar esto como un error o simplemente no actualizar si no hay datos válidos.
                // Aquí, decidimos continuar pero marcamos que no todos fueron recibidos como esperábamos.
                allItemsReceived = false;
                console.warn(`Item ${item.id_devolucion_item}: Cantidad recibida inválida o no especificada. Se esperaba ${item.cantidad_aprobada}, se recibió ${cantidad_recibida}.`);
                continue; // No actualizamos este item si la cantidad es inválida.
            }

            // Si la cantidad recibida es 0, podríamos marcarla como 'no_recibido' o 'rechazado_recepcion'
            // Por ahora, simplemente actualizamos la condición y la fecha si se recibió algo.
            if (cantidad_recibida > 0) {
                await item.update({
                    estado_item: 'recibido',
                    fecha_recibido: new Date(),
                    condicion_producto: datos.condiciones?.[item.id_devolucion_item] || item.condicion_producto // Mantener o actualizar
                }, { transaction });
            } else {
                // Qué hacer si se espera una cantidad pero se recibe 0?
                // Podría ser un nuevo estado como 'no_recibido'
                await item.update({
                    estado_item: 'rechazado_recepcion', // Nuevo estado sugerido
                    fecha_recibido: new Date(),
                    notas_inspeccion: `No se recibió la cantidad esperada (${item.cantidad_aprobada}).`
                }, { transaction });
                allItemsReceived = false;
            }
        }

        // Si al menos un item fue recibido o se espera su recepción, la devolución pasa a 'en_proceso'
        // Si todos los items aprobados no fueron recibidos, podrías considerar un estado diferente.
        await devolucion.update({
            estado: 'en_proceso',
            guia_devolucion: datos.guia_devolucion || null,
            transportista_devolucion: datos.transportista || null
        }, { transaction });

        await transaction.commit();
        return await obtenerDevolucion(id_devolucion);
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al registrar recepción: ${error.message}`);
    }
};

/**
 * @function inspeccionarItems
 * @description Registra los resultados de la inspección de los ítems recibidos en una devolución.
 * @param {number} id_devolucion - ID de la devolución.
 * @param {object} inspecciones - Objeto donde las claves son id_devolucion_item y los valores son objetos { condicion, accion, notas }.
 * @returns {Devoluciones} La instancia actualizada de la devolución.
 * @throws {Error} Si la devolución no existe, no está en estado 'en_proceso', o hay un error en la transacción.
 */
export const inspeccionarItems = async (id_devolucion, inspecciones) => {
    const transaction = await sequelize.transaction();

    try {
        const devolucion = await Devoluciones.findByPk(id_devolucion, { transaction });

        if (!devolucion) {
            throw new Error('Devolución no encontrada.');
        }

        // La devolución debe estar en estado 'en_proceso' para inspeccionar items recibidos.
        if (devolucion.estado !== 'en_proceso') {
            throw new Error('Solo se pueden inspeccionar devoluciones que están "en_proceso".');
        }

        let allItemsInspected = true;
        const itemsRecibidos = await Devoluciones_Items.findAll({
            where: { id_devolucion, estado_item: 'recibido' },
            transaction
        });

        for (const item of itemsRecibidos) {
            const inspeccion = inspecciones[item.id_devolucion_item];

            if (!inspeccion) {
                allItemsInspected = false;
                console.warn(`Ítem ${item.id_devolucion_item}: No se proporcionaron datos de inspección.`);
                continue;
            }

            await item.update({
                estado_item: 'inspeccionado',
                fecha_inspeccion: new Date(),
                condicion_producto: inspeccion.condicion,
                accion_tomar: inspeccion.accion,
                notas_inspeccion: inspeccion.notas || null
            }, { transaction });
        }

        // Si todos los items recibidos han sido inspeccionados, la devolución sigue en 'en_proceso'
        // pero se puede proceder con el reembolso o finalización.
        // Podrías añadir lógica aquí para mover la devolución a un estado como 'listo_para_reembolso'
        // si todos los ítems han sido inspeccionados y se ha decidido una 'accion_tomar'.

        await transaction.commit();
        return await obtenerDevolucion(id_devolucion);
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error en inspección: ${error.message}`);
    }
};

/**
 * @function crearReembolso
 * @description Crea un registro de reembolso para una devolución, sin procesarlo.
 * @param {number} id_devolucion - ID de la devolución a la que se asocia el reembolso.
 * @param {string} metodo_reembolso - Método de reembolso (e.g., 'original', 'credito_tienda').
 * @param {number} monto_reembolso - Monto a reembolsar.
 * @param {string} [notas_reembolso] - Notas adicionales sobre el reembolso.
 * @param {string} [moneda] - Moneda del reembolso (ej. 'USD', 'MXN').
 * @returns {Reembolsos} La instancia del reembolso creado.
 * @throws {Error} Si la devolución no existe, no está en estado 'en_proceso', o el monto excede el aprobado.
 */
export const crearReembolso = async (id_devolucion, metodo_reembolso, monto_reembolso, notas_reembolso = null, moneda = 'USD') => {
    const transaction = await sequelize.transaction();

    try {
        const devolucion = await Devoluciones.findByPk(id_devolucion, { transaction });

        if (!devolucion) {
            throw new Error('Devolución no encontrada.');
        }

        // Asegurarse de que el monto a reembolsar no exceda el monto aprobado para la devolución
        const reembolsosExistentes = await Reembolsos.sum('monto_reembolso', {
            where: { id_devolucion },
            transaction
        });

        const totalReembolsadoHastaAhora = parseFloat(reembolsosExistentes || 0);
        const montoAprobadoDevolucion = parseFloat(devolucion.monto_aprobado || 0);

        if (totalReembolsadoHastaAhora + monto_reembolso > montoAprobadoDevolucion) {
            throw new Error(`El monto del reembolso ($${monto_reembolso.toFixed(2)}) excede el monto aprobado restante ($${(montoAprobadoDevolucion - totalReembolsadoHastaAhora).toFixed(2)}) para esta devolución.`);
        }

        const reembolso = await Reembolsos.create({
            id_devolucion,
            metodo_reembolso,
            monto_reembolso,
            fecha_solicitud: new Date(),
            estado_reembolso: 'pendiente', // O 'creado', 'solicitado'
            notas_reembolso,
            moneda
        }, { transaction });

        await transaction.commit();
        return reembolso;
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al crear reembolso: ${error.message}`);
    }
};

/**
 * @function procesarReembolso
 * @description Marca un reembolso como 'procesando' e indica el usuario que lo inició.
 * @param {number} id_reembolso - ID del reembolso a procesar.
 * @param {number} id_usuario - ID del usuario que procesa el reembolso.
 * @returns {Reembolsos} La instancia actualizada del reembolso.
 * @throws {Error} Si el reembolso no existe, no está en estado 'pendiente', o hay un error en la transacción.
 */
export const procesarReembolso = async (id_reembolso, id_usuario) => {
    const transaction = await sequelize.transaction();

    try {
        const reembolso = await Reembolsos.findByPk(id_reembolso, { transaction });

        if (!reembolso) {
            throw new Error('Reembolso no encontrado.');
        }

        if (reembolso.estado_reembolso !== 'pendiente') {
            throw new Error('Solo se pueden procesar reembolsos pendientes.');
        }

        await reembolso.update({
            estado_reembolso: 'procesando',
            fecha_procesamiento: new Date(),
            id_usuario_aprobo_reembolso: id_usuario
        }, { transaction });

        await transaction.commit();
        return reembolso;
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al procesar reembolso: ${error.message}`);
    }
};

/**
 * @function completarReembolso
 * @description Marca un reembolso como 'completado' y actualiza el estado de la devolución si todos los reembolsos están completos.
 * @param {number} id_reembolso - ID del reembolso a completar.
 * @param {string} transaccion_id - ID de la transacción externa del reembolso.
 * @returns {Reembolsos} La instancia actualizada del reembolso.
 * @throws {Error} Si el reembolso no existe, no está en estado 'procesando', o hay un error en la transacción.
 */
export const completarReembolso = async (id_reembolso, transaccion_id) => {
    const transaction = await sequelize.transaction();

    try {
        const reembolso = await Reembolsos.findByPk(id_reembolso, { transaction });

        if (!reembolso) {
            throw new Error('Reembolso no encontrado.');
        }

        if (reembolso.estado_reembolso !== 'procesando') {
            throw new Error('Solo se pueden completar reembolsos en procesamiento.');
        }

        await reembolso.update({
            estado_reembolso: 'completado',
            fecha_completado: new Date(),
            transaccion_reembolso_id: transaccion_id
        }, { transaction });

        // Verificar si todos los reembolsos asociados a esta devolución están completados
        const totalReembolsados = await Reembolsos.sum('monto_reembolso', {
            where: {
                id_devolucion: reembolso.id_devolucion,
                estado_reembolso: 'completado'
            },
            transaction
        });

        const devolucion = await Devoluciones.findByPk(reembolso.id_devolucion, { transaction });
        const montoAprobado = parseFloat(devolucion.monto_aprobado || 0);

        // Si el monto total reembolsado es igual o mayor al monto aprobado de la devolución, marcar la devolución como 'completada'
        if (totalReembolsados >= montoAprobado && montoAprobado > 0) {
            await devolucion.update({
                estado: 'completada',
                fecha_completada: new Date()
            }, { transaction });
        } else {
             // Si hay más reembolsos pendientes o el monto total no se ha cubierto
            await devolucion.update({
                estado: 'reembolso_parcial' // Podrías tener un estado 'reembolso_parcial' si no está todo completado.
            }, { transaction });
        }


        await transaction.commit();
        return reembolso;
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al completar reembolso: ${error.message}`);
    }
};

/**
 * @function anularReembolso
 * @description Anula un reembolso que no ha sido completado.
 * @param {number} id_reembolso - ID del reembolso a anular.
 * @param {string} razon - Razón de la anulación.
 * @returns {Reembolsos} La instancia actualizada del reembolso.
 * @throws {Error} Si el reembolso no existe, ya está completado o anulado.
 */
export const anularReembolso = async (id_reembolso, razon) => {
    const transaction = await sequelize.transaction();
    try {
        const reembolso = await Reembolsos.findByPk(id_reembolso, { transaction });

        if (!reembolso) {
            throw new Error('Reembolso no encontrado.');
        }

        if (['completado', 'anulado'].includes(reembolso.estado_reembolso)) {
            throw new Error('No se puede anular un reembolso en este estado.');
        }

        await reembolso.update({
            estado_reembolso: 'anulado',
            notas_reembolso: (reembolso.notas_reembolso || '') + `\nAnulado: ${razon}`,
            fecha_anulacion: new Date()
        }, { transaction });

        await transaction.commit();
        return reembolso;
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al anular reembolso: ${error.message}`);
    }
};

/**
 * @function verificarElegibilidadDevolucion
 * @description Verifica si una orden es elegible para devolución según las políticas activas.
 * @param {number} id_orden - ID de la orden a verificar.
 * @returns {object} Objeto con 'elegible', 'razon', 'politica', 'dias_transcurridos', 'dias_restantes'.
 * @throws {Error} Si la orden no se encuentra o hay un error.
 */
export const verificarElegibilidadDevolucion = async (id_orden) => {
    try {
        const orden = await Orden.findByPk(id_orden);

        if (!orden) {
            throw new Error('Orden no encontrada.');
        }

        const politica = await Politicas_Devolucion.findOne({
            where: { activo: true },
            order: [['fecha_creacion', 'DESC']] // Asegura que se obtiene la política más reciente si hay varias activas
        });

        if (!politica) {
            return {
                elegible: false,
                razon: 'No hay política de devoluciones activa.'
            };
        }

        const fechaOrden = new Date(orden.fecha_orden);
        const hoy = new Date();
        const dias_transcurridos = Math.floor((hoy - fechaOrden) / (1000 * 60 * 60 * 24));

        if (dias_transcurridos > politica.dias_devolucion) {
            return {
                elegible: false,
                razon: `La orden supera el límite de ${politica.dias_devolucion} días para devoluciones. Han transcurrido ${dias_transcurridos} días.`,
                politica,
                dias_transcurridos
            };
        }

        const devolucionExistente = await Devoluciones.findOne({
            where: {
                id_orden,
                estado: {
                    [Op.in]: ['solicitada', 'aprobada', 'en_proceso', 'reembolso_parcial'] // Incluir 'reembolso_parcial'
                }
            }
        });

        if (devolucionExistente) {
            return {
                elegible: false,
                razon: 'Ya existe una devolución en proceso o pendiente para esta orden.',
                devolucionExistente
            };
        }

        return {
            elegible: true,
            politica,
            dias_transcurridos,
            dias_restantes: politica.dias_devolucion - dias_transcurridos
        };
    } catch (error) {
        throw new Error(`Error al verificar elegibilidad: ${error.message}`);
    }
};

/**
 * @function generarReporteDevoluciones
 * @description Genera un reporte resumido de devoluciones basado en filtros.
 * @param {object} [filtros] - Objeto con filtros (estado, id_cliente, fecha_inicio, fecha_fin).
 * @returns {object} Reporte con estadísticas y lista de devoluciones.
 * @throws {Error} Si hay un error al generar el reporte.
 */
export const generarReporteDevoluciones = async (filtros = {}) => {
    try {
        const where = {};

        if (filtros.estado) {
            where.estado = filtros.estado;
        }

        if (filtros.id_cliente) {
            where.id_cliente = filtros.id_cliente;
        }

        if (filtros.fecha_inicio && filtros.fecha_fin) {
            where.fecha_solicitud = {
                [Op.between]: [new Date(filtros.fecha_inicio), new Date(filtros.fecha_fin)]
            };
        }

        const devoluciones = await Devoluciones.findAll({
            where,
            include: [
                {
                    model: Cliente,
                    as: 'cliente',
                    attributes: ['id_cliente', 'nombre', 'email']
                },
                {
                    model: Devoluciones_Items,
                    as: 'items'
                },
                {
                    model: Reembolsos,
                    as: 'reembolsos'
                }
            ],
            order: [['fecha_solicitud', 'DESC']]
        });

        const totalDevoluciones = devoluciones.length;
        const montosTotalSolicitado = devoluciones.reduce((sum, dev) => sum + parseFloat(dev.monto_total_devolucion || 0), 0);
        const montosAprobados = devoluciones.reduce((sum, dev) => sum + parseFloat(dev.monto_aprobado || 0), 0);
        const montosReembolsados = devoluciones.reduce((sum, dev) => {
            if (dev.reembolsos && dev.reembolsos.length > 0) {
                return sum + dev.reembolsos.reduce((reflSum, r) => {
                    return reflSum + (r.estado_reembolso === 'completado' ? parseFloat(r.monto_reembolso || 0) : 0);
                }, 0);
            }
            return sum;
        }, 0);


        const estadisticasEstado = {};
        devoluciones.forEach(dev => {
            if (!estadisticasEstado[dev.estado]) {
                estadisticasEstado[dev.estado] = 0;
            }
            estadisticasEstado[dev.estado]++;
        });

        return {
            totalDevoluciones,
            montosTotalSolicitado: montosTotalSolicitado.toFixed(2),
            montosAprobados: montosAprobados.toFixed(2),
            montosReembolsados: montosReembolsados.toFixed(2),
            estadisticasEstado,
            devoluciones
        };
    } catch (error) {
        throw new Error(`Error al generar reporte: ${error.message}`);
    }
};

/**
 * @function obtenerDevolucionesPendientes
 * @description Obtiene todas las devoluciones en estado 'solicitada' (pendientes de aprobación).
 * @returns {Array<Devoluciones>} Lista de devoluciones pendientes.
 * @throws {Error} Si hay un error al obtener las devoluciones.
 */
export const obtenerDevolucionesPendientes = async () => {
    try {
        const devoluciones = await Devoluciones.findAll({
            where: { estado: 'solicitada' },
            include: [
                {
                    model: Cliente,
                    as: 'cliente',
                    attributes: ['id_cliente', 'nombre', 'email']
                },
                {
                    model: Devoluciones_Items,
                    as: 'items',
                    include: [Producto]
                }
            ],
            order: [['fecha_solicitud', 'ASC']]
        });

        return devoluciones;
    } catch (error) {
        throw new Error(`Error al obtener devoluciones pendientes: ${error.message}`);
    }
};

/**
 * @function cancelarDevolucion
 * @description Cancela una solicitud de devolución si no ha sido completada o rechazada.
 * @param {number} id_devolucion - ID de la devolución a cancelar.
 * @param {string} razon - Razón de la cancelación.
 * @returns {Devoluciones} La instancia actualizada de la devolución.
 * @throws {Error} Si la devolución no existe o no se puede cancelar en su estado actual.
 */
export const cancelarDevolucion = async (id_devolucion, razon) => {
    const transaction = await sequelize.transaction();

    try {
        const devolucion = await Devoluciones.findByPk(id_devolucion, { transaction });

        if (!devolucion) {
            throw new Error('Devolución no encontrada.');
        }

        if (['completada', 'rechazada', 'cancelada'].includes(devolucion.estado)) {
            throw new Error('No se puede cancelar una devolución en este estado.');
        }

        await devolucion.update({
            estado: 'cancelada',
            notas_internas: (devolucion.notas_internas || '') + `\nCancelada: ${razon}`,
            fecha_cancelacion: new Date() // Asegúrate de tener este campo en tu modelo
        }, { transaction });

        // Si se cancela, los ítems asociados también deberían reflejarlo
        await Devoluciones_Items.update(
            { estado_item: 'cancelado' }, // Nuevo estado 'cancelado' para items
            { where: { id_devolucion, estado_item: { [Op.notIn]: ['rechazado', 'inspeccionado', 'reembolsado'] } }, transaction }
        );

        await transaction.commit();
        return await obtenerDevolucion(id_devolucion);
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al cancelar devolución: ${error.message}`);
    }
};

/**
 * @function actualizarEstadoDevolucion
 * @description Actualiza el estado de una devolución a un nuevo estado válido.
 * @param {number} id_devolucion - ID de la devolución.
 * @param {string} nuevo_estado - El nuevo estado al que se desea mover la devolución.
 * @param {object} [datos_adicionales] - Datos opcionales para actualizar junto con el estado.
 * @returns {Devoluciones} La instancia actualizada de la devolución.
 * @throws {Error} Si la devolución no existe o la transición de estado no es válida.
 */
export const actualizarEstadoDevolucion = async (id_devolucion, nuevo_estado, datos_adicionales = {}) => {
    const transaction = await sequelize.transaction();
    try {
        const devolucion = await Devoluciones.findByPk(id_devolucion, { transaction });

        if (!devolucion) {
            throw new Error('Devolución no encontrada.');
        }

        const estado_actual = devolucion.estado;

        // Definir transiciones de estado válidas
        const transicionesValidas = {
            'solicitada': ['aprobada', 'rechazada', 'cancelada'],
            'aprobada': ['en_proceso', 'cancelada'],
            'en_proceso': ['completada', 'reembolso_parcial', 'cancelada'],
            'reembolso_parcial': ['completada', 'cancelada'],
            'rechazada': [],
            'completada': [],
            'cancelada': []
        };

        if (!transicionesValidas[estado_actual] || !transicionesValidas[estado_actual].includes(nuevo_estado)) {
            throw new Error(`Transición de estado inválida de "${estado_actual}" a "${nuevo_estado}".`);
        }

        const updateData = {
            estado: nuevo_estado,
            ...datos_adicionales // Permite pasar otros campos a actualizar
        };

        // Actualizar fechas según el estado
        if (nuevo_estado === 'aprobada' && !devolucion.fecha_aprobacion) updateData.fecha_aprobacion = new Date();
        if (nuevo_estado === 'rechazada' && !devolucion.fecha_rechazo) updateData.fecha_rechazo = new Date();
        if (nuevo_estado === 'completada' && !devolucion.fecha_completada) updateData.fecha_completada = new Date();
        if (nuevo_estado === 'cancelada' && !devolucion.fecha_cancelacion) updateData.fecha_cancelacion = new Date();


        await devolucion.update(updateData, { transaction });

        await transaction.commit();
        return await obtenerDevolucion(id_devolucion);
    } catch (error) {
        await transaction.rollback();
        throw new Error(`Error al actualizar estado de devolución: ${error.message}`);
    }
};