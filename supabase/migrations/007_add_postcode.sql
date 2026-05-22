-- Store the submitted postcode so events can be (re-)geocoded for the map
ALTER TABLE london_events ADD COLUMN IF NOT EXISTS postcode text;
