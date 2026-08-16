-- Record HOW an activity's age range was arrived at, not just what it is.
--
-- WHY. `age_min_months` / `age_max_months` (008) are a single pair of integers,
-- but they now arrive from four levels of evidence that are nothing like each
-- other in strength:
--
--   stated        the source itself published "6-18 months" or "18 months - 4
--                 years". The feed is asserting the eligibility; we copied it.
--   inferred      no range was published, but a category or title word implies
--                 one — "toddler", "baby", "rhyme time", "under 5s". The number
--                 in the column is OUR reading of a word, not the source's claim.
--   venue_default a venue- or programme-level assumption applied to a listing
--                 that said nothing at all — e.g. a family-hub stay-and-play
--                 room that is 0-5 by definition of the room, not of the entry.
--   llm_judged    the listing stated NO age data and no category word matched,
--                 so a language model judged from title and description whether
--                 it is plausibly an under-5 activity. This is the weakest of
--                 the four and the only one with no deterministic audit trail.
--
-- Stored as bare integers those four are INDISTINGUISHABLE — in the table, on
-- the review screen, and in any later analysis of how well the pipeline is
-- doing. An admin looking at "0-60 months" cannot see whether the source said
-- so or a model guessed so, which is exactly the information they need to decide
-- how hard to check the listing. Worse, without provenance we can never measure
-- the LLM judge against reality: no query can separate its output from the
-- deterministic path's, so its precision stays permanently unknown.
--
-- The `confidence` column (008) does not solve this. It is a 0..1 score of how
-- directly the range was stated, which compresses provenance into a magnitude
-- and loses the KIND of evidence — two different mechanisms can land on the same
-- number, and a number cannot be filtered on meaningfully in review.
--
-- A judged-likely item is INGESTED, never published: `status` stays 'pending'
-- and the public RLS policy on this table only exposes `status = 'published'`
-- (008), so an admin still has to approve it. The cost of a wrong LLM judgement
-- is review time, never a wrong listing on the site. `age_basis` is what makes
-- that review time cheap to spend in the right place.

alter table activities
  add column if not exists age_basis text;

comment on column activities.age_basis is
  'Provenance of age_min_months/age_max_months. stated = the source published an explicit range; inferred = derived deterministically from a category/title word; venue_default = a venue- or programme-level assumption applied to a listing that stated nothing; llm_judged = the listing stated no age at all and a model judged it plausibly under-5. NULL = unknown provenance (every row written before this migration, plus any writer that has not been updated).';

-- Constrain the vocabulary. Guarded so re-running this migration is a no-op
-- rather than a duplicate_object error.
--
-- The `is null` arm is redundant to the planner — `null in (...)` evaluates to
-- NULL and a CHECK passes on NULL — but it is written out so the constraint
-- states the intent rather than relying on three-valued logic to imply it.
alter table activities
  drop constraint if exists activities_age_basis_check;

alter table activities
  add constraint activities_age_basis_check
  check (age_basis is null or age_basis in ('stated', 'inferred', 'venue_default', 'llm_judged'));

-- BACKFILL: deliberately none.
--
-- Every row that predates this migration genuinely has unknown provenance. The
-- adapters that wrote them did not record which branch of inferAge() produced
-- the range, and it cannot be recovered from the stored values: "0-60 months"
-- looks identical whether the feed said "under 5s" or a category word implied
-- it. Backfilling the most common case as 'stated' or 'inferred' would put a
-- fabricated evidence level next to a real number — precisely the dishonesty
-- the age module's own header rejects ("a null is honest; a guess is a listing
-- a parent turns up to with the wrong-age child"). NULL is the true answer, and
-- it is also the useful one: it cleanly separates the pre-provenance era from
-- everything written afterwards, so the first analysis of judge quality is not
-- polluted by invented history. Rows re-ingested on their next run will fill
-- the column in naturally.

-- The review screen's likely query is "pending activities that a model judged,
-- best first" — the hook behind activity_review_queue filters on status and
-- orders by confidence descending with nulls last (useDiscoveredActivities.js),
-- and llm_judged is the one basis an admin has a positive reason to single out,
-- because it is the only one no human or publisher ever asserted.
--
-- Partial, not a plain b-tree on age_basis, for two reasons. First, selectivity:
-- llm_judged rows come from only two adapters (~45 unknown-age items per run,
-- of which only a fraction are judged likely), so they are and will remain a
-- small minority of a table dominated by 'stated' and 'inferred' — indexing the
-- whole column would mostly store the values nobody filters by. Second, size:
-- the index holds only the rows that satisfy the predicate, so it stays
-- proportional to the judged set rather than to the table, the same shape as
-- the unsynced-subscriber index in 019.
--
-- The leading `status` column serves the equality filter and `confidence desc
-- nulls last` matches the queue's sort direction exactly, so the ordering can
-- be read straight off the index rather than re-sorted. `nulls last` is spelled
-- out because Postgres defaults DESC to NULLS FIRST, which would not match.
create index if not exists activities_llm_judged_idx
  on activities (status, confidence desc nulls last)
  where age_basis = 'llm_judged';

-- RLS: intentionally unchanged. `activities` already carries "Public can view
-- published activities" (SELECT where status = 'published'), plus authenticated
-- SELECT/ALL policies (008). Policies are row-level, so the new column is
-- covered by all of them automatically; adding anything here would only widen
-- the surface. All writes to age_basis happen server-side in the discovery
-- edge functions under the service-role key, which bypasses RLS entirely.
--
-- NOT DONE HERE: the activity_review_queue view (009) does not select
-- age_basis, so the admin screen cannot yet filter or display it. That is a
-- view change, deliberately left to whoever wires up the review UI.

-- Verification — paste into the SQL editor after running:
--
-- select coalesce(a.age_basis, '(null)')                        as age_basis,
--        a.source_id,
--        count(*)                                               as rows,
--        count(*) filter (where a.status = 'pending')           as pending,
--        count(*) filter (where a.status = 'published')         as published,
--        count(*) filter (where a.age_min_months is null
--                           and a.age_max_months is null)       as no_age_range,
--        round(avg(a.confidence), 2)                            as avg_confidence
-- from activities a
-- group by rollup (coalesce(a.age_basis, '(null)'), a.source_id)
-- order by age_basis nulls last, rows desc;
