# PandaGestion

Aplicación web personal para registrar conceptos de gastos, generar obligaciones mensuales, marcar pagos y comparar períodos mediante un dashboard estadístico.

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

## Comandos

- `npm run dev`: servidor de desarrollo.
- `npm run build`: compilación optimizada.
- `npm run start`: servidor de producción (requiere build previo).
- `npm run lint`: análisis estático.
- `npm run db:seed`: datos ficticios opcionales.

## Funciones principales

- Conceptos reutilizables con categoría, importe habitual y día de vencimiento.
- Generación automática de los gastos de un mes sin duplicados.
- Ajuste del importe, vencimiento y notas de cada período.
- Estados pagado/pendiente y señalización de vencidos.
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
