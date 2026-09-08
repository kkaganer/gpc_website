# PRD Addendum — GPC Membership Intake & Community Business Directory

**Companion to:** `prd.md`
**Version:** 1.0
**Date:** 2026-08-18

> Overflow and working notes. Nothing here is the source of truth for *what* to build — that stays in `prd.md`.

---

## Open Questions

| # | Question | Owner | Needed By | Status |
|---|---|---|---|---|
| Q1 | **Should the directory show any location at all?** The current decision publishes none — not even an outcode. But the whole value proposition is finding someone nearby. (Note: the source form calls it a *"local member directory"*, which names a **different, later product** — the question is reworded to "business directory" for this release; see FR-003 and FR-D10.) A visitor cannot tell a Blackheath childminder from one in another borough. Recommended fallback if reconsidered: publish the **outcode only** (e.g. "SE3"), never the full postcode, as an explicit opt-in field separate from the signup postcode. | Controller / PM | Before EPIC-006 build | **open** |
| Q2 | What is the starter category taxonomy? The source form asks industry as free text, so there is nothing to import. Proposal: derive an initial list from the Business branch's "What are you currently looking for?" vocabulary plus common local trades, then let FR-017 evolve it. | GPC admins | Before EPIC-001 build | open |
| Q3 | What form does the "public enquiry contact" take — an email address, a phone number, a link to the business's own contact page, or the member's choice of any one of these? Choice is friendliest but complicates validation and display. | PM / UX | Before EPIC-001 build | open |
| Q4 | If the public enquiry contact is an email, should it be shown in the clear (harvestable by scrapers) or masked behind a form/relay? A relay is more work and creates a message store, which is more personal data. | PM / Builder | Before EPIC-006 build | open |
| Q5 | Should the newsletter consent on this form write directly into the existing `newsletter_subscribers` flow and Brevo, or stay a flag on the member record until an admin syncs it? The existing sync has opt-out semantics that must not be overridden by a new write path. | Builder | Before EPIC-003 build | open |
| Q6 | What happens to the responses already collected in Tally? Import, archive, or discard? Consent basis for imported records is unclear — those members agreed to a different notice and were never asked about a public listing that did not exist. Recommendation: do **not** auto-import into the directory; at most import into the private member record, and re-ask for directory consent. | Controller | Before Tally is retired | open |
| Q7 | Should the form ask for a last name? The source form asks first name only, which is fine for a member record but thin for a business listing where the member is the practitioner. | PM | Before EPIC-001 build | open |
| Q8 | What retention period applies to member data? The published policy says "as long as necessary" and, for consent-based data, "the period the individual has consented to" — which the consent wording must therefore actually state. A number is needed before the consent text is approved. | Controller | Before consent wording is approved | open |
| Q9 | Who is the admin notification address for FR-022, and is it a shared mailbox? Relevant because notification content should avoid personal data (it links rather than embeds). | GPC admins | Before EPIC-005 build | open |
| Q10 | ~~May an employed member name her employer in her listing?~~ **CLOSED — moot.** This release delivers a directory of *businesses*, so a salaried member with no business is not listed at all and no listing ever needs to name an employer. The question would return only with the deferred member directory (FR-D10), which is a different privacy shape and behind a login. | — | — | closed |

---

## Deferred Requirements (parked, not cut)

Wording preserved so these can be lifted into `prd.md` without rework.

- **FR-D01 — Member self-service listing management.** As a listed member, I can sign in and edit or withdraw my own listing, with edits re-entering moderation. *Deferred:* requires a member authentication system that does not exist; admin-mediated edits cover the need at current volume.
- **FR-D02 — Listing logo or photo.** A listing may carry one image supplied by the member. *Deferred:* public upload with the current setup would be an unauthenticated file dropbox — the single storage bucket is public, has no policies defined in any migration, no size or MIME validation beyond an `accept` attribute, and no deletion path. Needs a private bucket and a signed-upload route first. Interim: an admin may add an image during review.
- **FR-D03 — Approximate location on listings.** Publish the postcode outcode only, as a separate opt-in. *Deferred:* explicit user decision to publish no location. Tied to Q1.
- **FR-D04 — Admin permission tiers.** Distinguish admins who may read member personal data from those who may only moderate public listing content. *Deferred:* no role model exists; every authenticated user is currently a full admin who can also create and delete other admins. Mitigated for now by attribution (NFR-013).
- **FR-D05 — Read audit for private data.** Record which admin viewed or exported which member records. *Deferred:* meaningful only alongside FR-D04.
- **FR-D06 — Directory analytics for members.** "Your listing was viewed N times." *Deferred:* view tracking is new collection requiring new disclosure.
- **FR-D07 — Saved progress / resume later.** *Deferred:* implies identifying a partial submitter before consent is given, which is itself processing. Mitigated instead by keeping the form to five minutes (NFR-007).
- **FR-D08 — Automated retention sweep.** A scheduled job deleting records past their retention period. *Deferred:* no cron exists in the deployment config. Interim: FR-023 makes deletion a single admin workflow, and the six-monthly policy review is the trigger.
- **FR-D09 — Public directory sort options** (newest, A–Z, category). *Deferred:* low value below ~50 listings.
- **FR-D10 — A member directory (all members, not only businesses).** A directory of the community's *people* — searchable by skills, industry, interests and what they offered in "Would you be interested in…" — so members can find each other for mentoring, collaboration and referrals. *Deferred:* it is a **different product from this release**, not a later phase of it. It lists people rather than businesses, so its entries are personal data by definition and it must sit **behind a member login**; member authentication does not exist. Its lawful basis, its field set and its consent wording all need designing separately. The survey answers this release already collects (industry, current situation, support wanted, interest in speaking/mentoring/collaborating) would be its raw material, which is a reason to keep collecting them — but **not** a reason to publish any of them now. Nothing in this release should hint at it to members.

---

## Detailed Acceptance Criteria Overflow

### FR-003 — additional criteria
- Given the description exceeds its limit, when the member types, then a live remaining-character count is shown and submission is blocked with a specific message rather than silent truncation.
- Given a website or Instagram value is entered without a scheme, when it is stored, then it is normalised rather than rejected.
- Given a member enters their signup email as the public enquiry contact, when they submit, then they are warned that this address will be publicly visible and asked to confirm.
- Given the category list is empty (misconfiguration), when the section renders, then the member is not blocked from submitting the rest of the form.

### FR-004 — additional criteria
- Given the consent text is later revised, when a new member submits, then their record cites the new version and existing records continue to cite the version they saw.
- Given a member withdraws one consent, when the record is read, then the original grant and the withdrawal are both visible with their own timestamps.
- Given a submission arrives without the required consent, when it is processed, then it is rejected and no partial member record is created.

### FR-011 — additional criteria
- Given any new database object is added by this work, when it is created, then its default access posture is closed and any public read is granted explicitly and deliberately.
- Given a database function is added, when it is created, then execution rights are restricted in the same change rather than left at the permissive default.
- Given a view is used anywhere in this feature, when it is created, then it is verified not to bypass the row-level protections of its underlying tables.

### FR-015 — additional criteria
- Given a listing is rejected, when the member resubmits, then the new submission enters the queue as a fresh pending item and the earlier rejection reason remains visible to admins.
- Given several listings are pending, when an admin works through them, then their place in the queue is preserved after each decision.
- Given a listing has been in pending state beyond a defined period, when the queue renders, then it is visually distinguished so it is not forgotten.

### NFR-008 — the specific gaps being closed
The existing site has documented accessibility gaps that this feature must not inherit: inputs are wrapped in labels rather than associated by id, no modal is a real dialog (no dialog role, no focus trap, no Escape handling), at least one card is a click-handling div that keyboards cannot reach, there is no focus-visible styling, motion preferences are never honoured, and there is no 404 route. Meeting NFR-008 on the three new pages means fixing these patterns locally at minimum.

---

## Prioritization Working Notes

RICE was **not** run. The requirement set is a single indivisible journey (submit → moderate → publish) plus a legal gate, so Reach and Impact are near-identical across the Must items and the ranking would carry no information. MoSCoW was applied directly, and the placements that were not obvious are recorded below.

| Requirement | Bucket | Reasoning |
|---|---|---|
| FR-008, FR-009 (admin form configuration) | **Must**, not Should | "A webform we can create in the admin section" is the user's stated requirement. Without runtime-editable content the feature is a hard-coded form and fails the ask — the live form's "Weekly Newletter" typo is the standing example of why. |
| FR-006 (anti-abuse) | **Must**, not Should | The endpoint is public, unauthenticated and writes to a moderation queue a human works. Nothing comparable exists in the codebase to inherit. Retrofitting after an attack means cleaning the database as well as the code. |
| FR-024 (privacy disclosures) | **Must** and a launch gate | Collecting and publishing beyond what is disclosed is the failure the whole design is trying to avoid. It is content work, not code, and so is the item most likely to slip — naming it a gate is the mitigation. |
| FR-014 (insights) | **Should**, not Must | The survey answers are stored either way; the summary view can follow one cycle later without data loss. It is nonetheless the highest-value Should, because it is the only requirement that pays back the length of the form. |
| FR-021 (member notification) | **Should**, not Must | No transactional email path exists in the repo at all. At launch volumes an admin can send these by hand. |
| FR-022 (admin notification) | **Could** | The visible pending count in FR-015 already prevents work being lost. |
| FR-007 (duplicates) | **Should** | At community volume, an admin merging an occasional duplicate is cheaper than the matching logic. |

**Must-ratio note:** 18 of 24 FRs are Must (75%), above the 60% guideline the method warns about. Re-examined and left as is: the six non-Musts are the genuinely severable capabilities, and every Must either (a) is required for the journey to function end to end, or (b) is a privacy or legal guarantee that cannot be added later without reprocessing data already collected. Recorded rather than hidden.

---

## Supporting Research / References

- `bmad-output/inputs/tally-form-RG1M6K-structure.md` — complete field inventory of the source Tally form, extracted from its live definition: 153 blocks, one branch key, three conditional-logic blocks, plus ten inherited defects the replacement must fix rather than reproduce.
- `bmad-output/inputs/codebase-constraints-brief.md` — stack reality, migration and data conventions, the public/private enforcement patterns already in use, the three production traps this codebase has already hit, an inventory of what does not exist, the published legal commitments, and eleven named risks for a public-write endpoint.
- Live policy pages that constrain this work: `src/pages/GdprPolicy.jsx` (lawful bases, minimisation, 20-working-day deletion, ICO commitments), `src/pages/PrivacyPolicy.jsx` (the current, and incomplete, collection disclosure), `src/pages/SafeguardingPolicy.jsx` (consent for images identifying a child).
- Reference implementations named in the constraints brief: `src/pages/WhatsOn.jsx` (listing + filters), `src/pages/admin/SubscribersManager.jsx` (PII-bearing admin list, the closest analogue), `src/components/home/NewsletterBanner.jsx` (public form → API, and the site's only live region), `api/admin/subscribers.js` (the service-role admin route contract).

---

## Glossary

| Term | Definition |
|---|---|
| **Member** | A person who has submitted the membership form. Their record is private and admin-only. |
| **Listing** | The public directory entry for a member's **business**. Exists only if the member opted in, and is publicly visible only once an admin publishes it. |
| **Business directory** | What this release ships: a **public** directory of businesses run by GPC members. Contains business information only. |
| **Member directory** | A **separate, later product** (FR-D10): a directory of the community's *people*, behind a member login. Not in this release, and not to be referred to in member-facing copy. |
| **Public field** | A field the member nominated for publication: business name, category, description, website, Instagram, public enquiry contact. Nothing else. |
| **Private field** | Everything else — first name, signup email, postcode, every survey answer, every consent record, all moderation notes. Never publicly readable by any route. |
| **Branch** | The Business or Career question set, revealed by the member's answer to "Which group would you like to join?". |
| **Public enquiry contact** | A contact the member explicitly nominates for public display, deliberately distinct from the signup email. |
| **Moderation queue** | The set of listings awaiting an admin decision. Pending, held and rejected listings are never publicly visible. |
| **Consent record** | An append-only record of what a member agreed to: the exact text, its version, a UTC timestamp, and the capture method. |
| **Form configuration** | The admin-editable content of the form — labels, help text, choice options, required flags, intro and closed messages, open/closed state. Excludes the field set and branching, which are code-defined. |
| **Controller** | The data controller named in the published GDPR policy: Aster Thackery, CIC 16387545. |
