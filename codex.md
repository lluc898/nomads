# codex.md — Instrucciones para OpenAI Codex

## Contexto del proyecto

**ViajerosHub** es una plataforma web y móvil para organizar viajes grupales. Los usuarios publican viajes —por ejemplo, “Palma de Mallorca a Turquía, julio”— con enlaces a vuelos, hoteles y actividades. Otros usuarios pueden unirse, chatear y comprar directamente en los proveedores mediante enlaces de afiliado.

El objetivo del negocio es generar ingresos por comisiones de afiliados, no vender billetes ni gestionar pagos.

## Stack

- Turborepo + pnpm
- Next.js 15+ / React 19 / TypeScript
- Tailwind CSS v4 + shadcn/ui
- Expo + React Native + Expo Router + NativeWind
- PostgreSQL + Drizzle ORM
- Zod
- Redis + BullMQ
- Vitest + Playwright
- ESLint + Prettier

## Reglas principales

1. Usa TypeScript estricto en todo el monorepo.
2. Comparte tipos, validaciones y lógica en `packages/shared`.
3. La web está en `apps/web`; la app móvil en `apps/mobile`.
4. Usa Drizzle para todas las consultas SQL.
5. Valida toda entrada externa con Zod.
6. Aplica permisos en el backend, nunca solo en la interfaz.
7. Los enlaces de afiliado se normalizan exclusivamente en el servidor.
8. Guarda URL original y URL de afiliado por separado.
9. Registra clics de afiliado para analítica y detección de fraude.
10. No añadas dependencias sin justificarlo.

## Estructura esperada

```text
apps/web
apps/mobile
packages/database
packages/shared
packages/api-client
packages/ui
```

## Tareas habituales

### Crear una feature

1. Define tipos y esquema Zod en `packages/shared`.
2. Crea o modifica el esquema Drizzle en `packages/database`.
3. Genera migración idempotente.
4. Implementa servicio/repositorio con permisos.
5. Expón endpoint o Server Action.
6. Implementa UI en web y, si aplica, en móvil.
7. Añade tests de unidad y, si es una ruta crítica, E2E.

### Convertir un enlace de afiliado

1. Recibe URL del usuario.
2. Valida protocolo HTTPS y dominio.
3. Busca regla en `affiliate_rules` por dominio.
4. Aplica plantilla y parámetros de tracking.
5. Crea registro en `trip_links` con URL original y URL final.
6. Devuelve URL corta interna `/go/:code`.
7. Al hacer clic, registra el evento y redirige con 302.

### Buscador

- Origen y destino admiten ciudad, región o país.
- Debe funcionar la búsqueda con destino vacío.
- Debe funcionar la búsqueda por mes completo.
- Usa índices PostgreSQL y consultas eficientes.
- Devuelve resultados paginados con filtros y orden.

## Estilo de código

- Componentes pequeños y con una responsabilidad clara.
- Server Components por defecto en Next.js; usa `"use client"` solo cuando haga falta.
- Nombres descriptivos en inglés para código y español para textos de UI.
- Evita `any`.
- Prefiere funciones puras y módulos testables.
- Maneja errores explícitamente; no uses try/catch vacíos.
- No uses comentarios obvios; documenta solo decisiones no evidentes.

## Seguridad

- Nunca confíes en datos del cliente.
- Valida sesión y rol en cada endpoint protegido.
- Escapa o valida URLs externas.
- Aplica rate limiting a acciones sensibles.
- No registres datos personales innecesarios.
- Cumple RGPD: consentimiento de cookies, política de privacidad y minimización de datos.

## Criterios de aceptación

- `pnpm typecheck`, `pnpm lint` y `pnpm test` pasan.
- La funcionalidad funciona en desktop y móvil.
- Los estados de carga, error, vacío y éxito están cubiertos.
- La autorización está implementada en servidor.
- Si cambia el esquema, hay migración y datos de prueba coherentes.
- La UI sigue `design.md`.
