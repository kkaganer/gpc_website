## 2. The directory opt-in and consent

**Covers:** FR-003, FR-004, NFR-004, NFR-006 — with FR-015 (expectation-setting), FR-020 (plain text), FR-008 (editability boundary). Screens are prefixed `D-`; blocks marked `[shell]` belong to the `/join` form-shell section. Tokens, input/checkbox/card/pill/banner specs and the WCAG contract are fixed in **DESIGN.md** and referenced here, never restated. The three consent texts below are **deliverables**, stored verbatim and versioned (NFR-004): changing one costs a version bump and a second cohort of records citing different text, so they are the one thing here that must not be paraphrased.

### Journey J2 — "Do I want to be findable, and what does that cost me?"

**Goal:** a member reaches an informed, unhurried decision about being listed publicly, gives or withholds three separate permissions, and leaves knowing exactly which of her details are now on the internet and which are not.

**Persona:** Bea, Business Mum — phone, evening, tired, works from her kitchen table, genuinely frightened of her home address or personal email appearing on a public page. Secondary: Carla, Career Mum, who must pass through this whole journey in two taps and answer zero business questions (NFR-007).

**Time:** ~15s declining (one radio, two consent boxes); ~2m10s opting in (20s reading the disclosure, ~90s on six fields, ~20s on three consents) — both inside the NFR-007 five-minute budget with the rest of the form. **Entry points:** sequential scroll through `/join` after "Community & Involvement" (the normal path) · deep link `/join#directory` · return from a failed submit, focused into this section · `/join` re-entry after a rejected listing (FR-015), with no special case.

**Success criteria:** a member who opted in can state unprompted that her email and postcode are not published · a Career Mum who declines is never shown a business field and is never blocked by one · every stored submission carries 2 or 3 consent records with verbatim text, version, UTC timestamp and capture method, and none is stored with a required consent missing · zero fields collected here that are not either published (FR-003 list) or required to evidence a consent (NFR-006) · directory opt-in among Business Mums ≥60% (PRD metric).

**Happy path**

```
  [shell] /join, scrolled to the Directory section -> D-1  Directory opt-in
        (payoff copy + at-a-glance disclosure + Yes/No radio)
        |
   +----+-------------------------------------------------+
   | "No, not right now"     "Yes, please - list my business"
   |                                                       v
   |                    D-2  Your listing details: public/private panel
   |                         above field 1; name . category .
   |                         description (300) . website . instagram .
   |                         enquiry email . "what happens next"
   +----+-------------------------------------------------+
        v
  D-3  Privacy & consent: A hold_data REQUIRED . B publish_listing REQUIRED
       WHEN SHOWN . C newsletter OPTIONAL. None pre-ticked; each links to
       /privacy.
        v
  [shell] Submit -> server -> D-4  Submitted: what happens next
```

**Decision points**

| Trigger | Display | Recovery |
|---|---|---|
| Selects "Yes, please — list my business" | D-2 mounts in DOM order after the radio fieldset. Shared polite region: *"Directory details opened. Six more questions below."* | Selecting "No" removes it. |
| Selects "No, not right now" | D-2 unmounts; Consent B disappears from D-3 entirely — absent from the DOM, not disabled and not greyed. Shared polite region: *"Directory details closed. Your business details won't be submitted."* Values stay in component memory only. | Re-selecting "Yes" restores everything she typed, unchanged. |
| Flips Yes → No **after typing** | As above, plus a quiet inline note under the radio group: *"We've set your business details aside. They won't be submitted. Choose 'Yes' again to bring them back."* **No modal, no confirm dialog** — preserving is cheaper than re-typing six fields. | Re-select "Yes". |
| Types her sign-up email into the public contact field | Inline warning below the field plus a confirmation checkbox; submit blocked until she changes it or ticks. | Change the address (warning goes, tick resets to unticked) **or** tick *"I understand this address will be public. Use it anyway."* |
| Description crosses 300 characters | At ≤30 remaining the counter turns `--color-warning` (no error, no block); past 300 it reads *"N characters over the limit"* and the textarea takes the §2.4 error border. **Nothing is truncated and typing is never blocked.** | Delete characters until the count is positive. |
| Submit, opt-in = Yes, listing fields empty | Per-field errors; summary per §2.10. Below the last field error, an escape hatch: *"Not ready to write a listing? Change my answer to 'No, not right now'."* | Fill the fields, **or** take the escape hatch — it flips the radio to No, unmounts D-2 and Consent B, clears the errors, and lets the form submit. |
| Submit with Consent A unticked | Error on Consent A. There is no path to submit without it and the copy says so. | Tick it. |
| Submit, opt-in = Yes, Consent B unticked | Error on Consent B with two named routes out. | Tick it **or** follow the inline link *"change your directory answer"*, which scrolls to and focuses the D-1 radio group. |
| Category taxonomy in flight, then zero rows (FR-017) | In flight: `<select>` disabled, `aria-busy`, *"Loading categories…"*. Zero rows or a failed fetch: disabled, *"No categories available right now"*; helper becomes *"We'll choose a category for you when we review your listing."*; the required rule is suspended. | She submits normally; the listing enters the queue flagged `category_missing` so a moderator must set one before publishing. |
| Website / Instagram entered without a scheme | No error. Normalised server-side (`greenwichparentsandcarers.co.uk` → `https://…`; `@handle` → `https://instagram.com/handle`). | N/A — deliberately forgiving. |

**Drop-off notes**

- **The disclosure is both the risk and the cure.** Hedging ("we may publish some details") loses Bea; a blunt two-column list that names the postcode outright keeps her. Vagueness here reads as evasion.
- **The description is the longest dwell on `/join`**, near the four-minute mark. Mitigated by a helper that says how long it should be and a counter framed as permission ("300 characters left"), not quota ("0/300"). No minimum length — a thin description is a moderation problem (FR-016), not a reason to block a member at 9pm.
- **Blocking on the same-email warning is a calculated risk:** one extra tap for the member with one address, against a personal inbox on an indexed page, which is unrecoverable in a way an abandonment is not. The confirm copy is written to be tickable without shame — "use it anyway", not "are you sure?". **Three consent boxes can read as bureaucracy**, so they come last, stay short, mark the optional one visibly optional, and give each required one a one-line "why"; a Career Mum sees two boxes, not three.
- **Consent B is where an opted-in member may reverse** — "search engines can index them" is the first concrete moment. That reversal is a success, but only if it is cheap: hence the inline link back to D-1 and the preserve-don't-destroy rule.
- **"Why hasn't my listing appeared?" is a post-submission loss of trust**, so the review expectation appears twice: in D-2 before she submits, making the wait part of the deal she agreed to, and again in D-4.

#### Screen D-1 — Directory opt-in

**Purpose:** present the payoff and the cost in one eyeful, then take a single unambiguous yes/no — answerable "No" by a Career Mum without her reading anything else.

```
|<------------------ 320px ------------------>|
|  == The GPC member directory ========= (h2) |
|  intro paragraph (copy below)               |
|  +-------------------------------------+    |
|  |  AT A GLANCE   (copy below)         |    | Card, DESIGN.md 2.6
|  +-------------------------------------+    |
|  <fieldset><legend> Would you like to be    |
|   included in the GPC member directory?     |
|  helper (copy below)                        |
|  +-------------------------------------+    |
|  | (o) Yes, please - list my business  |    | card-style radios,
|  +-------------------------------------+    | DESIGN.md 2.5, full
|  | ( ) No, not right now               |    | width
|  +-------------------------------------+    |
|  </fieldset>   on "Yes", D-2 mounts below,  |
|  in DOM order, no modal                     |
```

**Copy.** Intro: *"The directory is a public page on this site where local parents can find businesses run by GPC members. It's free, and you can ask us to take your listing down at any time."* At a glance: *"Six things go public. Your email, postcode and survey answers never do."* Helper under the legend: *"Open to everyone — you don't need to have chosen 'Business Mums' above."* *Differences only:* ≥768px the two radio cards sit side by side and the intro and "At a glance" card sit 60/40, so the whole decision is above the fold; ≥1024px content caps at `max-w-2xl`. Copy is identical at every breakpoint.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Section renders | Neither radio selected; no error; no D-2 panel | `<fieldset>`/`<legend>` carries the question; `aria-describedby` → help-text id |
| Loading | N/A — static config already fetched with the form; if the whole config is loading, `[shell]` owns the skeleton and this section is not mounted | — | — |
| Empty | N/A — a fixed binary defined in code, not in the taxonomy or form config | — | — |
| Error | Submit with neither radio selected | *"Please choose yes or no — we need to know whether to list you."* below the group | Error `<p id>` appended to the fieldset's `aria-describedby`; linked from the §2.10 summary |
| Success | N/A at screen level — success is the whole-form outcome on D-4 | — | — |
| Disabled | Form closed by an admin (FR-009) | Whole section unmounts with the form; individual radios are never disabled | — |

**Accessibility (non-obvious only)**

- **No focus moves when "Yes" is selected.** The panel is inserted immediately after the fieldset in DOM order, so the next Tab lands on the first new field; moving focus would rip a screen-reader user out of the radio group before she has heard her choice register. The reveal is announced once through the page's single polite region (A13). The radios carry **neither `aria-expanded`** (invalid on a radio) **nor `aria-controls`** (poorly supported, unnecessary with DOM-adjacent insertion).
- **Deliberate divergence from `EventFilters.jsx`**, which dims dependent controls: declining **removes** the panel. Dimming six business fields in front of Carla presents them as work she is failing to do and breaks NFR-007. Hiding is right for a branch, dimming for a filter.
- **Editability boundary:** the intro and question label are admin-editable (FR-008); the "At a glance" card is **not** — it is a factual statement about system behaviour, and an admin editing it could make the site's disclosure untrue without anyone noticing.

#### Screen D-2 — Your listing details

**Purpose:** collect exactly the six publishable fields and make the public/private boundary impossible to misread while she is typing into it. This is where NFR-006 is honoured or quietly broken.

```
|<------------------ 320px ------------------>|
|  --- Your listing details ----------- (h3)  |
|  +=====================================+    |
|  | What other people will see     (h4) |    | Panel per DESIGN.md
|  | (globe) PUBLIC - anyone can see(h5) |    | 2.8: stacked at 320,
|  |   6 items (listed below)            |    | side-by-side >=768px,
|  | (lock) PRIVATE - never shown   (h5) |    | --color-info; items
|  |   6 items (listed below)            |    | echo her typed values
|  |  closing line (copy below)          |    | live as she types.
|  +=====================================+    |
|  Business or practice name *                | every field: label,
|  helper text (table below)                  | then helper ABOVE
|  [                                     ]    | the input (2.4)
|  Category *      [ Choose a category   v ]  | native <select>
|  Short description *   [ textarea      ]    |
|                        300 characters left  |
|  Website (optional) . Instagram (optional)  |
|  Email for enquiries *  [Shown publicly]    | Badge inside <label>
|  [                                     ]    |
|  +-------------------------------------+    |
|  |! That's the email you signed up with|    | warning banner 2.10,
|  |  [ ] I understand this address will |    | body copy below
|  |      be public. Use it anyway.      |    |
|  +-------------------------------------+    |
|  +--- WHAT HAPPENS AFTER YOU SUBMIT ---+    | 3 steps, copy below
```

*Differences only:* ≥768px Website and Instagram sit side by side — every other field stays full width, including the description and the enquiry email, which must never be visually diminished; ≥1024px the "What happens after you submit" box moves to a right-hand rail, never sticky. Copy is identical at every breakpoint and no disclosure text is ever truncated responsively.

**Panel content** (its presentation is DESIGN.md §2.8's). **Public:** business name · category · short description · website · Instagram · public contact email. **Private:** your first name · your sign-up email · your postcode · your answers about your business or career · your event preferences · anything you typed in a comment box. Marked up as two `<ul>`s under real `<h5>`s — **not a table**: the rows do not pair, and a `<table>` invites a screen reader to read "Business name" and "Your first name" as related. Glyphs are `aria-hidden`; the headings carry the meaning. Its closing line reads *"We never publish your location. Not your postcode, not your area, not a map."* The panel sits **above the first field and stays there** — FR-003 says "adjacent to the fields", and a disclosure that requires a tap has not been made.

**"What happens after you submit" copy:** *"1. We check your listing — we usually review new listings within a week. 2. If it's all fine, we publish it and email you the link. 3. If something needs changing, we'll email and explain."* then *"Your listing won't appear straight away. That's normal, not a fault."*

| Field | Req | Helper text, verbatim, above the input | Limit (FR-006) | Type |
|---|---|---|---|---|
| Business or practice name | ✔ | "This is the name shown at the top of your listing." | 80 | `text`, `autocomplete="organization"` |
| Category | ✔ (suspended if taxonomy empty) | "Pick the one that fits best. Local parents use these to filter the directory." | must match a live category id | native `<select>`, **generated from the directory taxonomy** (A3) |
| Short description | ✔ | "One or two sentences about what you do and who you help. This is the main thing people read. Plain text only — links and formatting won't show." | **300**, rejected not truncated | `textarea`, no `maxlength` |
| Website | — | "You can leave off the https:// — we'll add it." | 200 | `url`, `inputmode="url"`, `autocomplete="url"` |
| Instagram | — | "Your handle or the full link — either works." | 100 | `text`, `inputmode="url"` |
| Email for enquiries | ✔ | "This is the address your listing will show, so anyone can see it. Use a business address, or a free address you're happy to make public — not the personal one you signed up with." / "Don't have one? A free address like yourbusiness@gmail.com works well." | 254 | `email`, `inputmode="email"`, **`autocomplete="off"`** |

`autocomplete="off"` on the enquiry email is deliberate: autofill would otherwise offer exactly the personal address this field exists to avoid. The warning banner's body copy is *"If you use it here, it will be shown on your public listing where anyone — including people sending spam — can see it. Most members use a separate address for enquiries."*

| Condition | Error message |
|---|---|
| Business name empty | "Please add the name you'd like shown on your listing." |
| Category not chosen | "Please choose a category so people can find you." |
| Description empty | "Please add a short description — it's the main thing people read." |
| Description over limit | "Your description is {N} characters too long. Please shorten it to 300 characters or fewer." |
| Website unparseable | "That doesn't look like a web address. Try something like greenwichparentsandcarers.co.uk" |
| Instagram unparseable | "That doesn't look like an Instagram handle or link. Try @yourbusiness" |
| Enquiry email empty | "Please add an email address for enquiries — it's how people will reach you." |
| Enquiry email malformed | "That doesn't look like an email address. Check for a typo." |
| Enquiry email = sign-up email, unconfirmed | "Please either use a different email for enquiries, or tick the box to confirm you're happy for your sign-up address to be public." |

**Counter.** "{N} characters left" from 300 down to 1, then "0 characters left", then "{N} characters over the limit". Tone rides §2.4's threshold: neutral to 31 left, `--color-warning` from 30, `--color-error` past the limit. Per **A13** the counter does **not** own a live region — it writes into the page's single shared polite region, throttled to at most one announcement every 1.5s, and stays silent until fewer than 30 characters remain. An un-throttled counter on a 300-character field is a screen-reader denial of service.

**The public enquiry contact field** does not exist on the source form and is the whole reason the directory is safe for Bea. Its second helper sentence names a free alternative because the PRD names "members use their personal email anyway" as a live risk, and an alternative converts better than a warning.

- The `Shown publicly` badge sits **inside the `<label>`**, so the accessible name is "Email for enquiries, shown publicly, edit text, required". Public-ness is part of the name, not a visual afterthought.
- **Match detection:** trimmed, lower-cased comparison against the sign-up address, also matching after normalising `+tag` suffixes and — for `gmail.com`/`googlemail.com` only — after removing dots from the local part. Anything more elaborate is over-fitting. Runs on blur and on a 400ms debounce.
- **The warning is advisory, not corrective:** it never rewrites or clears the field. It sits inside the field's `aria-describedby` and is announced once through the shared polite region. Editing to a non-matching value removes it **and resets the checkbox to unticked**, so an old confirmation can never silently authorise a new address. The acknowledgement is recorded as `enquiry_contact_matches_signup: true` so a moderator can query it before publishing — it is **not** a consent record, and conflating a UI acknowledgement with consent evidence pollutes the evidence.
- **Q3/Q4 (ADJUDICATIONS §C):** base case is email, shown in the clear. If Q3 becomes member's choice, a radio group is inserted above the field and label/type/validation/warning switch with it, with a phone-specific warning; recommendation is **email only for v1**. If Q4 resolves to a relay, the field is unchanged but "Email for enquiries" moves to the **private** column and Consent B must reissue as `publish_listing@2.0.0` — a versioning event, and the strongest argument for settling Q4 before the first live submission.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Opt-in = Yes, nothing typed | Panel, six empty fields, counter at "300 characters left", "What happens next" box | `id`↔`htmlFor` on every field; `aria-describedby` lists helper id (plus counter id on the textarea); `aria-required="true"` on the four required fields |
| Loading | Category taxonomy in flight | Only the `<select>` is affected — disabled, option "Loading categories…"; every other field usable | `aria-busy="true"`; resolution is **silent** — announcing "Categories loaded" would be noise |
| Empty | Taxonomy resolves with zero rows | `<select>` disabled, option "No categories available right now"; helper replaced; `*` removed; submission proceeds | `aria-disabled` + updated `aria-describedby`; category excluded from client validation, server flags `category_missing` |
| Error | Submit with missing/invalid fields | Per-field border and message per §2.4; summary above the submit button per §2.10; escape-hatch `Button` below the last field error | `aria-invalid="true"`; error `<p id>` appended to that field's `aria-describedby`; **focus always moves to the summary** (A1), each summary row a link to its field |
| Success | N/A at screen level — no per-section save; success is the whole-form outcome on D-4 | — | — |
| Disabled | Whole-form submission in flight | Inputs disabled, section dimmed | `[shell]` sets `aria-busy` on the `<form>` |

**Accessibility (non-obvious only)**

- Heading ladder `<h3>` → `<h4>` → `<h5>`×2, no level skipped. The `<h5>`s are visually small but are real headings, because they are the semantic carrier of the entire disclosure. Verify in the manual NFR-008 pass that the "Public" `<h5>` is announced before its first list item; if a tested reader skips it, add a visually-hidden prefix per `<li>` rather than restructuring.
- Required fields use `aria-required="true"` and a visible `*` but **not** native `required` — browser bubbles pre-empt our error handling and are neither stylable nor reliably announced. Category is a **native `<select>`** so iOS uses the platform picker; a custom listbox would be a needless keyboard and VoiceOver risk on the one page that must not have any.
- **Data minimisation (NFR-006):** six fields and nothing else, every one in the FR-003 public list. Nothing is collected here "for admin use". A future field that is not published belongs in the private member record — the panel's contract with the member is that *everything in it is public*.

#### Screen D-3 — Privacy & consent

**Purpose:** take two or three separate, un-pre-ticked permissions in language a parent can read at 9pm without a lawyer, and capture the evidence NFR-004 demands. Replaces the source form's single undifferentiated tick, the live GDPR exposure named in the PRD.

```
|<------------------ 320px ------------------>|
|  == Privacy & consent ================ (h2) |
|  Each of these is a separate choice.        |
|  Nothing is ticked for you.                 |
|  +-------------------------------------+    | each card: checkbox +
|  | [ ] CONSENT A - hold_data  REQUIRED |    | the full consent
|  |     + helper (both verbatim below)  |    | sentence + a 14px
|  +-------------------------------------+    | helper. The sentence
|  ... Consent B renders ONLY if she opted in .| IS its accessible name.
|  +-------------------------------------+    |
|  | [ ] CONSENT B - publish_listing     |    | B's helper carries an
|  |     REQUIRED WHEN SHOWN + helper    |    | in-page link back to
|  +-------------------------------------+    | the D-1 radio group.
|  +-------------------------------------+    |
|  | [ ] CONSENT C - newsletter [Optional]|   |
|  +-------------------------------------+    |
|  controller footnote (copy below)           |
|  ---- [shell] error summary + submit ----   |
```

*Differences only:* the consent cards stay full width and stacked at **every** breakpoint — a three-across row invites treating them as one decision, which is the defect being fixed; ≥768px text caps at `max-w-2xl`. Each consent is a `Card` (§2.6) with a checkbox per §2.5, and **the card as a whole is not clickable** — only the checkbox and its label text are, so a thumb scrolling the card cannot accidentally consent. The controller footnote below the group reads *"Who holds your data: Greenwich Parents & Carers CIC (company 16387545). Read the full privacy notice."* — FR-021 requires controller identity on every email, and carrying it at the point of collection too costs one line.

##### The consent artifact register — THE DELIVERABLE

Stored verbatim with each submission (FR-004, NFR-004). Any change to a `text` value is a version bump, not an edit.

**Consent A — `hold_data@1.0.0`** · Required always. Submission is rejected server-side without it and no partial member record is created.

> Yes — Greenwich Parents & Carers CIC can keep the information I've given here, and use it to run the Mums in Business & Work community, contact me about it, and plan events. GPC won't sell it, and won't share it with anyone outside GPC without telling me first. I can ask to see it, change it or have it deleted at any time, and GPC will do that within 20 working days. GPC will keep it for **«RETENTION_PERIOD — addendum Q8»** unless I ask sooner. I've read the [privacy notice](/privacy).

> ⛔ **UNRESOLVED — blocks first live submission.** `«RETENTION_PERIOD — addendum Q8»` is a literal placeholder and **must not go live**. The published GDPR policy makes the consented period the retention basis, so the text has to name one; every day the form runs with a placeholder produces records citing unevidenceable text. This section does **not** invent a period — it is the controller's decision (ADJUDICATIONS §C, Q8). The sentence is drafted both ways so answering Q8 is a drop-in, not a rewrite:
> - **(a) a fixed period** — "GPC will keep it for **___ years** unless I ask sooner." *Only the number is missing.*
> - **(b) no fixed period** — "GPC will keep it for **as long as I'm part of the community**, and delete it within 20 working days of my asking." *No number needed.*
>
> Either way the string ships as `hold_data@1.0.0`; the placeholder version is never used for a live submission.

*Helper (not stored, freely editable):* "You can't join without this one — it's how we're allowed to hold your details at all."

**Consent B — `publish_listing@1.0.0`** · Required only when the member opted into the directory; absent from the DOM otherwise.

> Yes — GPC can publish my business name, category, description, website, Instagram and public enquiry contact on the public directory page of the GPC website, where anyone can see them and search engines can index them. My name, sign-up email, postcode and survey answers stay private. I can ask GPC to take my listing down at any time and they'll remove it within 20 working days. I've read the [privacy notice](/privacy).

*Helper (not stored):* "We only need this because you asked to be listed. [Change your directory answer](#directory) if you'd rather not." Every clause of the consent is working: it **names the six published fields**, because a consent that does not name what is published is not specific consent; "…and search engines can index them" is the sentence members most underestimate and it stays; the private-fields guarantee sits inside the consent text, not only in the panel, so it is part of the evidenced record; "within 20 working days" matches the published policy exactly.

**Consent C — `newsletter@1.0.0`** · Never required, never pre-ticked; declining has no other effect.

> Yes please — send me the GPC weekly newsletter with local events and news. GPC will use my email address only for the newsletter. I know I can unsubscribe from any email, at any time. I've read the [privacy notice](/privacy).

*Helper (not stored):* "Optional. Saying no here changes nothing else." This replaces the source form's "Weekly Newletter" typo. If she does not tick it, **no newsletter subscription is created by any path** (FR-004) — and per addendum Q5 the existing Brevo sync's opt-out semantics must not be overridden by this new write path.

**Storage contract** — what the UI hands the server per ticked consent:

| Field | Value |
|---|---|
| `consent_key` | `hold_data` \| `publish_listing` \| `newsletter` |
| `consent_version` | e.g. `publish_listing@1.0.0` |
| `consent_text` | the exact rendered string, **plain text with link URLs expanded inline** — "…I've read the privacy notice (https://greenwichparentsandcarers.co.uk/privacy)." Evidence can then be produced without rendering markup, and the link destination is itself part of the record. |
| `granted_at` | UTC ISO-8601, set **server-side**; the client never authors a timestamp (FR-005) |
| `capture_method` | `web_form:/join` |
| `granted` | `true`. Withdrawals **append** a row with `granted: false`; nothing is ever updated (FR-004) |

- **Deliberately not stored:** IP address, user agent, geolocation. Rate limiting (FR-006) may use an IP transiently, but attaching one to a consent record collects personal data no requirement asks for — a direct NFR-006 violation.
- **Version bump triggers:** any change to the rendered `consent_text`, including punctuation and including a change to a link destination. **Not** a bump: helper text, badge labels, card styling, or the order the consents appear in.
- **Where the strings live:** a versioned code module or read-only reference table — **not** the admin-editable form configuration. FR-008 scopes admin editing to labels, help text, options and required flags; consent strings are not questions, and an admin silently rewording one produces a cohort of records citing `1.0.0` whose text differs from `1.0.0`, destroying the evidence NFR-004 exists to create. The admin panel *displays* the current text and version read-only, with a note saying why.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Section renders | 2 or 3 unticked checkboxes. **None pre-ticked, at any time, for any reason — including on a resubmission by a returning member** | `<fieldset>` + visually-hidden `<legend>` "Your permissions"; `id`↔`htmlFor`; `aria-describedby` → helper id |
| Loading | N/A — consent text is bundled at its pinned version, not fetched. It must be identical to what is stored, so it cannot depend on a network response that might fail open | — | — |
| Empty | N/A — the consent set is code-defined; a missing definition is a build failure, not a runtime state | — | — |
| Error | Submit with A unticked, or B unticked while opted in | Error rule on the card, message below the checkbox | Error `<p id>` appended to `aria-describedby`; linked from the §2.10 summary, which holds focus (A1) |
| Success | N/A at screen level — the evidence of success is the consent record, echoed on D-4 | — | — |
| Disabled | Submission in flight | Checkboxes disabled, cards dimmed | `[shell]` sets `aria-busy` on the `<form>` |

**Consent error strings.** A unticked: *"We can't accept the form without this. It's the permission that lets us hold your details at all."* B unticked while opted in: *"You asked to be listed in the directory, so we need your permission to publish it. Tick this box, or change your directory answer."* — the last five words are an in-page link to the D-1 radio group. C never errors.

**Accessibility (non-obvious only)**

- **Each checkbox's accessible name is its full consent sentence.** That is long, deliberately. Truncating to "I agree to the terms" would mean the sentence a screen-reader user hears is not the sentence stored as her consent — exactly the failure NFR-004 exists to prevent.
- The `/privacy` link sits **inside the label** and is duplicated in the controller footnote below the group as a plain, non-nested route to the same page. A label-wrapped link is a known screen-reader edge case: verify it in the manual NFR-008 pass, and **if a tested reader fails to expose it, move the link to the line immediately below rather than removing it** — FR-004 requires the consent copy to link to `/privacy`.
- The `/privacy` link opens in a **new tab**, `rel="noopener"`, with a visually-hidden "(opens in a new tab)". This is the one place on `/join` where that is correct: there is no saved-progress feature, so a member who navigates away mid-form and comes back loses everything she typed. The new tab *is* the mitigation.
- Consent B's appearance is announced through the page's single polite region: *"One more permission added: publishing your directory listing."* No focus move — it is inserted after Consent A in DOM order and reached naturally.
- **No dark patterns:** no "select all", no pre-fill from a previous session, no consent implied by proceeding, no visual emphasis making the optional one look required. The optional one is last.

#### Screen D-4 — Submitted: what happens next

**Purpose:** close the loop — her listing is real, is not live yet, and that is correct rather than broken (FR-015). The confirmation screen as a whole is owned by `[shell]`; this section specifies only the listing-and-consent blocks nested inside it.

```
|<------------------ 320px ------------------>|
|        (check glyph, --color-success)       |
|  == Thanks - you're in ================ (h1)|
|  We've got your details and you're part of  |
|  the GPC Mums in Business & Work community. |
|  +-------------------------------------+    |
|  |  YOUR DIRECTORY LISTING        (h2) |    | status pill, 2.7
|  |  [ (clock) Pending ]                |    |
|  |  Your listing isn't live yet - and  |    |
|  |  that's normal. A GPC admin reads   |    |
|  |  every listing before it goes live. |    |
|  |  1. 2. 3. - the same three steps as |    |
|  |  D-2, then: Nothing about your      |    |
|  |  listing is public until then.      |    |
|  +-------------------------------------+    |
|  +-------------------------------------+    |
|  |  WHAT YOU AGREED TO            (h2) |    | rendered from the
|  |  v We can hold your details         |    | REQUEST PAYLOAD (A2),
|  |  v We can publish your listing      |    | never from stored
|  |  x Weekly newsletter - you said no  |    | records
|  |  footer copy (below)                |    |
|  +-------------------------------------+    |
|  [ Browse the directory ] [ See what's on ] |
```

*Differences only:* ≥768px the two cards sit side by side, equal height, and the buttons form a single row. No copy changes.

- **A2 — this screen renders from the request payload the client sent, never from the database result.** Rendering from stored records would tell a honeypot-caught bot that no records exist, and tell a duplicate submitter that her email was already registered, breaking FR-006 and FR-007's non-disclosure rule. This is a security property, not a preference. The card's footer reads *"Change your mind at any time — manage your data, read the privacy notice, or email gpc.communitynews@gmail.com."* (A18).
- **A9 — one confirmation, one timeframe.** The member-facing wording is *"We usually review new listings within a week"*, in the D-2 box and here, and nowhere is it phrased differently. The PRD's five-working-day figure is an internal median target and is never shown to a member: publishing it converts a metric into an obligation the organisation never agreed to.

| State | Trigger | Display | ARIA |
|---|---|---|---|
| Default | Submission succeeded, member opted in | Both cards; `Pending` status pill from §2.7 — no new variant | Confirmation container is `role="status"` and takes focus (`tabindex="-1"`) on mount |
| Loading | N/A — this screen only renders after the request resolves; the in-flight state is `[shell]`'s submit button | — | — |
| Empty | Submission succeeded, member declined the directory | Listing card absent; "What you agreed to" shows two lines. Not an error and not an empty-state illustration — just a shorter page | — |
| Error | N/A — a failed submit never reaches this screen. `[shell]` keeps the form mounted with every value intact and shows the failure inline. **The form is never cleared on error** | — | — |
| Success | This screen *is* the success state | As Default | Focus + `role="status"` |
| Disabled | N/A — nothing here is disableable | — | — |

**Accessibility (non-obvious only)**

- Focus moves to the confirmation container on mount so a screen-reader user is not left focused on a submit button that no longer exists; the container is `tabindex="-1"` and leaves the tab order after blur. "What you agreed to" uses **words** ("you said yes" / "you said no"), not tick and cross glyphs alone; the glyphs are `aria-hidden`.
- No auto-redirect, no timed dismissal, no focus trap — the page stays until she leaves it. Everything echoed back is plain text (FR-020); if a description preview is ever added it must not interpret markup.

### Notes for architecture

- `Button` needs `size="sm"` (the D-2 escape hatch), a disabled style and a busy state; all three are absent today.
- "Shown publicly" and "Optional" are **field labels, not statuses** — they must not enter the §2.7 status ramp or add variants to it. D-4 uses §2.7's existing `Pending` pill rather than a new `awaiting-review` one.
- The `FormField` wrapper (`id`/`htmlFor`/`aria-describedby` composition) is specified here but should be shared across all of `/join`; it is the fix for the site-wide missing-label gap.
- Whether the public/private panel and the consent strings are admin-editable is not stated in FR-008. This section specifies that **neither is**, which constrains the FR-008 admin UI.
- Addendum Q7 (last name): if collected, it joins the **private** column of the panel in the same change. Consent B's "My name … stays private" already covers it, but a stale panel list makes the disclosure incomplete.
- Proposed success metric, not currently in the PRD: ≥80% of opted-in submissions nominate an enquiry contact different from the sign-up email — the only direct measure of whether the privacy design survives contact with real members. The 300-character limit (A8) is fixed in three places at once — counter microcopy, client validation, server limit — and they change together or not at all.
