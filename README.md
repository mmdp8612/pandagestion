# PandaGestion

Aplicación web personal para registrar gastos mensuales, marcar pagos y comparar períodos mediante un dashboard estadístico.

## Requisitos

- Node.js 20.9 o superior
- npm

## Desarrollo

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). La base SQLite se crea automáticamente en `data/panda-gestion.db`.

Para cargar datos ficticios con los que explorar los gráficos:

```bash
npm run db:seed
```

El seed solo se ejecuta si no existen conceptos y nunca sobrescribe datos existentes.

## Producción con Node.js

```bash
npm install
npm run build
npm run start
```

El servidor escucha en el puerto 3000. Se puede cambiar con la variable `PORT`, por ejemplo en PowerShell:

```powershell
$env:PORT=8080
npm run start
```

Para producción, el proceso Node debe ejecutarse en una máquina o contenedor con almacenamiento persistente. SQLite no es compatible con despliegues serverless cuyo sistema de archivos sea efímero. Configurá `DATABASE_PATH` si querés ubicar la base en otro volumen:

```env
DATABASE_PATH=/ruta/persistente/panda-gestion.db
```

Antes de actualizar o migrar el servidor, respaldá el archivo `.db`. Se recomienda colocar un proxy HTTPS (por ejemplo, Caddy o Nginx) delante del proceso y administrarlo con un supervisor como PM2 o systemd.

## Producción con Docker

La imagen usa la salida `standalone` de Next.js, ejecuta la aplicación con un usuario sin privilegios y guarda SQLite en el volumen persistente `pandagestion_data`.

En el VPS, cloná el repositorio y ejecutá:

```bash
git clone https://github.com/mmdp8612/pandagestion.git
cd pandagestion
docker compose up -d --build
```

Comprobá el estado y consultá los logs:

```bash
docker compose ps
docker compose logs -f pandagestion
```

Por seguridad, el puerto se publica sólo en `127.0.0.1:3000`. Esta dirección está lista para usarse como destino de un proxy inverso Nginx o Caddy con HTTPS y autenticación. Para exponer temporalmente el puerto a la red, creá un archivo `.env`:

```env
PANDA_BIND_ADDRESS=0.0.0.0
PANDA_PORT=3000
```

Como la aplicación todavía no tiene inicio de sesión, no se recomienda exponerla públicamente sin protección adicional.

Para detenerla sin eliminar los datos:

```bash
docker compose down
```

No agregues `-v` al comando anterior: esa opción eliminaría el volumen de SQLite.

### Actualizar el contenedor

```bash
git pull
docker compose up -d --build
docker image prune -f
```

### Respaldar SQLite

Detené brevemente la aplicación para obtener una copia consistente y copiá la base desde el contenedor:

```bash
mkdir -p backups
docker compose stop pandagestion
docker cp pandagestion:/app/data/panda-gestion.db ./backups/panda-gestion.db
docker compose start pandagestion
```

El volumen `pandagestion_data` sobrevive a reconstrucciones y reemplazos del contenedor.

## Comandos

- `npm run dev`: servidor de desarrollo.
- `npm run build`: compilación optimizada.
- `npm run start`: servidor de producción (requiere build previo).
- `npm run lint`: análisis estático.
- `npm run db:seed`: datos ficticios opcionales.

## Funciones principales

- Conceptos administrables con nombre y categoría.
- Importe, vencimiento y fecha de cierre opcional cargados individualmente en cada gasto.
- Categorías administrables con nombre, color y estado activo/archivado.
- Carga y ajuste del importe, cierre, vencimiento y notas de cada período.
- Estados pagado/pendiente y señalización de vencidos.
- Días restantes al vencimiento y orden por concepto, cierre o vencimiento.
- Dashboard con totales, progreso, categorías y evolución de seis meses.
- Historial comparativo mensual.
- Reinicio total de la base desde Configuración, protegido por confirmación SweetAlert2.

## Estructura

- `app/`: páginas y endpoints HTTP de Next.js.
- `components/`: componentes visuales y pantallas interactivas.
- `lib/repositories/`: acceso a datos y consultas estadísticas.
- `lib/db.js`: conexión, configuración y creación del esquema SQLite.
- `data/`: archivo local de base de datos (ignorado por Git).
- `CONTEXTO.md`: contexto funcional y técnico para próximas sesiones.
