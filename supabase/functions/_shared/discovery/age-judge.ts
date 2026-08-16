// Age judgement for listings whose age range is UNKNOWN — batched, cheap, fail-safe.
//
// WHY THIS EXISTS. `isUnderFive(inferAge(...))` in age.ts collapses two very
// different verdicts into one `false`. Its own docstring admits it: "A listing
// with NO age data fails unless its category is inherently under-5." So a
// session positively marked "16+" and a session that simply never states an age
// are rejected identically. Measured across recent runs, the first group is
// ~11,000 items and rejecting them is the gate working correctly. The second is
// where real under-5 provision is lost: spektrix drops 258 items per run window
// and EVERY ONE of them is `no_age`.
//
// WHAT IS AND IS NOT JUDGED. Only the no-age group reaches here. Anything
// POSITIVELY excluded — min > 60 months, "16+", Key Stage, seniors — is dropped
// by the deterministic gate for free and must never be passed in. That is a
// correctness rule (the deterministic answer is already right, and an LLM can
// only make it wrong) and a cost rule (11,000 correctly-excluded adult swim and
// gym sessions must not be judged).
//
// COST. Two adapters are wired up, spektrix and classforkids, for ~45 unknown
// items per run. Forty items go in ONE request, so a typical run is a single
// gpt-5-nano call over a few thousand tokens of text already in hand — a
// fraction of a penny. That arithmetic ONLY holds because the positively-
// excluded items never get here; wire the raw OpenActive feed into this and it
// becomes ~2,000 items a run. MAX_ITEMS below is the backstop against exactly
// that mistake.
//
// TIER MODEL. A "likely" verdict INGESTS, it does not publish. The activity
// lands with its normal `status = 'pending'` and RLS restricts public reads to
// `status = 'published'`, so nothing reaches the public site until an admin
// approves it in Discovery. The cost of a wrong `true` is a minute of review
// time; the cost of a wrong `false` is a family never seeing the session. That
// asymmetry is why judging is worth doing at all — and why the prompt still
// asks for a confident false rather than a hopeful true, since review time is
// the scarce resource here, not disk.
//
// NEVER THROWS. Every failure path — no API key, non-200, unparseable JSON,
// timeout, deadline already passed — returns no verdict for the affected items.
// Callers treat an absent verdict as "drop and count", which is EXACTLY today's
// behaviour. A discovery run must never fail because the age judge had a bad day.

// Same cheap tier llm-discovery uses to verify. This is classification over text
// we already hold: no search, no tools, nothing to fetch. Re-declared rather
// than imported so a shared helper does not depend on an adapter.
const VERIFY_MODEL = 'gpt-5-nano'

/** One request per batch; ~45 items a run means a typical run is a single call. */
const DEFAULT_BATCH_SIZE = 40

/**
 * Hard ceiling per call sequence. Not a budget so much as a tripwire: if some
 * future adapter accidentally routes a whole leisure-centre timetable through
 * here, this caps the damage at ~8 calls and says so in the logs.
 */
const MAX_ITEMS = 300

/** Matches llm-discovery's per-call timeout. */
const CALL_TIMEOUT_MS = 60_000

/** Below this much wall clock left, a batch cannot finish; don't start it. */
const MIN_CALL_BUDGET_MS = 5_000

/** Trimmed before sending — the judgement is made on the first paragraph anyway. */
const MAX_DESCRIPTION_CHARS = 500
const MAX_FIELD_CHARS = 200

/** Reason text is shown to an admin in the review queue, so it is length-capped. */
const MAX_REASON_CHARS = 120

export interface AgeJudgeItem {
  /** Caller's own identifier — usually source_uid. Verdicts come back keyed by this. */
  key: string
  title: string
  description?: string | null
  venue?: string | null
}

export interface AgeJudgeVerdict {
  /** true => plausibly for under-5s; ingest as pending for an admin to confirm. */
  likely: boolean
  min_months: number | null
  max_months: number | null
  /** <= 120 chars, names the words it went on. Surfaced to the admin reviewer. */
  reason: string
}

// OpenAI strict mode requires EVERY property in `required`; optionality is
// expressed as a nullable type, never by omission. Same discipline as the
// schemas in llm-discovery.ts.
const JUDGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdicts'],
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['index', 'likely', 'min_months', 'max_months', 'reason'],
        properties: {
          index: { type: 'integer' },
          likely: { type: 'boolean' },
          min_months: { type: ['integer', 'null'] },
          max_months: { type: ['integer', 'null'] },
          reason: { type: 'string' },
        },
      },
    },
  },
}

const PROMPT = `
You are reading listings for children's activities in south-east London. Every
listing below comes from a source that did NOT state an age range — the age is
missing from the data, not hidden from you. Your job is to decide, from the
title, venue and description alone, whether each one is plausibly aimed at (or
genuinely suitable for) children UNDER FIVE attending with a parent or carer.

Answer likely=false when the listing reads as adult programming, as
general-audience entertainment that happens not to exclude children, or as
school-age-and-up. A comedy night, an adult craft workshop, a life-drawing
class, a gig, a talk, a Key Stage 2 holiday club and a general public swim are
all false. Being open to everyone is not the same as being for under-fives.

A CONFIDENT FALSE IS MORE USEFUL TO US THAN A HOPEFUL TRUE. Every true you
return costs a human being time: a person reads that listing and decides
whether to publish it. Do not hedge upward. If the text does not give you a
real reason to think under-fives are the audience, say false.

Give min_months and max_months ONLY when the text actually implies an age
(e.g. "for babies who are not yet crawling" -> 0 and 9; "pre-schoolers" ->
24 and 60). Use null for both when it does not. Do not invent a range to
justify a verdict.

Give a SHORT reason, 120 characters or fewer, naming the SPECIFIC WORDS in the
listing you went on — "titled 'Baby Rave', says buggy parking" or "'18+ only',
bar event". An admin reads this reason next to the listing, so "seems
suitable" or "likely for young children" is useless. Quote the evidence.

Return one verdict per item, using the item's index. Judge every item.
`.trim()

/**
 * Single OpenAI Responses call. Returns the parsed body, or null on ANY
 * failure — non-200, network error, abort. Mirrors llm-discovery's helper.
 */
async function openai(key: string, body: unknown, timeoutMs: number): Promise<any | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    return res.ok ? json : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function textOf(json: any): string {
  return (json?.output ?? [])
    .flatMap((o: any) => o?.content ?? [])
    .map((c: any) => c?.text)
    .filter(Boolean)
    .join('')
}

function clip(value: string | null | undefined, max: number): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

/** Accepts a plausible month count; anything else becomes null rather than a guess. */
function months(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const n = Math.round(value)
  if (n < 0 || n > 1200) return null
  return n
}

/**
 * Ask a cheap model whether each age-unknown listing is plausibly for under-5s.
 *
 * Returns a verdict per item it could judge, keyed by `AgeJudgeItem.key`. An
 * ABSENT KEY IS THE FAILURE MODE AND IT IS SAFE: callers must treat "no verdict"
 * exactly as they treat today's `isUnderFive` false — drop the item and count
 * it. This function never throws and never rejects.
 *
 * Only pass items whose age is genuinely underivable. Items the deterministic
 * gate positively excluded are already correctly rejected and must not be sent.
 */
export async function judgeUnderFive(
  items: AgeJudgeItem[],
  opts: { deadline: number; batchSize?: number },
): Promise<Map<string, AgeJudgeVerdict>> {
  const verdicts = new Map<string, AgeJudgeVerdict>()

  // Warn at most once per call, whatever goes wrong and however many batches
  // it goes wrong in. A run with eight failing batches is one problem, not eight.
  let warned = false
  const warn = (cause: string) => {
    if (warned) return
    warned = true
    console.warn(`age-judge: no verdicts (${cause}) — items fall back to the deterministic drop`)
  }

  try {
    if (!Array.isArray(items) || items.length === 0) return verdicts

    // Deduplicate on key before paying for anything: two occurrences of the same
    // activity are one judgement.
    const unique: AgeJudgeItem[] = []
    const seen = new Set<string>()
    for (const item of items) {
      if (!item || typeof item.key !== 'string' || !item.key) continue
      if (seen.has(item.key)) continue
      seen.add(item.key)
      unique.push(item)
    }
    if (unique.length === 0) return verdicts

    let pending = unique
    if (pending.length > MAX_ITEMS) {
      // Loud, because this can only mean a caller is sending items the
      // deterministic gate should have excluded for free.
      console.warn(
        `age-judge: ${pending.length} items exceeds the ${MAX_ITEMS} cap — judging the first ${MAX_ITEMS}, ` +
        'the rest fall back to the deterministic drop. Check the caller is only passing age-unknown items.',
      )
      pending = pending.slice(0, MAX_ITEMS)
    }

    // Deno.env.get itself can throw without env permission, hence the outer try.
    const key = Deno.env.get('OPENAI_API_KEY')
    if (!key) {
      warn('OPENAI_API_KEY is not configured')
      return verdicts
    }

    const size = Math.max(1, Math.min(Number(opts.batchSize ?? DEFAULT_BATCH_SIZE) || DEFAULT_BATCH_SIZE, MAX_ITEMS))

    for (let offset = 0; offset < pending.length; offset += size) {
      // Checked BEFORE each batch: this runs alongside nine other adapters
      // inside one edge-function wall clock, and half a request is worth
      // nothing. Stop cleanly and let the remainder fall back.
      const remaining = opts.deadline - Date.now()
      if (remaining < MIN_CALL_BUDGET_MS) {
        warn(offset === 0 ? 'deadline passed before the first batch' : 'deadline reached mid-batch')
        break
      }

      const batch = pending.slice(offset, offset + size)
      const payload = batch.map((item, i) => ({
        index: i,
        title: clip(item.title, MAX_FIELD_CHARS),
        venue: clip(item.venue, MAX_FIELD_CHARS) || null,
        description: clip(item.description, MAX_DESCRIPTION_CHARS) || null,
      }))

      const json = await openai(key, {
        model: VERIFY_MODEL,
        input: `${PROMPT}\n\n${JSON.stringify(payload)}`,
        // No tools. There is nothing to search; the text is already in hand.
        text: { format: { type: 'json_schema', name: 'verdicts', schema: JUDGE_SCHEMA, strict: true } },
      }, Math.min(CALL_TIMEOUT_MS, remaining))

      if (!json) {
        warn('the OpenAI call failed, timed out, or returned a non-200')
        continue
      }

      let parsed: unknown
      try {
        parsed = JSON.parse(textOf(json) || '{}')
      } catch {
        warn('the response was not parseable JSON')
        continue
      }

      const list = (parsed as any)?.verdicts
      if (!Array.isArray(list)) {
        warn('the response had no verdicts array')
        continue
      }

      // Map back BY INDEX, never by position. A model that returns 38 verdicts
      // for 40 items, or returns them out of order, would otherwise shift every
      // judgement onto the wrong listing — silently, and in the direction of
      // publishing an adult session as a toddler group.
      for (const v of list) {
        const i = v?.index
        if (!Number.isInteger(i) || i < 0 || i >= batch.length) continue
        if (typeof v?.likely !== 'boolean') continue
        const item = batch[i]
        if (verdicts.has(item.key)) continue // first verdict wins on a duplicated index
        verdicts.set(item.key, {
          likely: v.likely,
          min_months: months(v.min_months),
          max_months: months(v.max_months),
          reason: clip(v.reason, MAX_REASON_CHARS),
        })
      }
      // Anything the model skipped simply has no verdict, and no verdict means
      // the caller drops it — today's behaviour, so a partial answer degrades
      // gracefully instead of needing to be detected.
    }
  } catch (err) {
    // Belt and braces. Nothing above is expected to throw; if something does,
    // the run still gets whatever was already judged and never sees an error.
    warn(`unexpected error: ${err instanceof Error ? err.message : String(err)}`)
  }

  return verdicts
}
