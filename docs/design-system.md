# GPC design system

Extracted from the live site and `src/` on 4 September 2026. Every value here is
the **resolved** one — Tailwind v4 oklch tokens converted to hex, not rounded to a
4/8px grid. Visual companion: the design canvas (see bottom of this file).

Source of truth in code: `src/index.css` (`@theme`), `src/utils/constants.js`
(`BRAND`), `src/components/ui/`.

---

## 1. Colour

### Brand tokens — `src/index.css`

| Token | Hex | Class | Use |
|---|---|---|---|
| `--color-primary` | `#fc16a0` | `bg-primary` `text-primary` | CTAs, active nav, links, the 64×4 section underline, focus rings |
| `--color-dark` | `#2d1b4e` | `bg-dark` `text-dark` | All headings, footer, dark bands, image scrims, gradient end-stop |
| `--color-warm` | `#fffaf5` | `bg-warm` | Page ground — set on `body`, shows through every unpainted section |
| `--color-amber` | `#f59e0b` | `bg-amber` | **Declared but never used.** See the note below |

Body text colour is `#1a1a2e`, set on `body` in `index.css` (not a `@theme` token).

> **The amber fork.** `--color-amber` creates the class `bg-amber`, *not*
> `bg-amber-500`. The "New" badge and the newsletter band reach for Tailwind's own
> ramp instead — `#fe9a00` and `#fffbeb`. Pick one and retire the other.

### Neutrals — Tailwind defaults, resolved

| Class | Hex | Use |
|---|---|---|
| `text-gray-700` | `#364153` | Hero lede, testimonial copy, About story, policy pages |
| `text-gray-600` | `#4a5565` | Body copy, card meta, section subtitles |
| `text-gray-500` | `#6a7282` | Fine print, quote roles — the lightest text allowed |
| `gray-400` | `#99a1af` | "Past" badge — but also carrying tile text today at 2.6:1 |
| `border-gray-100` | `#f3f4f6` | Nav and drawer hairlines |
| `bg-gray-50` | `#f9fafb` | Card image wells |

### Status colours (badge variants)

| Variant | Hex | Class |
|---|---|---|
| `upcoming` | `#fc16a0` | `bg-primary` |
| `free` | `#00c950` | `bg-green-500` |
| `sold-out` | `#fb2c36` | `bg-red-500` |
| `new` | `#fe9a00` | `bg-amber-500` |
| `past` | `#99a1af` | `bg-gray-400` |

### Gradients

Tailwind v4 interpolates in oklab — keep `in oklab` or the midpoint goes muddy.

```css
/* Primary buttons, stats band. The only gradient that carries white text. */
linear-gradient(to right in oklab, #fc16a0, #2d1b4e)

/* Icon tiles. Deepens to primary/25 → dark/15 on card hover. */
linear-gradient(to bottom right in oklab, #fc16a026, #2d1b4e1a)

/* Scrim under any caption laid on a photo. Never skip it. */
linear-gradient(to top in oklab, #2d1b4ecc, #2d1b4e33, transparent)
```

### Alpha tints in circulation

`primary/5` secondary-button hover · `primary/10` active drawer link ·
`primary/15` pull-quote mark · `white/10` fields on dark · `white/20` borders on
dark · `white/60` footer text · `dark/[0.04]` community-tile border

---

## 2. Typography

Two faces, loaded in `index.html` from Google Fonts. **Poppins sets headings,
Nunito sets everything else.** Only the shipped weights exist — never call for
Poppins 400 or 800.

- **Poppins** 600, 700 — applied globally to `h1`–`h6`, plus `font-heading`
- **Nunito** 400, 600, 700 — set on `body`; default for copy, buttons, nav,
  badges, fields, and (by omission) the big stat numbers

### Ramp

| Role | Size / line-height | Weight | Classes |
|---|---|---|---|
| Page h1 | 48 / 60 | 700 | `text-3xl sm:text-4xl md:text-5xl leading-tight` |
| Section h2 | 36 / 40 | 700 | `text-3xl md:text-4xl` |
| Band h2 | 30 / 36 | 700 | `text-2xl md:text-3xl` |
| Featured title | 24 / 32 | 700 | `text-2xl` |
| Card title | 20 / 28 | 700 | `text-xl` |
| Tile title | 14 | 600 | `text-sm font-semibold` |
| Pull quote | 24 / 39, italic | 400 | `text-xl md:text-2xl leading-relaxed` |
| Stat number | 48 | 700 | `text-4xl md:text-5xl font-bold` (Nunito, not Poppins) |
| Hero lede | 18 / 29 | 400 | `text-base sm:text-lg leading-relaxed text-gray-700` |
| Body | 16 / 24 | 400 | `text-base text-gray-600` |
| Meta / small | 14 / 20 | 400 | `text-sm text-gray-600` |
| Button + link | 14 | 700 | `text-sm font-bold` |
| Nav | 14 | 600 | `text-sm font-semibold` |
| Fine print | 12 / 16 | 400 | `text-xs text-gray-500` |
| Badge | 12, uppercase | 700 | `text-xs font-bold uppercase` |
| Eyebrow | 10, uppercase | 700 | `text-[10px] tracking-wide` |

Uppercase appears **only** on badges and eyebrows.

---

## 3. Components

### Button — `src/components/ui/Button.jsx`

Base: `inline-flex items-center justify-center px-6 py-3 text-sm font-bold
rounded-full focus:ring-2 focus:ring-primary focus:outline-none`

| Variant | Fill | Height |
|---|---|---|
| `primary` | `bg-gradient-to-r from-primary to-dark text-white`, `hover:scale-105` | 44px |
| `secondary` | `bg-white text-primary border-2 border-primary`, `hover:bg-primary/5` | 48px |
| `outline` | `bg-transparent text-white border-2 border-white`, `hover:bg-white/10` | 48px |

One primary per view — it is the only element allowed to carry the gradient.
`outline` is for dark bands and image overlays only.

> **Drift to fix.** Four-plus elements bypass `Button.jsx`: a 36px `py-2 px-5`
> Subscribe, a 48px flat-pink `px-7 py-3.5` WhatsApp CTA, a hand-rolled gradient
> anchor in `NewsletterForm.jsx`, and the whole admin area, which uses
> `rounded-xl` gradient buttons rather than pills. The public site and the admin
> area are effectively two button systems.

### Card — `src/components/ui/Card.jsx`

`bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden`

No border — depth is entirely the shadow, which is why cards need the warm ground.
A white card on a white band disappears.

**Event card anatomy:** image well `bg-gray-50 h-56 sm:h-64 p-2` with the image
`object-contain` (event posters are portrait and text-heavy; letterboxing beats
cropping) → body `p-6`: badge → `mt-2` h3 → `mt-2`/`mt-1` meta rows with 16px
icons → `mt-3` copy `line-clamp-2` → `mt-4` secondary button.

### SectionHeading — `src/components/ui/SectionHeading.jsx`

```
h2   font-heading text-3xl md:text-4xl font-bold text-dark
p    text-gray-600 mt-2
div  w-16 h-1 bg-primary mt-4 rounded-full
```

Centred by default, left-aligned with `align="left"`. The 64×4 pink pill is the
signature — keep it even when it feels optional.

### Field on dark

`rounded-full py-2 px-4 text-sm w-48 bg-white/10 text-white border
border-white/20 placeholder-white/50 focus:border-primary`. Submit is **flat
pink**, not the gradient.

A second, undocumented input pattern exists: the What's On submit modal uses
`mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm
focus:ring-2 focus:ring-primary/50` on ten controls. Reconcile them.

### Community tile

`bg-white rounded-2xl p-4 border border-dark/[0.04] shadow-[0_1px_3px_rgba(45,27,78,0.06)]`
→ hover `shadow-[0_8px_30px_rgba(252,22,160,0.12)] -translate-y-0.5 duration-300`.
36px icon tile, `rounded-xl`, gradient fill, 16px primary icon. Collapses to a
`rounded-full` `bg-white/10` pill below `sm`.

### Navbar

`sticky top-0 z-50 h-16 bg-warm/95 backdrop-blur-sm border-b border-gray-100`,
container `max-w-7xl px-4 sm:px-6 lg:px-8`. Active item: `text-primary` plus a 2px
bottom pill. (The logo is `h-16` inside an `h-16` bar — it fills edge to edge.)

### WaveDivider — `src/components/ui/WaveDivider.jsx`

```
viewBox="0 0 1440 70"  preserveAspectRatio="none"  h-[50px] md:h-[70px]
d="M0,40 C180,70 360,0 540,35 C720,70 900,10 1080,40 C1260,70 1380,20 1440,30 L1440,70 L0,70 Z"
```

`fill` = the colour of the band **below**. `flip` → `transform: scaleY(-1)`.

**Not currently mounted** — `WaveDivider.jsx` has no importers.

### Elevation ladder

```
0 1px 3px #2d1b4e0f                                          tile rest
0 4px 6px -1px #0000001a, 0 2px 4px -2px #0000001a           shadow-md, card rest
0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a         shadow-lg, card hover
0 20px 25px -5px #0000001a, 0 8px 10px -6px #0000001a        shadow-xl, mobile drawer
0 8px 30px #fc16a01f                                         the one tinted shadow
```

### Radii

`rounded-full` buttons, badges, pills, fields, the underline · `rounded-2xl` 16px
cards, photos, modals · `rounded-xl` 12px icon tiles · `rounded-lg` 8px drawer
links · `rounded` 4px focus targets. **Nothing has a square corner.**

---

## 4. Layout

The page is a stack of full-bleed colour bands with a centred container inside
each. **No two adjacent bands share a background.**

Home page order:

| Band | Background | Padding |
|---|---|---|
| Newsletter bar | `bg-dark` | `py-3` |
| Hero | `bg-warm` | `py-16 md:py-20` |
| What happens here | `bg-white` | `py-20` |
| Testimonials | (warm shows through) | `py-16 md:py-24` |
| Find your people | `bg-dark` | `py-14 md:py-28` |
| Newsletter | `bg-amber-50` | `py-16` |
| Footer | `bg-dark` | `py-6` |

The gradient band (`from-primary to-dark`, `py-16 md:py-20`) lives in
`Stats.jsx`, which **no page imports** — it ships nowhere today.

**Gutters:** `px-4 sm:px-6 lg:px-8` (16/24/32) on the `7xl` containers. Narrow
sections — testimonials, newsletter, pull quote — use bare `px-4`.

**Container widths** — narrower means more intimate; the width is the hierarchy
signal, not the type size:
`max-w-7xl` 1280 default · `max-w-6xl` 1152 quotes, footer · `max-w-5xl` 1024
stats · `max-w-3xl` 768 pull quote · `max-w-xl` 576 newsletter

**Grid gaps:** `gap-3` 12 mosaic · `gap-4` 16 hero photos (md) · `gap-6` 24 card
grids, stats · `gap-8` 32 hero columns · `gap-10` 40 stats (md) · `gap-12` 48 hero
columns (md)

**Imagery:** candid and unposed, real families, no stock. `aspect-[3/4]` hero pair
· `aspect-[4/3]` featured (with scrim) · `aspect-square` Instagram mosaic. Always
`object-cover` at `rounded-2xl` — except event posters, which sit `object-contain`
in a `gray-50` well so their text survives.

---

## 5. Motion — framer-motion

Four presets, all short, all entrance-only. Nothing loops, nothing bounces, and
every scroll reveal is `viewport={{ once: true }}` so the page settles and stays
settled. The one exception is the `animate-spin` loading state.

| Preset | Definition | Used on |
|---|---|---|
| Fade | `opacity 0→1`, `duration 0.6` | Hero text, section wrappers (featured event is 0.5) |
| Rise | `opacity 0→1, y 20→0`, `duration 0.4` | Community tiles (testimonials use `y: 30`) |
| Pop | `opacity 0→1, scale 0.8→1`, `duration 0.5` | Stat numbers only |
| Drawer | `x '100%'→0`, tween `duration 0.25` | Mobile menu, over a `black/40` backdrop |

**Stagger:** stats `delay: i * 0.15` · mosaic `i * 0.08` · tiles
`min(i * 0.05, 0.5)` — long lists cap the delay so the tail never lags.
**Trigger margin:** `-30px` activity rows, `-40px` cards, `-50px` pull quote.
**Hover:** `scale(1.05)` primary button · `scale(1.03)` WhatsApp CTA ·
`-translate-y-0.5` community tile · `duration-300`.

---

## 6. Contrast — measured

| Pair | Ratio | Where | AA |
|---|---|---|---|
| `#2d1b4e` on `#fffaf5` | 14.7:1 | Every heading | Pass |
| white/60 on `#2d1b4e` | 6.3:1 | Footer text | Pass |
| `#4a5565` on `#fffaf5` | 7.3:1 | Body copy | Pass |
| `#6a7282` on `#fffaf5` | 4.7:1 | Fine print — the floor | Pass |
| `#fc16a0` on `#fffaf5` | 3.5:1 | 14px bold pink links | **Fail** |
| white on `#fc16a0` | 3.6:1 | Subscribe button, badges | **Fail** |
| `#99a1af` on `#ffffff` | 2.6:1 | Community tile descriptions | **Fail** |

**The pink problem.** `#fc16a0` clears 3:1, so it is fine as a fill, a border, an
icon, the underline, and any text at 24px or 18.66px bold. It does not clear
4.5:1, so 14px bold pink links and white-on-pink button labels miss AA today.
A text-only companion — `#d1067f`, 5.0:1 on warm and 5.2:1 on white — would let
`#fc16a0` keep doing the decorative work unchanged. *Not in the codebase yet.*

Focus is handled on `Button`, the nav items and the newsletter field, and that
ring clears 3:1 on both grounds. It is **missing entirely** from the footer
links, the hero contact links and the WhatsApp CTA, and the two modals use
`focus:ring-primary/50` instead.

---

## 7. Using this in Claude Design

Paste the block below at the top of a design prompt, then describe the screen.

```
Design for Greenwich Parents & Carers (GPC), a Greenwich family community.
Voice: warm, plain, welcoming — "Come as you are", never corporate.

FONTS   Poppins 600/700 for all headings; Nunito 400/600/700 for everything else.
COLOUR  #fc16a0 primary (CTAs, active nav, the 64x4 underline)
        #2d1b4e dark (every heading, dark bands, footer, scrims)
        #fffaf5 warm (page ground)
        text: #1a1a2e body, #4a5565 copy, #6a7282 fine print. Nothing lighter.
        Gradients only as: linear-gradient(to right in oklab, #fc16a0, #2d1b4e)
TYPE    h1 48/60 · h2 36/40 · card h3 20/28 · body 16/24 · meta 14/20 · fine 12/16
        Uppercase only on badges (12px bold) and eyebrows (10px bold).
SHAPE   Buttons/badges/fields are rounded-full pills. Cards and photos are 16px
        radius. Icon tiles 12px. No square corners anywhere.
CARDS   bg white, 16px radius, no border, shadow 0 4px 6px -1px #0000001a,
        0 2px 4px -2px #0000001a; hover to the 10px/15px shadow.
BUTTONS Primary: pink→purple gradient pill, white 14px bold, 24x12 padding, 44px.
        Secondary: white fill, pink text, 2px pink border, 48px.
        One primary per view.
LAYOUT  Full-bleed colour bands, no two adjacent bands the same. Section padding
        64px, 80px at md. Container max 1280, gutters 16/24/32.
HEADING Section heading = h2, 16px gap, gray-600 subtitle, then a 64x4px pink
        rounded pill underneath. Always.
MOTION  Entrance only. Fade 0.6s, rise (y20) 0.4s, pop (scale .8) 0.5s. Never loop.
IMAGERY Candid, unposed, real families. object-cover at 16px radius. Any caption
        over a photo needs a dark scrim.
AVOID   Square corners, stock photography, more than one primary button, pink text
        below 18px, gray lighter than #6a7282 for text, looping animation.
```

---

## 8. Open inconsistencies

Four things this document records as *what ships*, not *what is intended*:

1. `--color-amber` is declared but unused; the visible amber comes from Tailwind's
   ramp (§1).
2. Two buttons bypass `Button.jsx` (§3).
3. Community tile descriptions use `gray-400` at 2.6:1 (§6) — should be
   `gray-500`.
4. Pink text and white-on-pink miss WCAG AA at 14px (§6).
5. `WaveDivider.jsx`, `Stats.jsx` and `PullQuote.jsx` have **no importers** — they
   are specified here but ship on no page.
6. Focus styles are missing from several links and CTAs (§6).
7. The What's On modal runs a second input pattern (§3).

---

**Design canvas:** https://claude.ai/code/artifact/f6c8f481-a4d0-4289-8694-3348ee0df680
