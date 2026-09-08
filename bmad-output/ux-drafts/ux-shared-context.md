# UX Shared Context — GPC Membership Intake & Community Business Directory

Read this before drafting any UX section. Authoritative for tokens, personas and constraints.
Source docs: `bmad-output/prd.md`, `bmad-output/addendum.md`,
`bmad-output/inputs/tally-form-RG1M6K-structure.md`,
`bmad-output/inputs/codebase-constraints-brief.md`.

## Brand intent

Greenwich Parents & Carers — a community CIC, 1,800+ members, founded 2021.
Tagline: "Local parents running events and activities for local families."
Values: Inclusivity, Kindness, Connection. Warm, human, unfussy — not corporate SaaS.
The audience is mothers, mostly on phones, often one-handed, often interrupted.

## Design tokens — existing (`src/index.css`, the entire design system)

```css
@theme {
  --color-primary: #fc16a0;   /* hot pink  */
  --color-dark:    #2d1b4e;   /* deep purple */
  --color-warm:    #fffaf5;   /* page background */
  --color-amber:   #f59e0b;   /* effectively unused */
  --font-heading: 'Poppins', sans-serif;  /* weights 600/700 only */
  --font-body:    'Nunito',  sans-serif;  /* weights 400/600/700 */
}
body { background: var(--color-warm); color: #1a1a2e; }
```

**Measured contrast (critical):**

| Pair | Ratio | AA normal (4.5) | AA large (3.0) |
|---|---|---|---|
| `#fc16a0` text on white | **3.64:1** | ❌ FAIL | ✅ |
| `#fc16a0` text on `#fffaf5` | **3.51:1** | ❌ FAIL | ✅ |
| **white text on `#fc16a0`** (the current primary button) | **3.64:1** | ❌ **FAIL** | ✅ |
| `#2d1b4e` on `#fffaf5` | 14.69:1 | ✅ | ✅ |
| `#1a1a2e` body on `#fffaf5` | 16.44:1 | ✅ | ✅ |
| `#f59e0b` amber on white | 2.15:1 | ❌ | ❌ |

**Consequence:** the brand pink may NOT carry body-size text in either direction.
Use `--color-primary-700: #c9107f` (5.43:1 on white, 5.24:1 on warm) for button fills
carrying white text, for link text, and for any text under 24px / 18.66px-bold.
`#fc16a0` is retained for large display type, decorative fills, and non-text UI
(borders, icons, focus rings) where the 3:1 threshold applies. Do not "fix" this by
lightening the text.

## Radius grammar (established, follow it)

- press-it-and-it's-text → `rounded-full`
- type-into-it → `rounded-xl`
- holds-content → `rounded-2xl`
- icon button → `rounded-lg`

## Layout conventions (established)

- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Section rhythm: `py-16 md:py-24`
- Headings: `text-3xl md:text-4xl`
- `md:` is the primary breakpoint (105 uses); `xl:` is never used.

## Existing UI primitives (`src/components/ui/`)

- `Button` — `{ variant: 'primary'|'secondary'|'outline', href?, className, ...rest }`.
  Polymorphic. Fixed `px-6 py-3`. **No size variants, no disabled styling, no loading state.**
  All three gaps must be specified as extensions.
- `Card` — `{ children, className }`, **no internal padding** (consumers add `p-6`).
- `SectionHeading` — `{ title, subtitle, align, showUnderline }`. Always an `<h2>` —
  cannot serve as a page `<h1>`.
- `Badge` — `{ variant, children }`; variants `free | sold-out | new | upcoming | past`.
  Moderation status pills need new variants.
- `ImageUpload` — `{ value, onChange }`; `onChange` receives a URL string.
- Spinner idiom (copy-pasted, never extracted):
  `<div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />`

## Reference implementations to match

- Listing + filters: `src/pages/WhatsOn.jsx` + `src/components/whatson/EventFilters.jsx`
  (flat filter state; dependent controls **dimmed + disabled**, never hidden; 600ms
  debounced postcode with three-state border feedback).
- Card grid: `src/pages/Events.jsx` — `grid grid-cols-1 md:grid-cols-2 gap-8`, `delay: i*0.1` fade-in.
- Public form → API: `src/components/home/NewsletterBanner.jsx` — five-state machine
  (`idle | submitting | success | partial | error`); the site's **only**
  `role="status" aria-live="polite"` region.
- Admin list with PII: `src/pages/admin/SubscribersManager.jsx` — `PAGE_SIZE = 100`
  "Show N more", reset on filter change; selection as a `Set`; status pills as a
  module-scope class map; stat tiles computed over the full set, not the filtered set.
- Admin form: `LondonEventForm.jsx` — module-level `emptyForm`, four state atoms,
  `|| ''` hydration, a single `set(field, value)` updater, native HTML validation only,
  one inline red banner, `navigate()` away on success.
- Admin nav: one array at `src/components/admin/AdminLayout.jsx:5-16`
  — `{ to, label, icon, end?, comingSoon? }`.
- Public nav: one array at `src/components/layout/Navbar.jsx:8-14`.

## Accessibility gaps in the current site — NFR-008 requires NOT inheriting these

1. No `htmlFor`/`id` pairing anywhere — wrapping-`<label>` only.
2. No modal is a real dialog: no `role="dialog"`, no `aria-modal`, no focus trap, no Escape.
3. `LondonEventCard` is a `<div onClick>` — keyboard-unreachable.
4. No `focus-visible` styling anywhere.
5. `prefers-reduced-motion` never honoured (framer-motion used throughout).
6. No 404 route.
7. No skip-to-content link.
8. `react-hot-toast` used in exactly one file; no global `<Toaster>`.
9. No public text-search pattern exists anywhere on the site — the directory search is net-new.
10. Primary button fails AA (above).

## Personas

- **Bea — Business Mum.** Runs a small local business (childminder, coach, baker,
  therapist). Wants clients and visibility. Will fill in a longer form *if* she can see
  the payoff. Anxious about her home address and personal email becoming public — she
  works from home. Phone, evenings, tired.
- **Carla — Career Mum.** Employed or returning after leave. Wants support and
  connection, **not** a listing. Will abandon if asked business questions that do not
  apply. Phone, in fragments, often between other tasks.
- **Ash — GPC admin.** Volunteer, not technical. Moderates in short bursts on a laptop.
  Needs the queue to be obvious and decisions to be two clicks. Must never have to open
  a database.
- **Priya — public visitor.** A local parent looking for, say, a photographer or a
  sleep consultant. Arrives from Instagram or the newsletter, on a phone, low patience.
  Has no account and never will.

## Platform targets

Mobile-first, 320px minimum, no horizontal scroll. Breakpoints 320 / 768 / 1024 / 1440,
implemented with the site's existing `md:` (768px) as the primary hinge.
Modern evergreen browsers; iOS Safari matters most.

## Non-negotiable UX constraints from the PRD

- **FR-003** — the directory opt-in must state, adjacent to the fields, exactly which
  fields become public and that the signup email, postcode and survey answers do not.
- **FR-004** — three separate consents, none pre-ticked; the newsletter consent is always
  optional; consent copy links to the site's own `/privacy` page.
- **FR-002** — changing the group answer discards the abandoned branch's answers; hidden
  branch questions are never validated as required.
- **NFR-007** — median completion ≤ 5 minutes; a Career Mum declining the directory
  answers **zero** business questions.
- **NFR-008** — WCAG 2.1 AA on `/join`, the directory index, and a listing detail page.
- **FR-020** — submitted text is rendered as plain text, never as markup.
- Public listing shows **only**: business name, category, description, website,
  Instagram, public enquiry contact. **No location of any kind is published.**

## Source-form defects the UX must fix (not reproduce)

1. Directory opt-in collects nothing publishable; a Career Mum opting in yields an empty entry.
2. Email is the only contact captured; publishing it would expose a personal address.
3. "Looking for work" appears twice in the career situation list.
4. "How often would you like events?" is a checkbox group, so Weekly + Quarterly is submittable.
5. A single undifferentiated consent tick covering data-holding only.
6. No consent versioning or timestamp.
7. Typo: "Weekly Newletter".
8. Postcode is unvalidated free text.
9. Every branch question is required, including open-text ones — abandonment risk.
10. No spam protection.
