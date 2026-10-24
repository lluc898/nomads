# codex.md — Instrucciones para OpenAI Codex

## Contexto del proyecto

**ViajerosHub** es una plataforma web y móvil para organizar viajes grupales. Los usuarios publican viajes —por ejemplo, “Palma de Mallorca a Turquía, julio”— con enlaces a vuelos, hoteles y actividades. Otros usuarios pueden unirse, chatear y comprar directamente en los proveedores mediante enlaces de afiliado.

El objetivo del negocio es generar ingresos por comisiones de afiliados, no vender billetes ni gestionar pagos.

## Stack

- Turborepo + pnpm
- Next.js 15+ / React 19 / TypeScript
- Tailwind CSS v4 + shadcn/ui
- Expo SDK 58 + React Native 0.88 + Expo Router + NativeWind
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
11. Cada módulo de producto se desarrolla en web y en la app móvil durante la misma iteración, compartiendo contratos y validaciones. Una excepción debe acordarse explícitamente.

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
- La búsqueda no pide cantidad de viajeros: cada cuenta busca una plaza para sí misma.
- En la app móvil, el buscador vive en Inicio y no tiene una pestaña independiente.
- La interfaz comparte i18n para `es`, `en`, `ca`, `fr`, `de`, `it`, `pt` y `nl`; la selección manual persistida prevalece sobre la detección inicial por país/IP.
- Usa índices PostgreSQL y consultas eficientes.
- Devuelve resultados paginados con filtros y orden.
- Origen y destino reutilizan el catálogo `countries`/`airports`; el origen exige país o aeropuerto y el destino admite además `anywhere` ("Cualquier lugar").
- La fuente mundial inicial es OurAirports. Se incluyen aeropuertos activos grandes, medianos, pequeños e hidroaeropuertos; no se muestran instalaciones cerradas, helipuertos ni balloonports.

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

## Perfil de viajero

- Cada viajero elige un `username` público, único y en minúsculas.
- El `username` queda fijado en el primer guardado y no se puede cambiar desde producto.
- Tras el primer inicio de sesión, el viajero debe completar obligatoriamente el perfil antes de acceder a las áreas privadas; como mínimo debe reservar un `username` disponible.
- La disponibilidad del `username` se muestra durante la edición, pero la restricción única de PostgreSQL es la garantía definitiva frente a condiciones de carrera.
- Un perfil completo requiere `username` y foto; esta condición se comprobará antes de crear o unirse a un viaje.
- La foto parte de la cuenta de Google y puede sustituirse subiendo JPEG, PNG o WebP desde el dispositivo.
- Las fotos subidas se validan por contenido, se convierten a WebP cuadrado sin metadatos y se guardan en almacenamiento persistente.
- Instagram es opcional, se normaliza en servidor y es el único enlace social del perfil MVP.
- El correo nunca forma parte del perfil público.

## Creación de viajes

- Crear un viaje exige perfil completo, origen y destino del catálogo mundial y fechas exactas de ida y vuelta.
- El título se deriva del destino; descripción, presupuesto, tamaño del grupo y privacidad son configurables.
- Un viaje puede tener hasta 20 enlaces de reserva, cada uno con nombre y tipo `flight` o `accommodation`.
- Solo se aceptan enlaces HTTPS sin credenciales. Se conserva la URL original y la URL afiliada por separado.
- La interfaz nunca enlaza directamente al proveedor: usa `/go/:id`, comprueba acceso, registra el clic con IP hasheada y redirige.
- Los viajes publicados se muestran en el buscador por las mismas claves de país/aeropuerto usadas al crearlos.

## Criterios de aceptación

- `pnpm typecheck`, `pnpm lint` y `pnpm test` pasan.
- La funcionalidad funciona en desktop y móvil.
- La interfaz web y la interfaz nativa consumen el mismo contrato de API y cubren el mismo flujo de producto cuando sea aplicable.
- Los estados de carga, error, vacío y éxito están cubiertos.
- La autorización está implementada en servidor.
- Si cambia el esquema, hay migración y datos de prueba coherentes.
- La UI sigue `design.md`.
