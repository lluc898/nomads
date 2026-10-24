# Arquitectura inicial

## Decisiones

- Monorepo con pnpm y Turborepo para compartir contratos sin publicar paquetes.
- Next.js actúa inicialmente como web, BFF y API. No se separará un servicio hasta que exista una necesidad medible.
- Expo queda fijado a SDK 58 para mantener compatibilidad con Expo Go en iOS.
- Los datos visibles en el prototipo viven en `@viajeroshub/shared`; es una frontera temporal que permite construir UI y contratos antes de conectar PostgreSQL.
- `packages/database` solo se importa desde código de servidor. Las aplicaciones consumen API o Server Actions.
- Las URLs introducidas por viajeros se validarán y monetizarán en servidor. Nunca se sobrescribirá la URL original.
- Auth.js gestiona Google OAuth con sesiones de base de datos mediante el adaptador oficial de Drizzle. Las páginas y APIs protegidas usan guards separados para devolver redirecciones o respuestas 401 según el contexto.
- La app nativa inicia Google OAuth en el navegador mediante Auth.js y recibe un código de un solo uso protegido con PKCE. Lo canjea por una sesión móvil opaca de 30 días, cuyo token se guarda en SecureStore y cuyo hash es lo único persistido en PostgreSQL.
- `packages/api-client` contiene el contrato HTTP tipado que consume Expo. La app nunca importa `packages/database` ni accede directamente a PostgreSQL.
- El primer acceso nativo bloquea la navegación hasta guardar un `username` único y una foto. La subida usa el mismo servicio de validación, recorte WebP y almacenamiento que la web.
- El catálogo geográfico usa una instantánea versionada de OurAirports: países y aeropuertos activos se importan de forma idempotente y se buscan mediante PostgreSQL `pg_trgm`. Los identificadores públicos (`country:ES`, `airport:123` y `anywhere`) son compartidos por búsqueda y creación de viajes.

## Próximos cortes verticales

1. Entorno local con PostgreSQL/Redis y primera migración.
2. Autenticación y modelo de permisos.
3. Crear y publicar un viaje.
4. Búsqueda real por jerarquía geográfica y fechas.
5. Solicitudes de unión, participantes y chat.
6. Reglas y analítica de afiliación.
