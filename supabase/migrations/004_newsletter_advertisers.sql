-- Newsletter advertisers table (track advertiser bookings per newsletter edition)
CREATE TABLE newsletter_advertisers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_name text NOT NULL,
  contact_email text,
  event_title text NOT NULL,
  event_description text,
  event_url text,
  newsletter_date date NOT NULL,
  ad_type text NOT NULL DEFAULT 'free-listing' CHECK (ad_type IN ('free-listing', 'featured-ad', 'logo-sponsor')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'included', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE newsletter_advertisers ENABLE ROW LEVEL SECURITY;

-- Authenticated-only access (same as newsletter_drafts)
CREATE POLICY "Authenticated users can view newsletter advertisers" ON newsletter_advertisers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert newsletter advertisers" ON newsletter_advertisers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update newsletter advertisers" ON newsletter_advertisers
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete newsletter advertisers" ON newsletter_advertisers
  FOR DELETE TO authenticated USING (true);

-- Reuse existing updated_at trigger function
CREATE TRIGGER newsletter_advertisers_updated_at
  BEFORE UPDATE ON newsletter_advertisers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
