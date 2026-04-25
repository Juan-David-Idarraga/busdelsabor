# Roadmap de Evolución: El Bus del Sabor POS

Este documento detalla la hoja de ruta estratégica para la modernización, escalabilidad y mejora continua del sistema POS.

## 🟢 Corto Plazo: Estabilización y Seguridad (0-3 meses)

### Seguridad y Calidad de Código
*   **Refactorización de Credenciales**: Migrar las credenciales de base de datos y claves de administración a un archivo `.env` o sistema de almacenamiento seguro.
*   **Hasheo de Contraseñas**: Implementar `bcrypt` para el almacenamiento de contraseñas de usuarios, eliminando la comparación en texto plano.
*   **Migraciones de Base de Datos**: Implementar un sistema de migraciones (ej. `Knex` o `Sequelize`) para gestionar el esquema de la base de datos de forma versionada.
*   **Sanitización de Consultas**: Revisar todos los IPC handlers para asegurar el uso consistente de consultas parametrizadas y evitar riesgos de inyección SQL.

### Experiencia de Usuario (UX)
*   **Modularización del Frontend**: Separar el archivo `index.html` (2500+ líneas) en componentes o módulos JS para facilitar el mantenimiento.
*   **Gestión de Estado**: Implementar un patrón de gestión de estado (ej. Store simple) para evitar la dependencia de variables globales en el proceso de renderizado.

## 🟡 Mediano Plazo: Escalabilidad y Funcionalidades (3-9 meses)

### Arquitectura y Backend
*   **Capa de Servicios**: Separar la lógica de negocio de los IPC handlers en `main.js` hacia una capa de servicios dedicada.
*   **API WebSockets**: Migrar el sistema de cocina de polling (cada 3s) a WebSockets (ej. `Socket.io`) para una actualización instantánea y menor carga de red.
*   **Sincronización Cloud**: Implementar un módulo de respaldo en la nube para sincronizar ventas diarias y permitir reportes remotos.

### Nuevas Funcionalidades
*   **Gestión de Inventario**: Módulo para control de stock de insumos críticos con alertas de bajo inventario.
*   **Integración Directa de Delivery**: Explorar APIs de terceros para automatizar la entrada de pedidos de PedidosYa y Uber Eats sin entrada manual.
*   **Módulo de Clientes**: Registro de clientes frecuentes y sistema de fidelización simple.

## 🔴 Largo Plazo: Innovación y Expansión (+9 meses)

### Transformación Tecnológica
*   **Migración a Web Moderno**: Evaluar la migración del frontend a un framework moderno (ej. React o Next.js) manteniendo Electron como contenedor para aprovechar el tipado estático y componentes reutilizables.
*   **App Móvil Administrativa**: Desarrollo de una aplicación móvil (React Native/Flutter) para que el dueño pueda visualizar analíticas en tiempo real desde cualquier lugar.

### Inteligencia de Negocios
*   **Dashboard Avanzado**: Implementar visualizaciones de datos complejas para predicción de demanda y optimización de horarios de personal.
*   **Sistema Multi-sucursal**: Adaptar la arquitectura para soportar múltiples locales centralizados en una sola base de datos administrativa.

---

> **Nota**: Este roadmap es un documento vivo y será ajustado según las necesidades prioritarias del negocio y los hallazgos técnicos adicionales.
