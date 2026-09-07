-- The WhatsApp companion to content_html.
--
-- The guide now lives on the website; email and WhatsApp are delivery. WhatsApp
-- takes no HTML at all -- only *bold*, _italic_ -- and truncates past roughly
-- 1000 characters, so the message is generated and stored alongside the email
-- rather than being hand-written each week.

alter table newsletter_drafts
  add column if not exists whatsapp_text text;
