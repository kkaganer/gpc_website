/goal Upload a poster image and the event writes itself: the info is read off
the picture and lands in Pending for a quick check — the same pipeline as a
parsed email.

1. There is no OCR/vision today — `src/components/ui/ImageUpload.jsx` only
   resizes/stores. But the extraction pipeline exists and the model is
   vision-capable: `supabase/functions/parse-event-email/index.ts` already calls
   gpt-4o via `/v1/responses` (`:461`) and does extract → validate → dedupe →
   insert-to-Pending.
2. Add a poster path: accept an uploaded image (base64, or a Supabase storage
   URL as an image content part), send it to gpt-4o vision with the same
   extraction instructions, and REUSE the existing validation/geocode/dedupe/
   Pending-insert so output matches the email parser's.
3. Front it with `ImageUpload` in the What's On manager, next to Parse — upload
   poster → review extracted fields → save to Pending.

Out of scope: multi-poster batch upload, editing the image, and auto-approving
(always lands in Pending for review).

Done when: `npm run build` exits 0 AND an uploaded sample poster produces a draft
event in Pending with title/date/venue filled from the image AND it reuses the
parse pipeline's dedupe/geocode (no second copy of that logic). Do not weaken a
check to pass it. Stop after 14 tries.
