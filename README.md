# El Bus del Sabor POS

[![Electron](https://img.shields.io/badge/Electron-28.x-blueviolet?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-lightgrey?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-Modern-orange?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)

## Visión General (Overview)

**El Bus del Sabor POS** es una solución integral de **Punto de Venta (POS)** diseñada para optimizar la gestión operativa de establecimientos gastronómicos. Este sistema permite a los locales administrar eficientemente comandas en tiempo real, realizar cuadraturas de caja precisas y controlar el acceso de usuarios mediante un modelo de suscripción. Su impacto comercial y operativo radica en la automatización de procesos críticos, la reducción de errores manuales y la provisión de herramientas para una toma de decisiones ágil, mejorando la rentabilidad y la experiencia del cliente.

## Características Clave (Key Features)

*   **Terminal de Ventas Táctil**: Interfaz de usuario intuitiva y optimizada para pantallas táctiles, facilitando la toma de pedidos, la personalización de productos con extras y la gestión de categorías dinámicas.
*   **Monitor de Cocina Distribuido (KDS)**: Un sistema de visualización de comandas en tiempo real, accesible desde cualquier dispositivo en la red local. Incluye notificaciones sonoras y estados visuales para una gestión eficiente de la preparación.
*   **Gestión de Pedidos por WhatsApp**: Módulo dedicado para la recepción, edición y seguimiento de pedidos realizados a través de WhatsApp, integrándolos fluidamente en el flujo de ventas y cocina.
*   **Control de Caja y Turnos**: Funcionalidades completas para la apertura, cuadratura y cierre de turnos, con desglose detallado por métodos de pago (efectivo, débito, transferencia) y conciliación de plataformas de delivery (PedidosYa, Uber Eats).
*   **Control de Inventario y Extras**: Gestión detallada de productos y sus componentes, permitiendo la adición de extras y la personalización de pedidos, con un control futuro sobre el inventario de insumos.
*   **Impresión Térmica Profesional**: Integración nativa con impresoras térmicas de 58mm/80mm para la emisión de comandas de cocina y comprobantes de venta.
*   **Licenciamiento por Hardware ID**: Sistema de validación basado en el identificador único de hardware (Machine ID) para asegurar el despliegue autorizado del software.

## Arquitectura y Tecnologías

El sistema `El Bus del Sabor POS` se fundamenta en una **Arquitectura Monolítica Híbrida** construida sobre **Electron**. Esta elección permite combinar la riqueza de una aplicación de escritorio nativa con la flexibilidad del desarrollo web. La lógica de negocio y la interfaz de usuario residen en una única base de código, facilitando el desarrollo rápido y la gestión de dependencias.

*   **Electron**: Proporciona un entorno de ejecución multiplataforma para aplicaciones de escritorio, utilizando tecnologías web estándar (HTML, CSS, JavaScript). Esto asegura un alto rendimiento y una experiencia de usuario consistente.
*   **Node.js & Express**: Un servidor **Express** embebido en el proceso principal de Electron expone una API RESTful. Esta API es crucial para la comunicación interna y para servir el **Monitor de Cocina (KDS)** a dispositivos externos en la red local, garantizando baja latencia y operación offline.
*   **PostgreSQL**: Seleccionado como motor de base de datos relacional por su robustez, fiabilidad y capacidad para manejar transacciones ACID. Almacena de forma segura todos los datos de ventas, productos y usuarios.
*   **Vanilla JavaScript & CSS3**: La interfaz de usuario está desarrollada con JavaScript puro y CSS3, lo que permite un control granular sobre el rendimiento y la personalización del diseño, incluyendo efectos de *glassmorphism* y un diseño responsivo.

Esta arquitectura permite una operación autónoma y eficiente en entornos de punto de venta, donde la conectividad a internet puede ser intermitente, al mismo tiempo que sienta las bases para futuras integraciones y escalabilidad.

## Requisitos Previos (Prerequisites)

Para configurar y ejecutar el proyecto en un entorno de desarrollo local, asegúrese de tener instalados los siguientes componentes:

*   **Git**: Sistema de control de versiones.
    ```bash
    # Verificar instalación
    git --version
    ```
*   **Node.js**: Versión 18.x o superior. Incluye `npm` o `pnpm` para la gestión de paquetes.
    ```bash
    # Verificar instalación
    node -v
    npm -v
    ```
*   **PostgreSQL**: Versión 14.x o superior. Necesitará una instancia de PostgreSQL en ejecución y acceso a una base de datos.
    ```bash
    # Verificar instalación (ejemplo para sistemas basados en Debian/Ubuntu)
    sudo -u postgres psql -V
    ```
*   **pgAdmin (Opcional)**: Herramienta gráfica para la administración de bases de datos PostgreSQL.

## Guía de Instalación Rápida (Getting Started)

Siga estos pasos para levantar el entorno de desarrollo local:

1.  **Clonar el Repositorio**:
    ```bash
    git clone https://github.com/Juan-David-Idarraga/busdelsabor.git
    cd busdelsabor
    ```

2.  **Instalar Dependencias**:
    ```bash
    npm install
    # o si usa pnpm
    # pnpm install
    ```

3.  **Configurar Base de Datos PostgreSQL**:
    *   Cree una base de datos PostgreSQL con el nombre `busdelsabor`.
    *   Asegúrese de que las credenciales de conexión en `main.js` (línea 40: `user: 'postgres', host: 'localhost', database: 'busdelsabor', password: '12345678', port: 5432`) coincidan con su configuración local. **Nota**: Se recomienda encarecidamente migrar estas credenciales a variables de entorno para producción.

4.  **Ejecutar la Aplicación**:
    ```bash
    npm start
    ```
    La aplicación de escritorio Electron se iniciará. El servidor Express embebido estará escuchando en el puerto `3000`.

## Variables de Entorno (Environment Variables)

Para una configuración segura y flexible, se recomienda utilizar variables de entorno. Aunque actualmente las credenciales están *hardcoded*, el siguiente `.env.example` muestra la estructura deseada para futuras implementaciones:

```ini
# Configuración de la Base de Datos PostgreSQL
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=busdelsabor
DB_PASSWORD=your_db_password
DB_PORT=5432

# Clave de Acceso para Administrador (para funcionalidades sensibles)
ADMIN_PASSWORD=your_admin_password

# IDs de Máquinas Autorizadas (separadas por comas, para licenciamiento)
AUTHORIZED_MACHINE_IDS=id1,id2,id3
```

## Despliegue (Deployment)

Para el despliegue en producción de la aplicación de escritorio, se utiliza **Electron Builder**. Este paquete permite empaquetar y distribuir la aplicación para diferentes sistemas operativos (Windows, macOS, Linux).

Para generar un instalador para Windows:

```bash
npm run build
```

El resultado se encontrará en el directorio `dist/`.

---

**Desarrollado por Manus AI**
*Tech Lead & Developer Relations*
