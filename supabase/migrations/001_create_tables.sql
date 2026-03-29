-- GPC Events table (replaces hardcoded events.js)
CREATE TABLE gpc_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  date date NOT NULL,
  time text,
  location text NOT NULL,
  description text NOT NULL,
  image_url text,
  ticket_url text,
  price text,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'sold-out', 'past')),
  sponsors jsonb DEFAULT '[]',
  notes text,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- London events table (for What's On page)
CREATE TABLE london_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date NOT NULL,
  time text,
  location text NOT NULL,
  area text,
  description text,
  url text,
  source text DEFAULT 'manual',
  image_url text,
  category text,
  age_range text,
  price text,
  is_free boolean DEFAULT false,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Newsletter drafts table
CREATE TABLE newsletter_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content_html text NOT NULL,
  content_json jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent')),
  week_of date NOT NULL,
  events_included jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE gpc_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE london_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_drafts ENABLE ROW LEVEL SECURITY;

-- gpc_events: public read, authenticated write
CREATE POLICY "Public can view events" ON gpc_events
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert events" ON gpc_events
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update events" ON gpc_events
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete events" ON gpc_events
  FOR DELETE TO authenticated USING (true);

-- london_events: public read (approved only), authenticated full access
CREATE POLICY "Public can view approved london events" ON london_events
  FOR SELECT USING (approved = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert london events" ON london_events
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update london events" ON london_events
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete london events" ON london_events
  FOR DELETE TO authenticated USING (true);

-- newsletter_drafts: authenticated only
CREATE POLICY "Authenticated users can view newsletters" ON newsletter_drafts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert newsletters" ON newsletter_drafts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update newsletters" ON newsletter_drafts
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete newsletters" ON newsletter_drafts
  FOR DELETE TO authenticated USING (true);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gpc_events_updated_at
  BEFORE UPDATE ON gpc_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER newsletter_drafts_updated_at
  BEFORE UPDATE ON newsletter_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed existing events
INSERT INTO gpc_events (title, slug, date, time, location, description, image_url, ticket_url, price, status) VALUES
  ('Easter Egg Hunt', 'easter-egg-hunt', '2025-04-19', '10:00 - 12:00', 'Greenwich Park, London', 'Join us for a fun-filled Easter Egg Hunt in Greenwich Park! Activities include egg hunting, face painting, and arts & crafts. Perfect for children of all ages.', '/images/easter-egg-hunt.jpg', 'https://www.zeffy.com/en-GB/ticketing/easter-egg-hunt-gpc', 'Free', 'past'),
  ('Easter Egg & Beer Hunt', 'easter-egg-beer-hunt', '2025-04-19', '14:00 - 17:00', 'Greenwich Park, London', 'An adults-only Easter event! Hunt for eggs AND craft beers hidden around the park. A fun afternoon out for parents while the kids are with their other halves.', '/images/easter-beer-hunt.jpg', 'https://www.zeffy.com/en-GB/ticketing/easter-egg-beer-hunt-gpc', 'Free', 'past'),
  ('Christmas Fair 2025', 'christmas-fair-2025', '2025-12-07', '11:00 - 16:00', 'Greenwich West Community and Arts Centre', 'Our biggest event of the year! Stalls, Santa''s grotto, festive food, and family fun.', '/images/christmasfair.jpg', NULL, 'Adults £3 / Children Free', 'past'),
  ('Summer Fair 2025', 'summer-fair-2025', '2025-07-12', NULL, 'Greenwich Park', 'A wonderful day of stalls, activities, and community spirit in Greenwich Park.', '/images/summerfair.jpg', NULL, NULL, 'past');

-- Set sponsors for Christmas Fair
UPDATE gpc_events SET sponsors = '[{"name": "Working Mums Club", "logo": "/images/sponsors/working-mums-club.jpg", "url": "https://www.workingmumsclub.co.uk", "description": "Supporting working mothers with networking, events, and resources."}]', notes = 'Please note: dogs are not permitted at this venue.' WHERE slug = 'christmas-fair-2025';

-- Set sponsors for Summer Fair
UPDATE gpc_events SET sponsors = '[{"name": "Hartbeeps", "logo": "/images/sponsors/hartbeeps.jpg", "url": "https://www.hartbeeps.com", "description": "Multi-award-winning baby and toddler classes filled with music, sensory play, and imagination."}, {"name": "Waves Massage", "logo": "/images/sponsors/waves-massage.jpg", "url": "https://www.wavesmassage.co.uk", "description": "Professional massage therapy services in Greenwich, helping parents relax and unwind."}, {"name": "MammaKind", "logo": "/images/sponsors/mammakind.jpg", "url": "https://www.mammakind.com", "description": "Perinatal mental health support and wellbeing services for new and expectant parents."}, {"name": "Working Mums Club", "logo": "/images/sponsors/working-mums-club.jpg", "url": "https://www.workingmumsclub.co.uk", "description": "Supporting working mothers with networking, events, and resources."}]' WHERE slug = 'summer-fair-2025';

-- Auto-expire events: update status to 'past' when date has passed
-- Run this as a scheduled cron job via Supabase dashboard (pg_cron):
-- SELECT cron.schedule('auto-expire-events', '0 1 * * *', $$
--   UPDATE gpc_events SET status = 'past' WHERE date < CURRENT_DATE AND status = 'upcoming';
-- $$);

-- Create storage bucket for event images (run this via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true);
