# Gmail → What's On Parser

How labelling an email in the GPC inbox turns into pending What's On events.

---

## 1. What this does

Local organisers email `gpc.communitynews@gmail.com` asking for their class or
event to be listed. You apply one Gmail label to that email; within about ten
minutes a Google Apps Script has sent it to the `parse-event-email` edge
function, which extracts every event in it and writes them to `london_events`.

**They land in the Pending tab of `/admin/whats-on` as unapproved rows and go
nowhere else.** Nothing appears on the public What's On page, the map or the
newsletter until you click Approve. This replaces the copy-paste into the
"Parse Email" box — it does not replace the review step, and the review step is
what makes automating the rest safe.

---

## 2. Why it is label-gated

**An email is only ever parsed if you label it.** Nothing else in the mailbox is
touched — not unread mail, not spam, not the folder the label lives in. That is
the whole security model. An organiser's email is a document written by a
stranger, and text written by a stranger is exactly what you must not feed to an
AI unfiltered; a spam run or a deliberately crafted email trying to talk the
model into something never reaches it, because you never labelled it. It also
keeps the OpenAI bill proportional to real work — one model call per email you
actually decided to list — and it keeps the property the paste box already had:
parsing is a deliberate act by a human.

---

## 3. Before you start

You need three things.

| What | Where |
|---|---|
| The edge function deployed | `supabase functions deploy parse-event-email` from the repo root. If the "Parse Email" box in `/admin/whats-on` already works, it is deployed |
| Supabase **project ref** | Supabase dashboard → **Project Settings → API**. It is the subdomain in your project URL: `https://<PROJECT_REF>.supabase.co` |
| Supabase **anon key** | Same page, under **Project API keys** — the one labelled `anon` `public` |

**Use the anon key. Never the `service_role` key.** The edge function reads the
database with its own service-role key held on the Supabase side; the caller
only has to prove it is a legitimate client, which the anon key does. The
service-role key is unrestricted access to every table in the database, and
putting it in Apps Script means a compromised Google account hands it over.

You also need to be signed into Google **as the GPC mailbox account**, not your
personal one. The script has to read that mailbox, and an Apps Script project
belongs to whichever account created it.

---

## 4. Setup — once

1. Sign in to Google as `gpc.communitynews@gmail.com`.
2. Go to **script.google.com** → **New project**.
3. Rename it something you will recognise later — click "Untitled project" at
   the top and type `GPC What's On parser`.
4. Delete the sample `function myFunction() {}` in the editor, then paste in the
   entire contents of `scripts/gmail-whats-on-parser.gs`. Save (the disk icon,
   or ⌘S).
5. Click the gear icon, **Project Settings**, scroll to **Script Properties**,
   and click **Add script property**. Add these two, names exactly as written —
   they are case-sensitive and a typo produces a "not set" error rather than a
   guess:

   | Property | Required | Value |
   |---|---|---|
   | `SUPABASE_PROJECT_REF` | yes | your project ref, e.g. `abcdefghijklmnop` — the ref alone, not the full URL |
   | `SUPABASE_ANON_KEY` | yes | the long `anon` `public` key |
   | `SITE_URL` | no | e.g. `https://greenwichparents.org` — turns the summary email's "review here" line into a clickable link straight to `/admin/whats-on`. Without it the email tells you where to look in words |
   | `REPORT_EMAIL` | no | where summary emails go. Defaults to the GPC mailbox itself, which is normally what you want |

   Click **Save script properties**.
6. Back in the editor, choose **`testConnection`** from the function dropdown at
   the top and click **Run**. This is the step that triggers Google's permission
   prompts, and doing it here means they happen while you are watching rather
   than silently failing at 3am.
7. Google will ask you to **Review permissions** → choose the GPC account. It
   then shows a red-ish screen saying **"Google hasn't verified this app"**.
   This stops people, so: it is expected and correct. The "app" is the script
   you just pasted, in your own account, and it is unverified because it was
   never submitted to Google for publication — nobody publishes a private script
   for one mailbox. Click **Advanced** (small link, bottom left) → **Go to GPC
   What's On parser (unsafe)** → **Allow**.

   It asks for three things: to read and modify your Gmail (it reads labelled
   threads and swaps their labels), to connect to an external service (Supabase),
   and to send email as you (the summary email, to you).
8. Read the execution log at the bottom of the editor. A pass says the
   properties are set and the function answered. A failure names what is wrong —
   fix that before continuing; **do not skip to step 9 hoping it sorts itself
   out**.
9. Choose **`createTrigger`** from the dropdown and click **Run**, once. That
   installs the recurring ~10-minute timer. It is safe to run again at any
   time — it deletes any existing `processWhatsOnEmails` trigger before making a
   fresh one, so re-running is the fix if you are unsure rather than a risk. To
   confirm, check the clock icon (**Triggers**) in the left sidebar: there
   should be exactly one row.
10. In Gmail, confirm the three labels exist (the script's first run creates
    what it needs). The defaults are:

    | Label | Meaning |
    |---|---|
    | `whats-on` | **you** apply this — "parse this one" |
    | `whats-on/parsed` | the script applies this when it succeeded |
    | `whats-on/error` | the script applies this when it failed |

    These names are set in a block at the top of the script file. If you rename
    them there, rename them in Gmail to match.

---

## 5. Daily use

1. An organiser emails asking to be listed.
2. Apply the **`whats-on`** label to the email.
3. Wait up to ten minutes.
4. Open `/admin/whats-on` → **Pending**. The events are there, `Source: email`.
5. Check each one — the date and whether it is a weekly regular or a one-off are
   the two things worth reading twice — then **Approve**.

Back in Gmail, the label tells you what happened without opening anything:

| Label now on the thread | Meaning |
|---|---|
| `whats-on` still on it | Not picked up yet, or the run has not reached it |
| `whats-on/parsed`, `whats-on` gone | Sent successfully. Check Pending |
| `whats-on/error`, `whats-on` gone | It failed. The summary email says why |

The `whats-on` label is removed as part of the swap, and that swap is what stops an
email being parsed twice. Do not put `whats-on` back on a thread unless you
actually want it parsed again.

---

## 6. What the summary email means

**It only arrives when something needs your attention.** A run where every
labelled email parsed cleanly sends nothing — silence means it worked. When it
does arrive it lists, per email: events that were **skipped** and why, any
**error**, and whether the email was **truncated** for being over the length cap.

Every skip names its reason, because a skipped event is an event that is *not*
in Pending and that you will otherwise never hear about again.

**The most common skip by far is a date that has already passed.** The function
refuses to insert a one-off dated in the past, and says so:

> *Date has already passed (today is 2026-08-16) — it would be invisible in the
> Pending tab, so it was not added. Check the year.*

It is deliberate. A past-dated one-off inserts fine but is then filtered out of
both admin tabs, so it would sit in the database invisible and unapprovable —
parsed, lost, and no error anywhere. Almost always the cause is that the
organiser wrote "Saturday 12th" with no year and the model picked the wrong one.

What to do: open the original email, read the real date, and add the event with
**Add Manually** in `/admin/whats-on`. If the email genuinely does not say which
year — it happens — reply to the organiser and ask before listing anything.

**The summary email only arrives when something needs you** — a skip, an error,
or a truncation. A run where everything parsed cleanly sends nothing at all, so
silence means "no losses", not "nothing happened".

That makes one check your job on the Gmail route. Whether an event was read as a
**one-off on a date** or as **every [weekday]** is the judgement most likely to
be wrong, and the Pending table's columns (Event / Date / Area / Source) do not
show it. A clean-but-wrong recurrence produces no warning anywhere, so open each
newly parsed event in Pending and confirm which it is before approving. (The
green banner *does* state it for every event when you parse by pasting in the
admin panel — that route reports on screen, this one does not.)

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Nothing happens 15+ min after labelling | No trigger installed | Apps Script → **Triggers** (clock icon). If empty, run `createTrigger` once |
| Nothing happens, no error anywhere | Gmail label name does not match the script's | Compare exactly — `whats-on` ≠ `whats-on` in the wrong case ≠ `Parse ` with a trailing space. Nested labels count the parent: `GPC/whats-on` is a different label from `whats-on` |
| Nothing happens; **Executions** shows a failure | Script Properties missing or misspelled | Apps Script → **Executions** (list icon) shows every run and its error. Re-check both property names in Project Settings |
| `whats-on/error` label appears | The call failed — the summary email names the reason | Fix the cause below, then swap `whats-on/error` back to `whats-on` to retry that thread |
| `401` / `Invalid JWT` / `Missing authorization header` | Wrong, stale or truncated anon key, or wrong project ref | Re-copy the `anon` `public` key from Project Settings → API into `SUPABASE_ANON_KEY`. Confirm it is the anon key, not `service_role`, and that `SUPABASE_PROJECT_REF` matches the same project |
| `404` / function not found | `parse-event-email` not deployed to that project | `supabase functions deploy parse-event-email` |
| Summary email says **TRUNCATED** | The thread ran past 50,000 characters — usually a long forwarded chain or a pasted newsletter — so the script cut it to that length before sending, rather than letting the function reject it | Events found in the earlier part are already in Pending. Read the tail of the original for anything missed and add it with **Add Manually**. Do *not* re-label to retry — that duplicates everything already added |
| `OpenAI API error` / `Failed to parse the OpenAI response as JSON` | Model or OpenAI outage, or `OPENAI_API_KEY` unset on the function | Re-label to retry. If it repeats, check the function's `OPENAI_API_KEY` secret in the Supabase dashboard |
| Event in Pending has the **wrong date** | The email gave a day and month but no year, and the model guessed | Delete the row and re-add with **Add Manually**. If the email is genuinely ambiguous, ask the organiser |
| A weekly class listed as a **one-off**, or a one-off listed as **every [weekday]** | The email mentioned both a date and a weekday, or neither clearly. A date always wins over a weekday | Nothing flags this on the Gmail route — a clean-but-wrong reading produces no warning and sends no summary email. You catch it by opening each parsed event in Pending, as in section 6. Delete the row and re-add with **Add Manually** |
| Event added with **no map pin** | No postcode in the email, or the postcode did not resolve | The warning says which. Edit the event and add the postcode |
| **Duplicate** events in Pending | The same thread was labelled `whats-on` more than once — usually after removing the label by hand, or re-labelling a thread when the organiser replied | Delete the extras in Pending. There is no unique constraint stopping duplicates, so the label swap is the only guard — leave it alone |
| Events from an email you never labelled | Not possible via this route. Check whether someone used the "Parse Email" paste box, or whether the label was applied by a Gmail filter you set up earlier | Check Gmail → Settings → Filters |

---

## 8. Limits and costs

| Limit | Value | Why it matters |
|---|---|---|
| Model calls | **One gpt-4o call per labelled email** | Cost scales with emails you choose to list, not with inbox volume. A typical organiser email is well under 1p |
| Delay | **~10 minutes** | The trigger interval. Nothing is instant; do not stand and refresh Pending |
| Threads per run | A fixed cap, set at the top of the script | Anything over it keeps its `whats-on` label and is picked up on the next run ten minutes later. Labelling thirty emails at once is fine, it just takes a few cycles |
| Apps Script execution | **6 minutes per run**, hard | The per-run cap exists to stay inside it. A run cut off mid-way leaves unprocessed threads labelled `whats-on`, so they are retried, not lost |
| Email length | **50,000 characters** | Longer input is rejected by the function with a 400 |
| Google quotas | Consumer Gmail allows a few thousand outbound URL fetches a day | Nowhere near reachable at this volume |

**A thread is parsed once.** The label swap is per thread, so if an organiser
replies to the same thread a week later with a second event, the new message is
*not* parsed automatically — the thread already carries `whats-on/parsed`. Re-apply
`whats-on` to send the whole thread through again, then delete any duplicate rows
the first pass had already created.

---

## 9. Turning it off

1. Apps Script → **Triggers** (clock icon) → hover the row → **⋮** → **Delete
   trigger**. Nothing runs after this. This is the off switch.
2. **Removing the Gmail label does not stop anything already queued.** A run
   that has already started will finish, and events already written to Pending
   stay there — delete them in `/admin/whats-on` if you do not want them.
3. To retire it permanently, also delete `SUPABASE_ANON_KEY` from Script
   Properties so the key is not sitting in a script nobody maintains.

The "Parse Email" paste box in `/admin/whats-on` keeps working either way — it
calls the same function directly and does not depend on any of this.
