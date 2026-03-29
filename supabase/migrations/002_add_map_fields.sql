-- Add map and venue fields to london_events
ALTER TABLE london_events ADD COLUMN lat double precision;
ALTER TABLE london_events ADD COLUMN lng double precision;
ALTER TABLE london_events ADD COLUMN venue text;
ALTER TABLE london_events ADD COLUMN end_date date;

-- Allow anyone to submit events (they go in as unapproved)
CREATE POLICY "Anyone can submit events" ON london_events
  FOR INSERT WITH CHECK (approved = false);
