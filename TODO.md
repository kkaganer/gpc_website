# GPC Website — Setup Checklist

## 1. Create a Supabase Project
- [x ] Go to https://supabase.com and create a free account
- [x ] Click "New Project", pick a name (e.g. "gpc-website") and set a database password
- [x ] Wait for the project to finish provisioning (~1 minute)
- [x] Copy your **Project URL** and **anon public key** from Settings > API

## 2. Fill in Environment Variables
- [x] Open `.env` in the project root
- [x] Replace `your-supabase-url-here` with your Project URL
- [x]] Replace `your-supabase-anon-key-here` with your anon key
- [ ] Add the same two variables in Vercel: Settings > Environment Variables
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## 3. Run the Database Migrations
- [ ] In Supabase dashboard, go to **SQL Editor**
- [ ] Click "New Query"
- [ ] Copy the entire contents of `supabase/migrations/001_create_tables.sql` and paste it in
- [ ] Click **Run** — this creates all tables, policies, triggers, and seeds your existing events
- [ ] Run another new query with `supabase/migrations/002_add_map_fields.sql` — adds map coordinates and venue fields
- [ ] Run another new query with `supabase/migrations/003_newsletter_subscribers.sql` — adds the newsletter signup table

## 4. Create a Storage Bucket
- [ ] In Supabase dashboard, go to **Storage**
- [ ] Click **New Bucket**
- [ ] Name it `event-images`
- [ ] Toggle **Public bucket** ON
- [ ] Click **Create**

## 5. Create an Admin User
- [ ] In Supabase dashboard, go to **Authentication > Users**
- [ ] Click **Add User** > **Create New User**
- [ ] Enter an email and password (this is your admin login for `/admin`)
- [ ] Click **Create User**
- [ ] Use these credentials to sign in at `yoursite.com/admin/login`

## 6. Set Up Perplexity API (for AI features)
- [ ] Go to https://www.perplexity.ai and create an API account
- [ ] Generate an API key from your Perplexity dashboard
- [ ] In Supabase dashboard, go to **Edge Functions > Secrets**
- [ ] Add a secret: name = `PERPLEXITY_API_KEY`, value = your key

## 7. Deploy Edge Functions
- [ ] Install the Supabase CLI: `npm install -g supabase`
- [ ] Run `supabase login` and authenticate
- [ ] Link your project: `supabase link --project-ref YOUR_PROJECT_REF`
  - (Find your project ref in Supabase dashboard URL: `supabase.com/dashboard/project/YOUR_PROJECT_REF`)
- [ ] Deploy the discover-events function: `supabase functions deploy discover-events`
- [ ] Deploy the newsletter function: `supabase functions deploy generate-newsletter`

## 8. Deploy to Vercel
- [ ] Push the code to GitHub
- [ ] In Vercel, redeploy (or it auto-deploys if connected to your repo)
- [ ] Verify the environment variables are set (step 2)
- [ ] Visit your site and confirm events load from the database

## 9. Verify Everything Works
- [ ] Public site: homepage loads, events display correctly
- [ ] Public site: `/whats-on` page loads (will be empty until you add London events)
- [ ] Admin: go to `/admin` — should redirect to login
- [ ] Admin: sign in with the credentials from step 5
- [ ] Admin: create a test event, verify it appears on the public `/events` page
- [ ] Admin: click "Discover Events" on the What's On page to test Perplexity integration
- [ ] Admin: click "Generate Newsletter" to test newsletter generation
- [ ] Admin: delete the test event

## 10. Optional — Set Up Cron Jobs
- [ ] In Supabase SQL Editor, enable pg_cron and schedule auto-expiry:
  ```sql
  SELECT cron.schedule('auto-expire-events', '0 1 * * *',
    $$ UPDATE gpc_events SET status = 'past' WHERE date < CURRENT_DATE AND status = 'upcoming'; $$
  );
  ```
- [ ] Schedule weekly event discovery (Monday 9am):
  ```sql
  SELECT cron.schedule('weekly-discover', '0 9 * * 1',
    $$ SELECT net.http_post(
      url := 'YOUR_SUPABASE_URL/functions/v1/discover-events',
      headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ); $$
  );
  ```
- [ ] Schedule weekly newsletter draft (Wednesday 9am):
  ```sql
  SELECT cron.schedule('weekly-newsletter', '0 9 * * 3',
    $$ SELECT net.http_post(
      url := 'YOUR_SUPABASE_URL/functions/v1/generate-newsletter',
      headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ); $$
  );
  ```

## 11. Custom Domain (Optional)
- [ ] In Vercel: Settings > Domains > Add your custom domain
- [ ] Update your DNS records as Vercel instructs
- [ ] SSL certificate is automatic

---

## 12. What's On Page Upgrade (Map + Lovable-style design)

All code changes below are already implemented. You just need to run the migrations (step 3) and verify.

### Verify
- [ ] Map loads with OpenStreetMap tiles (no API key needed)
- [ ] Events with coordinates show as pins on the map
- [ ] Clicking a pin highlights the event in the list
- [ ] Filters work correctly
- [ ] "Submit Event" creates a pending event in admin
- [ ] Mobile layout works
- [ ] Newsletter generation still works (no breaking changes)
- [ ] Build passes: `npm run build`
