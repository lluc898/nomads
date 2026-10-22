# CLAUDE.md — ViajerosHub

Eres el agente de ingeniería principal de **ViajerosHub**, una plataforma para crear, descubrir y unirse a viajes grupales, con monetización mediante enlaces de afiliado.

Trabaja como un desarrollador senior full-stack: prioriza código simple, tipado, testeable, accesible y listo para producción. No inventes requisitos ni añadas dependencias sin necesidad.

## Producto

- Los usuarios crean anuncios de viaje: origen, destino, fechas exactas o flexibles, presupuesto, plazas, descripción y enlaces a vuelos/hoteles/actividades.
- Los viajes pueden ser **públicos** o **privados**.
- Los usuarios pueden solicitar unirse a un viaje privado; el creador aprueba o rechaza.
- Cada viaje tiene un chat grupal para participantes aprobados.
- Los enlaces de reserva se transforman en enlaces de afiliado mediante reglas del backend.
- El buscador permite buscar por origen/destino —ciudad, región o país—, fechas concretas o mes completo, y “sin destino”.

## Stack obligatorio

- **Monorepo:** Turborepo + pnpm.
- **Web:** Next.js 15+ con App Router, TypeScript, Tailwind CSS v4 y shadcn/ui.
- **Móvil:** Expo + React Native + Expo Router + TypeScript + NativeWind.
- **Backend inicial:** Next.js Route Handlers y Server Actions.
- **Base de datos:** PostgreSQL con Drizzle ORM.
- **Validación:** Zod.
- **Autenticación:** Auth.js o Clerk.
- **Colas y caché:** Redis + BullMQ.
- **Emails:** Resend o Postmark.
- **Testing:** Vitest para unidades, Playwright para E2E web.
- **Calidad:** ESLint, Prettier, TypeScript estricto, Husky y lint-staged.

## Estructura del monorepo

```text
apps/
  web/        # Next.js: SEO, buscador, anuncios, afiliados
  mobile/     # Expo: feed, viaje, chat, notificaciones
packages/
  database/   # Esquema Drizzle, migraciones y seeds
  shared/     # Tipos, constantes, validaciones Zod y utilidades
  api-client/ # Cliente tipado para web y móvil
  ui/         # Tokens y componentes compartidos cuando aplique
```

## Reglas de arquitectura

1. **La web y la app móvil nunca acceden directamente a PostgreSQL.** Consumen la API o Server Actions.
2. **La autorización se valida siempre en el servidor.** Nunca confíes en que la UI oculte contenido privado.
3. **Los enlaces de afiliado se generan y validan solo en el backend.** El frontend recibe una URL corta interna, por ejemplo `/go/:code`.
4. Guarda siempre la URL original y la URL monetizada por separado en `trip_links`.
5. Registra cada clic de afiliado con: enlace, viaje, usuario opcional, campaña, user agent, IP hasheada y fecha.
6. No almacenes datos de pago ni gestiones reservas: el usuario compra en el proveedor externo.
7. Toda mutación importante debe validar entrada con Zod y comprobar permisos.
8. Usa transacciones para operaciones que afecten a varias tablas.
9. Evita lógica de negocio en componentes React; colócala en `packages/shared`, servicios o repositorios.
10. No introduzcas microservicios hasta que haya una necesidad real de escalado.

## Modelo de datos base

Tablas mínimas:

- `users`
- `trips`
- `trip_locations`
- `trip_links`
- `trip_participants`
- `conversations`
- `conversation_participants`
- `messages`
- `affiliate_clicks`
- `affiliate_rules`
- `geo_places`
- `reports`

Campos clave de `trips`:

```ts
{
  id: uuid
  creatorId: uuid
  title: string
  slug: string
  originPlaceId: uuid | null
  destinationPlaceId: uuid | null
  departureDate: date | null
  returnDate: date | null
  flexibleMonth: date | null
  visibility: 'public' | 'private'
  status: 'draft' | 'published' | 'closed' | 'archived'
  maxParticipants: int | null
  budget: numeric | null
  currency: string
  description: text
}
```

## Búsqueda

- Usa PostgreSQL Full-Text Search y `pg_trgm` en el MVP.
- Al crear un viaje, guarda la jerarquía geográfica: ciudad -> provincia/isla -> comunidad/región -> país.
- Una búsqueda por “España” debe incluir todos los viajes cuyo origen esté dentro de España.
- Una búsqueda por “sin destino” debe devolver viajes de cualquier destino.
- Para fechas flexibles, busca por rango del mes seleccionado.
- Ordena por relevancia, fecha de salida, precio indicado, popularidad o fecha de creación.
- Añade Meilisearch solo cuando el volumen o las necesidades de autocomplete lo justifiquen.

## Privacidad y permisos

- **Viaje público:** visible sin sesión; los enlaces pueden verse; el chat requiere registro y participación aprobada.
- **Viaje privado:** el listado puede mostrar información mínima; detalles, enlaces, participantes y chat requieren sesión y aprobación.
- Roles: `owner`, `trip_admin`, `participant`, `authenticated_visitor`, `anonymous`.
- Implementa middleware/guards reutilizables: `requireAuth`, `requireTripAccess`, `requireTripOwner`, `requireParticipant`.

## Afiliados

- Mantén una tabla `affiliate_rules` con dominio, proveedor, red, patrón de URL, plantilla y parámetros de tracking.
- Detecta el proveedor por dominio; no apliques transformaciones genéricas.
- Si un dominio no tiene regla, guarda el enlace original y márcalo como `pending_review`.
- Nunca modifiques el destino final sin una regla verificada.
- Muestra un aviso visible de “Enlace de afiliado” o “Publicidad”.
- No prometas precio final, disponibilidad ni comisión concreta al usuario.

## Seguridad

- HTTPS obligatorio.
- Rate limiting en login, registro, creación de viajes, mensajes y generación de enlaces.
- Sanitiza y valida todas las URLs externas.
- Bloquea `javascript:`, `data:` y dominios no permitidos en enlaces introducidos por usuarios.
- Usa cookies `httpOnly`, `secure` y `sameSite` donde corresponda.
- Hashea IPs antes de almacenarlas.
- Nunca expongas secretos en el cliente.
- Añade cabeceras CSP, HSTS, X-Frame-Options y Referrer-Policy.

## UX y accesibilidad

- Diseño limpio, rápido y orientado a conversión, inspirado en Skyscanner y Chollometro.
- Mobile-first.
- Contraste mínimo WCAG AA.
- Navegación por teclado y foco visible.
- Formularios con errores claros y estados de carga.
- Textos en español de España, tono cercano pero profesional.
- No uses dark patterns ni botones engañosos.

## Flujo de trabajo

1. Lee el contexto relevante antes de modificar código.
2. Propón un plan breve para tareas grandes.
3. Implementa cambios pequeños y revisables.
4. Ejecuta typecheck, lint y tests antes de dar una tarea por terminada.
5. No dejes TODOs sin explicación.
6. No rompas la compatibilidad de la API sin migración y versión.
7. Documenta decisiones importantes en `docs/` o en el PR.

## Comandos

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm db:migrate
pnpm db:studio
```

## Definición de terminado

- TypeScript sin errores.
- Lint y tests en verde.
- Permisos comprobados en servidor.
- Migración de base de datos incluida si cambia el esquema.
- Estados de carga, error y vacío implementados.
- Accesible en teclado y móvil.
- Sin secretos ni datos sensibles en el código.
