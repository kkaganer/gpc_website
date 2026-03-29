-- Newsletter subscribers table
CREATE TABLE newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  subscribed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert their email)
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- Only authenticated users can view subscribers
CREATE POLICY "Authenticated users can view subscribers" ON newsletter_subscribers
  FOR SELECT TO authenticated USING (true);

-- Only authenticated users can delete subscribers
CREATE POLICY "Authenticated users can delete subscribers" ON newsletter_subscribers
  FOR DELETE TO authenticated USING (true);
