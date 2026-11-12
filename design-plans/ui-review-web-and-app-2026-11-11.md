# UI review and implementation handoff

Reviewed on: `2026-11-11`
Written against: `cdbe87ece6dcd754bb3c768f7f88459feb7790bf`
Product classification: `Both`
Platforms and stack: `Next.js 16.4 web (React 19, Tailwind CSS 4) and native iOS/Android app (Expo SDK 58, React Native 0.88, Expo Router, NativeWind)`

## Objective

Review ViajerosHub's connected web and native app experience, with emphasis on the primary discovery, creation, trips, messaging, notification, and profile journeys. The implementation should remove verified design-contract and accessibility deviations and evolve primary navigation toward the user's supplied modern floating-navigation reference without copying Instagram's dark styling or weakening ViajerosHub's light, blue, practical identity.

The intended navigation outcome is a compact floating capsule with five stable destinations on the signed-in native app and signed-in mobile web, using a clearly shaped active state, consistent line icons, notification badges, safe-area handling, and accessible names. Desktop web retains the existing top header and gains route awareness. The current five native destinations are the working information architecture: Home/Explore, Create, My trips, Messages, and Profile.

## Review scope

### Reviewed

- Repository structure, manifests, entry points, route ownership, and design documentation for `apps/web`, `apps/mobile`, `packages/ui`, and `packages/shared`.
- Web source: `/`, `/buscar`, `/crear`, `/mis-viajes`, `/mensajes`, `/mensajes/[slug]`, `/viajes/[slug]`, `/notificaciones`, `/perfil`, `/viajeros/[username]`, and `/acceso`; shared header, search, trip cards, carousel, language, avatar, and notification components.
- Web rendered state: `/acceso` at a 1440 x 1000 headless-Chrome viewport and a narrow 390 x 844 capture. Only the desktop capture was used for visual-craft conclusions; the narrow capture was not used to assert reflow defects because the host display scaling made its effective CSS viewport uncertain. Browser runtime output was inspected and proved the nested-link hydration failure documented in UI-007.
- App source: auth gate, access, five tab routes, search/results, trip detail, chat, notifications, public traveller profile, profile editor, shared search/date/location/trip-card components, loading/empty/error states, and safe-area declarations.
- User-supplied reference: a dark floating, rounded five-item bottom navigation with an enlarged active pill, icon-only inactive destinations, profile avatar, notification dot, and generous separation from the device edge. It is treated as interaction/composition inspiration, not a visual specification.
- Themes: current light theme only. The product manifest explicitly sets `userInterfaceStyle: "light"`.

### Not reviewed

- Authenticated web pages were not rendered because this checkout has no PostgreSQL or OAuth environment configuration; their review is source-based.
- The native app was not rendered on iOS, Android, tablet, or Expo web. Touch, software keyboard, orientation, dynamic type, VoiceOver, TalkBack, reduced motion, haptics, and real safe-area behavior remain device-validation requirements.
- No authenticated, loading, empty, long-content, error, offline, push-notification, or deep-link state was exercised against a live backend.
- No Figma file, Storybook, production analytics, product research, or formal WCAG audit was available.
- Dark/high-contrast themes are not currently supported and are not introduced by this handoff.
- Repository lint, typecheck, tests, and builds were identified but not run because this was a read-only source review.

### Evidence inspected

- `README.md`, `docs/architecture.md`, `design.md`, root/package manifests, and `apps/mobile/app.json`.
- `packages/ui/src/index.ts` for the shared color constants and `apps/web/app/globals.css` for web tokens, focus, and reduced-motion behavior.
- `apps/web/components/site-header.tsx`, `language-selector.tsx`, `logo.tsx`, `notification-bell.tsx`, `icons.tsx`, `search-form.tsx`, `featured-trips-carousel.tsx`, and `trip-card.tsx`.
- The web route files listed above, including `apps/web/app/crear/trip-form.tsx`.
- `apps/mobile/app/_layout.tsx`, `apps/mobile/app/(tabs)/_layout.tsx`, each tab screen, and the mobile screens/components listed above.
- Local `next dev` rendering of `/acceso`; the server started successfully, while the page correctly exposed the missing auth/database configuration state.
- The supplied navigation reference image, interpreted textually in this handoff so implementation does not depend on access to the conversation attachment.

## Product and design system

- Product type: one group-travel product with a browser client and separately deployable native Expo client.
- Shared design owners: `design.md` for binding principles and component/state contracts; `packages/ui/src/index.ts` for the current shared color constants; `packages/shared/src/i18n.ts` for user-facing language; the shared API/data contracts for content shape.
- Web-specific owners: `apps/web/app/globals.css`, `apps/web/components/site-header.tsx`, `apps/web/components/icons.tsx`, route-local compositions, and Tailwind utility variants.
- App-specific owners: `apps/mobile/app/(tabs)/_layout.tsx`, Expo Router, NativeWind classes, `react-native-safe-area-context`, and screen-local React Native components.
- Governing design sources: `design.md` is connected to the implementation through exact palette values, component names, route structure, state copy, and stated web/mobile patterns. The supplied reference governs only the requested navigation direction described in the Objective.
- Existing tokens/components/variants to reuse: `brand50`, `brand500`, `brand600`, `neutral900`, `neutral600`, `neutral100`, and `surface`; CSS variables in `globals.css`; `SiteHeader`, `Logo`, `NotificationBell`, `UserAvatar`, `TripCard`, `SearchForm`/`HomeSearch`, `LocationCombobox`/`LocationPicker`, and `TravelDatePicker`.
- Explicit exceptions: platform UI should be semantically aligned but not share one rendering component across DOM and React Native. The app remains portrait-first and light-only. Desktop web keeps top navigation. The Instagram reference's black/glass aesthetic, icon set, and label-free interaction are not product requirements.

## Executive summary

The product already has a coherent blue travel identity, strong core cards, useful search composition, localization, minimum-size patterns, and broad state coverage. The largest quality gap is structural: navigation is implemented independently with no coherent cross-platform destination model, web mobile hides every primary route in a menu, desktop web cannot show the current route, and native tabs use platform-dependent text glyphs with a fixed rectangular tab bar. The requested floating system is a good fit if it is adapted rather than copied. The rendered access route also emits invalid nested anchors and a React hydration failure, which should be removed before broader visual work.

Two binding contracts are also visibly unfulfilled in source: creation is a single long form instead of the documented five-stage task, and several app list states use generic spinners or offer no recovery/action despite `design.md` requiring skeletons, useful empty actions, and retryable errors. Mobile segmented choices also expose no selected semantics. Implement navigation and accessibility foundations first, then restructure creation, normalize asynchronous states, and finish with typography.

| Priority | Verified defects | Implementation risks | Design recommendations |
| -------- | ---------------: | -------------------: | ---------------------: |
| P0       |                0 |                    0 |                      0 |
| P1       |                3 |                    0 |                      1 |
| P2       |                2 |                    0 |                      0 |
| P3       |                1 |                    0 |                      0 |

## Corrections

### UI-001 — Introduce an adaptive, modern primary navigation system

- **Classification:** Design recommendation
- **Priority:** P1
- **Platform:** Shared concept; separate Web and App implementations
- **Surface and state:** Signed-in app tabs; signed-in web below `lg`; desktop web at `lg` and above; all primary routes; default, pressed, focused, selected, badge, keyboard-open, and reduced-motion states
- **User task affected:** Move predictably among discovery, creation, owned trips, conversations, and profile without reopening a menu or re-orienting after every route change.
- **Observation:** The app exposes five persistent tabs but uses a conventional full-width rectangle and Unicode symbols. Mobile web hides the same high-frequency destinations inside a hamburger. The user explicitly prefers the modern floating five-item pattern shown in the supplied reference. The reference succeeds through stable placement and a strong active pill, but its icon-only dark styling should not be copied into this light utility product.
- **Evidence:** `apps/mobile/app/(tabs)/_layout.tsx:6-32` defines text-glyph icons and fixed bar metrics; `:35-79` defines five current routes. `apps/web/components/site-header.tsx:66-168` supplies a floating top shell but hides primary navigation below `lg`; `:183-239` moves primary links into a disclosure menu. `design.md:94-101` limits web primary navigation and requires 44 px mobile targets; `design.md:206-212` documents a four-tab app model, which conflicts with the five implemented routes and the now-requested five-item direction.
- **Impact:** Native icon rendering varies by OS/font and feels unfinished. On mobile web, frequent signed-in tasks require opening and scanning a menu every time. Platform navigation does not feel like one product, and unread conversation urgency is visible inside the messages screen but not at the navigation decision point.
- **Root cause:** Separate platform navigation owners evolved without a shared destination model or shared interaction specification; the documented four-tab model is stale relative to the implemented five routes.
- **Required correction:**
  - Treat the five current native destinations as the approved working model: App `/(tabs)` Home, Create, My trips, Messages, Profile; authenticated mobile web `/buscar`, `/crear`, `/mis-viajes`, `/mensajes`, `/perfil`.
  - App: replace only the visual tab bar via Expo Router/React Navigation's supported custom `tabBar` API. Render a light `surface` capsule with a subtle `border` and restrained shadow, horizontally inset 16 px, with 8 px minimum separation from the computed bottom safe area. Keep all five destinations stable. Give every item a minimum 44 x 44 hit target. Inactive items show a consistent line icon; the active item uses `brand50` pill fill plus `brand600` icon and a short text label. Selection must not rely on color alone. Profile may use the traveller avatar only when a valid image exists; retain a profile icon fallback.
  - App: use one coherent vector icon family. Add `@expo/vector-icons` as an explicit Expo-compatible dependency using the repository's Expo package-management convention; do not retain Unicode glyphs. Expose unread messages/notifications through an accessible badge on Messages and cap visible counts at `99+`.
  - App: derive height and bottom padding from `useSafeAreaInsets`; enable `tabBarHideOnKeyboard` or equivalent supported behavior. Do not animate layout when reduced motion is enabled; otherwise use only a short opacity/scale transition.
  - Mobile web: for authenticated sessions below `lg`, keep a compact top utility header for logo, notifications, language/account/sign-out, but remove duplicate primary destinations from its disclosure. Add a fixed bottom capsule with the same five semantic destinations, icon treatment, active pill, and unread badge. Use a small client navigation child with `usePathname`; keep session/data work in the server `SiteHeader`. Add page-level/global bottom content inset equal to bar height + safe-area inset so content and controls are never obscured. Hide the bar on unauthenticated pages and the mandatory profile-setup flow.
  - Desktop web: retain the existing header composition; UI-005 supplies its current-route behavior.
- **Reuse:** Existing palette/tokens from `packages/ui/src/index.ts` and `apps/web/app/globals.css`; `NotificationBell` unread source; `UserAvatar`; existing web SVG style in `apps/web/components/icons.tsx`; existing Expo Router route definitions and translation keys. Share semantics and measurements, not a cross-runtime component.
- **Affected files and consumers:** Direct: `apps/mobile/app/(tabs)/_layout.tsx`, `apps/mobile/package.json`, a focused mobile tab-bar/icon component under `apps/mobile/components/`, `apps/web/components/site-header.tsx`, `apps/web/components/icons.tsx`, and a focused client mobile-primary-navigation component. Inherited: every tab screen and every authenticated web route rendering `SiteHeader`; web page shells need shared bottom inset rather than route-by-route magic numbers.
- **Preserve:** Current route URLs, auth/profile gate, notification access, language selection, sign-out, desktop header hierarchy, i18n labels, brand blue palette, light theme, deep links, and native back behavior.
- **Acceptance criteria:**
  - [ ] The five destinations and order are stable on app and authenticated mobile web; each opens the existing route and exposes an accessible localized name.
  - [ ] Active destination is communicated by shape and text in addition to color, and app/web current state remains correct on nested trip/message/profile routes.
  - [ ] Every target is at least 44 x 44; badge text is announced without making the decorative dot separately focusable.
  - [ ] App capsule clears iPhone home indicator and Android gesture/navigation regions; web capsule uses `env(safe-area-inset-bottom)` and never covers the final control/content row.
  - [ ] App tab bar hides or moves safely for software keyboards; no fixed bar covers chat input, create fields, search fields, or profile fields.
  - [ ] At `lg` and above, web shows only the existing desktop top navigation, not the bottom capsule.
  - [ ] Unauthenticated web and mandatory profile setup do not expose signed-in primary destinations.
  - [ ] No Unicode/emoji glyph remains as a tab icon, and the visual result reads as ViajerosHub rather than an Instagram clone.
- **Validation:** iOS small/large phone and Android gesture-navigation device; native widths 320, 390, and 430; mobile web Chrome/Safari at 320, 390, 430, and 768 CSS px; desktop at 1024 and 1440; Spanish plus German or another long-label locale; touch, keyboard, VoiceOver/TalkBack smoke test, 200% browser zoom, reduced motion, long unread count, missing avatar, and software keyboard on Create/Messages/Profile.
- **Dependencies:** UI-005 for desktop and reusable route matching. Badge wiring depends on the existing notifications/conversations providers and must not introduce a second polling channel.
- **Uncertainty:** `design.md` still states four app tabs while the implementation and user reference support five. This handoff resolves the review in favor of the current five implemented destinations; update design documentation only after implementation and product confirmation.
- **Stop condition:** Stop and request product direction if one of the five current destinations must be removed or merged, if mobile web navigation is intentionally menu-only, or if adding the Expo-compatible vector icon dependency violates repository policy. Do not silently choose a different information architecture.

### UI-002 — Convert trip creation into the documented staged task

- **Classification:** Verified defect
- **Priority:** P1
- **Platform:** Shared journey; separate Web and App compositions
- **Surface and state:** Web `/crear`; App `/(tabs)/create`; new, partially complete, validation error, pending, review, success, and back/forward states
- **User task affected:** Create and publish a trustworthy group trip in under the documented two-minute target.
- **Observation:** Both clients render one long page containing route, dates, details, privacy, links, and publication. The governing design specifies five steps: route/dates, details/budget, links, privacy/rules, and review/publication. The app form is especially long and places validation feedback only near the final button.
- **Evidence:** `design.md:194-201` defines the five-step form. Web `apps/web/app/crear/trip-form.tsx:65-223` renders three fieldsets in one form with one final submit. App `apps/mobile/app/(tabs)/create.tsx:79-270` renders the entire task in one `ScrollView`, and `:42-70` validates/submits only from the final action. `design.md:262` targets less than two minutes to create a trip.
- **Impact:** Travellers cannot see scope or progress, must scan a long mobile page, and discover some missing information only after reaching the end. There is no deliberate review moment for privacy, dates, budget, or external links before publishing.
- **Root cause:** Existing field components and submit logic were composed directly without a step controller or review representation.
- **Required correction:** Build a lightweight local step controller around the existing inputs and submit functions; do not rewrite API contracts. Use exactly five stages matching `design.md`. Show `Paso n de 5`, a concise title, and a progress indicator with text semantics. Validate the current stage before advancing, focus/scroll to the first invalid field, preserve entered values while moving back, and reserve the API mutation for the final Publish action. The review stage must summarize route/dates, details/budget, links, visibility/rules, and provide Edit links to the relevant step. Keep browser/native back behavior within the flow predictable; warn before discarding only when data has changed.
- **Reuse:** `LocationCombobox`/`LocationPicker`, `TravelDatePicker`, current text inputs, visibility/link models, translations, existing submit/mutation functions, button colors, card/fieldset shells, and current error copy where accurate.
- **Affected files and consumers:** Direct: `apps/web/app/crear/trip-form.tsx`, `apps/mobile/app/(tabs)/create.tsx`, and i18n keys in `packages/shared/src/i18n.ts`. Optional focused step/progress components may be added locally to each runtime. API/database contracts are consumers to preserve, not change.
- **Preserve:** Existing payload fields, validation limits, exact-date creation requirement, visibility options, link maximum, authentication guards, success redirect to the created/owned trip area, Spanish copy style, and the current primary-blue publication action.
- **Acceptance criteria:**
  - [ ] Both platforms expose five named stages in the documented order and never submit before the final stage.
  - [ ] Back/next preserves all valid values; first invalid field receives focus and a descriptive inline error.
  - [ ] Review reflects every submitted value and each Edit action returns to the correct stage without data loss.
  - [ ] Pending publication disables duplicate submission and communicates progress; failure retains all values and offers retry.
  - [ ] Keyboard navigation, screen-reader stage announcement, software keyboard avoidance, long translations, and 320 px layouts remain usable.
- **Validation:** Web `/crear` at 320, 390, 768, 1024, and 1440; keyboard-only and 200% zoom; app iOS/Android with small screen and software keyboard; exact dates, optional budget/group size, 0/1/20 links, public/private, invalid URL, API error, double-tap publish, backward navigation, and long localized labels.
- **Dependencies:** UI-003 for segmented choice semantics; UI-001 must ensure the floating bar does not cover controls or trigger accidental flow abandonment.
- **Uncertainty:** The documented “rules” field is not present in the current payload. Do not invent or persist a new field; label step 4 around the supported privacy settings unless a product/backend requirement for rules is supplied.
- **Stop condition:** Stop before adding a new database/API field, draft persistence, or autosave semantics. Those require separate product and backend requirements.

### UI-003 — Expose semantics and state for mobile segmented choices

- **Classification:** Verified defect
- **Priority:** P1
- **Platform:** App: iOS and Android
- **Surface and state:** Create trip privacy and booking-link type; selected, unselected, focused by assistive technology, pressed, and disabled states
- **User task affected:** Choose trip visibility and categorize booking links, including with VoiceOver or TalkBack.
- **Observation:** The two segmented groups are collections of generic `Pressable` elements. Selection is shown only through background/text color and no role, group label, or selected/checked accessibility state is exposed.
- **Evidence:** `apps/mobile/app/(tabs)/create.tsx:157-173` renders Public/Private choices; `:193-206` renders Flight/Accommodation choices. Neither group supplies `accessibilityRole`, `accessibilityState`, or an accessible group relationship. This contradicts `design.md:244-249`, especially the rule not to communicate information only with color.
- **Impact:** Assistive-technology users cannot reliably determine the control type or current value. Travellers with color-vision differences receive a weaker state cue.
- **Root cause:** Visual segmented styling was implemented without a semantic control pattern.
- **Required correction:** Implement each as an accessible radio group (or the closest supported native React Native pattern): give the group a visible/accessibility label, each option `accessibilityRole="radio"`, `accessibilityState={{ checked: ... }}`, and a non-color selected cue such as a check icon and stronger outline. Preserve 44 px minimum targets. Announce disabled state where applicable. Apply the same pattern to any matching segmented control discovered while implementing.
- **Reuse:** Current labels, state variables, brand colors, rounded segmented shell, and the icon family selected in UI-001.
- **Affected files and consumers:** Direct: `apps/mobile/app/(tabs)/create.tsx`; any extracted local `SegmentedRadioGroup` must remain app-local until a second proven consumer justifies generalization.
- **Preserve:** Current values (`public`, `private`, `flight`, `accommodation`), payload mapping, layout density, and touch behavior.
- **Acceptance criteria:**
  - [ ] VoiceOver and TalkBack announce group purpose, option label, and selected state.
  - [ ] Selected state remains understandable in grayscale and without color.
  - [ ] Each option is at least 44 px high and remains usable at large system text sizes without clipping.
  - [ ] Changing selection updates visual and accessibility state once and does not advance the creation step unexpectedly.
- **Validation:** iOS VoiceOver and Android TalkBack; default and largest supported text size; grayscale/color-filter inspection; public/private and both link types; disabled/pending state if introduced by the staged flow.
- **Dependencies:** UI-001 icon family, UI-002 staged form composition.
- **Uncertainty:** None.
- **Stop condition:** Do not substitute tabs for form choices; these values are data inputs, not navigation.

### UI-004 — Make asynchronous and empty states actionable and contract-compliant

- **Classification:** Verified defect
- **Priority:** P2
- **Platform:** App, with web parity checks
- **Surface and state:** App Home featured trips, My trips, Messages, Notifications, trip detail, traveller profile, auth loading, and related list/detail loading, empty, and error states
- **User task affected:** Understand whether content is loading, recover from failures, and continue after an empty result.
- **Observation:** The design contract requires skeletons instead of generic spinners, useful empty states with a next action, and errors with Retry. Search results largely follows this pattern, but other app surfaces use centered `ActivityIndicator`s, raw error text, blank successful areas, or empty cards without an action. Home renders no useful state when the featured list succeeds empty; My trips has no Create/Explore action and its error has no retry; Messages errors have no explicit retry control.
- **Evidence:** Contract: `design.md:157-162`. Home: `apps/mobile/app/(tabs)/index.tsx:116-160`. My trips: `apps/mobile/app/(tabs)/trips.tsx:48-66`. Messages: `apps/mobile/app/(tabs)/messages.tsx:60-134`. Notifications: `apps/mobile/app/notifications.tsx:80-106`. Similar generic spinners appear in `apps/mobile/app/trips/[slug].tsx:188-198`, `apps/mobile/app/travelers/[username].tsx:58-70`, and `apps/mobile/components/loading-screen.tsx:8-14`. The positive exemplar is `apps/mobile/app/search-results.tsx:188-229`, which has a skeleton, explanatory error, Retry, and an empty-state action.
- **Impact:** Travellers cannot distinguish slow loading from a stalled screen, some failures offer no visible recovery, and empty states become dead ends. This reduces trust in travel/group data and conflicts with the documented perceived-speed principle.
- **Root cause:** State UI is implemented screen-by-screen instead of reusing the established search-results pattern.
- **Required correction:** Use the search-results state composition as the exemplar, not as a new universal abstraction by default. Replace list/detail page-level spinners with shape-matched skeletons; keep small inline `ActivityIndicator`s only inside buttons or compact asynchronous controls. Add useful empty copy and the existing next action: Home → Explore/Create; My trips → Create plus Explore; Messages → Explore/My trips; Notifications → return to current task. Add explicit localized Retry actions to recoverable page-level errors and clear stale error state before retry. Add `accessibilityRole="alert"` or live-region-equivalent behavior to new error feedback without repeatedly announcing skeletons.
- **Reuse:** `SearchSkeleton`/state structure from `apps/mobile/app/search-results.tsx`, existing buttons, route actions, translation keys, trip-card geometry, and brand palette. Extract a shared state component only if at least two screens truly share structure and behavior.
- **Affected files and consumers:** Direct: the mobile screens/components cited above and `packages/shared/src/i18n.ts`. Verify analogous web route states and add only missing equivalents; do not replace already useful web empty states.
- **Preserve:** Pull-to-refresh, pagination, API calls, existing data, button-level pending indicators, offline/native behavior, and current layout hierarchy.
- **Acceptance criteria:**
  - [ ] No page-level generic spinner remains on audited content lists/details; skeletons match the main content geometry and do not animate under reduced motion.
  - [ ] Every recoverable page-level error explains the failure in user-safe language and exposes Retry.
  - [ ] Every empty primary list offers at least one relevant next action and never leaves a titled blank region.
  - [ ] Retry clears stale errors, prevents duplicate requests, and preserves prior content where that is safer than blanking the screen.
  - [ ] Search results keeps its currently stronger states or improves without regression.
- **Validation:** Simulate slow success, empty success, initial failure, retry success, refresh failure, pagination failure, and offline/online recovery on each cited screen; test reduced motion and screen-reader announcement; verify web parity at mobile and desktop widths.
- **Dependencies:** UI-001 for navigation destinations used by empty actions; UI-002 for creation pending/error states.
- **Uncertainty:** Backend error messages may contain technical details. Reuse existing safe translated summaries and log technical details rather than exposing them if the API contract does not already guarantee user-safe text.
- **Stop condition:** Do not invent offline caching, optimistic updates, or new backend retry semantics; limit this correction to presentation and re-triggering existing reads/mutations.

### UI-005 — Identify the current route in persistent web navigation

- **Classification:** Verified defect
- **Priority:** P2
- **Platform:** Web
- **Surface and state:** Desktop top navigation, mobile disclosure fallback, and the new mobile bottom navigation; base and nested routes
- **User task affected:** Know where they are and orient after following a direct/deep link.
- **Observation:** Persistent web links have hover styles but no route-aware active styling and no `aria-current="page"`. The server `SiteHeader` has no pathname-aware child. The native navigator already provides active tint, so this is a web-specific gap.
- **Evidence:** `apps/web/components/site-header.tsx:70-96` defines desktop links and `:183-219` defines mobile links with static classes. Repository search found no `aria-current` or `usePathname` in web navigation. The visual and semantic current state is therefore absent by construction.
- **Impact:** Sighted and screen-reader users receive no persistent location cue; the problem is amplified on nested messages/trips routes and would carry into UI-001 if not solved centrally.
- **Root cause:** Authentication/localization/data and route presentation are combined in one async server component.
- **Required correction:** Keep session, translations, and unread-count reads in `SiteHeader`, but pass a serializable destination model into a small client navigation renderer using `usePathname`. Apply `aria-current="page"` to the best matching destination and use `brand50` background, `brand600` text/icon, and a weight/shape difference. Define explicit prefix rules so `/mensajes/[slug]` maps to Messages, `/viajes/[slug]` does not incorrectly claim My trips unless ownership is known, and `/viajeros/[username]` does not claim Profile unless it is the signed-in traveller's own profile. Use exact matching where ownership/context cannot be known safely.
- **Reuse:** Existing links, translations, palette, header geometry, and icons; UI-001 destination model.
- **Affected files and consumers:** Direct: `apps/web/components/site-header.tsx` plus the focused client navigation renderer created for UI-001. Inherited: every route that renders `SiteHeader`.
- **Preserve:** Server-side auth/data access, link URLs, responsive breakpoint, hover/focus behavior, notification placement, and restricted first-profile header behavior.
- **Acceptance criteria:**
  - [ ] Exactly one eligible persistent destination has `aria-current="page"` and a non-color-only active cue.
  - [ ] Base and nested message routes select Messages; search selects Explore; create, owned trips, and own profile select their corresponding destinations.
  - [ ] Public trip/traveller detail does not claim an unrelated destination.
  - [ ] Focus-visible remains distinct from selected state and passes at 200% zoom.
- **Validation:** Visit every listed web route by link and direct URL at 390, 768, 1024, and 1440; keyboard and screen-reader navigation; authenticated and unauthenticated sessions; nested messages/public detail/own profile cases.
- **Dependencies:** UI-001 destination model and mobile-web renderer.
- **Uncertainty:** Ownership of `/viajes/[slug]` is not available to a generic client route matcher. Prefer no active destination over a false one unless the server passes authoritative context.
- **Stop condition:** Do not fetch ownership client-side solely to paint navigation state.

### UI-006 — Apply the documented web typeface

- **Classification:** Verified defect
- **Priority:** P3
- **Platform:** Web
- **Surface and state:** All web routes and components
- **User task affected:** Read and scan interface content consistently across product surfaces.
- **Observation:** The design source specifies Inter or Geist Sans for web, while the global stylesheet sets Arial/Helvetica. The rendered access page therefore has a generic system-office feel that is less aligned with the otherwise modern rounded visual system.
- **Evidence:** `design.md:65-78` specifies the type family and scale. `apps/web/app/globals.css:24-29` applies `Arial, Helvetica, sans-serif`. `apps/web/app/layout.tsx` loads no font.
- **Impact:** Typography is a persistent brand inconsistency across every web page; metrics and line breaks also differ from the documented design target.
- **Root cause:** The intended font was documented but never loaded at the root layout.
- **Required correction:** Load Geist Sans through Next's supported font integration at `apps/web/app/layout.tsx`, expose it as a CSS variable/class, and make it the first global body family with a robust system fallback. Do not change the established scale or weights in the same pass. Avoid runtime layout shift and confirm the production build can obtain/bundle the font; prefer a repository-approved self-hosted asset if build environments prohibit font fetching.
- **Reuse:** Existing type scale/weights, root layout, and global stylesheet.
- **Affected files and consumers:** Direct: `apps/web/app/layout.tsx`, `apps/web/app/globals.css`; inherited: all web routes.
- **Preserve:** Current hierarchy, text sizes, localization, content widths, and accessibility zoom behavior.
- **Acceptance criteria:**
  - [ ] Computed body font resolves to Geist Sans (or approved self-hosted Geist) before system fallbacks on every web route.
  - [ ] No flash-driven layout shift is visible on first load; long localized copy, buttons, selects, cards, and headings do not clip.
  - [ ] Production `next build` succeeds in the deployment environment without an undeclared network dependency.
- **Validation:** Computed-style check and screenshots at 320, 390, 768, 1024, and 1440; Spanish and a long-label locale; 200% zoom; production build with deployment-equivalent network policy.
- **Dependencies:** None; implement after structural changes to simplify screenshot comparison.
- **Uncertainty:** The repository contains no local font asset. Confirm deployment font-fetch policy before choosing Google-hosted build-time retrieval versus a self-hosted file.
- **Stop condition:** If the build environment cannot fetch fonts and no approved font file/license is available, keep the current fallback temporarily and document the blocker rather than downloading an unapproved asset.

### UI-007 — Remove the access-page nested link and hydration failure

- **Classification:** Verified defect
- **Priority:** P1
- **Platform:** Web
- **Surface and state:** `/acceso`, desktop blue brand panel, initial server render and client hydration
- **User task affected:** Reach and operate the authentication entry point without client rerender errors or invalid link semantics.
- **Observation:** The access page wraps `Logo` in a `Link`, while `Logo` already returns its own `Link`. The rendered DOM therefore contains an anchor inside an anchor. Next/React reports invalid HTML and hydration failure, then regenerates the tree on the client.
- **Evidence:** `apps/web/app/acceso/page.tsx:53-55` renders `<Link><Logo /></Link>`. `apps/web/components/logo.tsx:3-34` proves `Logo` owns its home link. Local `next dev` browser runtime output for `/acceso` reported “In HTML, <a> cannot be a descendant of <a>” and “Hydration failed,” with the component stack pointing to those exact locations.
- **Impact:** The authentication page ships invalid interactive nesting, may lose server-rendered event/state assumptions during client regeneration, produces noisy production diagnostics, and exposes ambiguous link semantics to assistive technology.
- **Root cause:** The caller tried to apply inverted desktop styling by adding a second link wrapper instead of a non-interactive style wrapper or a supported `Logo` visual variant.
- **Required correction:** Remove the outer `Link` in `apps/web/app/acceso/page.tsx`. Preserve the blue-panel inverted treatment with a non-interactive wrapper (`div`/`span`) around the existing linked `Logo`, or add a narrowly scoped visual prop/class pass-through to `Logo` while retaining exactly one anchor. Do not remove `Logo`'s existing home destination because all other consumers rely on it.
- **Reuse:** Existing `Logo` home link, current `brightness-0 invert` treatment, and the same desktop layout.
- **Affected files and consumers:** Direct: `apps/web/app/acceso/page.tsx`; optionally `apps/web/components/logo.tsx` only if a reusable visual class/variant is chosen. Verify all `Logo` call sites for similar wrappers.
- **Preserve:** Home URL, accessible name, logo artwork, inverted brand-panel appearance, mobile access-page logo, and language selector.
- **Acceptance criteria:**
  - [ ] `/acceso` renders exactly one anchor for each Logo instance and valid HTML contains no interactive element nested inside another anchor.
  - [ ] Server and client trees hydrate without React/Next mismatch or nested-anchor console errors.
  - [ ] Clicking either visible Logo returns home, and keyboard/screen-reader link behavior remains clear.
  - [ ] Desktop inverted and mobile standard logo treatments remain visually unchanged.
- **Validation:** Run `/acceso` in development and production builds at 390 and 1440 CSS px; inspect browser console, DOM nesting, keyboard focus order, and accessible link names; test with auth configured and with the current configuration-warning state.
- **Dependencies:** None; fix before screenshot baselines and UI-006 typography comparison.
- **Uncertainty:** None.
- **Stop condition:** Do not make `Logo` non-interactive globally to solve a single call-site nesting defect.

## Cross-platform implementation notes

### Shared

- Share destination names, order, meaning, brand colors, minimum 44 px targets, active-state logic, and badge semantics. Do not attempt to share a DOM/React Native rendering component.
- Preserve `packages/shared` translation ownership. Add keys once and use them on both platforms; avoid hard-coded Spanish in new UI.
- `packages/ui` currently owns color constants only. Reuse them in mobile and keep web CSS variables aligned; do not broaden the package into a cross-platform component library during this work.
- Treat the current five-route implementation plus this handoff as the working navigation decision. Reconcile `design.md` after product confirmation rather than deleting Messages or Profile to satisfy stale prose.

### Web

- Maintain the current desktop header at `lg+`. The bottom capsule is authenticated mobile/tablet navigation, not a desktop replacement.
- Use `usePathname` only in a small client boundary. Do not move database/auth reads into the browser.
- Account for `env(safe-area-inset-bottom)`, browser zoom, long locale labels, hover-capable tablets, keyboard focus, and the final page control/content row.
- Keep the account disclosure for language/profile utilities and sign-out, but avoid duplicating primary links once the authenticated bottom bar is active.
- No dark theme is introduced. Use the existing white/blue/slate system and restrained shadow.

### App

- Use Expo Router's supported custom tab-bar path and `react-native-safe-area-context`; do not position a decorative overlay disconnected from navigation state.
- Prefer one explicit Expo-compatible vector icon dependency over Unicode glyphs. Use the same stroke weight and filled/outlined logic across all five icons.
- Validate on iOS and Android because safe areas, font metrics, badge placement, back behavior, and keyboard behavior differ.
- Do not display the tab bar in auth, mandatory profile setup, full-screen callbacks, or modal-like routes unless the current navigator already intends it.
- Keep button-level activity indicators where they communicate a local pending action; replace only page/content loading spinners with skeletons.

## Implementation sequence

1. `UI-007` + `UI-003` — remove the proven hydration failure and fix data-choice semantics before broader visual/refactor work.
2. `UI-001` + `UI-005` — define the five-destination model, implement route matching/current state, then build the native and mobile-web capsule variants with safe-area/badge behavior.
3. `UI-002` — compose the existing creation controls into five stages and validate navigation/keyboard coexistence with the new bars.
4. `UI-004` — normalize loading, empty, error, and retry states using search results as the proven exemplar.
5. `UI-006` — apply typography last and run visual regression checks for changed text metrics.

## Validation matrix

| Platform        | Surface                                              | Viewport/device                                                         | Theme | Input/AT                         | State                                                              | Expected result                                                                                                                                               |
| --------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- | ----- | -------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web             | Authenticated primary navigation                     | 320, 390, 430, 768 CSS px                                               | Light | Touch + keyboard + screen reader | Base and nested routes, unread `0/1/99+`                           | Floating five-item capsule clears safe area/content, current item is shaped/labeled and announced, badge is legible, no duplicated primary menu links         |
| Web             | Header navigation                                    | 1024 and 1440 CSS px                                                    | Light | Mouse + keyboard + screen reader | Every eligible route                                               | Existing desktop header remains; exactly one correct `aria-current`; focus and selected states remain distinct                                                |
| Web             | Create                                               | 320, 390, 768, 1440 CSS px; 200% zoom                                   | Light | Keyboard + screen reader         | Five stages, errors, review, pending, failure                      | No clipping or covered controls; values persist; inline validation and review/edit work; one final mutation                                                   |
| Web             | Access and public pages                              | 320, 390, 1440 CSS px                                                   | Light | Keyboard + screen reader         | Signed out/configuration error                                     | No authenticated bottom bar; one valid Logo link per instance; no hydration/console error; access content and utilities remain usable after typography change |
| App iOS         | Tabs and nested routes                               | Small iPhone + current large iPhone                                     | Light | Touch + VoiceOver                | Five tabs, missing avatar, unread `0/1/99+`, reduced motion        | Capsule clears home indicator, active state and badges are announced, no Unicode icons, nested routes select correctly                                        |
| App Android     | Tabs and nested routes                               | Small phone + 390/430-class device with gesture and 3-button navigation | Light | Touch + TalkBack                 | Five tabs, keyboard open/closed                                    | Capsule clears navigation region and hides/moves for keyboard; no chat/form obstruction                                                                       |
| App iOS/Android | Create                                               | Small phone; largest supported text size                                | Light | Touch + VoiceOver/TalkBack       | All five stages, radio choices, invalid URL, publish error/success | Groups/checked state announced; content reflows; values persist; final review matches payload                                                                 |
| App iOS/Android | Home, Trips, Messages, Notifications, detail/profile | Small + 390-class phone                                                 | Light | Touch + screen reader            | Slow, empty, error, retry success, refresh failure, reduced motion | Shape skeletons, useful actions, safe errors, explicit retry, no blank titled region or page-level generic spinner                                            |
| Both            | Localization                                         | 390 mobile + 1440 web                                                   | Light | Touch/keyboard                   | Spanish and one long-label locale                                  | Labels do not collide or clip; active label remains understandable; copy comes from shared i18n                                                               |

## Repository checks

- `corepack pnpm lint` → all workspace lint tasks pass with zero warnings where configured.
- `corepack pnpm typecheck` → all workspace TypeScript checks pass.
- `corepack pnpm test` → all existing Vitest suites pass.
- `corepack pnpm build` → Next production build, Expo iOS export, and package build tasks complete.
- `corepack pnpm format:check` → repository formatting passes; run the write formatter only if explicitly authorized by the implementation task and limit resulting edits to in-scope files.

## Completion evidence

Implemented on: `2026-11-11`

### Correction status

- [x] `UI-001` implemented: web and app now use five stable destinations, coherent line icons, shaped/labeled active states, at least 44 px targets, safe-area-aware floating capsules, keyboard hiding on app, route-aware web semantics, and capped accessible badges. Desktop web retains its top header. The app badge reuses the existing notifications provider instead of creating a second conversation polling channel; it therefore represents unread trip activity already available to the shared notification source.
- [x] `UI-002` implemented: both creation clients now expose five local stages in the documented order, preserve values across Back/Edit, validate route/date and link stages before advancing, provide a complete review summary with Edit actions, and reserve the existing mutation for the final publish action. The unsupported rules field, draft persistence, autosave, API, and database contracts were not invented.
- [x] `UI-003` implemented: mobile privacy and booking-link choices are radio groups with visible labels, per-option radio roles, checked state, 44 px targets, stronger outlines, and check/circle icons. Each option's accessible name includes its group purpose.
- [x] `UI-004` implemented for the audited app surfaces: Home, My trips, Messages, Notifications, trip detail, public traveller profile, auth loading, and search results now use static shape skeletons for page/content loading; recoverable failures expose safe localized summaries and Retry; empty primary lists expose relevant actions. Existing button-level activity indicators and data/retry semantics were preserved. Source review found no analogous web state requiring replacement beyond the existing useful states.
- [x] `UI-005` implemented: a focused client navigation owner uses `usePathname`; search/create/owned trips/messages/profile use explicit exact or prefix rules, nested messages select Messages, public trip/traveller details remain unclaimed, and current state uses `aria-current` plus shape/weight rather than color alone.
- [x] `UI-006` implemented: Geist is loaded through `next/font/google`, exposed through `--font-geist-sans`, and used before robust fallbacks. The production build fetched and bundled the font successfully; browser computed style resolved to `Geist, "Geist Fallback", Geist, Inter, ui-sans-serif, system-ui, sans-serif`.
- [x] `UI-007` implemented: the access page's outer Logo link was replaced by a non-interactive wrapper while preserving the inverted treatment and Logo-owned home link. A hydrated browser DOM reported `nestedAnchors: 0` and `logoLinks: 2` (one for each visible responsive Logo instance), with no hydration or nested-anchor browser error.

### Validation matrix results

- **Web access/public, 1440 x 1000, light:** visually inspected the signed-out configuration state after implementation. Layout, inverted desktop Logo, language selector, Geist typography, and configuration warning rendered coherently. Evidence: [`evidence/acceso-1440x1000.png`](evidence/acceso-1440x1000.png).
- **Web access narrow capture:** generated [`evidence/acceso-390x844.png`](evidence/acceso-390x844.png), but did not use it as responsive acceptance evidence because Windows headless Chrome did not expose a trustworthy matching CSS viewport. This preserves the original review limitation instead of claiming an unverified 390 px result.
- **Web hydration/DOM:** Chrome DevTools Protocol reload of `/acceso` found zero nested anchors, two Logo home links, and the expected Geist computed family. The only captured error events were the documented missing Auth.js secret and a missing resource response; no React hydration or nested-anchor error was emitted.
- **Authenticated web navigation/create matrix:** blocked by the checkout's missing Auth.js secret, OAuth credentials, and PostgreSQL configuration. Navigation and creation were verified by source, lint, typecheck, and production compilation only.
- **App navigation/create/async-state matrix:** Expo iOS production export completed, proving bundle/module integration. Physical iOS/Android rendering, safe areas, gesture/three-button navigation, software keyboards, largest text, VoiceOver, TalkBack, and runtime slow/empty/error injection remain unverified because no device/simulator and configured backend session were available.
- **Localization:** all new copy is owned by `packages/shared/src/i18n.ts`; Spanish and English values are explicit and other locales inherit their existing base fallback convention. Existing long German destination labels compile through both navigation implementations, but visual collision testing remains part of device/authenticated verification.

### Repository checks

- `corepack pnpm lint` → passed all 6 workspace tasks with zero warnings/errors after implementation.
- `corepack pnpm typecheck` → passed all 6 workspace TypeScript tasks.
- `corepack pnpm test` → passed 39 tests: 25 shared, 2 mobile, and 12 web.
- `corepack pnpm build` → passed all 6 workspace build tasks; Next production build compiled/generated all routes and Expo exported the iOS bundle (`1833` modules) to the ignored `apps/mobile/dist` output.
- `corepack pnpm format:check` → repository-wide check remains blocked by pre-existing formatting drift in untouched product/database files plus `pnpm-lock.yaml`, which is kept in pnpm's generated format after adding the explicit icon dependency. In-scope edited source and this handoff pass the repository Prettier configuration. The final residual list is recorded from the last check below.

  - `apps/mobile/components/travel-date-picker.tsx`
  - `apps/mobile/components/trip-card.tsx`
  - `apps/mobile/components/trip-chat.tsx`
  - `apps/mobile/lib/trip-search.ts`
  - `apps/web/app/api/trips/[slug]/route.ts`
  - `apps/web/app/api/trips/route.ts`
  - `apps/web/app/viajes/[slug]/trip-chat.tsx`
  - `apps/web/components/featured-trips-carousel.tsx`
  - `apps/web/components/location-combobox.tsx`
  - `apps/web/components/search-trip-grid.tsx`
  - `packages/database/drizzle/meta/0009_snapshot.json` through `0015_snapshot.json`
  - `packages/database/src/chat.ts`
  - `packages/database/src/seed-demo-trips.ts`
  - `packages/database/src/trips.ts`
  - `pnpm-lock.yaml` (pnpm-generated formatting)

### Deployment evidence

- On `2026-11-12`, the completed implementation and validation evidence were pushed to `origin/main`. The final documentation commit and the production source are based on the same implementation commit chain.
- Before deployment, the existing server source and configuration were backed up to `/home/lluc/backups/viajeroshub-pre-ui-20261112-0935.tgz`. The release archive SHA-256 matched locally and remotely, contained no absolute/traversal paths or `deploy/.env`, and was extracted over the deployment source while preserving the production environment file, persisted avatars, database, and Docker volumes.
- `docker compose --env-file deploy/.env -f deploy/compose.yml up -d --build database migrate web` rebuilt the production images. Drizzle reported migrations applied successfully, the location/image seed completed, and the database and web containers became healthy. External requests to `https://viajes.llucbosch.com/acceso` and `/api/trips` returned `200`; the deployed access DOM had zero nested-anchor patterns and the production stylesheet contained Geist declarations.
- `docker compose --env-file deploy/.env -f deploy/compose.yml --profile mobile up -d --build mobile-dev` rebuilt the Expo Go service. The container and watchdog became healthy, `https://viajes.llucbosch.com/expo` redirected to the new `exp://c-lluckaicen-m468d2-mwdannru7km8p4ng.on.expo.app` tunnel, the iOS Expo manifest returned `200` with runtime `exposdk:58.0.0` and project ID `3cae2b68-68a6-43c4-8c96-f3c72c9acf13`, and its JavaScript launch asset returned `200`.

### Evidence-backed deviations and remaining blockers

- The handoff requested device/browser combinations that this environment cannot provide. No physical-device, simulator, software-keyboard, screen-reader, dynamic-type, or authenticated route result is claimed.
- No animation was added to the custom tab bars or skeletons, so reduced-motion users receive a static result without requiring a parallel animation preference implementation.
- The mobile Messages badge reuses existing unread notification state to honor the prohibition on a second polling channel. If product requires a conversation-only aggregate independent of notification preferences, that requires a dedicated existing-provider contract rather than a new tab-bar fetch.
- `format:check` failures outside the files changed for this handoff were preserved rather than rewritten as unrelated cleanup.

## Development-agent prompt

```text
Work in this repository and implement the complete UI review handoff at `design-plans/ui-review-web-and-app-2026-11-11.md`.

Read the entire handoff before editing. Inspect the current repository state and verify that every cited path, owner, component, token, and assumption is still valid. Then implement every in-scope correction in the documented priority and dependency order, including shared, web-specific, and app-specific work where applicable.

Preserve valid behavior, content, accessibility, platform conventions, and the product's existing identity. Reuse the named design-system owners and do not create parallel tokens or components unless the handoff explicitly justifies them. Do not silently invent product intent: if a stop condition or stale assumption is encountered, document the evidence and ask for clarification.

Run the handoff's validation matrix and repository checks. Update the handoff's Completion evidence section with completed items, commands and results, visual verification performed, and any evidence-backed deviations. Finish with a concise summary of files changed, corrections completed, validation results, and remaining blockers.
```
