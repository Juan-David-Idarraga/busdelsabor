# El Bus del Sabor POS

## Sistema de Gestión Integral para Punto de Venta (POS) y Cocina

Este proyecto representa una solución tecnológica robusta diseñada para optimizar la operación de venta y producción del restaurante **El Bus del Sabor**. Desarrollada por **Technology of Jota** y liderada por **Juan Idarraga**, esta plataforma centraliza la toma de pedidos, la gestión de caja, la sincronización con cocina en tiempo real y el control de pedidos vía WhatsApp, garantizando una operación fluida y un control administrativo riguroso.

## Visión General del Proyecto

`El Bus del Sabor POS` es una aplicación de escritorio multiplataforma construida con **Electron**, que integra una interfaz de usuario táctil de alto rendimiento con un backend local basado en **Node.js** y **PostgreSQL**. La arquitectura incluye un servidor **Express** embebido que permite la conexión de dispositivos externos (tablets/móviles) como monitores de cocina (KDS) dentro de la red local, eliminando la latencia y asegurando la continuidad operativa incluso sin conexión a internet externa.

## Características Clave

*   **Terminal de Ventas Táctil**: Interfaz optimizada para pantallas touch con categorías dinámicas, gestión de extras y flujos de personalización de productos.
*   **Monitor de Cocina (KDS) Distribuido**: Sistema de gestión de comandas accesible desde cualquier navegador en la red local, con notificaciones sonoras y estados visuales de preparación.
*   **Integración con WhatsApp**: Módulo dedicado para la recepción, edición y gestión de pedidos provenientes de canales digitales, integrándolos directamente al flujo de caja y cocina.
*   **Control de Caja y Turnos**: Sistema detallado de apertura, cuadratura y cierre de turnos, con desglose por métodos de pago (Efectivo, Débito, Transferencia) y conciliación de apps de delivery (PedidosYa, Uber Eats).
*   **Impresión Térmica Profesional**: Integración nativa con impresoras de 58mm/80mm para la emisión de comandas y comprobantes de venta.
*   **Seguridad y Licenciamiento**: Sistema de validación por Hardware ID (MachineID) para control de despliegue y roles de usuario diferenciados (Administrador/Cajero).

## Stack Tecnológico

| Categoría | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Framework Base** | Electron | Entorno para aplicaciones de escritorio utilizando tecnologías web (HTML5, CSS3, JS). |
| **Motor de Base de Datos** | PostgreSQL | Sistema de gestión de base de datos relacional para persistencia de ventas e inventario. |
| **Servidor Interno** | Node.js & Express | Servidor embebido para comunicación entre el POS y los monitores de cocina. |
| **Interfaz de Usuario** | Vanilla JS & CSS3 | UI personalizada con variables CSS, efectos de glassmorphism y diseño responsivo. |
| **Hardware Integration** | node-thermal-printer | Librería para comunicación directa con periféricos de impresión térmica. |
| **Seguridad** | node-machine-id | Generación de identificadores únicos de hardware para licenciamiento. |

## Arquitectura del Sistema

La solución opera bajo un modelo de **Arquitectura Monolítica Híbrida**:

1.  **Proceso Principal (Electron Main)**: Gestiona el ciclo de vida de la aplicación, la seguridad por hardware, y la conexión persistente con la base de datos PostgreSQL.
2.  **Proceso de Renderizado (UI)**: Interfaz de usuario construida con estándares modernos, comunicada con el proceso principal a través de un `Context Bridge` seguro.
3.  **Servidor de Red Local (Express)**: Expone una API REST y sirve el monitor de cocina de forma estática, permitiendo que tablets se conecten a la IP del servidor POS.
4.  **Capa de Datos**: Consultas SQL directas con soporte para transacciones ACID, asegurando la integridad de los registros financieros.

## Instalación y Configuración (Para Desarrollo Local)

Para ejecutar este proyecto localmente, sigue los siguientes pasos:

1.  **Prerrequisitos**:
    *   Node.js (v18 o superior)
    *   PostgreSQL (v14 o superior) configurado con una base de datos llamada `busdelsabor`.
    *   Impresora térmica (opcional para pruebas).

2.  **Clonar el Repositorio**:
    ```bash
    git clone https://github.com/Juan-David-Idarraga/busdelsabor.git
    cd busdelsabor
    ```

3.  **Instalar Dependencias**:
    ```bash
    npm install
    ```

4.  **Configurar Base de Datos**:
    Asegúrate de que PostgreSQL esté corriendo y que las credenciales en `main.js` coincidan con tu configuración local.

5.  **Ejecutar la Aplicación**:
    ```bash
    npm start
    ```

## Autor y Empresa

Este proyecto ha sido desarrollado por:

**Juan Idarraga**
*   **Empresa**: Technology of Jota
*   **Portafolio**: [LinkedIn Profile](https://www.linkedin.com/in/juan-david-idarraga-11088b387/)

---
