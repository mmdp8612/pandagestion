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

- Un concepto identifica y clasifica un gasto: nombre, categoría y estado activo/archivado.
- Un gasto es la fotografía de ese concepto en un mes concreto. Guarda nombre y categoría como snapshot, importe, fecha de cierre opcional, vencimiento, estado, fecha de pago y notas.
- La combinación concepto/mes es única para evitar duplicados.
- Los gastos se cargan individualmente. El importe, la fecha de cierre opcional y el vencimiento pertenecen exclusivamente al gasto.
- Editar un concepto no cambia gastos históricos.
- Un concepto ya utilizado se archiva en vez de eliminarse, preservando integridad histórica.

Los importes se almacenan en centavos enteros para evitar errores de coma flotante.

## Base de datos

Archivo predeterminado: `data/panda-gestion.db`. Puede modificarse con `DATABASE_PATH`.

En Docker, `DATABASE_PATH` apunta a `/app/data/panda-gestion.db` y el directorio está respaldado por el volumen persistente `pandagestion_data`. La imagen usa el modo `standalone` de Next.js y se ejecuta con el usuario no privilegiado `nextjs` (UID 1001).

La conexión SQLite se inicializa de forma diferida en la primera petición. Esto evita que los workers paralelos de `next build` intenten crear o configurar la misma base durante la compilación de la imagen.

Tablas:

- `concepts`: nombres y categorías disponibles para identificar gastos.
- `expenses`: gastos mensuales y estados de pago.
- `categories`: categorías administrables con nombre, color y estado.

La conexión activa WAL, claves foráneas y `busy_timeout`. El esquema se crea automáticamente al primer acceso. El endpoint `POST /api/reset` elimina todos los datos y reinicia las secuencias; la UI exige escribir `REINICIAR`.

## Rutas de interfaz

- `/`: dashboard del período elegido.
- `/gastos`: carga y gestión individual de gastos mensuales.
- `/conceptos`: altas, cambios, archivo y baja de conceptos.
- `/categorias`: administración de categorías.
- `/historial`: totales y comparación con el período anterior.
- `/configuracion`: información del almacenamiento y reinicio total.

## API interna

- `GET/POST /api/concepts`
- `PUT/DELETE /api/concepts/:id`
- `GET/POST /api/categories`
- `PUT/DELETE /api/categories/:id`
- `GET/POST /api/expenses`
- `PATCH/DELETE /api/expenses/:id`
- `GET /api/stats`
- `GET /api/history`
- `POST /api/reset`

## Decisiones visuales

Interfaz responsive con sidebar oscuro, acento violeta, tarjetas claras y estados semánticos: verde para pagado, ámbar para pendiente y rojo para vencido/destructivo. Los componentes compartidos están en `components/ui`.

## Próximas mejoras posibles

- Presupuestos y alertas por categoría.
- Gastos variables no asociados a un concepto.
- Exportación/importación CSV y respaldos desde la interfaz.
- Moneda configurable.
- Cuotas de tarjeta y gastos recurrentes con frecuencia distinta de mensual.
- Autenticación si la aplicación pasa a ser multiusuario.
