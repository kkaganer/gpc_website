/goal The admin Help page carries the Friday-morning running order as one
numbered sequence, so somebody who has not sent the newsletter for a week can
follow it top to bottom without deciding what comes next.

1. Merge Help.jsx's current steps 5 (Copy the HTML into Brevo and send), 6 (Post
   the WhatsApp message) and 7 (Check the web page) into one ordered send-day
   sequence, in the order: open `/whats-on/<the Friday>` and check it -> Generate
   -> read the draft -> Copy HTML -> send from Brevo -> post the WhatsApp text ->
   Mark as sent. No duplicate copy left behind, and the step numbers after it
   renumber cleanly.
2. Each step states what to check before moving on. The page is first because
   both the email and WhatsApp point at it, so wrong there is wrong everywhere.
3. State the true reason WhatsApp comes last: the send has been confirmed to
   work and the page has been read. NOT "so the link is live" -- `/whats-on/:date`
   is data-driven and live as soon as events are approved.
4. Keep, do not lose: nothing in this admin sends email; Brevo holds a copy of
   the list and Supabase is the source of truth; `Mark as sent` is a label, not
   a send; the unsubscribe merge tag only gets checked on a test send.

Out of scope: no redesign of Help.jsx's `Step` / `Note` / `Shortcut` components.
Do not touch the renderer, the edge function or any newsletter code. Do not
switch or name a different email provider. Do not invent Brevo screen names,
field labels or menu paths nobody has verified -- describe what has to be true,
not clicks.

Done when: `npm run build` exits 0 AND a script asserts the rendered Help source
contains the six anchors (the week's page, Generate, Copy HTML, Brevo send,
WhatsApp, Mark as sent) at ascending string indices AND every one of those steps
contains a stated check AND no step in the file duplicates another's subject AND
a screenshot of `/admin/help` shows the sequence. Do not weaken a check to pass
it. Stop after 8 tries.
