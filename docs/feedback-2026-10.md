# Feedback triage — October 2026

Source: a round of feedback on the website + newsletter (three "it's hard to
submit events" comments, plus a long email from Aster). 25 distinct items, each
tracked as a goal brief (`goals/done/` once built, `goals/` while open) or in the
["Not a code change"](#not-a-code-change) list.

Effort tags: **S** small · **M** medium · **L** large · **?** investigate first.

## Status — as of 2026-10-19

**Built — 14 goals:** 15, 16, 17, 18, 19, 20, 22, 23, 24, 25 (age), 27, 28, 31, 32.
They sit on stacked local branches `feedback/goal-NN-*`, with
`feedback/regression-fixes` on top (that tip holds everything). **Not pushed to
main.**

**Regression-tested.** A harness was run against `main` and the tip. It renders
the newsletter and the WhatsApp text from fixtures, exercises every pure module,
and re-runs each brief's Done-when.
- Result: 36 of 39 checks pass, with **zero regressions**.
- The 3 failures fail identically on `main`, because the checks themselves are
  stale:
  - 13's WhatsApp clause was superseded by 14.
  - 05's email "spaces left" moved to the web page.
  - The email's `<style>` is the documented reset.
- Also run: live-data checks, rolled-back `publish_activity` tests, a live
  email-parse test, and browser smoke tests of the public pages (no console
  errors).
- The review found real bugs in 15, 16, 18, 20, 22, 24, 25, 27, 28 and 32, all
  fixed. See the `feedback/regression-fixes` commit.

**Already live.** The backend changes are backward-compatible and do nothing
visible until the branches ship. Migration history is in sync through 037.
- Migration 035 (activity admin dates).
- Migration 036 (clearing admin dates no longer leaves the run row live; a blank
  admin time keeps the session time). Verified live.
- Migration 037 (the Discovery review queue is no longer readable with the public
  key). Verified live: an anonymous read now returns "permission denied".
- The `parse-event-email` edge function, which now also reads posters.

**Deploy step.** Redeploy `generate-newsletter` alongside the frontend. Vercel
ships only the frontend, and the newsletter generator carries the same renderer
and resolver changes as the browser preview.

**Open, waiting on Aster:**
- **21:** credit the business name on the presenting card, or was it an unsold
  week?
- **29:** which surface is "Sing"?
- **30:** what are the current Blackheath details, and does she want to edit the
  weekly activities herself?

**Optional:** 25's fuller "one identical form everywhere".

## Quick wins
| Brief | What | Items | |
|---|---|---|---|
| [15](../goals/done/15-member-count-says-2000.md) | Say **2,000+** on the site and the newsletter | F21 | ✅ |
| [16](../goals/done/16-picks-card-heading-and-content.md) | "This week's **top** picks"; venue + description on **every** pick | F15, F17 | ✅ |
| [17](../goals/done/17-easy-event-submission.md) | Obvious submit route on the homepage + a submit link in the newsletter | F1, F2 | ✅ |
| [18](../goals/done/18-save-and-publish.md) | A **"Save & Publish"** button, not only "Update" → back to Pending | F7 | ✅ |
| [19](../goals/done/19-coffee-block-in-palette.md) | "Buy us a coffee" block addable from the editor | F19 | ✅ |

## Medium
| Brief | What | Items | |
|---|---|---|---|
| [20](../goals/done/20-advertiser-clicks-all-time.md) | Advertiser clicks: previous week + all-time per advertiser | F18 | ✅ |
| [22](../goals/done/22-newsletter-area-and-further-afield.md) | Stop dropping no-area listings + a "further to travel" section | F10, F11 | ✅ |
| [23](../goals/done/23-newsletter-pictures.md) | Upload pictures into the newsletter (+ a "what we've been up to" note) | F12 | ✅ |
| [29](../goals/29-event-sponsor-logo-by-url.md) | Sponsor logo on an event via an http link | F23 | waiting on Aster |
| [30](../goals/30-editable-weekly-activities.md) | Edit the weekly activities (Blackheath) | F24 | waiting on Aster |
| [32](../goals/done/32-newsletter-formatting-and-spellcheck.md) | Bold/italic + spell check in the composer (*flagged not essential*) | F13 | ✅ |

## Large
| Brief | What | Items | |
|---|---|---|---|
| [24](../goals/done/24-edit-activity-dates-and-recurrence.md) | Edit Activity can set date, date range, recurrence | F6 | ✅ (range; recurrence deferred) |
| [25](../goals/25-one-consistent-event-form.md) | One consistent event form across all three entry points | F5 | age part ✅; full form optional |
| [27](../goals/done/27-ai-poster-reader.md) | AI poster reader — upload a poster → event | F3 | ✅ |
| [31](../goals/done/31-filter-within-greenwich.md) | Filter within Greenwich (peninsula, Eltham…) + define outside-Greenwich | F25 | ✅ |

## Investigate first
| Brief | What | Items | |
|---|---|---|---|
| [21](../goals/21-featured-ad-on-edition-page.md) | Is the featured advertiser really missing from the edition page? | F20 | it shows; asking Aster about crediting the name |
| [28](../goals/done/28-discovery-only-better-libraries.md) | Why Discovery leans on Better Libraries; Spektrix starved; the URL list | F4 | ✅ (volume, not a broken feed: source filter added) |

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
