# Feedback triage — October 2026

Source: a round of feedback on the website + newsletter (three "it's hard to
submit events" comments, plus a long email — looks like it's from Aster). 25
distinct items. Every item below is tracked, either as a goal brief in
`goals/15-*.md … 32-*.md` or, where it isn't code, in the
["Not a code change"](#not-a-code-change) list. Nothing has been built yet —
this is the backlog.

Effort tags: **S** small · **M** medium · **L** large · **?** investigate first.

## Quick wins
| Brief | What | Items |
|---|---|---|
| [15](../goals/15-member-count-says-2000.md) | Say **2,000+** on the site and the newsletter | F21 |
| [16](../goals/16-picks-card-heading-and-content.md) | "This week's **top** picks"; venue + description on **every** pick | F15, F17 |
| [17](../goals/17-easy-event-submission.md) | Obvious submit route on the homepage + a submit link in the newsletter | F1, F2 |
| [18](../goals/18-save-and-publish.md) | A **"Save & Publish"** button, not only "Update" → back to Pending | F7 |
| [19](../goals/19-coffee-block-in-palette.md) | "Buy us a coffee" block addable from the editor | F19 |

## Medium
| Brief | What | Items |
|---|---|---|
| [20](../goals/20-advertiser-clicks-all-time.md) | Advertiser clicks: previous week + all-time per advertiser | F18 |
| [22](../goals/22-newsletter-area-and-further-afield.md) | Stop dropping no-area listings + a "further to travel" section | F10, F11 |
| [23](../goals/23-newsletter-pictures.md) | Upload pictures into the newsletter (+ a "what we've been up to" note) | F12 |
| [29](../goals/29-event-sponsor-logo-by-url.md) | Sponsor logo on an event via an http link | F23 |
| [30](../goals/30-editable-weekly-activities.md) | Edit the weekly activities (Blackheath) | F24 |
| [32](../goals/32-newsletter-formatting-and-spellcheck.md) | Bold/italic + spell check in the composer (*flagged not essential*) | F13 |

## Large
| Brief | What | Items |
|---|---|---|
| [24](../goals/24-edit-activity-dates-and-recurrence.md) | Edit Activity can set date, date range, recurrence | F6 |
| [25](../goals/25-one-consistent-event-form.md) | One consistent event form across all three entry points | F5 |
| [27](../goals/27-ai-poster-reader.md) | AI poster reader — upload a poster → event | F3 |
| [31](../goals/31-filter-within-greenwich.md) | Filter within Greenwich (peninsula, Eltham…) + define outside-Greenwich | F25 |

## Investigate first
| Brief | What | Items |
|---|---|---|
| [21](../goals/21-featured-ad-on-edition-page.md) | Is the featured advertiser really missing from the edition page? | F20 |
| [28](../goals/28-discovery-only-better-libraries.md) | Why Discovery leans on Better Libraries; Spektrix starved; the URL list | F4 |

## Not a code change
Tracked, but handled outside the backlog:

- **Photos don't show our true diversity** (F22) — content task, blocked on new
  photos. When they arrive, swap the files in `public/images/` and the homepage
  gallery (`src/components/home/GalleryPreview.jsx`) / About imagery.
- **Where the email list sits / a MIBW list** (F14) — operational: the list
  lives in **EmailOctopus** (Supabase is the source of truth for subscribers;
  Brevo is a contact-sync copy that does not send — see `CLAUDE.md`). A separate
  "Mums in Business & Work" list can be created in EmailOctopus. Note the MIBW
  membership + business directory is already a planned build in
  `bmad-output/` (PRD, architecture, 46 ready-for-dev stories).

## Notes (already true, no action)
- **Parse already handles pasted text** (F8, F9) — it extracts events from any
  pasted text; organiser emails and whole web pages both work today. Aster can
  try pasting the WhatsApp group in as-is (it's tuned for emails, so a busy group
  chat may be hit-and-miss). **No dedicated WhatsApp support is planned.**
- **Picks Card is the format in use, not long-form** (F16) — the unused
  long-form list layout can stay as-is; brief 16 improves the Picks Card.

## Raw item index
F1 newsletter submit link → 17 · F2 homepage submit route → 17 · F3 AI poster
reader → 27 · F4 Discovery sources → 28 · F5 one consistent form → 25 · F6 Edit
Activity dates → 24 · F7 Save & Publish → 18 · F8 parse whole pages → note ·
F9 parse WhatsApp → note (already works, no build planned) · F10 no-location listings dropped → 22 · F11 further to
travel → 22 · F12 newsletter pictures → 23 · F13 formatting/spell check → 32 ·
F14 email list / MIBW → not-a-code-change · F15 "top picks" → 16 · F16 Picks Card
in use → note · F17 venue + description on every pick → 16 · F18 advertiser
clicks → 20 · F19 coffee button → 19 · F20 featured ad on edition page → 21 ·
F21 2,000+ → 15 · F22 photos → not-a-code-change · F23 sponsor logo by URL → 29 ·
F24 weekly activities / Blackheath → 30 · F25 filter within Greenwich → 31.
