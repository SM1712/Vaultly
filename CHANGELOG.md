# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [Rework Update] - 2026-01-11

### Metas (Goals) Rework
Se ha rediseñado completamente la lógica y la interfaz de las Metas de Ahorro para ofrecer una experiencia más flexible y orientada a resultados.

#### Funcionalidades Nuevas
- **Cuotas Dinámicas Deterministas**:
  - Implementación de una curva de pagos variable única para cada meta (basada en su ID).
  - Los pagos ya no son lineales; varían mes a mes para simular fluctuaciones realistas.
  - Al realizar **adelantos** de pago, la curva futura se escala proporcionalmente hacia abajo, reduciendo el esfuerzo mensual requerido sin perder la variabilidad.
- **Botón de Adelanto Inteligente**:
  - El botón de "Pagar Cuota" detecta automáticamente si la cuota del mes actual ya fue cubierta.
  - Si está cubierta, cambia a modo **"Adelantar"**, permitiendo inyectar capital extra que reduce directamente las cuotas futuras.
- **Switch de Ahorro Dinámico**:
  - Nuevo control (icono de Rayo ⚡) en cada tarjeta de meta para activar/desactivar el cálculo dinámico individualmente.
- **Alertas de "Ola Grande"**:
  - Sistema de advertencia que detecta si la cuota del próximo mes subirá drásticamente (>20%).
  - Muestra un aviso visual para recomendar moderación en los gastos del mes actual.
- **Interfaz Mejorada**:
  - Visualización clara del progreso de cuotas (ej: "Cuota 5/12").
  - Indicadores de tendencia (flechas) que muestran si la próxima cuota subirá o bajará.
  - Modal de confirmación de eliminación con diseño personalizado (eliminado `window.confirm`).

#### Mejoras Técnicas
- Refactorización profunda de `useGoals` para soportar proyecciones y simulaciones de pagos.
- Optimización de cálculos de cuotas para soportar estrategias 'Spread' (Redistribución) y 'Catch Up' (Recuperación) de manera más robusta.

### Créditos y Deudas (Rework Previo)
Se ha consolidado el módulo de Créditos con herramientas financieras avanzadas para un control total de deudas.
- **Modo Dual de Creación**:
  - **Modo Simple**: Para préstamos informales donde solo conoces la cuota y el plazo.
  - **Modo Avanzado**: Calculadora financiera completa con sistema de **Amortización Francesa**.
- **Ingeniería Inversa de Tasas**:
  - Si conoces el monto del préstamo y la cuota, el sistema calcula automáticamente la **Tasa de Interés Implícita** usando algoritmos de búsqueda binaria.
- **Gestión de Pagos Integrada**:
  - Los pagos a capital generan automáticamente transacciones de gasto categorizadas, manteniendo el balance global sincronizado.

### Adaptabilidad (Responsive Design)
- Todas las nuevas funcionalidades han sido diseñadas bajo el paradigma **Mobile-First**.
- Las tarjetas de Metas y Créditos se adaptan fluidamente a pantallas de escritorio, tablets y móviles.
- Los modales y formularios son completamente táctiles y responsivos.
