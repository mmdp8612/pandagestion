# Contexto de PandaGestion

## Objetivo

PandaGestion es una aplicación web de uso personal y sin autenticación para controlar gastos mensuales. Permite saber cuánto se debe, cuánto se pagó, qué está vencido y cómo evolucionan los gastos entre meses.

## Stack acordado

- Next.js 16 con App Router y JavaScript.
- React 19.
- HTML semántico y Tailwind CSS 4.
- SQLite mediante `better-sqlite3`.
- SweetAlert2 para confirmaciones y avisos.
- Recharts para gráficos; Lucide React para iconografía.

## Modelo funcional

La aplicación separa **conceptos** de **gastos mensuales**:

- Un concepto es una plantilla reutilizable: nombre, categoría, importe habitual, día de vencimiento y estado activo/archivado.
- Un gasto es la fotografía de ese concepto en un mes concreto. Guarda nombre y categoría como snapshot, importe, fecha, estado, fecha de pago y notas.
- La combinación concepto/mes es única para evitar duplicados.
- “Generar mes” crea los gastos faltantes a partir de todos los conceptos activos.
- Editar un concepto no cambia gastos históricos.
- Un concepto ya utilizado se archiva en vez de eliminarse, preservando integridad histórica.

Los importes se almacenan en centavos enteros para evitar errores de coma flotante.

## Base de datos

Archivo predeterminado: `data/panda-gestion.db`. Puede modificarse con `DATABASE_PATH`.

Tablas:

- `concepts`: plantillas de gastos habituales.
- `expenses`: gastos mensuales y estados de pago.

La conexión activa WAL, claves foráneas y `busy_timeout`. El esquema se crea automáticamente al primer acceso. El endpoint `POST /api/reset` elimina todos los datos y reinicia las secuencias; la UI exige escribir `REINICIAR`.

## Rutas de interfaz

- `/`: dashboard del período elegido.
- `/gastos`: gestión mensual y generación automática.
- `/conceptos`: altas, cambios, archivo y baja de conceptos.
- `/historial`: totales y comparación con el período anterior.
- `/configuracion`: información del almacenamiento y reinicio total.

## API interna

- `GET/POST /api/concepts`
- `PUT/DELETE /api/concepts/:id`
- `GET/POST /api/expenses`
- `PATCH/DELETE /api/expenses/:id`
- `POST /api/expenses/generate`
- `GET /api/stats`
- `GET /api/history`
- `POST /api/reset`

## Decisiones visuales

Interfaz responsive con sidebar oscuro, acento violeta, tarjetas claras y estados semánticos: verde para pagado, ámbar para pendiente y rojo para vencido/destructivo. Los componentes compartidos están en `components/ui`.

## Próximas mejoras posibles

- Presupuestos y alertas por categoría.
- Gastos variables no asociados a un concepto recurrente.
- Exportación/importación CSV y respaldos desde la interfaz.
- Moneda configurable.
- Cuotas de tarjeta y gastos recurrentes con frecuencia distinta de mensual.
- Autenticación si la aplicación pasa a ser multiusuario.
