/goal Nothing in the product claims a `newsletter_advertisers` row with
`ad_type = 'free-listing'` produces a listing, because it does not: the sale is
the advertiser row, the listing is a `london_events` row somebody still has to
add. The Advertisers screen shows which confirmed free listings have not been
added yet.

1. `/advertise`'s Tier 3 wording and Help.jsx's ad-type explanation both describe
   the two-step reality. Today they promise the row itself appears in the list.
2. `/admin/newsletter-advertisers` flags `free-listing` rows at status confirmed
   or included that have no plausible matching `london_events` row, with a link
   to add one. There is no foreign key between the tables, so match conservatively
   on title text and say in the UI that it is a hint, not detection.
3. Confirmed in this repo and worth not re-deriving: only `featured-ad` and
   `logo-sponsor` are ever queried, by the renderer and by `useEdition`. No code
   path anywhere reads a `free-listing` row.

Out of scope: no schema changes and no new migration. Do not auto-create
`london_events` rows from advertiser rows. Do not merge advertiser rows into the
edition page's event list. Do not touch the renderer, the presenting slot or the
supporter row. Do not change how `featured-ad` or `logo-sponsor` behave. Do not
alter `parse-advertiser-email` filing enquiries as free-listing/pending.

Done when: `npm run build` exits 0 AND Help.jsx's ad-type explanation says a
free listing appears because somebody added it under What's On rather than
because of the advertiser row AND `/advertise` Tier 3 states how a listing
actually gets there and no longer says "Web list only" (a community listing CAN
be chosen as one of the email's five picks, because picks come from
`london_events`) AND a script proves the admin flag both ways -- a confirmed
free listing whose title has no approved `london_events` match is flagged, one
whose title does match is not -- AND a screenshot of
`/admin/newsletter-advertisers` shows the flag and its link. Do not weaken a
check to pass it. Stop after 10 tries.

## Amended mid-flight

The original done-when required a grep for "ordinary line" across `src/` to come
back empty. That was a bad proxy for the outcome and would have damaged copy
that is true: `/advertise` promises a reader that their event appears as an
ordinary line, and it does -- once it is added to What's On. The page never
claims the advertiser row is what renders it. The false claim lived only in
Help.jsx's ad-type explanation, which was already corrected. Checking the
outcome directly instead.
