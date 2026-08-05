# Design system

Four layers. Each depends only on the ones above it, so a second app —
a seller portal, a white-label storefront, the mobile app — consumes them
unchanged instead of forking the storefront.

```
packages/
├── tokens/     colour, type, radius, shadow, motion, z-index   (no React)
├── brand/      names, legal text, footer links, SEO            (no React)
└── ui/         Button, Field, Modal, Card, Badge, Tabs…        (React, brand-neutral)

marketplace_app/lib/design/                                     (Flutter)
├── tokens.g.dart, brand.g.dart   generated from the two packages above
├── theme.dart                    DsThemeScope — the CSS-variable analogue
└── components.dart               BxButton, BxField, BxCard, BxTabs…
```

Two clients, one source. The React primitives in `packages/ui` and the Flutter
primitives in `marketplace_app/lib/design/components.dart` are separate code —
they have to be — but neither declares a value of its own. Both read the
generated output of `packages/tokens`.

Imported via the aliases in `jsconfig.json`:

```js
import { tokens, fontsHref } from '@ds/tokens';
import { brand, seo, getBrand, storageKey } from '@ds/brand';
import { Button, Input, Modal, Card, Badge, Tabs } from '@ds/ui';
```

Everything is on display at **`/design-system`** — every primitive in every
state, light and dark. That page is the contract: if you need a control, look
there first.

---

## tokens

`packages/tokens/src/tokens.js` is the only file in the repo where a colour,
radius, shadow or type step is written by hand. Everything else is generated:

```bash
npm run tokens:build     # also runs automatically on `npm run dev` and `npm run build`
```

| Output | Consumed by |
|---|---|
| `dist/tokens.css` | `app/globals.css` — CSS variables + the Tailwind `@theme` block |
| `dist/tokens.js` | JS that needs a value at runtime (`fontsHref`, meta theme-color, charts) |
| `dist/tokens.json` | anything non-JS |
| `dist/tokens.dart` | reference copy of the Dart projection |
| `marketplace_app/lib/design/tokens.g.dart` | the Flutter app — written directly, not copied |
| `marketplace_app/lib/design/brand.g.dart` | the Flutter app's brand strings, from `packages/brand` |

`dist/` and the `.g.dart` files are build output — never edit them.

The Flutter files are written *into the app* rather than left in `dist/` for
someone to sync by hand. A copy step that has to be remembered is the drift this
package exists to remove.

Shadows are authored as layer data (`[x, y, blur, spread, r, g, b, a]`) rather
than CSS strings for the same reason: CSS joins them into a `box-shadow`, Dart
emits `BoxShadow` constructors, and neither has to parse the other's format.

### Why there are no `dark:` classes

Colours are authored as `[light, dark]` pairs. The generator writes the light
value under `:root`, the dark value under `.dark`, and declares the Tailwind
theme with `@theme inline` so each utility emits `var(--ds-…)` rather than a
resolved literal. `bg-surface` is therefore correct in both themes on its own.

A `dark:` override would outrank the variable it is trying to help, which is
why the eslint rules reject them.

### Naming

| Group | Tokens |
|---|---|
| Surfaces | `canvas` `surface` `surface-muted` `surface-sunken` `inverse` |
| Foreground | `ink` `ink-muted` `ink-subtle` `ink-inverse` |
| Lines | `line` `line-strong` |
| Brand | `primary(-hover)` `on-primary` `accent(-hover/-soft)` `on-accent` `highlight(-hover)` `on-highlight` |
| Status | `success(-soft)` `warning(-soft)` `danger(-hover/-soft)` `info(-soft)` |
| Commerce | `sale` `new` `rating` `agent(-hover/-surface)` |

Radii are named by role, not size — `rounded-chip` (tags), `rounded-control`
(inputs, small buttons), `rounded-card`, `rounded-panel` (modals, sections),
`rounded-pill`. "Which rounding does a card get" has one answer.

---

## brand

`getBrand(id)` resolves an entry from the `brands` map; `NEXT_PUBLIC_BRAND`
picks one per deployment. Colour does **not** live here — that is `tokens`.
This file is names, legal text, destinations and storage namespacing.

To launch a differently-branded app: add an entry, set the env var. No
component changes.

---

## ui

Brand-neutral primitives. They read tokens and nothing else: no hex, no
default-palette Tailwind utilities, no brand strings. `packages/ui` is the only
place a control's padding, radius or focus ring is decided.

Two of these carry behaviour worth knowing about:

- **`Field` / `Input` / `Select` / `Textarea` / `Checkbox`** generate their own
  id with `useId` and wire `htmlFor`, `aria-describedby` and `aria-invalid`.
  A control cannot be rendered unlabelled — there is no call site at which to
  forget.
- **`Modal` / `Drawer`** handle Escape, backdrop dismissal, background scroll
  lock, focus trap and focus restore. Do not hand-roll a `fixed inset-0`
  overlay; there were sixteen of those and most were missing at least one.

---

## Enforcement

`eslint.config.mjs` fails the build on raw palette utilities (`bg-gray-100`),
hex literals, size-named radii and `dark:` colour variants. The previous token
layer reached roughly 3% adoption precisely because nothing stopped the next
`bg-gray-100` from being written.

```bash
npx eslint .
```

---

## Adding to the system

1. **A new colour** → add a `[light, dark]` pair to `tokens.js`, run
   `npm run tokens:build`. It appears as a Tailwind utility, a CSS variable, a
   JS value and a Dart constant at once.
2. **A new primitive** → add it to `packages/ui/src/`, export it from
   `packages/ui/index.js`, and add it to `/design-system` in every state it
   supports. If it is not on that page it does not exist.
3. **A commerce-specific composite** (ProductCard, OrderTimeline,
   VariantSelector) → these still live in `components/`. Promote one to
   `packages/commerce-ui` when a second app needs it, not before.
