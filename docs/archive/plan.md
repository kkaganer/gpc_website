# GPC Community Website Redesign

## Context

The Greenwich Parents & Carers (GPC) community website currently lives on Google Sites at `sites.google.com/view/gpccommunity/home`. It needs a full redesign and rebuild as a modern, standalone website. The goal is to preserve the warm, community-focused tone and all existing content/images while delivering a polished, distinctive design using the `frontend-design` skill.

---

## Tech Stack

- **Build:** Vite 6 + React 19
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v7
- **Fonts:** Google Fonts (Nunito body + Poppins headings)
- **Icons:** Lucide React
- **Animations:** Framer Motion (subtle scroll reveals)
- **Deployment:** Static build (`dist/`), deployment-agnostic

---

## Site Architecture (6 pages)

```
/                          -> Home
/about                     -> About Us
/events                    -> Events Hub (lists all events)
/events/christmas-fair-2025 -> Christmas Fair 2025
/events/summer-fair-2025   -> Summer Fair 2025
/gallery                   -> Instagram Gallery
```

---

## Design Direction

**Preserve:** Pink/magenta brand (#fc16a0), warm friendly tone, emojis, community photos, values (Inclusivity | Kindness | Connection)

**Modernize with:**
- Extended palette: primary #fc16a0, dark #2d1b4e (deep purple for footer/headings), warm off-white #fffaf5 background, amber #f59e0b highlights
- Rounded cards with soft shadows
- SVG wave dividers between sections
- Gradient CTAs (pink-to-purple)
- Mobile-first responsive design
- Scroll entrance animations

---

## Images

Download all images from Google Sites URLs and store in `public/images/`. Optimize for web. All current image URLs captured:
- Hero banner, Easter Egg Hunt, Easter Beer Hunt, Community/IWD event, Summer Fair photos, sponsor logos, site icon

---

## File Structure

```
website/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── images/
│       ├── hero-banner.jpg
│       ├── easter-egg-hunt.jpg
│       ├── easter-beer-hunt.jpg
│       ├── community-iwd.jpg
│       ├── summer-fair-1.jpg
│       ├── sponsors/
│       └── team/
├── src/
│   ├── main.jsx
│   ├── App.jsx                    # Router (6 routes)
│   ├── index.css                  # Tailwind + custom styles
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx         # Sticky nav, mobile hamburger
│   │   │   ├── Footer.jsx         # Deep purple, 3-col, CIC info
│   │   │   └── Layout.jsx         # Wrapper
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── SectionHeading.jsx
│   │   │   ├── Badge.jsx          # "Free", "Sold Out" tags
│   │   │   ├── WaveDivider.jsx    # SVG section separators
│   │   │   └── NewsletterForm.jsx # Brevo iframe embed
│   │   ├── home/
│   │   │   ├── Hero.jsx
│   │   │   ├── UpcomingEvents.jsx
│   │   │   ├── Activities.jsx
│   │   │   ├── Stats.jsx          # 1800+ members, Founded 2021, etc.
│   │   │   └── Newsletter.jsx
│   │   ├── about/
│   │   │   ├── Story.jsx
│   │   │   ├── Values.jsx
│   │   │   ├── Team.jsx
│   │   │   └── Milestones.jsx     # Timeline
│   │   ├── events/
│   │   │   ├── EventCard.jsx      # Reusable event card
│   │   │   ├── EventHero.jsx
│   │   │   ├── EventDetails.jsx
│   │   │   └── SponsorsBar.jsx
│   │   └── gallery/
│   │       ├── GalleryGrid.jsx    # Masonry grid
│   │       ├── GalleryCard.jsx
│   │       └── GalleryFilter.jsx  # Category tabs
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   ├── Events.jsx             # Events hub listing
│   │   ├── ChristmasFair.jsx
│   │   ├── SummerFair.jsx
│   │   └── Gallery.jsx
│   ├── data/
│   │   ├── events.js
│   │   ├── team.js
│   │   ├── activities.js
│   │   ├── sponsors.js
│   │   └── galleryPosts.js        # Curated Instagram post URLs
│   └── utils/
│       └── constants.js           # Brand colors, contact info, social links
```

---

## Implementation Phases

### Phase 1: Scaffolding
- `npm create vite@latest . -- --template react`
- Install dependencies: tailwindcss, react-router, lucide-react, framer-motion
- Configure Tailwind theme with GPC brand colors/fonts
- Set up folder structure
- Download images from Google Sites URLs into `public/images/`

### Phase 2: Layout Shell
- Build Navbar (sticky, mobile hamburger, active page indicator)
- Build Footer (deep purple bg, 3 columns, CIC number, social links)
- Set up React Router with all 6 routes
- Create reusable UI components (Button, Card, Badge, SectionHeading, WaveDivider)

### Phase 3: Home Page (use `frontend-design` skill)
- Hero section: full-width community photo, gradient overlay, heading + values tagline + CTAs
- Upcoming Events: card grid linking to event pages
- Activities: icon + text cards with "Free" badges
- Stats strip: 1,800+ Members | Founded 2021 | 100% Volunteer Run
- Newsletter signup: Brevo iframe embed

### Phase 4: About Page
- Origin story (2-column: text + photo)
- Values cards (Inclusivity, Kindness, Connection)
- Team grid (circular photos, name, role, bio)
- Milestones timeline (2021 -> 2024 -> 2025)

### Phase 5: Events Pages
- Events Hub: grid of all event cards with dates and status badges
- Christmas Fair 2025 page: hero, details, sponsor, ticket CTA
- Summer Fair 2025 page: post-event recap with sponsors

### Phase 6: Instagram Gallery
- Curated gallery using Instagram oEmbed (no API keys needed)
- Masonry grid (3 cols desktop, 2 tablet, 1 mobile)
- Category filter tabs (All, Events, Meetups, Community)
- Instagram follow CTA

### Phase 7: Polish
- Responsive testing
- Accessibility (semantic HTML, alt text, contrast, keyboard nav)
- Meta tags / Open Graph
- Performance (lazy loading images, code splitting)

---

## Key Content to Preserve

- **Tagline:** "Local parents running events and activities for local families"
- **Values:** Inclusivity | Kindness | Connection
- **Contact:** gpc.communitynews@gmail.com
- **Instagram:** @gpc.community
- **CIC no.:** 16387545
- **Location:** SE10 9JT, London
- **Members:** 1,800+
- All event details, team bios, sponsor info from current site
- Warm, friendly, emoji-inclusive tone throughout

---

## Verification

1. Run `npm run dev` and visually check all 6 pages
2. Test responsive design at mobile/tablet/desktop breakpoints
3. Verify all navigation links work (including event hub -> individual events)
4. Verify external links open correctly (Brevo newsletter, Zeffy tickets, Instagram)
5. Check images load from local `public/images/`
6. Run `npm run build` to confirm clean production build
