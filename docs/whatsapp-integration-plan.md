# WhatsApp Integration Plan for GPC Website

## Context

GPC's website mentions WhatsApp everywhere as the primary community platform (~1,800 members, 14+ groups), but the only way to join is via a `mailto:` link — high friction, low conversion. The goal is to make the website and WhatsApp feel seamlessly connected while keeping things inclusive and safe.

---

## Key Research Findings

### What's technically possible

| Option | How it works | Cost |
|---|---|---|
| **WhatsApp Community invite link** | `chat.whatsapp.com/XXXX` — anyone who clicks can join (or request to join if "Approve New Participants" is on) | Free |
| **WhatsApp Channel** | One-way broadcast feed. Followers are anonymous, can only read + react. Separate from your Community. | Free |
| **wa.me click-to-chat** | Opens a 1:1 chat with a specific phone number in WhatsApp. Not for groups. | Free |
| **Chat widgets** (Elfsight, Chaty, GetButton) | Floating button on website that redirects to WhatsApp app. Just a styled link. | Free–$24/mo |
| **WhatsApp Business API** (Wati, Callbell, respond.io) | Automated messages, chatbots, shared inbox for teams. | $15–$79/mo |
| **QR codes** | Generate from any WhatsApp link using `qrcode.react` library. Useful for print. | Free |

### What's NOT possible

- **Embedding WhatsApp conversations on a website** — encryption prevents any iframe/embed
- **Pulling WhatsApp content to display on a website** — no API for reading group/channel messages
- **Programmatically adding members to Community groups** — API limited to 8-person business groups
- **Broadcasting WhatsApp Channel content on the site** — no embed exists; you can only link to it

### What we decided against

| Option | Why not |
|---|---|
| WhatsApp Channel | GPC has a Community, not a Channel. A Channel is a separate product (one-way broadcast). Not needed when the Community Announcement Group already reaches all members. |
| Floating WhatsApp chat button | Requires sharing an admin's personal phone number. No purpose in the new join flow. |
| Paid services (Wati, Callbell, Elfsight) | Overkill at 1,800 members. Everything needed can be built for free. |
| Admin-gated approval flow | Feels exclusionary and goes against GPC's inclusive values. |

---

## The Plan

### Join flow: Light form → instant Community link

**How it works:**
1. Parent clicks "Join our WhatsApp community" on the website
2. A modal (or the `/join` page) shows a short form: name, area, interests, how you found us
3. On submit, the data is saved to Supabase (so GPC knows who's joining and what they're interested in)
4. The Community invite link is **immediately revealed** — no waiting, no admin approval
5. Parent clicks the link → WhatsApp opens → they join the Community

**This is NOT a gate.** The form is for data collection, not approval. Anyone who fills in a name gets the link instantly.

### Privacy / scammer considerations (OPEN DECISION)

The light form provides no real protection against bad actors — someone can type a fake name and get the link. Options:

1. **Accept the risk** — the form is just for data, not security. Your groups don't contain sensitive content. Anyone determined to join will find a way regardless. This is the most inclusive approach.

2. **Turn on WhatsApp's "Approve New Participants"** — this is a WhatsApp-level setting (not on the website). When enabled, clicking the invite link shows "Request to join" instead of "Join". Admins get a pending-requests queue in WhatsApp. This is invisible on the website side — the form still reveals the link instantly, but WhatsApp itself adds a lightweight gate.

3. **Keep the current email flow** — highest protection, highest friction.

**Recommendation:** Option 1 or 2. The invite link can be revoked and regenerated from WhatsApp settings at any time if it gets abused.

---

## Implementation

### Phase 1: Core (build now)

#### 1. Constants — `src/utils/constants.js`
- Add `whatsappCommunityUrl` to `CONTACT` object
- **Status: DONE** (placeholder link — needs real URL)

#### 2. Community data — `src/data/communities.js`
- Added `key` and `description` fields to each community
- **Status: DONE**

#### 3. Join modal — `src/components/home/JoinCommunityModal.jsx`
- Form: first name, area (SE10/SE3/SE7/SE8/SE18/Other), group interests (checkboxes), baby year (radio), referral source
- Submits to `whatsapp_join_requests` table in Supabase
- On success: shows Community invite link immediately
- **Status: BUILT** (needs updating for instant-reveal flow)

#### 4. Test page — `src/pages/JoinTest.jsx`
- Standalone page at `/join-test` to preview the full flow
- Hero → how it works → community pills → join button → modal
- **Status: BUILT** (available at `/join-test`)

#### 5. Supabase table
- Create `whatsapp_join_requests` table with: id, name, area, interests, baby_year, referral_source, created_at
- No `status` column needed (no approval flow)
- RLS: public INSERT, authenticated SELECT/DELETE for admin viewing
- **Status: TODO**

#### 6. Update existing CTAs
- `src/components/home/FindYourPeople.jsx` — replace mailto link with modal trigger
- `src/components/home/Communities.jsx` — same, remove TODO comment
- **Status: TODO** (waiting for test page approval)

#### 7. WhatsApp icon in Footer + Navbar
- `src/components/layout/Footer.jsx` — WhatsApp SVG icon linking to `/join`
- `src/components/layout/Navbar.jsx` — same
- **Status: TODO**

#### 8. Admin view for join data
- `src/pages/admin/JoinRequestsManager.jsx` — table showing who joined (name, area, interests, date)
- Not for approval — just visibility into who's joining and from where
- Add route in `App.jsx`, nav link in `AdminLayout.jsx`
- **Status: TODO**

### Phase 2: Enhanced (build later)

#### 9. Dedicated `/join` page
- Full landing page for Instagram bio links, QR codes on flyers
- Hero + community pills + inline form (not modal) + newsletter/Instagram fallback
- Replace `/join-test` with production version

#### 10. QR code for print materials
- Install `qrcode.react`, show QR code on `/join` page
- Encodes the `/join` URL, not the WhatsApp link directly (so you control the flow)

---

## What GPC needs to provide

1. **WhatsApp Community invite link** — the `chat.whatsapp.com/XXXX` link from your Community settings
2. **Decision on "Approve New Participants"** — on or off at the WhatsApp level?

---

## Files summary

### Modified
- `src/utils/constants.js` — WhatsApp Community URL
- `src/data/communities.js` — enriched with keys/descriptions
- `src/components/home/FindYourPeople.jsx` — modal trigger replaces mailto
- `src/components/home/Communities.jsx` — same
- `src/components/layout/Footer.jsx` — WhatsApp icon
- `src/components/layout/Navbar.jsx` — WhatsApp icon
- `src/App.jsx` — new routes
- `src/components/admin/AdminLayout.jsx` — sidebar link

### Created
- `src/components/home/JoinCommunityModal.jsx`
- `src/pages/JoinTest.jsx` (temporary test page)
- `src/pages/admin/JoinRequestsManager.jsx`
- `src/pages/Join.jsx` (Phase 2)

### Total cost: $0/month
