const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Autenticación
    login: (credenciales) => ipcRenderer.invoke('login', credenciales),
    
    // Productos
    obtenerProductos: () => ipcRenderer.invoke('obtener-productos'),
    obtenerIngredientes: () => ipcRenderer.invoke('obtener-ingredientes'),
    
    // Ventas y WhatsApp
    registrarVenta: (datos) => ipcRenderer.invoke('registrar-venta', datos),
    guardarWsp: (datos) => ipcRenderer.invoke('guardar-wsp', datos),
    obtenerWsp: () => ipcRenderer.invoke('obtener-wsp'),
    pagarWsp: (datos) => ipcRenderer.invoke('pagar-wsp', datos),
    eliminarWsp: (id) => ipcRenderer.invoke('eliminar-wsp', id),
    
    // Cocina
    obtenerPedidosPendientes: () => ipcRenderer.invoke('obtener-pedidos-pendientes'),
    finalizarPedido: (id) => ipcRenderer.invoke('finalizar-pedido', id),
    
    // Caja y Turno
    obtenerCuadraturaHoy: () => ipcRenderer.invoke('obtener-cuadratura-hoy'),
    verificarComandasPendientes: () => ipcRenderer.invoke('verificar-comandas-pendientes'),
    cerrarTurno: (datos) => ipcRenderer.invoke('cerrar-turno', datos),
    obtenerCuadraturas: () => ipcRenderer.invoke('obtener-cuadraturas'),
    // Sistema de Impresión
    imprimirBoleta: (datos) => ipcRenderer.invoke('imprimir-boleta', datos),
    // Historial
    obtenerHistorialTurno: () => ipcRenderer.invoke('obtener-historial-turno'),

    // Celulares
    obtenerIpLocal: () => ipcRenderer.invoke('obtener-ip-local'),   

    // Analíticas
    obtenerAnaliticasDashboard: () => ipcRenderer.invoke('obtener-analiticas-dashboard'),
    obtenerAnaliticasFecha: (fecha) => ipcRenderer.invoke('obtener-analiticas-fecha', fecha),

    // Creacion de productos
   crearProducto: (datos) => ipcRenderer.invoke('crear-producto', datos),
    editarProducto: (datos) => ipcRenderer.invoke('editar-producto', datos),
    borrarProducto: (id) => ipcRenderer.invoke('borrar-producto', id),
    actualizarWsp: (datos) => ipcRenderer.invoke('actualizar-wsp', datos),

 
    // 🔥 AGREGA ESTAS DOS LÍNEAS NUEVAS AQUÍ:
    crearExtra: (data) => ipcRenderer.invoke('crear-extra', data),
    borrarExtra: (id) => ipcRenderer.invoke('borrar-extra', id),

    // (Asegúrate de que queden arriba de getItemsListos si ya lo tenías)
    getItemsListos: () => ipcRenderer.invoke('get-items-listos'),
    toggleItemListo: (idStr) => ipcRenderer.invoke('toggle-item-listo', idStr),

    // 🔥 AGREGA ESTAS DOS LÍNEAS PARA LAS CATEGORÍAS
    obtenerCategorias: () => ipcRenderer.invoke('obtener-categorias'),
    crearCategoria: (datos) => ipcRenderer.invoke('crear-categoria', datos),

    obtenerSlotsWhats: () => ipcRenderer.invoke('obtener-slots-whats'),
    asignarSlotWhats: (datos) => ipcRenderer.invoke('asignar-slot-whats', datos),

        // 🔥 NUEVO SOPORTE IMPRESORA TÉRMICA (ESC/POS)
    imprimirTermica: (datos) => ipcRenderer.invoke('imprimir-termica', datos),
    obtenerPrinterConfig: () => ipcRenderer.invoke('obtener-printer-config'),
    guardarPrinterConfig: (config) => ipcRenderer.invoke('guardar-printer-config', config)

    
});