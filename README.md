# ViajerosHub

Plataforma web y móvil para descubrir, crear y compartir viajes en grupo.

## Requisitos

- Node.js 22.13 o superior
- pnpm 10
- PostgreSQL y Redis (cuando se active el backend persistente)
- Expo Go compatible con SDK 58 para probar la app móvil

## Primer arranque

```bash
corepack pnpm install
corepack pnpm dev:web
```

Para la app móvil:

```bash
corepack pnpm dev:mobile
```

Escanea el QR desde Expo Go. Si el móvil no alcanza el ordenador por LAN, ejecuta
`corepack pnpm --filter @viajeroshub/mobile start --tunnel`.

## Autenticación

Auth.js usa Google OAuth y sesiones persistentes en PostgreSQL. Copia el archivo
`.env.example` de la raíz a `.env.local` y configura `DATABASE_URL`, `AUTH_SECRET`,
`AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET`.

En la app, el mismo acceso de Google se completa en el navegador y vuelve a Expo
mediante un código PKCE de un solo uso. La sesión nativa se guarda en SecureStore;
no se exponen cookies ni secretos de OAuth en el bundle.

En Google Cloud, registra estas URLs de callback:

- Local: `http://localhost:3000/api/auth/callback/google`
- Producción: `https://<tu-dominio>/api/auth/callback/google`

Después aplica la migración inicial:

```bash
corepack pnpm db:migrate
```

## Despliegue

La configuración de `deploy/compose.yml` crea una web standalone, PostgreSQL y
una tarea de migración. La web se expone únicamente en `127.0.0.1:3010` y en la
red de Nginx Proxy Manager como `viajeroshub-web:3000`.

Para mantener Expo disponible, inicia el perfil móvil con
`docker compose --profile mobile up -d --build mobile-dev`. El servicio usa el
túnel autenticado de Expo SDK 58 para que Expo Go pueda abrirlo aunque la red
local bloquee el descubrimiento. Requiere `EXPO_TOKEN` en `deploy/.env`. Un
watchdog comprueba tanto Metro como el túnel público y reinicia el servicio si
Expo devuelve errores 502 de forma continuada.

## Estructura

- `apps/web`: web pública y API con Next.js App Router.
- `apps/mobile`: app Expo/React Native.
- `packages/shared`: contratos Zod, tipos y lógica compartida.
- `packages/database`: esquema Drizzle y acceso futuro a PostgreSQL.
- `packages/api-client`: cliente HTTP tipado para web y móvil.
- `packages/ui`: tokens de diseño compartidos.

Consulta [docs/architecture.md](docs/architecture.md) para las decisiones iniciales.
