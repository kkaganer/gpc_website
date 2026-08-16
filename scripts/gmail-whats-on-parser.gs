/**
 * Greenwich Parents & Carers — Gmail → What's On "Pending" queue
 * =============================================================================
 *
 * WHAT THIS DOES
 * Organisers email us asking for their class or event to be listed. You put a
 * Gmail LABEL on those emails. Every 10 minutes this script finds the labelled
 * ones, sends the text to our parse-event-email function, and the events appear
 * in the Pending tab of /admin/whats-on for you to approve. Nothing goes on the
 * public site without your approval — that gate is what makes this safe to run
 * automatically.
 *
 * WHY IT ONLY LOOKS AT LABELLED EMAILS
 * Deliberate. Labelling is your decision, the same deliberate act as pasting an
 * email into the Parse Email box today. It keeps spam and any "ignore your
 * instructions" mischief away from the model entirely, and keeps the AI bill
 * proportional to real work. This script must NEVER be changed to read the
 * whole inbox.
 *
 * -----------------------------------------------------------------------------
 * SETUP — do this once
 * -----------------------------------------------------------------------------
 * 1. Open the Gmail account (gpc.communitynews@gmail.com) → script.google.com →
 *    New project → paste this whole file in, replacing whatever is there.
 * 2. Click the gear icon (Project Settings) → "Script properties" →
 *    "Add script property", and add:
 *
 *      SUPABASE_PROJECT_REF   the bit before ".supabase.co" in your Supabase
 *                             dashboard URL, e.g. abcdefghijklmnop
 *      SUPABASE_ANON_KEY      Supabase → Project Settings → API → anon / public
 *
 *    Optional, but worth setting:
 *      SITE_URL               e.g. https://greenwichparents.org  (used to put a
 *                             clickable link to the Pending tab in the summary
 *                             email)
 *      REPORT_EMAIL           where summary emails go. Defaults to this Gmail
 *                             account, which is normally what you want.
 *
 * 3. Back in the editor, choose "testConnection" from the function dropdown and
 *    press Run. Approve the permissions Google asks for. It should log
 *    "CONNECTION OK". Read its comment first — it is designed NOT to create a
 *    real event.
 * 4. Choose "createTrigger" and press Run. That schedules the 10-minute check
 *    and creates the three labels.
 * 5. Label a real organiser email "whats-on" and wait ten minutes.
 *
 * -----------------------------------------------------------------------------
 * ABOUT THE KEY — READ THIS
 * -----------------------------------------------------------------------------
 * The ANON key is the correct key here, and the service-role key must NEVER be
 * put in this script. The reason: parse-event-email holds its own service-role
 * key inside Supabase and uses that to write to the database. All the caller
 * has to do is get past Supabase's front-door check (verify_jwt), and the anon
 * key does that. The service-role key is full, unrestricted access to the whole
 * database — if this Google account were ever compromised, that key would go
 * with it. There is no upside to using it and a catastrophic downside.
 * getConfig_() below actively refuses to run if the key looks like a secret one.
 *
 * -----------------------------------------------------------------------------
 * A NOTE ON THE FUNCTION NAMES
 * -----------------------------------------------------------------------------
 * Functions ending in an underscore are internal plumbing — Apps Script hides
 * them from the Run dropdown. The three you can run yourself are:
 * processWhatsOnEmails, createTrigger, testConnection.
 */


// =============================================================================
// CONFIG
// =============================================================================

/**
 * THE LABEL STATE MACHINE — this is the whole idempotency guarantee.
 *
 *   whats-on           you apply this. It is the ONLY thing that makes the
 *                      script look at an email.
 *   whats-on/parsed    the parser accepted the email. "whats-on" is removed.
 *   whats-on/error     the parse failed. "whats-on" is removed.
 *
 * An email is parsed only while it carries "whats-on", and handling it always
 * ends by taking that label off. So it can never be parsed twice — which
 * matters because there is no unique constraint on london_events to catch
 * duplicates; they would just sit in Pending twice with nothing to say why.
 *
 * WHEN A REPLY ARRIVES LATER on an already-parsed thread: the thread carries
 * "whats-on/parsed", not "whats-on", so nothing happens. That is correct and
 * predictable — a chatty "thanks!" reply should not re-create the events. If
 * the reply genuinely adds a new event, put "whats-on" back on the thread and
 * it will be parsed again on the next run. Deliberate act, same as before.
 *
 * These are nested labels, so Gmail shows them tidily under one "whats-on"
 * heading in the sidebar. Let the script create them (createTrigger does it) —
 * if you hand-make them with different capitalisation they will not match.
 */
var TRIGGER_LABEL = 'whats-on';
var PARSED_LABEL = 'whats-on/parsed';
var ERROR_LABEL = 'whats-on/error';

/**
 * How many threads one run will handle. Apps Script kills a run at ~6 minutes,
 * and each email means an AI call that can take the best part of a minute, so a
 * big backlog must not be attempted in one go. Anything left over keeps its
 * "whats-on" label and is picked up by the next run ten minutes later — nothing
 * is lost, it just arrives a bit later.
 */
var MAX_THREADS_PER_RUN = 10;

/**
 * parse-event-email rejects anything over 50,000 characters with a 400. We
 * truncate to the same number rather than let that happen, and say so in the
 * summary email so a chopped-off event is never a silent loss.
 */
var MAX_EMAIL_CHARS = 50000;

// There is deliberately NO retry setting. An email is sent to the parser at
// most once per run. Retrying is only safe when you know the previous attempt
// did not write anything, and from out here you cannot know that: a read
// timeout and a gateway 502 both look like failures while the function may have
// finished inserting. There is no idempotency key on the call and no unique
// constraint on london_events covering these rows, so a retry that guesses
// wrong produces duplicate events with nothing to catch them. Anything genuinely
// unresolved is handed to the admin with the wording "check Pending first",
// which is the only safe retry there is.

/** How long to wait for the lock before giving up and letting the other run work. */
var LOCK_WAIT_MS = 30000;

/**
 * Stop STARTING new emails after this long, so we never begin a call we cannot
 * finish inside the ~6 minute limit. Being killed mid-call is the one situation
 * where we cannot tell whether events were created.
 *
 * The arithmetic: one email now costs at most a single UrlFetchApp call, whose
 * own ceiling is around 60s. 240s of budget + 60s of worst-case call + label
 * and mail overhead stays comfortably inside the 360s kill. (With the old
 * 3-attempt retry loop this did NOT hold — three calls plus back-off could run
 * past 360s and be killed mid-flight, which is exactly the unknown outcome the
 * budget exists to prevent.)
 */
var RUN_BUDGET_MS = 4 * 60 * 1000;

/** Where the parsed events end up, for the "no SITE_URL set" wording. */
var PENDING_TAB_DESCRIPTION = 'the admin panel → What\'s On → Pending tab';


// =============================================================================
// MAIN ENTRY POINT — this is what the 10-minute trigger calls
// =============================================================================

function processWhatsOnEmails() {
  // Time triggers can overlap (a slow run still going when the next one fires).
  // Two runs seeing the same labelled email would parse it twice, so the second
  // one simply stands down. Its work is not lost — the emails still carry the
  // trigger label and the next run picks them up.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) {
    console.log('[whats-on] Another run is already working. Standing down.');
    return;
  }

  try {
    var config = getConfig_();
    var labels = getOrCreateLabels_();

    var threads = labels.trigger.getThreads(0, MAX_THREADS_PER_RUN);
    if (threads.length === 0) {
      console.log('[whats-on] Nothing labelled "' + TRIGGER_LABEL + '". Nothing to do.');
      return;
    }
    console.log('[whats-on] Found ' + threads.length + ' labelled email(s) to process.');

    var results = [];
    var startedAt = Date.now();

    for (var i = 0; i < threads.length; i++) {
      if (Date.now() - startedAt > RUN_BUDGET_MS) {
        console.log('[whats-on] Out of time budget — leaving ' + (threads.length - i) +
          ' email(s) labelled for the next run.');
        break;
      }
      // One thread must never cost the run. An escaping exception here would
      // discard the results of every thread already processed — including their
      // skipped events, which are only ever reported by the summary email — and
      // leave the rest of the queue unprocessed behind the same bad email on
      // every future run.
      try {
        results.push(handleThread_(threads[i], labels, config));
      } catch (err) {
        var message = (err && err.message) ? err.message : String(err);
        console.error('[whats-on] Unexpected failure handling a thread: ' + message);
        var failed = {
          subject: '(could not be read)',
          permalink: '',
          added: 0, rawCount: 0, events: [], skipped: [], truncated: false,
          // Unknown, not failed: the throw may have come after the insert.
          error: 'Unexpected failure while handling this email: ' + message +
            ' — events MAY have been created, check ' + PENDING_TAB_DESCRIPTION + ' before re-labelling.',
          outcomeUnknown: true
        };
        try {
          failed.subject = threads[i].getFirstMessageSubject() || '(no subject)';
          failed.permalink = threads[i].getPermalink();
        } catch (ignored) { /* keep the placeholders */ }
        // Get the trigger label off even now, or this thread throws again every
        // ten minutes and blocks the queue behind it.
        try { applyOutcomeLabels_(threads[i], labels, false); } catch (ignored2) { /* reported below */ }
        results.push(failed);
      }
    }

    sendSummaryIfNeeded_(results, config);
  } finally {
    // Always, even if something above threw — otherwise the lock would keep
    // every later run out until it expires.
    lock.releaseLock();
  }
}


// =============================================================================
// ONE EMAIL THREAD, START TO FINISH
// =============================================================================

function handleThread_(thread, labels, config) {
  var result = {
    subject: thread.getFirstMessageSubject() || '(no subject)',
    permalink: thread.getPermalink(),
    added: 0,
    rawCount: 0,
    events: [],
    skipped: [],
    truncated: false,
    error: null,
    // True when a request went out but we never saw the answer, so we genuinely
    // do not know whether events were created. The admin has to look.
    outcomeUnknown: false
  };

  var emailText = buildEmailText_(thread, result);

  if (!emailText) {
    result.error = 'This email had no readable plain text, so there was nothing to send to the parser.';
  } else {
    var call = callParser_(emailText, config);
    if (call.ok) {
      result.added = call.data.inserted || 0;
      result.rawCount = call.data.raw_count || 0;
      result.events = call.data.events || [];
      result.skipped = call.data.skipped || [];
    } else {
      result.error = call.error;
      result.outcomeUnknown = !!call.outcomeUnknown;
    }
  }

  var labelProblem = applyOutcomeLabels_(thread, labels, !result.error);
  if (labelProblem) {
    // Surfaced as an error so the summary email is guaranteed to go out. The
    // parse itself may well have succeeded; the danger is what happens next.
    result.error = (result.error ? result.error + ' ALSO: ' : '') + labelProblem;
    result.outcomeUnknown = true;
  }

  // Always log a one-liner, whether or not anything gets emailed. When
  // something goes wrong at 3am, the execution log is the record of what
  // happened, and a run that reports nothing must still be readable here.
  console.log('[whats-on] "' + result.subject + '" → ' +
    (result.error
      ? 'FAILED: ' + result.error
      : 'added ' + result.added + ', skipped ' + result.skipped.length +
        ' (model found ' + result.rawCount + ')' +
        (result.truncated ? ', TRUNCATED' : '')));

  return result;
}

/**
 * Move the thread out of the queue.
 *
 * ORDER MATTERS. The trigger label comes off FIRST. If the script were killed
 * between these two calls, removing first leaves the thread with no label — the
 * events are in Pending and the log says what happened, and crucially it will
 * not be parsed again. The other order (add, then remove) could leave "whats-on"
 * sitting on an already-parsed email, which would re-parse it every ten minutes
 * and fill Pending with duplicates. A missing label is a nuisance; duplicates
 * are the one failure we will not accept.
 *
 * Failures lose the trigger label too, for the same reason: an email the parser
 * cannot handle would otherwise be retried for ever, burning quota on every
 * cycle. It gets "whats-on/error" and lands in the summary email; you re-label
 * it by hand when you want another go.
 */
function applyOutcomeLabels_(thread, labels, succeeded) {
  // Removing the trigger label is the ONLY thing standing between a parsed
  // email and being parsed again ten minutes later. Gmail calls fail
  // transiently ("Service invoked too many times", backend hiccups), and an
  // unguarded throw here would escape with the events already in Pending and
  // the trigger label still attached — re-parsing on every cycle, for ever if
  // the failure is deterministic. So this one operation is retried (it is
  // idempotent, unlike the parse call), and if it still will not go, we return
  // the problem rather than throwing, so the run reports it loudly.
  var labelError = null;
  for (var attempt = 1; attempt <= 3; attempt++) {
    try {
      thread.removeLabel(labels.trigger);
      labelError = null;
      break;
    } catch (err) {
      labelError = (err && err.message) ? err.message : String(err);
      if (attempt < 3) Utilities.sleep(1000 * attempt);
    }
  }

  if (labelError) {
    return 'The events were handled, but the "' + TRIGGER_LABEL + '" label could NOT be removed (' +
      labelError + '). REMOVE IT BY HAND NOW — otherwise this email is parsed again every ten ' +
      'minutes and Pending fills with duplicates.';
  }

  // Cosmetic by comparison, so failure here is noted but not escalated. Also
  // clear the opposite outcome label: a thread that errored, was re-labelled by
  // hand and then succeeded would otherwise carry both parsed and error.
  try {
    thread.removeLabel(succeeded ? labels.error : labels.parsed);
  } catch (ignored) { /* the label may simply not be on the thread */ }
  try {
    thread.addLabel(succeeded ? labels.parsed : labels.error);
  } catch (err2) {
    console.error('[whats-on] Could not add the outcome label: ' +
      ((err2 && err2.message) ? err2.message : String(err2)) +
      ' (the trigger label IS off, so this email will not be re-parsed.)');
  }

  return null;
}


// =============================================================================
// TURNING A THREAD INTO THE TEXT WE SEND
// =============================================================================

/**
 * All the messages in the thread, oldest first, each with a short From/Date/
 * Subject header. The subject usually carries the event name and the From line
 * identifies the organiser, so both are worth giving the model. Later messages
 * in a thread often carry the corrections ("sorry, it's the 14th not the 4th"),
 * which is why we send the whole thread and not just the first message.
 *
 * Plain body, never the HTML one: HTML would spend the character budget on
 * markup and tables, and gives the model tags to trip over. Gmail generates a
 * plain-text version even for HTML-only emails, so nothing is missed.
 */
function buildEmailText_(thread, result) {
  var timeZone = Session.getScriptTimeZone();
  var messages = thread.getMessages();
  var parts = [];

  for (var i = 0; i < messages.length; i++) {
    var message = messages[i];
    var header =
      'From: ' + message.getFrom() + '\n' +
      'Date: ' + Utilities.formatDate(message.getDate(), timeZone, 'EEE d MMM yyyy HH:mm') + '\n' +
      'Subject: ' + (message.getSubject() || '(no subject)');
    var body = (message.getPlainBody() || '').trim();
    parts.push(header + '\n\n' + body);
  }

  var text = parts.join('\n\n----- next message in this thread -----\n\n').trim();

  if (text.length > MAX_EMAIL_CHARS) {
    // The function returns a hard 400 above the cap, which would fail the whole
    // email. Cutting it short at least gets the earlier (usually the important)
    // part parsed — and result.truncated makes sure you are told, so a lost
    // event at the bottom of a very long email is never silent.
    text = text.slice(0, MAX_EMAIL_CHARS).trim();
    result.truncated = true;
  }

  return text;
}


// =============================================================================
// CALLING parse-event-email
// =============================================================================

/**
 * Returns { ok: true, data: <the function's JSON> }
 *      or { ok: false, error: '...', outcomeUnknown: true|false }
 */
function callParser_(emailText, config) {
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + config.anonKey },
    payload: JSON.stringify({ emailText: emailText }),
    // Without this, Apps Script throws on any non-2xx and we never get to read
    // the body — and the body is where the function explains what was wrong.
    muteHttpExceptions: true
  };

  var response;

  try {
    response = UrlFetchApp.fetch(config.functionUrl, options);
  } catch (err) {
    var message = (err && err.message) ? err.message : String(err);

    // FAIL CLOSED. We cannot tell, from an Apps Script transport exception,
    // whether the request reached the server. A DNS failure and a read timeout
    // can surface with similar wording, and the difference matters enormously:
    // a timeout means the function may have run to completion and inserted the
    // events. There is no idempotency key on this call and london_events has no
    // unique constraint covering these rows, so a wrong guess here means silent
    // duplicates. So every transport failure is "unknown", and a human decides.
    return {
      ok: false,
      outcomeUnknown: true,
      error: 'Could not complete the request (' + message + '). The events MAY have been created — ' +
        'check ' + PENDING_TAB_DESCRIPTION + ' before re-labelling this email, or you will get duplicates.'
    };
  }

  var status = response.getResponseCode();
  var bodyText = response.getContentText();
  var body = null;
  try {
    body = JSON.parse(bodyText);
  } catch (parseErr) {
    body = null; // Handled below — never assume the body is JSON.
  }

  if (status >= 200 && status < 300) {
    if (body && body.success === true) {
      return { ok: true, data: body };
    }
    // The server ran to completion and answered 2xx; we just cannot read the
    // answer. Rows may well exist, so this is NOT "nothing was added".
    return {
      ok: false,
      outcomeUnknown: true,
      error: 'The parser replied HTTP ' + status + ' but not in the expected shape: ' +
        bodyText.slice(0, 300) + ' — events MAY have been created, check ' +
        PENDING_TAB_DESCRIPTION + ' before re-labelling.'
    };
  }

  // 4xx never reaches the insert. Platform rejections (401 bad key, 403, 404
  // wrong URL) stop before the function runs at all, and every 400 the function
  // itself raises is thrown during input validation, before the database is
  // touched. These are safely "nothing was added".
  if (status >= 400 && status < 500) {
    return {
      ok: false,
      outcomeUnknown: false,
      error: 'HTTP ' + status + ' from the parser: ' + ((body && body.error) ? body.error : bodyText.slice(0, 300))
    };
  }

  // A 500 carrying the function's own {success:false} body came from its catch
  // block, and every throw that reaches it happens before the insert — safe.
  if (status === 500 && body && body.success === false) {
    return {
      ok: false,
      outcomeUnknown: false,
      error: 'The parser failed before writing anything: ' + (body.error || 'no reason given')
    };
  }

  // Everything else is a PLATFORM 5xx — 502, 503, 504 gateway timeout, 546
  // worker resource limit — raised by Supabase around the function rather than
  // by the function itself. These can occur after rows were written (the
  // function inserts row-by-row when a batch insert fails), so they are never
  // safe to treat as "nothing happened", and never safe to retry.
  return {
    ok: false,
    outcomeUnknown: true,
    error: 'HTTP ' + status + ' from the platform, not the parser' +
      (bodyText ? ' (' + bodyText.slice(0, 200) + ')' : '') +
      '. The events MAY have been created — check ' + PENDING_TAB_DESCRIPTION +
      ' before re-labelling this email, or you will get duplicates.'
  };
}


// =============================================================================
// THE SUMMARY EMAIL
// =============================================================================

/**
 * ONE email per run, and only when there is something you must actually do:
 * an event was skipped, an email failed, or text was truncated. A clean run
 * sends nothing — the new events are sitting in Pending where you will see
 * them, and a message every ten minutes saying "all fine" is how a mailbox
 * teaches you to ignore it.
 *
 * Warnings on ADDED events do not, on their own, trigger an email. Most are
 * routine ("no postcode in the email — added without map coordinates") and the
 * event is right there in Pending to look at. They are always shown in the
 * summary when one is sent, and always in the execution log.
 */
function sendSummaryIfNeeded_(results, config) {
  var needsAttention = results.filter(function (r) {
    return r.error || r.truncated || (r.skipped && r.skipped.length > 0);
  });

  if (needsAttention.length === 0) {
    console.log('[whats-on] Run finished cleanly — no summary email needed.');
    return;
  }

  var recipient = config.reportTo;
  if (!recipient) {
    // Never swallow this: if we cannot email, the log is the only record left.
    console.error('[whats-on] ' + needsAttention.length + ' email(s) need attention but no report ' +
      'address could be worked out. Set the REPORT_EMAIL script property.');
    return;
  }

  var lines = [];
  lines.push(needsAttention.length + ' of ' + results.length +
    ' labelled email(s) need a look. Run at ' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'd MMM yyyy HH:mm') + '.');
  lines.push('');
  lines.push(config.siteUrl
    ? 'Review and approve here: ' + config.siteUrl.replace(/\/+$/, '') + '/admin/whats-on'
    : 'Review and approve in ' + PENDING_TAB_DESCRIPTION + '. (Set the SITE_URL script property to get a direct link here.)');

  for (var i = 0; i < results.length; i++) {
    var r = results[i];
    if (!r.error && !r.truncated && r.skipped.length === 0) continue;

    lines.push('');
    lines.push('-----------------------------------------------------------');
    lines.push('EMAIL: ' + r.subject);
    lines.push('Open it: ' + r.permalink);

    if (r.error) {
      lines.push('');
      lines.push(r.outcomeUnknown ? 'OUTCOME UNKNOWN — READ THIS ONE:' : 'FAILED — nothing was added:');
      lines.push('  ' + r.error);
      lines.push('  Labelled "' + ERROR_LABEL + '". To try again, put "' + TRIGGER_LABEL + '" back on it.');
      continue;
    }

    lines.push('Events added to Pending: ' + r.added + ' (the parser read ' + r.rawCount + ' from the email)');

    if (r.truncated) {
      lines.push('');
      lines.push('TRUNCATED: this email was longer than ' + MAX_EMAIL_CHARS + ' characters, so only the');
      lines.push('  beginning was parsed. Anything mentioned near the end may be missing — check the');
      lines.push('  original and add it by hand if so.');
    }

    if (r.skipped.length > 0) {
      lines.push('');
      lines.push('NOT ADDED (' + r.skipped.length + ') — these need you to decide:');
      for (var s = 0; s < r.skipped.length; s++) {
        var skip = r.skipped[s];
        lines.push('  • ' + (skip.title || '(untitled)') +
          (skip.date ? '  [date given: ' + skip.date + ']' : ''));
        lines.push('    Reason: ' + skip.reason);
      }
    }

    var warningLines = [];
    for (var e = 0; e < r.events.length; e++) {
      var ev = r.events[e];
      if (!ev.warnings || ev.warnings.length === 0) continue;
      warningLines.push('  • ' + ev.title + ' (' + (ev.is_recurring ? 'weekly, first listed ' : '') + ev.date + ')');
      for (var w = 0; w < ev.warnings.length; w++) {
        warningLines.push('    - ' + ev.warnings[w]);
      }
    }
    if (warningLines.length > 0) {
      lines.push('');
      lines.push('ADDED, BUT WORTH CHECKING:');
      lines = lines.concat(warningLines);
    }
  }

  lines.push('');
  lines.push('-----------------------------------------------------------');
  lines.push('Sent automatically by the Gmail → What\'s On parser (Apps Script).');
  lines.push('Emails handled successfully are labelled "' + PARSED_LABEL + '"; failures "' + ERROR_LABEL + '".');

  var bodyText = lines.join('\n');

  // By the time this runs the labels have already been swapped, so this email is
  // the only remaining record of what was skipped. If it cannot be sent, the
  // report must survive somewhere — dump it to the execution log rather than let
  // the exception escape and take the whole thing with it.
  try {
    GmailApp.sendEmail(
      recipient,
      'What\'s On parser: ' + needsAttention.length + ' email(s) need attention',
      bodyText
    );
    console.log('[whats-on] Summary emailed to ' + recipient + '.');
  } catch (err) {
    console.error('[whats-on] COULD NOT SEND THE SUMMARY (' +
      ((err && err.message) ? err.message : String(err)) +
      '). The full report follows so it is not lost:\n' + bodyText);
  }
}


// =============================================================================
// CONFIG AND LABELS
// =============================================================================

function getConfig_() {
  var props = PropertiesService.getScriptProperties();

  var projectRef = (props.getProperty('SUPABASE_PROJECT_REF') || '').trim();
  var anonKey = (props.getProperty('SUPABASE_ANON_KEY') || '').trim();
  var siteUrl = (props.getProperty('SITE_URL') || '').trim();
  var reportTo = (props.getProperty('REPORT_EMAIL') || '').trim();

  if (!projectRef) throw new Error(missingPropertyMessage_('SUPABASE_PROJECT_REF',
    'the part before ".supabase.co" in your Supabase dashboard URL'));
  if (!anonKey) throw new Error(missingPropertyMessage_('SUPABASE_ANON_KEY',
    'Supabase → Project Settings → API → the "anon / public" key (NOT the service_role key)'));

  // A wrong key here would be a serious mistake, so refuse rather than proceed.
  if (looksLikeSecretKey_(anonKey)) {
    throw new Error(
      'SUPABASE_ANON_KEY appears to hold a SERVICE ROLE / secret key. That key is full ' +
      'access to the whole database and must never live in Apps Script. Replace it with the ' +
      'anon / public key — the parse-event-email function already has its own service-role key ' +
      'inside Supabase, so the anon key is all this script needs.'
    );
  }

  if (!reportTo) {
    // The mailbox reports to itself. getActiveUser is the account that installed
    // the trigger; getEffectiveUser is the fallback when a trigger context does
    // not expose it.
    try { reportTo = Session.getActiveUser().getEmail() || ''; } catch (e) { reportTo = ''; }
    if (!reportTo) {
      try { reportTo = Session.getEffectiveUser().getEmail() || ''; } catch (e2) { reportTo = ''; }
    }
  }

  return {
    functionUrl: 'https://' + projectRef + '.supabase.co/functions/v1/parse-event-email',
    anonKey: anonKey,
    siteUrl: siteUrl,
    reportTo: reportTo
  };
}

function missingPropertyMessage_(name, whatItIs) {
  return 'The script property "' + name + '" is not set, so this script cannot run. ' +
    'Set it in the Apps Script editor: gear icon (Project Settings) → Script properties → ' +
    'Add script property. Its value is ' + whatItIs + '.';
}

/**
 * Catches both shapes of Supabase secret key: the legacy JWT (whose middle
 * segment spells out "service_role") and the newer "sb_secret_..." format.
 * Deliberately fails open — if the check itself errors we do not block the run,
 * we just lose the safety net.
 */
function looksLikeSecretKey_(key) {
  if (key.indexOf('sb_secret_') === 0) return true;
  var parts = key.split('.');
  if (parts.length !== 3) return false;
  try {
    var json = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString();
    return json.indexOf('service_role') !== -1;
  } catch (e) {
    return false;
  }
}

/**
 * Fetch the three labels, creating any that are missing so setup is one step
 * shorter. Gmail creates the "whats-on" parent automatically when a nested
 * label is made, but we create it explicitly first so it always exists with
 * exactly the spelling this script looks for.
 */
function getOrCreateLabels_() {
  return {
    trigger: getOrCreateLabel_(TRIGGER_LABEL),
    parsed: getOrCreateLabel_(PARSED_LABEL),
    error: getOrCreateLabel_(ERROR_LABEL)
  };
}

function getOrCreateLabel_(name) {
  // getUserLabelByName is exact and case-sensitive, and getThreads() on the
  // label object returns ONLY threads carrying that exact label. A Gmail search
  // for "label:whats-on" would also sweep up the nested parsed/error labels and
  // re-parse everything, which is why this script never searches.
  var label = GmailApp.getUserLabelByName(name);
  return label ? label : GmailApp.createLabel(name);
}


// =============================================================================
// SETUP HELPERS — run these by hand from the editor
// =============================================================================

/**
 * Run once to schedule the 10-minute check. Safe to run again any time.
 *
 * It deletes any existing trigger for processWhatsOnEmails before making a new
 * one. Without that, running this twice would leave TWO triggers firing, and
 * two runs starting together is exactly the double-parse the LockService guard
 * exists to prevent — no sense creating the problem on purpose.
 */
function createTrigger() {
  var existing = ScriptApp.getProjectTriggers();
  var removed = 0;
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].getHandlerFunction() === 'processWhatsOnEmails') {
      ScriptApp.deleteTrigger(existing[i]);
      removed++;
    }
  }

  ScriptApp.newTrigger('processWhatsOnEmails').timeBased().everyMinutes(10).create();
  getOrCreateLabels_(); // So the labels are in Gmail's sidebar straight away.

  console.log('Removed ' + removed + ' old trigger(s) and scheduled processWhatsOnEmails every 10 minutes.');
  console.log('Labels ready: "' + TRIGGER_LABEL + '" (apply this one), "' + PARSED_LABEL + '", "' + ERROR_LABEL + '".');
}

/**
 * Check the properties and the connection BEFORE labelling anything real.
 * Run it from the editor and read the log.
 *
 * IT DOES NOT CREATE A TEST EVENT. The sample below is dated 11 January 2020 on
 * purpose. parse-event-email refuses to insert a one-off whose date has already
 * passed — such a row would be invisible in Pending and quietly lost — so it
 * comes back in "skipped" instead. That gives us a full round trip through the
 * URL, the key, the model and the validation, while leaving the database
 * untouched and nothing for you to tidy up afterwards. (A future-dated sample
 * would work too, but then you would have to remember to delete it, and the
 * thing you forget to delete is the thing that ends up on the public site.)
 *
 * A healthy result logs "CONNECTION OK", inserted: 0, and one skipped event
 * whose reason mentions the date having passed.
 */
function testConnection() {
  var config = getConfig_();
  console.log('Calling: ' + config.functionUrl);
  console.log('Summary emails would go to: ' + (config.reportTo || '(nowhere — set REPORT_EMAIL)'));

  var sample = [
    'From: Test Organiser <organiser@example.com>',
    'Date: 11 Jan 2020 09:00',
    'Subject: Connection test — please ignore',
    '',
    'Hello, we held a one-off baby sensory taster session (it does not repeat)',
    'at Mycenae House, 90 Mycenae Road, London SE3 7SE, on 11 January 2020,',
    '10:00-11:00, £5. Please could you list it in What\'s On?'
  ].join('\n');

  var call = callParser_(sample, config);

  if (!call.ok) {
    console.error('CONNECTION FAILED: ' + call.error);
    console.error('Check SUPABASE_PROJECT_REF and SUPABASE_ANON_KEY in Project Settings → Script properties.');
    return;
  }

  console.log('CONNECTION OK.');
  console.log('The parser read ' + (call.data.raw_count || 0) + ' event(s) from the sample.');
  console.log('Inserted: ' + call.data.inserted + ' (0 is the expected, correct answer)');
  console.log('Skipped: ' + JSON.stringify(call.data.skipped, null, 2));

  if (call.data.inserted > 0) {
    console.warn('The sample DID create ' + call.data.inserted + ' event(s) in Pending, which was not ' +
      'expected. Go to ' + PENDING_TAB_DESCRIPTION + ' and delete the "Connection test" event(s).');
    console.warn(JSON.stringify(call.data.events, null, 2));
  }
}
