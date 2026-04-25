
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { Pool } = require('pg');
const { machineIdSync } = require('node-machine-id');
const express = require('express'); 
const cors = require('cors');       
const ip = require('ip');           

let globalItemsListos = [];

const IDS_AUTORIZADAS = [
    "10149d334f56cd826141fa32d68a1a83cd21258917f53476407317b175e7c48a", 
    "3750FC2B4FB2CA95",
"d86861869ce7706cc815adc33899d6478225c3a9c9a968338930ce066bb1cc14"
];

function verificarLicencia() { 
    // Obtenemos la ID única de este PC
    const miID = machineIdSync(); 
    
    // Revisamos si la ID está dentro de tu lista
    if (IDS_AUTORIZADAS.includes(miID)) {
        return true; // Permitir acceso
    } else {
        return false; // Bloquear acceso
    }
}
// --- FUNCIÓN DE UTILIDAD INTERNA PARA SINCRONIZACIÓN ---
function procesarToggleItem(idStr) {
    if (globalItemsListos.includes(idStr)) {
        globalItemsListos = globalItemsListos.filter(i => i !== idStr);
    } else {
        globalItemsListos.push(idStr);
    }
    return globalItemsListos;
}

// CONEXIÓN BD
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'busdelsabor', password: '12345678', port: 5432, });

ipcMain.handle('login', async (event, { email, password }) => {
  try {
    const res = await pool.query('SELECT * FROM usuario WHERE email = $1 AND activo = true', [email]);
    if (res.rows.length > 0 && res.rows[0].password_hash === password) return { success: true, nombre: res.rows[0].nombre, rol: res.rows[0].rol_id };
    return { success: false };
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('obtener-productos', async () => {
  try {
    const res = await pool.query('SELECT *, nombre_base FROM producto WHERE activo = true ORDER BY categoria, nombre_base, precio_base');
    return res.rows;
  } catch (err) { return []; }
});

ipcMain.handle('obtener-ingredientes', async () => {
  try {
    const res = await pool.query("SELECT DISTINCT ON (nombre) * FROM ingrediente WHERE tipo_exacto = 'EXTRA' ORDER BY nombre");
    return res.rows;
  } catch (err) { return []; }
});

ipcMain.handle('crear-extra', async (event, data) => {
    try {
        await pool.query("INSERT INTO ingrediente (nombre, precio_adicional, tipo_exacto) VALUES ($1, $2, 'EXTRA')", [data.nombre, data.precio]);
        return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
});

ipcMain.handle('borrar-extra', async (event, id) => {
    try {
        await pool.query("DELETE FROM ingrediente WHERE id = $1", [id]);
        return { success: true };
    } catch(e) { return { success: false, error: e.message }; }
});

ipcMain.handle('registrar-venta', async (event, datos) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resPedido = await client.query("INSERT INTO pedido (estado, cliente, fecha) VALUES ('PENDIENTE', $1, NOW()) RETURNING id", [datos.cliente]);
    const pedidoId = resPedido.rows[0].id;
    for (const item of datos.items) {
      await client.query("INSERT INTO pedido_item (pedido_id, producto_id, cantidad, notas) VALUES ($1, (SELECT id FROM producto WHERE nombre = $2 LIMIT 1), $3, $4)", [pedidoId, item.nombre, item.cantidad, item.detalles || '']);
    }
    await client.query("INSERT INTO venta (pedido_id, total, metodo_pago, cerrada) VALUES ($1, $2, $3, FALSE)", [pedidoId, datos.total, datos.metodo_pago]);
    await client.query('COMMIT');
    return { success: true, pedidoId };
  } catch (err) { await client.query('ROLLBACK'); return { success: false, error: err.message };
  } finally { client.release(); }
});

ipcMain.handle('guardar-wsp', async (event, datos) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const resPed = await client.query("INSERT INTO pedido (estado, cliente, fecha) VALUES ('PENDIENTE', $1, NOW()) RETURNING id", [datos.cliente]);
        const pedidoId = resPed.rows[0].id;
        for (const item of datos.items) {
            await client.query("INSERT INTO pedido_item (pedido_id, producto_id, cantidad, notas) VALUES ($1, (SELECT id FROM producto WHERE nombre = $2 LIMIT 1), $3, $4)", [pedidoId, item.nombre, item.cantidad, item.detalles || '']);
        }
        await client.query("INSERT INTO venta (pedido_id, total, metodo_pago, cerrada) VALUES ($1, $2, 'WHATSAPP', FALSE)", [pedidoId, datos.total]);
        await client.query('COMMIT');
        return { success: true };
    } catch (err) { await client.query('ROLLBACK'); return { success: false, error: err.message };
    } finally { client.release(); }
});

ipcMain.handle('obtener-wsp', async () => {
    try {
        const res = await pool.query(`SELECT p.id, p.cliente, p.fecha, v.total, string_agg(prod.categoria || '::' || prod.nombre || '::' || COALESCE(pi.notas, '') || '::' || pi.cantidad, '|||') as productos_data FROM pedido p JOIN venta v ON p.id = v.pedido_id JOIN pedido_item pi ON p.id = pi.pedido_id JOIN producto prod ON pi.producto_id = prod.id WHERE v.metodo_pago = 'WHATSAPP' AND v.cerrada = FALSE GROUP BY p.id, p.cliente, p.fecha, v.total ORDER BY p.fecha DESC`);
        return res.rows;
    } catch(e) { return []; }
});

ipcMain.handle('pagar-wsp', async (e, {pedidoId, metodo}) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Actualizamos el método de pago en la venta
        await client.query("UPDATE venta SET metodo_pago = $1 WHERE pedido_id = $2", [metodo, pedidoId]);
        
        // 2. 🔥 FORZAMOS el estado a 'LISTO' para que desaparezca de la cocina automáticamente
        await client.query("UPDATE pedido SET estado = 'LISTO' WHERE id = $1", [pedidoId]);
        
        await client.query('COMMIT');

        // 3. Limpiamos la memoria local de la cocina por seguridad
        globalItemsListos = globalItemsListos.filter(i => !i.startsWith(`${pedidoId}-`));

        return {success: true};
    } catch(e) {
        await client.query('ROLLBACK');
        return {success: false, error: e.message};
    } finally {
        client.release();
    }
});

ipcMain.handle('actualizar-wsp', async (event, datos) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query("DELETE FROM pedido_item WHERE pedido_id = $1", [datos.pedidoId]);
        for (const item of datos.items) {
            await client.query("INSERT INTO pedido_item (pedido_id, producto_id, cantidad, notas) VALUES ($1, (SELECT id FROM producto WHERE nombre = $2 LIMIT 1), $3, $4)", [datos.pedidoId, item.nombre, item.cantidad, item.detalles || '']);
        }
        await client.query("UPDATE venta SET total = $1 WHERE pedido_id = $2", [datos.total, datos.pedidoId]);
        await client.query('COMMIT');
        return { success: true };
    } catch (err) { await client.query('ROLLBACK'); return { success: false, error: err.message };
    } finally { client.release(); }
});

ipcMain.handle('eliminar-wsp', async (event, id) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Borramos en orden para que PostgreSQL no reclame por llaves foráneas
        await client.query("DELETE FROM pedido_item WHERE pedido_id = $1", [id]);
        await client.query("DELETE FROM venta WHERE pedido_id = $1", [id]);
        await client.query("DELETE FROM pedido WHERE id = $1", [id]);
        await client.query('COMMIT');
        
        // Limpiamos la memoria local de la cocina
        globalItemsListos = globalItemsListos.filter(i => !i.startsWith(`${id}-`));
        return { success: true };
    } catch (err) { 
        await client.query('ROLLBACK'); 
        return { success: false, error: err.message };
    } finally { 
        client.release(); 
    }
});

ipcMain.handle('obtener-pedidos-pendientes', async () => {
  try {
    const res = await pool.query(`SELECT p.id, p.cliente, p.fecha, string_agg(prod.categoria || '::' || prod.nombre || '::' || COALESCE(pi.notas, '') || '::' || pi.cantidad, '|||') as productos_data FROM pedido p JOIN pedido_item pi ON p.id = pi.pedido_id JOIN producto prod ON pi.producto_id = prod.id WHERE p.estado = 'PENDIENTE' GROUP BY p.id, p.cliente, p.fecha ORDER BY p.fecha ASC`);
    return res.rows;
  } catch (err) { return []; }
});

ipcMain.handle('get-items-listos', () => globalItemsListos);

ipcMain.handle('toggle-item-listo', (e, idStr) => {
    return procesarToggleItem(idStr);
});

ipcMain.handle('finalizar-pedido', async (e, id) => {
    try {
        await pool.query("UPDATE pedido SET estado = 'LISTO' WHERE id = $1", [id]);
        globalItemsListos = globalItemsListos.filter(i => !i.startsWith(`${id}-`)); 
        return { success: true };
    } catch(err) { return { success: false, error: err.message }; }
});

ipcMain.handle('obtener-cuadratura-hoy', async () => {
    const res = await pool.query("SELECT metodo_pago, SUM(total) as total_metodo FROM venta WHERE cerrada = FALSE GROUP BY metodo_pago");
    return res.rows;
});

ipcMain.handle('verificar-comandas-pendientes', async () => {
    // 🔥 Ahora solo cuenta pedidos que tengan productos reales asociados
    const res = await pool.query(`
        SELECT COUNT(DISTINCT p.id) 
        FROM pedido p 
        JOIN pedido_item pi ON p.id = pi.pedido_id 
        WHERE p.estado = 'PENDIENTE'
    `);
    return parseInt(res.rows[0].count);
});

ipcMain.handle('cerrar-turno', async (event, datos) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        if (datos) {
            await client.query(`INSERT INTO registro_caja (sys_efectivo, sys_debito, sys_transf, cajero_efectivo, cajero_debito, cajero_transf, diferencia, cajero_nombre, gastos_monto, gastos_motivo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, 
            [datos.sys_efec, datos.sys_deb, datos.sys_trans, datos.cajero_efec, datos.cajero_deb, datos.cajero_trans, datos.dif, datos.cajero_nombre, datos.gastos_monto, datos.gastos_motivo]);
        }
        await client.query("UPDATE venta SET cerrada = TRUE WHERE cerrada = FALSE AND metodo_pago != 'WHATSAPP'");
        
        // 👇 NUEVO: Auto-limpieza de pedidos fantasmas al cerrar turno
        await client.query("UPDATE pedido SET estado = 'LISTO' WHERE estado = 'PENDIENTE'");
        globalItemsListos = [];
        // 👆 FIN DE LO NUEVO
        
        await client.query('COMMIT');
        return { success: true };
    } catch (err) { 
        await client.query('ROLLBACK'); return { success: false, error: err.message };
    } finally { client.release(); }
});

ipcMain.handle('obtener-cuadraturas', async () => {
    try { const res = await pool.query("SELECT * FROM registro_caja ORDER BY fecha DESC LIMIT 30"); return res.rows; } catch(e) { return []; }
});

ipcMain.handle('obtener-analiticas-dashboard', async () => {
    try {
        const resAyer = await pool.query(`SELECT COALESCE(SUM(v.total), 0) as total FROM venta v JOIN pedido p ON v.pedido_id = p.id WHERE DATE(p.fecha) = CURRENT_DATE - INTERVAL '1 day' AND v.metodo_pago != 'WHATSAPP'`);
        const resMes = await pool.query(`SELECT COALESCE(SUM(v.total), 0) as total FROM venta v JOIN pedido p ON v.pedido_id = p.id WHERE EXTRACT(MONTH FROM p.fecha) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM p.fecha) = EXTRACT(YEAR FROM CURRENT_DATE) AND v.metodo_pago != 'WHATSAPP'`);
        const resTop = await pool.query(`SELECT prod.nombre, COALESCE(SUM(pi.cantidad), 0) as cant FROM pedido_item pi JOIN producto prod ON pi.producto_id = prod.id JOIN venta v ON pi.pedido_id = v.pedido_id WHERE v.metodo_pago != 'WHATSAPP' GROUP BY prod.nombre ORDER BY cant DESC LIMIT 10`);
        const resBottom = await pool.query(`SELECT prod.nombre, COALESCE(SUM(pi.cantidad), 0) as cant FROM pedido_item pi JOIN producto prod ON pi.producto_id = prod.id JOIN venta v ON pi.pedido_id = v.pedido_id WHERE v.metodo_pago != 'WHATSAPP' GROUP BY prod.nombre ORDER BY cant ASC LIMIT 10`);
        return { ayer: resAyer.rows[0].total, mes: resMes.rows[0].total, top: resTop.rows, bottom: resBottom.rows };
    } catch(e) { return {ayer:0, mes:0, top:[], bottom:[]}; }
});

ipcMain.handle('obtener-analiticas-fecha', async (e, fecha) => {
    try {
        const resTot = await pool.query(`SELECT COALESCE(SUM(v.total), 0) as total, COUNT(v.id) as tickets FROM venta v JOIN pedido p ON v.pedido_id = p.id WHERE DATE(p.fecha) = $1 AND v.metodo_pago != 'WHATSAPP'`, [fecha]);
        const resProd = await pool.query(`SELECT prod.nombre, COALESCE(SUM(pi.cantidad), 0) as cant FROM pedido_item pi JOIN producto prod ON pi.producto_id = prod.id JOIN venta v ON pi.pedido_id = v.pedido_id JOIN pedido p ON v.pedido_id = p.id WHERE DATE(p.fecha) = $1 AND v.metodo_pago != 'WHATSAPP' GROUP BY prod.nombre ORDER BY cant DESC`, [fecha]);
        return { total: resTot.rows[0].total, tickets: resTot.rows[0].tickets, productos: resProd.rows };
    } catch(e) { return {total:0, tickets:0, productos:[]}; }
});

ipcMain.handle('obtener-historial-turno', async () => {
    try {
        const res = await pool.query(`SELECT p.id, p.cliente, p.fecha, v.total, v.metodo_pago, string_agg(pi.cantidad || 'x ' || prod.nombre, ' | ') as detalles FROM pedido p JOIN venta v ON p.id = v.pedido_id JOIN pedido_item pi ON p.id = pi.pedido_id JOIN producto prod ON pi.producto_id = prod.id WHERE v.cerrada = FALSE AND v.metodo_pago != 'WHATSAPP' GROUP BY p.id, p.cliente, p.fecha, v.total, v.metodo_pago ORDER BY p.fecha DESC`);
        return res.rows;
    } catch(e) { return []; }
});

ipcMain.handle('crear-producto', async (event, p) => {
    try {
        await pool.query("INSERT INTO producto (nombre, nombre_base, precio_base, categoria, subcategoria, activo, permite_extras, imagen) VALUES ($1, $2, $3, $4, $5, true, $6, $7)", [p.nombre, p.nombre_base, p.precio, p.categoria, p.subcategoria, p.extras, p.imagen]);
        return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('editar-producto', async (event, p) => {
    try {
        await pool.query("UPDATE producto SET nombre=$1, nombre_base=$2, precio_base=$3, categoria=$4, subcategoria=$5, permite_extras=$6, imagen=$7 WHERE id=$8", [p.nombre, p.nombre_base, p.precio, p.categoria, p.subcategoria, p.extras, p.imagen, p.id]);
        return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
});

ipcMain.handle('borrar-producto', async (event, id) => {
    try {
        await pool.query("UPDATE producto SET activo = false WHERE id=$1", [id]);
        return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
});


ipcMain.handle('obtener-categorias', async () => {
    try {
        const res = await pool.query('SELECT * FROM categoria ORDER BY nombre');
        return res.rows;
    } catch (err) {
        console.error(err);
        return [];
    }
});

ipcMain.handle('crear-categoria', async (event, data) => {
    try {
        await pool.query('INSERT INTO categoria (nombre, icono, color) VALUES ($1, $2, $3)', 
            [data.nombre, data.icono, data.color]);
        return { success: true };
    } catch (e) {
        return { success: false };
    }
});

// ======================== SISTEMA PROFESIONAL IMPRESORA TÉRMICA ========================
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');

let printerConfig = {
    type: PrinterTypes.EPSON,      // Cambia a PrinterTypes.STAR si tu impresora es Star
    interface: 'usb',             // 'usb' o 'network://192.168.1.100'
    width: 48,                    // 48 = 58mm (recomendado). Usa 42 si la letra sale muy chica
    characterSet: 'PC437'
};

ipcMain.handle('obtener-printer-config', () => printerConfig);

ipcMain.handle('guardar-printer-config', (event, newConfig) => {
    printerConfig = { ...printerConfig, ...newConfig };
    return { success: true };
});

ipcMain.handle('imprimir-termica', async (event, datos) => {
    try {
        const printer = new ThermalPrinter({
            type: printerConfig.type,
            interface: printerConfig.interface,
            width: printerConfig.width,
            characterSet: printerConfig.characterSet,
            removeSpecialCharacters: false
        });

        printer.alignCenter();
        printer.bold(true);
        printer.println("BUS DEL SABOR");
        printer.setTypeFontB();
        printer.println("¡AGENDA POR WHATSAPP!");
        printer.println("📞 +56 9 7445 5988");
        printer.bold(false);
        printer.println("-----------------------------");

        printer.alignLeft();
        printer.println(`Cliente: ${datos.cliente}`);
        printer.println(`Fecha: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'})}`);
        printer.println(`Pago: ${datos.metodo}`);
        printer.println("-----------------------------");

        // Productos
        datos.items.forEach(i => {
            const nombreCorto = i.nombre.length > 28 ? i.nombre.substring(0,25) + ".." : i.nombre;
            printer.println(`${i.cantidad}x ${nombreCorto}`);
            if (i.detalles && i.detalles !== 'Normal' && i.detalles !== '') {
                printer.println(`   → ${i.detalles}`);
            }
        });

        printer.println("-----------------------------");
        printer.alignCenter();
        printer.bold(true);
        printer.setTypeFontA();
        printer.println(`TOTAL: $${datos.total.toLocaleString('es-CL')}`);
        printer.bold(false);
        printer.println("=============================");
        printer.println("¡Gracias por tu preferencia!");
        printer.println("Vuelve pronto 🍔");

        printer.cut();           // Corte automático
        await printer.execute();

        return { success: true };
    } catch (e) {
        console.error("Error térmica:", e);
        return { success: false, error: e.message };
    }
});
function createWindow() {
  // 🔥 Verificamos la licencia ANTES de abrir la ventana
  if (!verificarLicencia()) {
      const miID = machineIdSync();
      // Mostramos una alerta en la pantalla con la ID para que puedas copiarla
      dialog.showErrorBox(
          "ACCESO DENEGADO - PC NO AUTORIZADO", 
          "Esta computadora no tiene licencia para ejecutar el sistema Bus del Sabor.\n\n" +
          "La ID de este equipo es:\n" + miID + "\n\n" +
          "Por favor, contacta al administrador para agregar esta ID al sistema."
      );
      app.quit(); // Cerramos la aplicación
      return; // Detenemos el proceso
  }

  // Si la licencia es correcta, abrimos el sistema normalmente
  const win = new BrowserWindow({ width: 1280, height: 800, webPreferences: { preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true } });
  win.loadFile('index.html');

}
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

const server = express();
server.use(cors());
server.use(express.json()); 

// 🔥 ESCUDO ANTI-CACHÉ PARA LAS TABLETS
server.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

server.use('/assets', express.static(path.join(__dirname, 'assets')));
server.use('/estilos.css', express.static(path.join(__dirname, 'estilos.css')));

server.get('/', (req, res) => res.redirect('/cocina'));
server.get('/cocina', (req, res) => res.sendFile(path.join(__dirname, 'cocina.html')));

server.get('/api/pedidos-pendientes', async (req, res) => {
    try {
        const result = await pool.query(`SELECT p.id, p.cliente, p.fecha, string_agg(prod.categoria || '::' || prod.nombre || '::' || COALESCE(pi.notas, '') || '::' || pi.cantidad, '|||') as productos_data FROM pedido p JOIN pedido_item pi ON p.id = pi.pedido_id JOIN producto prod ON pi.producto_id = prod.id WHERE p.estado = 'PENDIENTE' GROUP BY p.id, p.cliente, p.fecha ORDER BY p.fecha ASC`);
        res.json(result.rows);
    } catch (e) { res.status(500).send(e.message); }
});

server.get('/api/items-listos', (req, res) => res.json(globalItemsListos));

server.post('/api/toggle-item', (req, res) => {
    const { idStr } = req.body;
    const listaActualizada = procesarToggleItem(idStr);
    res.json(listaActualizada);
});

server.post('/api/finalizar-pedido/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query("UPDATE pedido SET estado = 'LISTO' WHERE id = $1", [id]);
        globalItemsListos = globalItemsListos.filter(i => !i.startsWith(`${id}-`)); 
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`🌐 Servidor listo en puerto ${PORT}`));
ipcMain.handle('obtener-ip-local', () => { return `http://${ip.address()}:${PORT}/cocina`; });