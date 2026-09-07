-- Per-advertiser logo plate colour.
--
-- Supporter logos arrive in wildly different shapes, and some are transparent
-- PNGs with light artwork that would vanish on a white tile. Normalisation at
-- upload flattens each logo onto a solid plate; this column is which colour
-- that plate is, so the rare white-artwork logo can be given a dark one.
--
-- White is the default because most logos assume it, and a white tile on the
-- warm ground reads as the existing Card component.

alter table newsletter_advertisers
  add column if not exists logo_bg text not null default '#ffffff';
