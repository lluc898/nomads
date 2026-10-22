# design.md — Sistema de diseño de ViajerosHub

## Objetivo

Crear una interfaz clara, rápida y confiable, inspirada en la densidad útil de **Skyscanner** y la orientación a ofertas de **Chollometro**, pero con identidad propia: una plataforma social para encontrar compañeros de viaje y planes reales.

Principios:

1. **Claridad antes que decoración.**
2. **Mobile-first.**
3. **Velocidad percibida.**
4. **Confianza y transparencia.**
5. **Accesibilidad WCAG AA.**

## Herramientas y agentes de diseño

Usa agentes y herramientas actuales que funcionen bien en 2026:

- **Claude Code:** arquitectura, refactorizaciones, revisión de código y tareas multiarchivo.
- **OpenAI Codex:** tareas paralelas, generación de componentes y revisión asistida.
- **Cursor:** iteración rápida de UI dentro del editor.
- **v0:** prototipado inicial de pantallas web con shadcn/ui y Tailwind.
- **shadcn/ui:** base de componentes accesibles, personalizables y reconocida por los agentes de código.
- **Tailwind CSS v4:** sistema de utilidades para web.
- **NativeWind:** sintaxis Tailwind-compatible para Expo/React Native.
- **Storybook:** documentación visual de componentes web.
- **Figma Make o Motiff:** exploración rápida de layouts cuando sea necesario.

Claude Code destaca en trabajo autónomo y multiarchivo; Codex encaja bien con flujos OpenAI y tareas paralelas; Cursor es especialmente cómodo para iterar UI en el editor. [web:47][web:50][web:56] shadcn/ui y Tailwind son una base habitual para sistemas de diseño de startups y son bien entendidos por herramientas como Claude, Cursor y v0. [web:49] Para móvil, NativeWind permite reutilizar una sintaxis similar a Tailwind en React Native. [web:48][web:51][web:60]

## Identidad visual

### Nombre tentativo

**ViajerosHub**

Tagline:

> Encuentra gente para tu próximo viaje.

### Personalidad

- Cercana, práctica, moderna y confiable.
- No corporativa ni excesivamente “startup”.
- Optimista, pero sin promesas exageradas.

### Paleta

| Token | Color | Uso |
|---|---|---|
| `--brand-500` | `#0B6EFD` | Acciones principales, enlaces, CTAs |
| `--brand-600` | `#0857C9` | Hover y estados activos |
| `--brand-50` | `#EAF3FF` | Fondos suaves y badges |
| `--accent-500` | `#FF6B35` | Ofertas, precios destacados, urgencia controlada |
| `--success-500` | `#16A34A` | Confirmaciones y plazas disponibles |
| `--warning-500` | `#F59E0B` | Avisos |
| `--danger-500` | `#DC2626` | Errores y acciones destructivas |
| `--neutral-900` | `#0F172A` | Texto principal |
| `--neutral-600` | `#475569` | Texto secundario |
| `--neutral-100` | `#F8FAFC` | Fondos |
| `--surface` | `#FFFFFF` | Tarjetas y paneles |

No uses naranja para acciones primarias: resérvalo para ofertas, precios o etiquetas de ahorro.

### Tipografía

- Web: **Inter** o **Geist Sans**.
- Móvil: fuente del sistema o la misma fuente si el rendimiento lo permite.
- Escala:

```text
Display: 32–40px / 700
H1: 28–32px / 700
H2: 22–24px / 650
H3: 18–20px / 600
Body: 16px / 400
Small: 14px / 400
Caption: 12–13px / 500
```

- Line-height: 1.4 para cuerpo, 1.2 para títulos.
- Máximo de ancho de lectura: 70–75 caracteres.

### Radios, sombras y espaciado

- Radios: `8px` inputs, `12px` botones, `16px` tarjetas, `24px` modales.
- Espaciado base: escala de 4px: `4, 8, 12, 16, 24, 32, 48, 64`.
- Sombras suaves y discretas; evita sombras grandes.
- Bordes: `1px solid #E2E8F0`.
- Densidad: compacta en listados, más aireada en creación de viaje y chat.

## Componentes base

### Botones

- `primary`: azul de marca, para “Crear viaje”, “Buscar”, “Unirme”.
- `secondary`: blanco con borde, para acciones secundarias.
- `ghost`: para navegación y acciones poco frecuentes.
- `destructive`: rojo, para eliminar o reportar.
- `affiliate`: azul con icono externo y etiqueta “Enlace de afiliado”.

### Tarjeta de viaje

Debe mostrar, en este orden:

1. Destino principal y origen.
2. Fechas exactas o mes flexible.
3. Precio orientativo, si existe.
4. Plazas disponibles.
5. Etiquetas: `Grupo`, `Privado`, `Nuevo`, `Últimas plazas`.
6. Avatar del creador y fecha de publicación.
7. CTA: `Ver viaje` o `Solicitar unirme`.

Ejemplo:

```text
Palma de Mallorca → Turquía
12–26 julio · Flexible
Desde 450 €
4 plazas disponibles
Grupo · Vuelos + hotel
[Creada por @carlos]  [Ver viaje]
```

### Buscador

Estilo tipo Skyscanner:

- Campo **Desde** con autocomplete.
- Campo **Hacia** con autocomplete y opción “Cualquier destino”.
- Selector de fechas: ida/vuelta o mes flexible.
- Selector de viajeros.
- Botón grande **Buscar viajes**.
- Filtros posteriores: presupuesto, duración, tipo de viaje, visibilidad, plazas y orden.

### Badges

- `Público`
- `Privado`
- `Últimas plazas`
- `Nuevo`
- `Verificado`
- `Enlace de afiliado`
- `Flexible`

### Estados

Toda lista o detalle debe cubrir:

- Cargando: skeletons, no spinners genéricos.
- Vacío: mensaje útil y acción siguiente.
- Error: explicación y botón “Reintentar”.
- Sin resultados: sugiere ampliar fechas, cambiar destino o crear un viaje.

## Pantallas web

### Home

1. Hero con buscador prominente.
2. Chips de accesos rápidos: “Desde Baleares”, “Verano”, “Sin destino”, “Últimos viajes”.
3. Grid de viajes destacados.
4. Sección “Cómo funciona”.
5. CTA para crear viaje.

### Resultados de búsqueda

- Barra de filtros sticky.
- Lista de tarjetas de viaje.
- Orden: relevancia, fecha, precio, popularidad.
- Paginación o infinite scroll con botón “Cargar más”.

### Detalle de viaje

- Cabecera con origen, destino, fechas y estado.
- Galería o imagen de portada.
- Descripción del creador.
- Enlaces de vuelo, hotel y actividades.
- Participantes y plazas.
- Chat si el usuario está aprobado.
- CTA contextual: `Unirme`, `Solicitar unirme`, `Ya eres participante`.

### Crear viaje

Formulario por pasos:

1. Ruta y fechas.
2. Detalles y presupuesto.
3. Enlaces de reserva.
4. Privacidad y reglas del grupo.
5. Revisión y publicación.

## App móvil

### Navegación

Tab bar con cinco pestañas:

1. **Explorar**
2. **Buscar**
3. **Crear**
4. **Mis viajes**
5. **Perfil**

### Pantallas prioritarias

- Onboarding breve.
- Feed de viajes.
- Buscador con filtros.
- Detalle de viaje.
- Crear viaje.
- Chat grupal.
- Notificaciones push.
- Perfil y ajustes.

### Patrones móviles

- Bottom sheet para filtros.
- Pull-to-refresh en feeds.
- Skeletons durante carga.
- Haptics sutiles en acciones clave.
- Botón flotante para crear viaje.
- Deep links a viajes: `tuviaje.com/viajes/:slug`.

## Accesibilidad

- Contraste mínimo 4.5:1 para texto normal.
- Áreas táctiles mínimas de 44x44px.
- Foco visible en todos los elementos interactivos.
- Labels asociados a inputs.
- Mensajes de error descriptivos.
- No comunicar información solo con color.
- Respetar `prefers-reduced-motion`.

## Copywriting

- Usa español de España.
- Llama a los usuarios “viajeros”, no “usuarios”.
- CTAs directos: “Buscar viajes”, “Crear viaje”, “Unirme al grupo”, “Ver vuelos”.
- Sé transparente con afiliación: “Este enlace es de afiliado; podemos recibir una comisión si reservas.”
- Evita lenguaje agresivo como “¡Última oportunidad!” salvo que sea real.

## Métricas de diseño

- Tiempo hasta crear un viaje: menos de 2 minutos.
- Tiempo hasta enviar una búsqueda: menos de 10 segundos.
- Tasa de clic en enlaces de afiliado.
- Tasa de solicitudes de unión por viaje.
- Retención semanal de usuarios registrados.
- Core Web Vitals en verde en móvil.
