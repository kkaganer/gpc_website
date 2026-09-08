# Completeness Critique — EXPERIENCE.md drafts

> Produced by an independent critic agent across all seven drafts.
> Adjudications are in `ADJUDICATIONS.md`; the resolved spec is `../EXPERIENCE.md`.

# Completeness Critique — EXPERIENCE.md drafts (7 sections)

Reviewed against `prd.md` (FR-001–024, NFR-001–013) and `ux-shared-context.md`. Findings are ordered by severity within each category.

---

## 1. Coverage holes — PRD requirements with no UX treatment

**Fully uncovered**

| Req | What is missing | Evidence |
|---|---|---|
| **FR-006, criterion 5** — *"Rejected submissions increment a counter an admin can see, so a live attack is visible."* | **Nothing anywhere.** Grep across all seven drafts for a rejected/spam/blocked-submission counter returns zero hits. The moderation queue (`ux-journey-moderation-draft.md` M-S1, §N, pending-count table at lines 1275–1286) surfaces *pending*, *overdue* and *email-failed* counts but never a rejection count. `ux-journey-members-insights-draft.md` §3's stat tiles are members / directory / branches / newsletter / data-requests — no abuse tile. The only mention of the counter's *existence* is `ux-journey-form-config-draft.md:1191`, which says preview must **not** increment "rate-limit counter, honeypot counter, or rejection counter (FR-006)" — i.e. the drafts assume a counter exists but no screen displays it. **NFR-003 inherits the same hole.** | — |
| **FR-024** — the privacy page itself | Only the *call-to-action block* is specified (`ux-journey-rights-errors-draft.md` Screen D-0, "Your data, your call"). FR-024 requires the page to describe **every category of data collected**, **which fields are published and on what lawful basis**, and **the retention period** — and it explicitly **gates launch**. No draft specifies `/privacy`'s content, IA, or named states. Compounded by `ux-journey-consent-disclosure-draft.md:874`, whose Consent A text carries the literal placeholder `«RETENTION_PERIOD — addendum Q8»`, and its own Gap 2 calls this "the single hardest blocker in this section". The retention number is required in two places and drafted in neither. | — |

**Half-covered**

- **NFR-009** — `ux-journey-public-directory-draft.md:705–722` gives an excellent budget for the directory index, but NFR-009 has a second clause: *"the form's initial render adds no more than 50KB gzipped over the existing site shell."* `ux-journey-join-form-draft.md` has **no performance section at all**, despite specifying ~12 net-new components including a 21-cell matrix, a scroll-linked progress rail, and framer-motion on every section. Nobody owns the `/join` budget.
- **FR-005** — the only UX surface is `ux-journey-rights-errors-draft.md` E-02 (JSON-not-HTML error, no PII in logs). That is correct as far as it goes, but FR-005's client-cannot-author-status criterion has no admin-visible confirmation anywhere.
- **NFR-010** — covered for the members list (`members-insights` §3, with an explicit 500KB/2,000-row escape hatch) and the public directory (300 listings). **Not covered for the moderation queue**, which is the view most likely to hold 300 published listings: `moderation` M-S1 specifies `PAGE_SIZE = 25` and "Show 25 more" but never states a bound on the *fetch*, and §0.6 P1 requires the full list to stay mounted across silent refetches.

---

## 2. Contradictions between drafts

### 2.1 The error summary is specified three different ways (highest impact — it is the FR-001 mechanism)

- `ux-journey-join-form-draft.md:88` — *"Renders an `ErrorSummary` `Card` **immediately above section 1**, with `role="alert"`"*, then *"moves focus to **the first offending field**"* (always).
- `ux-journey-rights-errors-draft.md:1720` — *"**Where the summary lives, and why not at the top.** Conventional error summaries sit above the form. On a 320px viewport, a member who has scrolled to the bottom to press Submit would then see nothing happen. So the summary renders **above the submit button**"*, and `:1735` — *"it receives focus **only if** more than one field is in error. For a single error, focus goes straight to the field."*
- `ux-journey-consent-disclosure-draft.md:552` — *"Above the submit button: a **non-live** summary list linking to each bad field… The summary list itself is `role="group"`, **not** live, so it does not double-announce."*

Three positions, three ARIA roles, two focus rules. This is the single control FR-001 names literally, and it cannot be built from these drafts.

### 2.2 Confirmation state: rendered from the payload, or from the persisted result?

- `ux-journey-rights-errors-draft.md:1616` (E-05 honeypot) — *"**Rule: the confirmation is rendered from the request payload the client sent, never from the database result.**"* This is load-bearing: it is how a honeypot-caught bot is prevented from learning it was caught.
- `ux-journey-consent-disclosure-draft.md:1083` (D-4) — *"'What you agreed to'. **Rendered from the consent records actually stored, not from local form state**, so it reflects what the server persisted."*

These are mutually exclusive on the same screen. D-4's rule leaks the honeypot (a discarded submission has no stored consent records) and also leaks FR-007 duplicate state.

### 2.3 Category management: draft/publish vs immediate, and Delete exists vs doesn't

- `ux-journey-form-config-draft.md:296–300` — *"Both changes go live in the same instant… Ash was never offered a Delete"*; `:300` — categories *"reuse the same **NEW** `OptionListEditor` component specified in Screen 2 below, with identical retire/rename/reorder semantics **and the same draft/publish discipline**"*; `:403` — *"**There is no Delete anywhere in this section.** … 'Retiring is reversible; nothing here can be deleted.'"*
- `ux-journey-moderation-draft.md` M-S4 — a wholly different component (`CategoryManager`, `CategoryRow`), **no publish bar at all**, and writes that take effect immediately: `:1207` *"Renamed to 'Sleep & feeding support'. 4 published listings show the new name **straight away**"*. And Delete is real: `:1101` *"│ Delete │ **ENABLED (0 listings)** … Nothing uses this yet, so it can be deleted outright"*, with `:1222` *"`ActionConfirmModal`, `tone: danger`, confirm label **"Delete it"**"*.

Under moderation's model, form-config's Journey B success criterion ("Both changes go live in the same instant — the public form is never in a state where one has landed and the other has not") is unachievable. The two retire dialogs also carry incompatible copy: form-config's *"It disappears from the form **as soon as you publish**"* vs moderation's *"It comes off the form so no new member can pick it."*

### 2.4 Where withdrawal requests live, and who actions them

- `ux-journey-moderation-draft.md:322` and `:440` — a **`Requests`** tab inside `/admin/directory` (the tab strip literally renders `Req 1`), with `:305` *"a removal request appears in the **Requests** tab with its 20-working-day deadline (NFR-005)"*.
- `ux-journey-rights-errors-draft.md` Screen D-6 — a separate route `/admin/data-requests`, its own sidebar entry `{ to: '/admin/data-requests', label: 'Data requests', icon: ShieldCheck }`, its own stat tiles, its own `DeadlinePill`, and D-7's own **"Unpublish the listing"** action.

Same request, two queues, two sidebar items, two action buttons, two deadline components. `DeadlinePill` is described at `:1190` as *"the NFR-005 component; it must be a **single source of truth** so the list, the detail view and the admin-home tile cannot disagree"* — which the moderation Requests tab already breaks.

### 2.5 Form-config version pinning vs E-09's mid-session refetch

- `ux-journey-form-config-draft.md:122–133` — *"The public form fetches its configuration **once, at page load**… the server validates the payload **against the version the member declared**"*, and specifically for a retired option: *"Nothing on screen; the option she can see stays selectable and **her answer is accepted**, because it was live in the version she declared."*
- `ux-journey-rights-errors-draft.md` E-09 (`:1779`) — the submission **is rejected**: *"**That category isn't available any more.** Please pick another one"*, plus *"A single **re-fetch of the whole form config** happens at the same time (labels, help text, required flags may also have changed under her — FR-008)"* and a second alert *"We've refreshed a couple of questions — have a quick look before you send."*

E-09 is unreachable under form-config's model, and its refetch directly contradicts *"Her page is not refetched and does not re-render."*

### 2.6 Directory opt-in reversal: modal vs no modal

- `ux-journey-join-form-draft.md:437` — *"Carla declines the directory after having opted in and typed three fields → **`ConfirmDialog`**, same mechanism as the branch discard: 'Your listing details will be cleared. Nothing is saved and nothing is sent to GPC.'"*
- `ux-journey-consent-disclosure-draft.md:151` — *"Member flips Yes → No after typing → …a quiet inline note under the radio group: 'We've set your business details aside…' **No modal, no confirm dialog.** … Re-selecting 'Yes' **restores everything she already typed, unchanged**."*

Opposite behaviours (destroy vs preserve) and opposite ceremony on the same control.

### 2.7 `sessionStorage` draft of unsubmitted answers: specified vs explicitly unspecified

- `ux-journey-rights-errors-draft.md:1481` — *"On `/join`, state is additionally mirrored to **`sessionStorage`** under a key that is cleared on success"* (relied on again in E-08 and E-15).
- `ux-journey-join-form-draft.md:1844` (Gaps #8) — *"A same-tab-only `sessionStorage` draft of the non-sensitive answers would cost little… but that is **a controller call, not a UX one**. *Currently:* **no mitigation specified.**"*

One draft ships it; the other says it must not be decided by UX.

### 2.8 Status vocabulary — four labels for one state, and Badge is used/not-used

`ux-journey-moderation-draft.md:32` — *"**`Badge` is deliberately not reused here.**"* Statuses are a module-scope `StatusPill` class map with labels **Pending / Live / On hold / Not published / Taken down**.

Meanwhile:
- `ux-journey-members-insights-draft.md:559` — *"`Badge` (existing) — **needs new variants**: … `dir-published`, `dir-pending`, `dir-held`, `dir-rejected`, `dir-unpublished`, `dir-not-requested`"*, and the wireframe renders `[Published]` and `[Not listed]`.
- `ux-journey-rights-errors-draft.md:839` — *"`Badge` (existing) — **needs NEW variants**: `live`, `pending`, `subscribed`, `unsubscribed`, `not-listed`"*, rendering `[ Live on the site ]`.
- `ux-journey-consent-disclosure-draft.md:1080` — *"`Badge` — **NEW variant** `awaiting-review`"* → label **"Awaiting review"**.

So the published state is variously **Live**, **Published**, **Live on the site**; the pending state is **Pending** and **Awaiting review**; and the component is both "deliberately not Badge" and "a new Badge variant". Nobody owns the union of ~30 proposed Badge variants across the five drafts that request them.

### 2.9 Semantic status colours — three palettes

| Role | consent-disclosure | join-form | rights-errors | form-config / moderation |
|---|---|---|---|---|
| Error text | `--color-error-text: #b91c1c` (`:34`) | `#b91c1c` border, `#7f1d1d` on `#fef2f2` (`:1790`) | **`#b3261e`** on `#fdf2f1` (`:16`) | `#b91c1c` (`ActionConfirmModal` danger, `:867`) |
| Warning text | `--color-warn-text: #92400e` (`:32`) | **`#b45309`** (`:1687`) | **`#8a5200`** (`:17`) | `text-amber-800/900` |
| Success text | (surface `#f0fdf4` only) | — | **`#0f7b3d`** (`:17`) | `#166534` (form-config `:645`), `text-green-800` (moderation) |

Three error reds, three warning browns, three greens. `consent-disclosure` Gap 4 asks DESIGN.md to ratify seven tokens; `rights-errors` B.0 defines a fourth set as "one primitive"; neither references the other.

### 2.10 Toasts: introduced globally vs explicitly refused

- `ux-journey-rights-errors-draft.md:2140` — *"Toast enter/exit | Admin only (**NEW global `<Toaster>`** — currently mounted in exactly one file)"*, used by D-6 (`:1203`).
- `ux-journey-form-config-draft.md:646` — *"Introducing a toast here would mean introducing a global toaster for one message, and a toast is **the wrong shape anyway**."*
- `ux-journey-public-directory-draft.md:546` — *"**No toast** — … introducing one for a single confirmation is disproportionate."*
- `ux-journey-members-insights-draft.md:581` — *"do **not** rely on `react-hot-toast` alone, which is used in exactly one file today and has no global `<Toaster>`."*
- `ux-journey-moderation-draft.md:272` — *"**Not a toast**: a toast can be missed."*

Four drafts refuse it; one adds it globally.

### 2.11 The spinner idiom

`ux-journey-rights-errors-draft.md:2145` — *"Spinner (`animate-spin`, the copy-pasted idiom) | Legacy pattern — **not used in this feature** … Replaced everywhere by skeletons or in-button ellipses."* But `join-form` S1 Loading uses *"The existing `animate-spin` idiom"*; `moderation` §0.8 *"Reused verbatim"*; `members-insights` §3.11 extracts it into a shared `Spinner`; `form-config` `:674` uses *"site's existing `animate-spin` idiom"*.

### 2.12 Public description character limit: 300 vs 400

- `ux-journey-consent-disclosure-draft.md:562, 577, 589–592` — **300**, hard-specified with counter strings and a server limit, and Gap 1 owns the number.
- `ux-journey-moderation-draft.md:684` — *"212 of 300 characters"* (agrees).
- `ux-journey-public-directory-draft.md:714, 760` — *"**Recommend ≤400 characters**"*, and the NFR-009 payload maths is computed at 400. Gap 13 restates *"Recommend 400 characters."*

The performance budget is computed against a number a sibling draft has already fixed differently.

### 2.13 Confirmation heading and body — three versions of the same screen

- `join-form` S6: `<h1>` **"You're in, Bea."** + "Thanks for joining… We've saved your answers." + numbered "What happens next" + "We aim to do that within 5 working days."
- `consent-disclosure` D-4: `<h1>` **"Thanks — you're in"** + "We've got your details…" + "1. We check it - **usually within 5 working days**."
- `rights-errors` E-06: **"Thanks, Bea — that's in."** + "…**That's usually a few days.**" + "Nothing you've told us is public until we've checked it with you."

Three headings, three timeframe phrasings, three bodies. `consent-disclosure` Gap 8 already flags that "usually within 5 working days" is a member-facing promise the PRD only makes as an internal median — but the other two drafts restate it anyway in different words.

### 2.14 Skip link: exists or doesn't

- `ux-shared-context.md` gap #7 — *"No skip-to-content link."*
- `ux-journey-public-directory-draft.md:390` and Gap 12 — *"**Correction to the shared context:** item 7 … is inaccurate — one exists at `src/components/layout/Layout.jsx:8-10`."*
- `ux-journey-join-form-draft.md:572` — *"`SkipLink` — **NEW**. Site-wide gap #7."*
- `ux-journey-rights-errors-draft.md:629` — *"a skip-to-content link is added (a11y gap 7)"*.

Two drafts would add a second skip link to pages that already have one. See §4 for the accessibility consequence.

### 2.15 Contact address and canonical domain

- `form-config` `:10` uses `gpc.communitynews@gmail.com` and `:9` declares the canonical domain **`greenwichparentsandcarers.co.uk`** (from `og:url`), using it in four places.
- `rights-errors`, `consent-disclosure` (`:936`, storage contract) and `moderation` (`:982`, `:1269`, inside member-facing email copy) all use **`greenwichparents.co.uk`**.
- `join-form` Gap 6 — *"**No support/contact email address exists anywhere** in the PRD or addendum. Three pieces of microcopy in this section… currently point at 'the address on our privacy page' as a hedge."*

Two domains, one of them baked into a **verbatim-stored consent string** (`consent_text` at `consent-disclosure:936`), and one draft hedging around an address two siblings already found.

### 2.16 FR-007's resubmission state has three names

`moderation` proposes an **Updates tab** (`:270`, Gap 3); `rights-errors` E-06 says *"the moderation queue gains a **`Resubmission` badge** and the listing detail shows a side-by-side 'submitted / published' diff"*; `members-insights` shows it only as an **Activity** entry ("Re-submitted 2 Aug 2026"). Three different data shapes for one PRD clause.

### 2.17 Internal contradiction inside `join-form` — the question count

Journey A header (`:137`) — *"**27 questions visible, 18 required**"*, and D2 (`:61`) — *"'About 5 minutes · 27 questions' for a Business Mum who wants a listing"*. But the Journey A happy-path diagram (`:178`) and Screen S1's wireframe (`:509`) both render *"About 5 minutes · **20 questions**"* for exactly that member, and the diagram annotates *"length signal: 20 → 20 (unchanged)"*. The whole D2.1 anti-abandonment device depends on this number being honest.

---

## 3. Missing named states

**Every screen that has a Named States block has all six**, with explicit N/A justifications — that discipline is genuinely uniform across all seven drafts and I found no omissions within specified screens.

The gap is **screens that exist in the design but have no Named States block at all**:

1. **The admin home / Dashboard.** Four drafts modify it and none specifies it:
   - `moderation:161` — a Dashboard quick-link card where *"the count replaces the `ArrowRight`"*, plus a `batch_failed` banner (`:1271`).
   - `form-config:84–86` — a `quickLinks` entry with a **live status line**: *"Open · 3 unpublished changes" / "Open · up to date" / "Closed since 12 Aug"*, described at `:86` as *"the primary defence against Journey A's biggest failure mode"*.
   - `members-insights:92` — a "Members" stat tile and a "Plan an event from what members told us" link.
   - `rights-errors:1114` — an admin home tile *"Data requests (2)"* which `:344` says *"turns from neutral to the same state"* on overdue.
   No wireframe, no Loading state (four independent counts, all of which `moderation:1286` insists must arrive with the shell, not lazily), no Error state, no Empty state.
2. **`/privacy`** — only the D-0 block is specified; the page FR-024 gates launch on is not.
3. **The moderation "Updates" tab** (`moderation:270`) — a tab with a proposed count, side-by-side diff and approve/dismiss actions, with no wireframe and no states.
4. **`moderation` §N `NotificationStatus`** has a seven-row state table (`disabled/queued/sent/failed/retrying/given_up/not_applicable`) that maps to none of the six named states — acceptable for a component, but it is the FR-021 surface and it never says what its Empty or Loading states are.

---

## 4. Accessibility gaps — inherited rather than fixed

1. **Site gap #10 (primary button fails AA) is inherited *by the skip link itself*.** `public-directory` Gap 12 is the only draft that noticed: the existing skip link *"uses `focus:` (not `focus-visible:`) and paints white on `#fc16a0` (3.64:1), so it fails AA in its own right."* `join-form:572` specifies a **NEW `SkipLink`** with no colours at all; `rights-errors:2135` specifies its motion but not its contrast; `form-config:687` adds one to `AdminLayout` with no contrast spec. Three of the four drafts adding a skip link would ship the failing one. And gap #7's status is itself contested (§2.14).

2. **Site gap #10 is re-inherited via `SubscribersManager`'s pill ramp.** `moderation:42` correctly identifies it: *"the existing `SubscribersManager` map uses `text-green-600` on `bg-green-50` (~3.4:1) and `text-amber-600` on `bg-amber-50` (~3.1:1). **Those fail AA at pill size.**"* But `members-insights:562` instructs the builder to *"Implement as a module-scope class map, **matching the `statusStyles` idiom already in `SubscribersManager`**"* without repeating the correction, and §3.2 also lifts `SubscribersManager`'s private `Tile` verbatim. The failing ramp propagates into the new members list.

3. **Site gap #6 (no 404 route) is not fixed by anyone.** `public-directory` Gap 4: *"`src/App.jsx` has no `path="*"`. Screen D-C covers `/directory/*`, but `/anything-else` still renders an empty `<main>`… it is outside FR-018/019/020, so it is **flagged, not assumed**."* No other draft picks it up. `join-form`'s `/join` has no unmatched-route handling; `members-insights`' `/admin/members/:memberId` has a 404 *state* but no route-level catch-all.

4. **Site gap #2 (no real dialog) is fixed five separate times.** `join-form` `ConfirmDialog` ("the first real dialog in this codebase"), `moderation` `ActionConfirmModal` (with `ConfirmModal` re-implemented over it), `form-config` `Dialog`, `rights-errors` `Dialog` (`:955`, "reused by the moderation queue's reject dialog"), `members-insights` `ExportDialog`. Four of the five claim to be the site's first; only `rights-errors` claims reuse, and it names a component (`ActionConfirmModal`) it does not describe. No single owner, five ARIA contracts.

5. **Site gap #8 (no global `<Toaster>`)** — see §2.10. One draft closes it; four refuse to.

6. **Site gap #5 (`prefers-reduced-motion`)** — every draft honours it per-interaction, but `rights-errors` Gap 12 correctly notes the decision is unowned: *"Decide: apply globally in this change, or scope the reset to the new routes."* Under a scoped reset, the shared components each draft *reuses* (`NewsletterBanner`'s `animate-spin`, `Button`'s `hover:scale-105`, `Events.jsx`'s stagger) keep animating. `join-form:1410` is the only draft that spots this: *"The inherited spinner **must** be gated… This is a change to an existing shared component and is the one place this screen touches code outside `/join`."*

7. **`#fc16a0` at body size:** I found **no violation** — every draft correctly confines the brand pink to focus rings, borders, rails, icons, tints and ≥24px display. One claim needs re-measuring: `members-insights:1092, 1109` puts a `#fc16a0` "best cell" outline on the L5 heat cell whose background is `#2d1b4e`, but justifies it as *"3.64:1 against white"* — the wrong comparison for the pairing actually rendered (it does still clear 3:1 against `#2d1b4e`, ≈4:1, so the conclusion holds and only the stated evidence is wrong).

8. **Live-region count on `/join` exceeds the stated rule.** `rights-errors:2069` — *"It is **one** region reused, not one per message — multiple simultaneous live regions produce interleaved, unintelligible speech."* But on `/join` the drafts together instantiate at least four: `join-form`'s page-level `LiveRegion`, its `ChoiceCount` (debounced 500ms), `consent-disclosure`'s `CharacterCounter` (`aria-live="polite" aria-atomic`, throttled 1.5s), and `consent-disclosure` D-2's separate `role="alert"` error count. `join-form:1779–1785` already calls its own `role="alert"` sequencing *"the one genuinely fiddly rule in this document"*; adding three more regions on the same page makes it worse.

---

## 5. Seams no draft owns

1. **Submit → publish: what the member sees in between.** `join-form` S6 and `consent-disclosure` D-4 both end at *"with us for review"* and route the member to `/privacy` for changes. `rights-errors` D-3 *does* render a listing status (*"Waiting for review"* with a **"Withdraw my request"** button, `:207`) — but `rights-errors`' entry-point list (`:121`) does **not** include the join confirmation, and neither confirmation screen links to `/my-data`. The one screen that answers "what's happening with my listing?" is reachable only by a two-hop `/privacy` → D-0 → D-1 → inbox path that no draft tells the member about at the moment she most wants it.

2. **Admin member record ↔ listing, in one direction only.** `members-insights:94` lists as an entry point *"The moderation queue (FR-015) → a pending listing's **'View full member record'** link"*, and its member detail renders *"[ Open in moderation queue ]"*. But `moderation` M-S1/M-S2 render private member data inline in `PrivateMemberPanel` and their component hierarchies contain **no link to `/admin/members/:id`**. Half the round trip is claimed by one draft and not built by the other.

3. **FR-021 emails have no data-rights footer.** `rights-errors:373` — *"Every email carries, per FR-021: the controller's identity…, a link to `/privacy`, **and the mail-token footer link 'Manage your data or unsubscribe'**"*, and the mail token is entry point #1 for the entire FR-023 journey (`:122`). But `moderation` §N's two member emails (`:1261–1262`) carry only *"Greenwich Parents & Carers CIC 16387545. Data controller: Aster Thackery. How we handle your data: [/privacy]"* — no mail-token footer. The publish email instead says *"Want to change something, or come off the list? **Just reply to this email.**"*, which is precisely the emailing-an-admin-and-waiting that FR-023 exists to remove.

4. **Idempotency key.** `rights-errors` E-15 layer 3 makes it load-bearing — it is what licenses the retry copy in E-01, E-03, E-04 and D-4, and `:2054` says it is *"what makes the E-03 copy ('if you try again we'll make sure you don't end up with two') **a true statement**."* `join-form` S7's `network` row says only *"`Try again` (re-posts the identical payload)"* — no key, no mention, and no Gaps entry. No FR names it; `join-form` Gap 9 flags a form-start timestamp but not this.

5. **`/join` in the public navbar.** `join-form:141` — *"Public navbar item `Join` (new entry in the array at `src/components/layout/Navbar.jsx:8-14`)."* `public-directory:50` — *"**Coordination note:** if the intake section also adds `/join` to the public nav, it should be a `Button`-styled CTA sitting to the right of the nav row, **not a seventh `NavItem`** — seven text links wrap at 1024px. That decision belongs to the intake section; noted here so the two sections do not both edit the same array in conflicting ways."* The intake section did not take the decision, and specified the seventh NavItem.

6. **`AdminLayout` responsiveness.** Flagged as a blocking gap by three drafts independently (`moderation` Gap 6, `form-config` Gap 1, `members-insights` Gap 1), each proposing the same off-canvas drawer + sticky top bar, none owning it, and `form-config` Gap 1 offering an alternative (declare admin desktop-only) that would invalidate every 320px admin wireframe in the other two drafts.

7. **Listing slug/URL.** `public-directory` proposes `/directory/:slug` and Gap 5 raises the killer: *"if the slug regenerates on rename, **every previously shared link breaks and lands on Screen D-C**, which is indistinguishable from the member having withdrawn."* `moderation` Gap 5 raises the identical issue from the other side (FR-021's publish email needs the URL, and FR-016 lets admins rename). Both flag it; neither owns it; `moderation` M-S2's rename flow has no slug consequence at all.

8. **Insights labels ↔ form config.** `members-insights` Gap 5 — *"insights must read labels from the form configuration, not from a hard-coded list"* — and Gap 6 asks what Insights shows when a *question's wording* changed mid-collection. `form-config` owns the config and its versioning model (`config_version`) but never mentions Insights. The read path between the two is unspecified.

9. **Category retire → public filter, at the last listing.** `moderation` Gap 9 and `public-directory` Gap 15 describe the same transition (a retired-but-in-use category stays in the public select until its last listing goes) and both say the other section must be written to match. Neither specifies who removes the option, or what the visitor sees if it disappears while their filtered URL is open.

10. **Data-rights routes.** `rights-errors` Gap 5 — *"No route path is defined for the data-rights journey… The addendum separately notes that a `/unsubscribe` route is absent and promised."* Meanwhile `consent-disclosure:926` makes newsletter consent depend on Brevo opt-out semantics (addendum Q5) and `rights-errors` Gap 2 says erasure may not reach Brevo at all. The newsletter withdrawal path crosses three drafts and lands in nobody's screen.

---

## 6. Vagueness — placeholders where copy is owed

1. **`consent-disclosure:874`** — the highest-stakes string in the feature is a placeholder: *"GPC will keep it for **«RETENTION_PERIOD — addendum Q8»** unless I ask sooner."* This is stored **verbatim** as `consent_text` under version `hold_data@1.0.0`. The draft's own warning (`:879`) is correct and should be read as blocking: *"every day the form is live with a placeholder produces records citing unevidenceable text."*
2. **`moderation:1865`** (E-11 display, and M-S2's email-failed state) — *"Last tried Mon 18 Aug, 21:14. *[error summary]*"*. The one string that tells Ash *why* an email failed is a bracketed placeholder.
3. **`moderation` M-S2 Error (conflict), `:808`** — *"Priya changed this listing while you had it open. **[ See what changed ]** [ Reload and lose my edits ]"*. "See what changed" has no spec — no diff format, no states. `form-config:1303` specifies the equivalent affordance concretely (*"'Weekly Newletter' renamed to 'Weekly Newsletter' by Kristina, 14:20"*), so the pattern exists and was simply not applied.
4. **`members-insights:179, 806, 863`** — *"Copy consent record" → "Plain text on the clipboard"* and *"[ Copy the whole consent record ]"*. The exact serialisation is unspecified, yet this is the artefact Ash reads aloud or pastes into a DSAR reply — and `members-insights:98` makes it a success criterion (*"Ash can read aloud, from one screen, the exact consent wording…"*). Compare `consent-disclosure:936`, which specifies the stored form precisely (*"plain text, with link URLs expanded inline"*); the copy affordance should match it and doesn't say so.
5. **`members-insights:579, 873, 1156`** — error cards render *"the returned message"* / *"+ message +"* with no example string and no bound on what a server may return.
6. **`join-form:1740, 1494`** — *"If it keeps happening, **the contact address is on our privacy page**"* and *"Changed your mind? … **see our privacy page**"*. Both are acknowledged hedges (Gap 6) around an address that `form-config:10` and `rights-errors:1503` both name outright as `gpc.communitynews@gmail.com`.
7. **`moderation:891`** — Hold's member-facing consequence: *"(Whether a held member should ever hear anything is flagged in Gaps found.)"* Hold is one of three first-class decisions and the member-facing half of it is a parenthesis. Same for `moderation` Gap 1: the "Email the member about this" defaults for take-down are *proposed* per reason but the email body for a take-down is never written, while publish and reject bodies are.
8. **`form-config:1383`** (Gap 11) — whether the admin-authored intro/closed message may contain a link is *"Not decided"*, while `join-form` Gap 13 independently asks the same question and `join-form:1378` ships a rendering (`whitespace-pre-line`, no markup) as if it were decided.

---

## One-line summary of what to fix first

The four findings that block build rather than merely need reconciliation: **(a)** FR-006's admin-visible rejection counter and FR-024's privacy-page content have no UX anywhere; **(b)** the error summary (FR-001's named mechanism) has three incompatible specifications; **(c)** category management is specified twice, with opposite persistence models and opposite answers on whether Delete exists; **(d)** `consent-disclosure`'s D-4 "rendered from stored records" defeats `rights-errors`' honeypot non-disclosure rule on the same screen.