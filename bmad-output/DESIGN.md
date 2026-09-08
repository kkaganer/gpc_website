# DESIGN.md — Visual System

> **LOCKED PLANNING ARTIFACT.** The external dev tool reads this document but must
> not edit it. All design changes go through the bmad-ux skill and are recorded in
> `decision-log.md`.

**Project:** GPC Mums in Business & Work — Membership Intake & Community Business Directory
**Track:** BMad Method
**Date:** 2026-08-18
**Version:** 1.0
**Companion:** `EXPERIENCE.md` (journeys, screens, states) · `prd.md` (requirements)

---

## 0. Scope and posture

This is **not** a new design system. GPC has one — four colours and two typefaces in a
20-line `src/index.css` — and this feature must look like the rest of the site. What
follows **extends** that system with the tokens it does not yet have (a working scale
for the brand colour, semantic colours, a border colour that is actually visible) and
specifies the components this feature needs.

Three things below are corrections rather than extensions, because NFR-008 sets WCAG 2.1
AA as the bar and the current palette does not clear it:

| Existing | Measured | Problem | This document's answer |
|---|---|---|---|
| White text on `--color-primary` `#fc16a0` — every primary button on the site | **3.64:1** | Fails AA for normal text (needs 4.5:1) | New `--color-primary-700` `#c9107f` (**5.43:1**) carries white body-size text. `#fc16a0` is retained for large display type and non-text UI. |
| `#fc16a0` as link/body text | **3.64:1** white / **3.51:1** warm | Fails AA | Same: `#c9107f` for text-size pink. |
| `border-gray-200/300` on inputs (`#d1d5db`) | **1.47:1** | Fails WCAG 1.4.11 non-text contrast (needs 3:1) | `--color-border` `#6b7280` (**4.83:1**) on interactive controls. |
| `--color-amber` `#f59e0b` | **2.15:1** on white | Unusable for text or UI | Not used for text. Semantic warning is `#92400e`. |

These corrections apply to the **new** surfaces (`/join`, the directory, the new admin
screens). Retrofitting the rest of the site is out of scope for this feature but is
recorded as a follow-up in `decision-log.md`.

---

## 1. Design Tokens

### 1.1 Color Palette

All values below were verified with a WCAG 2.x relative-luminance calculation. Ratios are
stated against **both** backgrounds in use: white `#ffffff` (cards, inputs) and warm
`#fffaf5` (page background).

**Primary — GPC pink**

| Token | Value | On white | On warm | Usage |
|---|---|---|---|---|
| `--color-primary-100` | `#ffe3f4` | 1.20 | 1.15 | Tint background: selected chips, hover fills, focus halo |
| `--color-primary-200` | `#ffc7e8` | 1.44 | 1.39 | Selected-state background, progress track fill |
| `--color-primary-500` | `#fc16a0` | 3.64 | 3.51 | **Brand colour.** Large display text only (≥24px, or ≥18.66px bold). Non-text UI: borders, icons, dividers, decorative fills. **Never body-size text, and never a fill behind white body-size text.** |
| `--color-primary-600` | `#e0128f` | 4.51 | 4.35 | Hover state for primary-700 surfaces. Passes on white but is marginal on warm — do not use as a resting text colour. |
| `--color-primary-700` | `#c9107f` | **5.43** | **5.24** | **The workhorse.** Primary button fill (with white text), link text, active tab, required-field asterisk. |
| `--color-primary-800` | `#a30d68` | 7.46 | 7.19 | Active/pressed state |
| `--color-primary-900` | `#7d0a50` | 10.34 | 9.97 | Pink text on a pink-100 tint |

**Secondary — GPC deep purple**

| Token | Value | On white | On warm | Usage |
|---|---|---|---|---|
| `--color-dark` | `#2d1b4e` | 15.24 | 14.69 | Headings, secondary button text and border, **focus ring** |

**Semantic**

| Token | Value | On white | On warm | Usage |
|---|---|---|---|---|
| `--color-success` | `#166534` | 7.13 | 6.87 | Published, saved, submitted |
| `--color-warning` | `#92400e` | 7.09 | 6.84 | Pending, awaiting review, unsaved changes |
| `--color-error` | `#991b1b` | 8.31 | 8.01 | Validation errors, rejection, destructive actions |
| `--color-info` | `#1e40af` | 8.72 | 8.41 | Held, informational callouts, the public/private disclosure panel |

Each has a tint for pill and banner backgrounds, all verified ≥4.5:1 with their
foreground:

| Semantic | Text | Tint bg | Ratio |
|---|---|---|---|
| Success | `#166534` | `#dcfce7` | 6.49:1 |
| Warning | `#92400e` | `#fef3c7` | 6.37:1 |
| Error | `#991b1b` | `#fee2e2` | 6.80:1 |
| Info | `#1e40af` | `#dbeafe` | 7.15:1 |
| Neutral | `#374151` | `#f3f4f6` | 9.37:1 |

**Neutral scale**

| Token | Value | On white | Usage |
|---|---|---|---|
| `--color-warm` | `#fffaf5` | — | Page background (existing) |
| `--color-surface` | `#ffffff` | — | Card, input, panel background |
| `--color-neutral-100` | `#f3f4f6` | — | Subtle panel fill, table zebra, disabled input background |
| `--color-divider` | `#d1d5db` | 1.47 | **Decorative rules only.** Never an input border, never a control boundary. |
| `--color-border` | `#6b7280` | **4.83** | Input borders, control outlines, anything the user must perceive as interactive (WCAG 1.4.11) |
| `--color-text-muted` | `#4b5563` | 7.56 | Helper text, timestamps, placeholder text |
| `--color-text` | `#1a1a2e` | 17.4 | Body text (existing) |

> **Placeholder text uses `--color-text-muted`, not a lighter grey.** Placeholder is
> content and must clear 4.5:1. It is never the only label for a field (see §2.4).

---

### 1.2 Typography

**Font families** (existing, unchanged)

| Role | Stack | Weights available |
|---|---|---|
| Heading | `'Poppins', sans-serif` | 600, 700 |
| Body | `'Nunito', sans-serif` | 400, 600, 700 |

**Type scale**

| Role | Mobile (320–767) | Tablet (768–1023) | Desktop (1024+) | Weight | Line-height | Family |
|---|---|---|---|---|---|---|
| H1 (page title) | 30px | 36px | 40px | 700 | 1.2 | Poppins |
| H2 (section) | 24px | 28px | 32px | 700 | 1.25 | Poppins |
| H3 (question / card title) | 20px | 20px | 22px | 600 | 1.3 | Poppins |
| H4 (sub-group) | 18px | 18px | 18px | 600 | 1.4 | Poppins |
| Body | **16px** | 16px | 17px | 400 | 1.6 | Nunito |
| Body strong | 16px | 16px | 17px | 600 | 1.6 | Nunito |
| Helper / caption | 14px | 14px | 14px | 400 | 1.5 | Nunito |
| Legal / consent copy | **16px** | 16px | 16px | 400 | 1.65 | Nunito |
| Input text | **16px** | 16px | 16px | 400 | 1.5 | Nunito |
| Button label | 16px | 16px | 16px | 600 | 1 | Nunito |

**Rules**

- **16px is the floor for anything a user reads or types.** Input text below 16px triggers
  iOS Safari's auto-zoom on focus, which breaks the layout mid-form.
- **Consent copy is body size, never small print.** Shrinking it would undermine the
  informed part of informed consent, which is the point of FR-004.
- Line length capped at ~70 characters (`max-w-prose`) for all body and consent copy.
- Text must resize to 200% without loss of function — no fixed-height text containers.
- One `<h1>` per page. The existing `SectionHeading` primitive always renders `<h2>`, so
  page titles need a different element (see §2.11).

---

### 1.3 Spacing Scale (8px grid)

| Token | Value | Common use |
|---|---|---|
| `--space-1` | 4px | Icon-to-label gap |
| `--space-2` | 8px | Minimum gap between touch targets |
| `--space-3` | 12px | Label-to-input gap |
| `--space-4` | 16px | Standard padding (mobile), gap between form fields |
| `--space-6` | 24px | Card padding, gap between question groups |
| `--space-8` | 32px | Gap between form sections |
| `--space-12` | 48px | Section margin (mobile) |
| `--space-16` | 64px | Section margin (desktop) — matches existing `py-16 md:py-24` |

---

### 1.4 Breakpoints

| Name | Min-width | Container | Notes |
|---|---|---|---|
| Mobile | 320px | 100%, 16px padding | **Primary design target.** No horizontal scroll at 320px. |
| Tablet | 768px | 100%, 24px padding | The site's `md:` — its main and most-used hinge |
| Desktop | 1024px | `max-w-7xl`, 32px padding | The site's `lg:` |
| Desktop XL | 1440px | `max-w-7xl` (1280px) | No separate treatment; the site never uses `xl:` |

Container class, unchanged from the rest of the site:
`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

**Reading width override:** `/join` and any consent or legal copy cap at `max-w-2xl`
(672px) regardless of viewport. A 1280px-wide form is harder to complete, not easier.

---

### 1.5 Elevation & Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(45,27,78,.05)` | Input resting state |
| `--shadow-sm` | `0 2px 4px rgba(45,27,78,.06)` | Card default |
| `--shadow-md` | `0 4px 10px rgba(45,27,78,.10)` | Card hover, sticky bars |
| `--shadow-lg` | `0 8px 20px rgba(45,27,78,.12)` | Dropdowns, popovers |
| `--shadow-xl` | `0 16px 32px rgba(45,27,78,.18)` | Modals |

Shadows are tinted with the brand purple rather than pure black, so they sit correctly
on the warm `#fffaf5` background.

**Shadow is never the sole indicator of anything.** Elevation is decorative; state is
carried by colour *and* a non-colour cue (icon, text, border weight).

---

### 1.6 Border Radius

Follows the site's established radius grammar. Do not introduce new radii.

| Token | Value | Grammar rule | Usage |
|---|---|---|---|
| `--radius-lg` | 8px | icon button | Icon-only buttons, small chips |
| `--radius-xl` | 12px | type-into-it | **All text inputs, textareas, selects** |
| `--radius-2xl` | 16px | holds-content | Cards, panels, modals, banners |
| `--radius-full` | 9999px | press-it-and-it's-text | **All text buttons**, status pills, filter chips |

---

## 2. Component Specifications

Components marked **EXTEND** modify an existing primitive; **NEW** must be built.
Reusing without change is stated explicitly.

---

### 2.1 Button — Primary  **EXTEND** (`src/components/ui/Button.jsx`)

The existing component has `variant`, polymorphic `href`, and fixed `px-6 py-3`. It has
**no size variants, no disabled styling, and no loading state** — all three are required
here and are the extension.

**Visual**

| Property | Value |
|---|---|
| Background | `--color-primary-700` `#c9107f` — **not** `--color-primary-500` |
| Text | `#ffffff`, 16px / 600 (5.43:1 ✅) |
| Height | 48px mobile & tablet · 44px desktop |
| Padding | 12px 24px (existing `px-6 py-3`) |
| Radius | `--radius-full` |
| Min-width | 120px |

**States**

| State | Visual | Non-colour cue |
|---|---|---|
| Default | `primary-700` fill | — |
| Hover | `primary-800` fill | cursor pointer |
| Focus-visible | 2px `--color-dark` outline, 2px offset (14.69:1 on warm) | — |
| Active | `primary-900` fill, no transform | — |
| Disabled | `--color-neutral-100` fill, `--color-text-muted` text, `cursor: not-allowed` | Reason stated in adjacent text, never a bare grey button |
| Loading | Spinner replaces the label's leading edge; label becomes the progress verb ("Sending…"); button disabled | `aria-busy="true"`; spinner has `aria-hidden`, the label carries the meaning |

**Accessibility**

- Touch target ≥44×44px including padding; ≥8px from neighbouring targets.
- Always a real `<button>`; `href` renders `<a>`. Never a `<div onClick>`.
- Focus ring is styled, never removed. `:focus-visible`, so pointer users do not see it.
- Disabled uses `aria-disabled="true"` and stays focusable so a screen-reader user can
  discover *why* it is disabled — a `disabled` attribute would hide the explanation.
- **Known existing bug to avoid:** `mailto:` hrefs currently fall into the `<Link>` branch
  rather than rendering an `<a>`. The directory's enquiry contact depends on this working.

---

### 2.2 Button — Secondary  **EXTEND**

| State | Visual |
|---|---|
| Default | Transparent fill, 2px `--color-dark` border, `--color-dark` text (15.24:1) |
| Hover | `--color-primary-100` fill |
| Focus-visible | Same ring as primary |
| Active | `--color-primary-200` fill |
| Disabled | `--color-border` border and text, no fill |

Same size, radius and touch rules as primary.

---

### 2.3 Button — Destructive  **NEW**

Used for Reject, Unpublish, Delete, Erase. Must be visually distinct from primary — pink
and red are close enough at a glance that a tired admin could confuse Publish with Reject.

| State | Visual |
|---|---|
| Default | `--color-error` `#991b1b` fill, white text (8.31:1) |
| Hover | `#7f1616` fill |
| Focus-visible | 2px `--color-error` outline, 2px offset |
| Disabled | As primary disabled |

**Rules**

- Never adjacent to the primary action. Destructive actions sit apart, or behind a
  confirmation step, or both.
- Always paired with a leading icon **and** an explicit verb ("Reject listing"), never a
  bare "Reject", so colour is not the only signal (WCAG 1.4.1).
- **The existing `ConfirmModal` hard-codes a red "Delete" confirm label.** It must be
  extended to accept the confirm label, the confirm tone, and an optional required reason
  — see §2.9.

---

### 2.4 Text Input / Textarea / Select  **NEW pattern**

The site has no input component; every form hand-rolls its fields with a wrapping
`<label>` and no `htmlFor`/`id` association. This feature establishes the pattern.

| Property | Value |
|---|---|
| Height | 48px (single-line) · textarea min 120px |
| Border | **1px `--color-border` `#6b7280`** (4.83:1 — the current `gray-200/300` fails 1.4.11) |
| Radius | `--radius-xl` (12px) |
| Padding | 12px 16px |
| Font | **16px** — mandatory, prevents iOS zoom |
| Background | `--color-surface` white |

**Anatomy, top to bottom**

```
Label *                        <- 16px/600, --color-text; asterisk --color-primary-700
Helper text                    <- 14px, --color-text-muted, ALWAYS above the input
[ input                     ]  <- 48px, 16px text
⚠ Error message                <- 14px, --color-error, icon + text
```

Helper text sits **above** the input, not below. Below-input helper text is routinely
missed by screen-magnifier users and is covered by the on-screen keyboard on a phone.

**States**

| State | Border / fill | Non-colour cue |
|---|---|---|
| Default | 1px `--color-border` | — |
| Hover | 1px `--color-dark` | — |
| Focus-visible | 2px `--color-primary-700` + 3px `--color-primary-100` halo | — |
| Error | 2px `--color-error` + 3px `#fee2e2` halo | ⚠ icon and message text — never colour alone |
| Success | 2px `--color-success` | ✓ icon |
| Disabled | `--color-neutral-100` fill, `--color-divider` border | Explanation in helper text |
| Character-limited | Counter bottom-right, 14px `--color-text-muted`; turns `--color-error` at 90% | Counter is `aria-live="polite"`, throttled so it does not announce every keystroke |

**Accessibility contract**

- Every input has an `id`, and its `<label>` has a matching `htmlFor`. **This is the
  single most important departure from the current codebase.**
- Helper text and error text are referenced by `aria-describedby` on the input.
- Error message containers carry `role="alert"`.
- `aria-invalid="true"` on a field in error.
- `autocomplete` set where applicable — `given-name`, `email`, `postal-code`, `url`,
  `organization` (WCAG 1.3.5).
- Placeholder is never the only label, and is never used to convey format requirements.
- Validation runs **on blur**, not on every keystroke. Re-validation after an error may
  run on change, so the error clears as soon as the user fixes it.

---

### 2.5 Checkbox & Radio  **NEW pattern**

| Property | Value |
|---|---|
| Control size | 24×24px visual |
| Hit area | **44×44px minimum**, achieved by label padding |
| Border | 2px `--color-border` unselected |
| Selected | `--color-primary-700` fill, white check/dot |
| Focus-visible | 2px `--color-dark` outline, 2px offset, on the control |
| Radius | Checkbox `--radius-lg` (8px); radio `--radius-full` |
| Gap | ≥8px between adjacent options |

**Card-style option** (used for the group choice and other high-stakes single choices):
the whole row is the target — 2px border, `--radius-2xl`, 16px padding; selected state is
`--color-primary-700` border **plus** `--color-primary-100` fill **plus** a check icon.
Never fill alone.

**Grouping**

- Every group is a `<fieldset>` with a `<legend>` carrying the question text. This is what
  lets a screen reader announce "Which group would you like to join? Business Mums, radio
  button, 1 of 3."
- Groups with >8 options get an internal `role="group"` label and, where the options have
  natural structure (the 21 day/time slots), a two-dimensional presentation — see
  `EXPERIENCE.md`, which replaces the source form's flat 21-checkbox list.
- Multi-select groups state the constraint in the legend ("Choose as many as you like");
  single-select groups say "Choose one". The source form's "How often would you like
  events?" is a checkbox group that permits Weekly + Quarterly — it becomes a radio group.

---

### 2.6 Card  **EXTEND** (`src/components/ui/Card.jsx`)

Existing component has **no internal padding**; consumers wrap in `p-6`. Keep that
contract; specify padding per usage.

| Property | Value |
|---|---|
| Background | `--color-surface` white |
| Radius | `--radius-2xl` |
| Padding | 24px (`p-6`) |
| Shadow | `--shadow-sm` default, `--shadow-md` on hover |
| Border | none by default; 1px `--color-divider` when on a white background |

**Directory listing card structure:** Business name (H3) → category pill → description
(clamped to 3 lines) → link icons row. No image at v1 (logo upload is deferred — `FR-D02`).

**Accessibility — the critical rule:** the card is **not** a click target. The business
name is a real `<a>` and is the only navigation affordance. The existing
`LondonEventCard` is a `<div onClick>` and is keyboard-unreachable; that pattern must not
be copied. Making the whole card clickable while keeping it accessible requires a
stretched-link pseudo-element over the anchor — permitted, but the anchor stays the
accessible name and the tab stop.

---

### 2.7 Status Pill  **EXTEND** (`src/components/ui/Badge.jsx`)

Existing variants (`free`, `sold-out`, `new`, `upcoming`, `past`) do not cover moderation.
Add:

| Status | Text | Background | Ratio | Icon |
|---|---|---|---|---|
| Pending | `#92400e` | `#fef3c7` | 6.37:1 | clock |
| Published | `#166534` | `#dcfce7` | 6.49:1 | check-circle |
| Held | `#1e40af` | `#dbeafe` | 7.15:1 | pause-circle |
| Rejected | `#991b1b` | `#fee2e2` | 6.80:1 | x-circle |
| Unpublished | `#374151` | `#f3f4f6` | 9.37:1 | eye-off |

14px / 600, `--radius-full`, 4px 12px padding. **Icon plus text always** — never colour
alone (WCAG 1.4.1). Icons are `aria-hidden`; the text is the accessible name.

> **Do not copy `SubscribersManager`'s pill ramp.** Its `text-green-600` on `bg-green-50`
> (≈3.4:1) and `text-amber-600` on `bg-amber-50` (≈3.1:1) **fail AA at pill size**. Reuse the
> module-scope class-map *idiom*; use the verified values above, not its values.
> (Adjudication A15.)

---

### 2.8 Public / Private Disclosure Panel  **NEW** — the signature component

The component that carries FR-003's guarantee. It appears at the directory opt-in and
must be legible to someone tired, on a phone, who will not read a paragraph.

| Property | Value |
|---|---|
| Container | `--radius-2xl`, 2px `--color-info` border, `#dbeafe` fill, 16px padding |
| Heading | "What other people will see" — H4, `--color-info` |
| Two lists | 🌍 **Public** and 🔒 **Private**, stacked on mobile, side-by-side ≥768px |
| Item | 16px body, leading icon, one field per line, in the member's own words where possible |

**Rules**

- The private list is **never** collapsed, truncated, or behind a disclosure toggle. It is
  the reassurance; hiding it defeats the component.
- It updates live as the member types, echoing their actual entered values, so "what
  people will see" is literal rather than abstract.
- Emoji are decorative and `aria-hidden`; the list headings carry the meaning.
- Marked up as two `<ul>`s under real headings, so a screen reader can navigate to
  "Private" directly.
- Colour is `--color-info` (blue), deliberately not brand pink: this is an informational
  guarantee, not a promotional element.

---

### 2.9 Modal / Dialog  **NEW** (extends `ConfirmModal`)

The existing `ConfirmModal` takes `{ title, message, onConfirm, onCancel }`, hard-codes a
red "Delete" confirm button, and — like every modal on the site — has **no `role="dialog"`,
no focus trap, and no Escape handling**. All three are required here.

| Breakpoint | Presentation |
|---|---|
| Mobile | Bottom sheet, full width, `--radius-2xl` top corners only |
| Tablet+ | Centred, `max-w-lg`, `--shadow-xl` |

**Extended props:** `confirmLabel`, `confirmTone` (`primary | destructive`),
`requireReason` (renders a required textarea — used by Reject, FR-015).

**Accessibility contract (all mandatory)**

- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing at the title.
- Focus moves to the dialog on open — to the first interactive element, or the heading if
  the first control is destructive.
- Focus is trapped: Tab cycles within the dialog.
- Escape closes and returns focus to the triggering element.
- Background content is `inert` / `aria-hidden` while open.
- The backdrop is not the only dismissal route.

---

### 2.10 Inline Banner (error / success / info)  **NEW**

| Property | Value |
|---|---|
| Container | `--radius-2xl`, 1px semantic border, semantic tint fill, 16px padding |
| Structure | Icon → title (16px/600) → body (16px) → optional action button |

| Type | Colours | ARIA |
|---|---|---|
| Error | `--color-error` on `#fee2e2` | `role="alert"` |
| Success | `--color-success` on `#dcfce7` | `role="status"` |
| Warning | `--color-warning` on `#fef3c7` | `role="status"` |
| Info | `--color-info` on `#dbeafe` | none (static content) |

**Form-level error summary** (shown on failed submit): an error banner listing every
invalid field as a link to that field.

- It renders **above the submit button**, not at the top of the form. On a 320px screen a
  member who has scrolled down to press Submit must see the result without hunting for it.
- Focus moves to the summary **always**, regardless of the error count, so a screen-reader
  user hears the total before navigating. One unconditional rule; no count-dependent branch.
- `role="alert"`.

This is the standard the site currently has no equivalent for. (Adjudication A1.)

---

### 2.11 Page Heading  **NEW**

`SectionHeading` always renders `<h2>` and so cannot be a page title. Each new page needs
an `<h1>`: 30px/700 Poppins mobile → 40px desktop, `--color-dark`, optional 16px
`--color-text-muted` subtitle beneath. `SectionHeading` continues to serve `<h2>`s within
the page.

---

### 2.12 Loading / Skeleton  **NEW**

The spinner idiom is copy-pasted across the codebase and never extracted:
`animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent`.
Retained visually, and **extracted into one shared `Spinner` component that honours
`prefers-reduced-motion` internally** (adjudication A7). This is the one change this feature
makes to a shared component outside its own routes, and it is deliberate: a scoped
reduced-motion reset would leave every reused component still animating.

| Context | Treatment |
|---|---|
| Page load (directory) | Skeleton cards matching the real card's shape and count (6) |
| Inline action (save, publish) | Spinner inside the button; label becomes the progress verb |
| Filter/search re-query | Existing results dim to 50% opacity; **layout does not collapse** |

**Accessibility**

- A `role="status"` `aria-live="polite"` region announces "Loading directory" and then
  "24 businesses found". The site has exactly one such region today (`NewsletterBanner`);
  every async surface in this feature needs one.
- The spinner is `aria-hidden`; the live region carries the meaning.
- Under `prefers-reduced-motion: reduce`, the spinner does not rotate — a static
  indicator plus the live region conveys the state.
- Skeletons never pulse under reduced motion.

---

### 2.13 Navigation  **REUSE**

Public nav: add one entry to the array at `src/components/layout/Navbar.jsx:8-14`; the
same array drives the desktop row and the mobile drawer. Admin nav: add rows to
`sidebarLinks` at `src/components/admin/AdminLayout.jsx:5-16`
(`{ to, label, icon, end?, comingSoon? }`).

**Skip link — correction to a widely-repeated claim.** A skip-to-content link **already
exists**, at `src/components/layout/Layout.jsx:8-10`, wrapping every public page. Do not add
a second one to public pages. Two defects in the existing one must be fixed:

- It uses `focus:` rather than `focus-visible:`.
- It paints white on `--color-primary` `#fc16a0` — **3.64:1, failing AA**. It must move to
  `--color-primary-700`.

`AdminLayout` has no `Layout` wrapper and genuinely needs a skip link added.

**Other additions required by NFR-008, absent site-wide today:**

- `aria-current="page"` on the active nav item.
- The mobile drawer follows the dialog contract in §2.9 (trap, Escape, focus return).
- **`AdminLayout` becomes responsive** below 768px: off-canvas drawer plus a sticky top bar.
  It is currently desktop-only, which blocks three admin screens in `EXPERIENCE.md`
  (adjudication A21).

---

## 3. WCAG 2.1 AA Contract

Scope: `/join`, the directory index, and a listing detail page (NFR-008), plus the new
admin screens, which are held to the same bar because admins use assistive technology too.

### 3.1 Colour contrast — verified pairs

| Pair | Ratio | AA Normal | AA Large | Notes |
|---|---|---|---|---|
| Body `#1a1a2e` on warm `#fffaf5` | 16.44:1 | ✅ | ✅ | Existing |
| Heading `#2d1b4e` on warm | 14.69:1 | ✅ | ✅ | Existing |
| **White on primary button `#c9107f`** | **5.43:1** | ✅ | ✅ | **Corrected — `#fc16a0` was 3.64:1 ❌** |
| Link `#c9107f` on white | 5.43:1 | ✅ | ✅ | Corrected |
| Link `#c9107f` on warm | 5.24:1 | ✅ | ✅ | Corrected |
| Helper / placeholder `#4b5563` on white | 7.56:1 | ✅ | ✅ | |
| Error `#991b1b` on white | 8.31:1 | ✅ | ✅ | |
| Error `#991b1b` on `#fee2e2` | 6.80:1 | ✅ | ✅ | |
| Success `#166534` on `#dcfce7` | 6.49:1 | ✅ | ✅ | |
| Warning `#92400e` on `#fef3c7` | 6.37:1 | ✅ | ✅ | |
| Info `#1e40af` on `#dbeafe` | 7.15:1 | ✅ | ✅ | |
| **Input border `#6b7280` on white** | **4.83:1** | — | — | ✅ 1.4.11 (needs 3:1). **`#d1d5db` was 1.47:1 ❌** |
| Focus ring `#2d1b4e` on warm | 14.69:1 | — | — | ✅ 1.4.11 |
| Brand `#fc16a0` — large text ≥24px only | 3.64:1 | ❌ | ✅ | Permitted **only** at large sizes and for non-text UI |
| `--color-amber` `#f59e0b` on white | 2.15:1 | ❌ | ❌ | **Not used for text or UI in this feature** |

Regenerate any pair with:
`python3 "$CLAUDE_PLUGIN_ROOT/skills/bmad-ux/scripts/contrast-check.py" #fg #bg`

### 3.2 Keyboard & focus

- Every interactive element reachable by Tab; tab order follows reading order.
- Focus indicator: **2px solid `--color-dark`, 2px offset**, via `:focus-visible`.
  `outline: none` without a visible replacement is prohibited. The site has no
  focus-visible styling anywhere today.
- Skip-to-content link on every page.
- Modals and the mobile drawer: focus trapped, Escape closes, focus returns to trigger.
- On failed submit, focus moves to the error summary banner (§2.10).
- When the form's branch changes, focus stays on the group control; the new section is
  announced by a live region rather than by stealing focus.
- No keyboard trap anywhere. No functionality is pointer-only.

### 3.3 Touch & sizing

- Touch targets ≥44×44px on mobile and tablet, ≥8px apart.
- No horizontal scroll at 320px (WCAG 1.4.10). Verified on the 21-slot day/time control
  and the admin tables, which are the two real risks.
- Text resizes to 200% without loss of content or function.
- Works in portrait and landscape (1.3.4).
- Admin tables scroll within their own container, never the page body.

### 3.4 Semantic structure

- One `<h1>` per page; no skipped heading levels.
- Landmarks on every page: `<header>`, `<nav>`, `<main>`, `<footer>`.
- Every input: `<label htmlFor>` + matching `id`. Every group: `<fieldset>` + `<legend>`.
- Errors: `role="alert"` + `aria-describedby` + `aria-invalid`.
- Async updates: `aria-live="polite"`; errors `role="alert"`.
- `<button>` for actions, `<a>` for navigation — never a `<div onClick>`.
- Images: descriptive `alt`, or `alt=""` when decorative.
- Tables: `<th scope>` + `<caption>`.
- Colour is never the sole carrier of meaning — every status has an icon and a label.
- `autocomplete` on name, email, postcode, URL, organisation (1.3.5).

### 3.5 Motion

`prefers-reduced-motion: reduce` is honoured on every animation in this feature. The site
currently honours it nowhere while using framer-motion throughout, so this is new work.

| Animation | Reduced-motion fallback |
|---|---|
| Card grid stagger fade-in | Instant, no stagger |
| Branch reveal on group change | Instant, no height transition |
| Spinner rotation | Static indicator + live region |
| Skeleton pulse | Static block |
| Modal / bottom-sheet entry | Instant |
| Banner slide-in | Instant |

No animation is the sole carrier of meaning. Nothing auto-plays, flashes, or moves
without user action. Nothing flashes more than three times per second (2.3.1).

### 3.6 Out of scope for this contract

Retrofitting the existing site's ten documented accessibility gaps beyond the pages named
above. This feature must not *inherit* them; fixing `LondonEventCard`, the existing
modals, and the missing 404 route is separate work, logged in `decision-log.md`.

---

## 4. Design Decisions

| Decision | Rationale | Alternatives considered |
|---|---|---|
| Primary button fill becomes `#c9107f`, not brand `#fc16a0` | White on `#fc16a0` measures **3.64:1** and fails AA for 16px text. NFR-008 makes AA a hard requirement. `#c9107f` measures 5.43:1 and is the same hue, so it still reads as GPC pink. | *Darken the label instead* — dark text on `#fc16a0` is 4.18:1, still failing, and looks unfinished. *Enlarge button text to 24px* — absurd on mobile. *Accept the failure* — contradicts NFR-008. |
| `#fc16a0` retained for large display text and non-text UI | It passes at 3:1, which is the correct threshold for large text and for UI components. Removing it entirely would drain the brand from the page for no accessibility gain. | Dropping it altogether — rejected as over-correction. |
| Input borders move from `#d1d5db` to `#6b7280` | The current border is **1.47:1** and fails WCAG 1.4.11's 3:1 requirement for control boundaries. On the warm background it is close to invisible for low-vision users. | A tinted-fill input with no border — rejected as a larger departure from the site's look than darkening a line. |
| The public/private disclosure is a persistent panel, not a tooltip or a line of small print | FR-003 requires the split to be understood at the point of collection. Bea's stated fear is her home address becoming public; a tooltip she never opens does not address it. Live-echoing her actual values makes the guarantee concrete. | *A footnote* — the pattern that produced the problem. *A modal on opt-in* — one-shot, dismissible, unavailable when she needs it while typing. |
| The disclosure panel is blue (`--color-info`), not pink | It is a factual guarantee, not a promotion. Brand pink here would read as marketing and be discounted. | Brand pink — rejected as undermining the panel's credibility. |
| Consent copy is 16px body text, never small print | Consent must be informed to be valid, and it is stored verbatim and versioned (FR-004). Setting it in 12px grey would be evidence of the opposite. | 14px — rejected; the legal artifact should not be the least readable text on the page. |
| Helper text sits above the input, not below | On a phone, below-input helper is covered by the keyboard exactly when it is needed. | Below (the common convention) — rejected on mobile grounds. |
| Status is always icon + text, never colour alone | WCAG 1.4.1, and pink/red proximity in this palette makes Publish and Reject genuinely confusable at a glance for a tired volunteer. | Colour-only pills — rejected. |
| Cards are not click targets; the title anchor is | The existing `LondonEventCard` is a `<div onClick>` and is unreachable by keyboard. Repeating it would fail NFR-008 on the directory index. | Copying the existing card — rejected. |
| The existing radius grammar is kept unchanged | It is consistent across the site and carries meaning (pill = press it, 12px = type into it). A new feature is not a reason to break it. | A fresh radius scale — rejected as gratuitous. |
| Reading width capped at `max-w-2xl` on `/join` | A 25-question form at 1280px wide is harder to scan, and long line lengths hurt completion. Directly serves NFR-007. | Full container width — rejected. |
| `--color-amber` is not used | 2.15:1 on white; unusable for text or UI. It is already effectively unused in the codebase. | Using it for "pending" — rejected on contrast; `#92400e` used instead. |

| Error summary sits above the submit button, and always takes focus | On a 320px screen, a top-of-form summary is invisible to someone who scrolled down to submit. A single unconditional focus rule beats a count-dependent one for a solo maintainer. | *Top of form* — rejected on mobile. *Focus the field when there is only one error* — rejected as a conditional that will drift. |
| One shared `Spinner`; reduced-motion reset applied globally | A reset scoped to new routes leaves every reused component still animating — the exact failure the requirement exists to prevent. | Scoped reset — rejected. |
| No global toast provider | A toast can be missed and cannot be re-read; wrong shape for a moderation decision or a save confirmation. Four of five UX drafts independently refused it. | `react-hot-toast` globally — rejected as disproportionate for one message. |
| One `Dialog` primitive, with `ConfirmModal` rebuilt on it | Five independently-specified dialogs would mean five ARIA contracts and five chances to omit the focus trap. | Per-screen dialogs — rejected. |

Full rationale and the alternatives thread: `decision-log.md`, entries dated 2026-08-18.
Cross-draft conflicts and their resolutions: `ux-drafts/ADJUDICATIONS.md`.

---

*Part of the BMAD Planning & Orchestrator plugin. Produced by the `bmad-ux` skill.*
