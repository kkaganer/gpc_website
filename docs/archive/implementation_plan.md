# GPC Website - Implementation Plan

## Phase 1: Scaffolding

### Tasks
- [ ] Scaffold Vite + React project (`npm create vite@latest . -- --template react`)
- [ ] Install dependencies: `tailwindcss`, `@tailwindcss/vite`, `react-router`, `lucide-react`, `framer-motion`
- [ ] Configure Tailwind theme with GPC brand colors (#fc16a0, #2d1b4e, #fffaf5, #f59e0b) and fonts (Nunito, Poppins)
- [ ] Add Google Fonts to `index.html`
- [ ] Create folder structure: `components/layout`, `components/ui`, `components/home`, `components/about`, `components/events`, `components/gallery`, `pages`, `data`, `utils`
- [ ] Create `src/utils/constants.js` with brand colors, contact info, social links, CIC number
- [ ] Download all images from Google Sites into `public/images/` (hero, events, community, sponsors, team)

### Definition of Done
- `npm run dev` starts without errors and shows the default Vite welcome page
- Tailwind classes render correctly (test with a colored div using brand colors)
- All images are present in `public/images/` and load in the browser
- Folder structure matches the plan's file structure
- `constants.js` exports all brand values (colors, contact email, Instagram handle, CIC number, location)

---

## Phase 2: Layout Shell

### Tasks
- [ ] Build `Layout.jsx` wrapper (Navbar + `<main>` + Footer)
- [ ] Build `Navbar.jsx`: sticky top, logo left, nav links right, mobile hamburger menu with slide-in drawer, active page pink underline
- [ ] Build `Footer.jsx`: deep purple (#2d1b4e) background, 3 columns (Quick Links, Contact, Follow Us), CIC number, Instagram link
- [ ] Set up React Router in `App.jsx` with all 6 routes (`/`, `/about`, `/events`, `/events/christmas-fair-2025`, `/events/summer-fair-2025`, `/gallery`)
- [ ] Create placeholder page components for all 6 pages
- [ ] Build reusable UI components:
  - [ ] `Button.jsx` - primary (gradient pink-to-purple), secondary, outline variants
  - [ ] `Card.jsx` - rounded corners, soft shadow, hover effect
  - [ ] `SectionHeading.jsx` - consistent title + optional subtitle styling
  - [ ] `Badge.jsx` - "Free", "Sold Out", "New" tag variants
  - [ ] `WaveDivider.jsx` - SVG curved section separator
  - [ ] `NewsletterForm.jsx` - Brevo iframe embed wrapper

### Definition of Done
- All 6 routes navigate correctly; browser URL updates and correct placeholder page renders
- Navbar is sticky, shows all nav links on desktop, collapses to hamburger on mobile (<768px), active page has pink underline
- Footer displays on all pages with 3 columns, CIC number, email, Instagram link
- Each UI component renders correctly in isolation with all variants (e.g. Button has primary/secondary/outline)
- WaveDivider renders a smooth SVG curve between two differently-colored sections
- Mobile hamburger opens/closes a slide drawer with all nav links

---

## Phase 3: Home Page

### Tasks
- [ ] Build `Hero.jsx`: full-width hero with community photo background, gradient overlay (pink-to-purple), "Welcome to Greenwich Parents & Carers" heading, values tagline, two CTA buttons ("Join Our Community" newsletter link, "Upcoming Events" scroll/link)
- [ ] Build `UpcomingEvents.jsx`: card grid (2 cols desktop, 1 mobile) showing events from `data/events.js`. Each card: image, date badge, title, location, description, "Book Tickets" button linking to Zeffy
- [ ] Build `Activities.jsx`: icon + text cards listing all activities (Parent & Baby meetups, Networking, Newsletter, WhatsApp community, Fairs). "Free" badges where applicable
- [ ] Build `Stats.jsx`: pink gradient strip with 3 stats: "1,800+ Members", "Founded 2021", "100% Volunteer Run"
- [ ] Build `Newsletter.jsx`: warm background section with Brevo form embed and Instagram follow CTA
- [ ] Create `data/events.js` with Easter Egg Hunt and Easter Egg & Beer Hunt data (title, date, time, location, description, image path, ticket URL)
- [ ] Create `data/activities.js` with all activities data
- [ ] Add Framer Motion scroll-reveal animations to each section

### Definition of Done
- Home page (`/`) renders all 5 sections in order: Hero, Upcoming Events, Activities, Stats, Newsletter
- Hero displays community photo with gradient overlay, heading, tagline with values, and two working CTA buttons
- Event cards show correct images, dates, locations, and "Book Tickets" buttons that open Zeffy URLs in new tabs
- Activities section lists all 6+ activities with icons and "Free" badges
- Stats strip shows 3 stats with pink gradient background
- Newsletter section embeds Brevo form that loads and is interactive
- Sections animate in on scroll (fade-up or similar)
- Page is responsive: hero text stacks on mobile, event cards go single-column, stats stack vertically

---

## Phase 4: About Page

### Tasks
- [ ] Build `Story.jsx`: two-column layout (text left, community photo right) telling the founding story - Aster's origin during COVID, growth from meetups to 1,800+ members
- [ ] Build `Values.jsx`: three large cards for Inclusivity, Kindness, Connection with icons and descriptions
- [ ] Build `Team.jsx`: grid of team member cards with circular photos, name, role, short bio. Members: Aster Thackery (Founder), Clare MacGregor (Director), Andrea Barrenetxea Lopez (Director), Leah Irish (Finance Director)
- [ ] Build `Milestones.jsx`: vertical timeline with key dates (2021 founded, 2024 CIC + first Summer Fair, 2025 sold-out Christmas Fair + 1,800 members)
- [ ] Create `data/team.js` with team member data (name, role, bio, image path)

### Definition of Done
- About page (`/about`) renders all 4 sections: Story, Values, Team, Milestones
- Story section shows two-column layout on desktop, stacks on mobile, includes founding narrative preserving the warm tone
- Values section shows 3 distinct cards with icons for Inclusivity, Kindness, Connection
- Team section shows 4 member cards with circular photo placeholders, names, roles, and bios
- Milestones timeline shows at least 3 entries in chronological order with visual connection (line/dots)
- All text content matches the tone and facts from the original Google Sites page
- Page is responsive at all breakpoints

---

## Phase 5: Events Pages

### Tasks
- [ ] Build `Events.jsx` (hub page): grid of EventCards showing all events with date badges and status ("Upcoming", "Sold Out", "Past"). Each card links to the individual event page
- [ ] Build `EventCard.jsx`: reusable card with image, date badge, title, location snippet, status badge, and link
- [ ] Build `EventHero.jsx`: banner image with event title and date overlay
- [ ] Build `EventDetails.jsx`: structured info block (date, time, location, admission, description)
- [ ] Build `SponsorsBar.jsx`: horizontal row of sponsor logos with links
- [ ] Build `ChristmasFair.jsx`: hero, details (Dec 7 2025, Greenwich West Community and Arts Centre, Adults GBP3/Children Free, sold out), sponsor (Working Mums Club), no-dogs notice
- [ ] Build `SummerFair.jsx`: post-event page with thank-you message, event recap, sponsor logos (Hartbeeps, Waves Massage, MammaKind, Working Mums Club) with descriptions
- [ ] Create `data/sponsors.js` with sponsor data (name, logo path, website URL, description)

### Definition of Done
- Events hub (`/events`) shows a grid of all events with correct status badges (Sold Out for Christmas Fair, Past for Summer Fair, Upcoming for Easter events)
- Clicking an event card navigates to the correct event detail page
- Christmas Fair page (`/events/christmas-fair-2025`) shows hero, full event details, sponsor logo, and ticket/sold-out CTA
- Summer Fair page (`/events/summer-fair-2025`) shows thank-you hero, event recap text, and all 4 sponsor logos with descriptions and website links
- All external links (Zeffy tickets, sponsor websites) open in new tabs
- Sponsor logos render at consistent sizes
- Pages are responsive at all breakpoints

---

## Phase 6: Instagram Gallery

### Tasks
- [ ] Create `data/galleryPosts.js` with curated Instagram post URLs, categories (Events, Meetups, Community), alt text, and featured flag
- [ ] Build `Gallery.jsx` page: hero section ("Our Community in Action"), filter tabs, gallery grid, newsletter CTA
- [ ] Build `GalleryFilter.jsx`: horizontal pill tabs (All, Events, Meetups, Community) that filter the grid
- [ ] Build `GalleryGrid.jsx`: CSS masonry grid (3 cols desktop, 2 tablet, 1 mobile)
- [ ] Build `GalleryCard.jsx`: image thumbnail with rounded corners, hover overlay showing caption and date, click opens Instagram post in new tab
- [ ] Add prominent "Follow @gpc.community" button with Instagram icon in hero
- [ ] Add "Load More" button or pagination if more than 9 posts

### Definition of Done
- Gallery page (`/gallery`) renders hero, filter tabs, and grid of Instagram posts
- Filter tabs switch between categories and "All" shows everything
- Grid displays in 3 columns on desktop, 2 on tablet, 1 on mobile
- Each card has a hover effect showing caption/overlay
- Clicking a card opens the Instagram post URL in a new tab
- "Follow @gpc.community" button links to the Instagram profile
- Page works with placeholder data (actual Instagram URLs can be added later)
- Page is responsive at all breakpoints

---

## Phase 7: Polish & QA

### Tasks
- [ ] Responsive testing: check all 6 pages at 375px (mobile), 768px (tablet), 1024px (laptop), 1440px (desktop)
- [ ] Accessibility: semantic HTML tags (`nav`, `main`, `section`, `article`, `footer`), all images have `alt` text, color contrast meets WCAG AA, skip-to-content link, keyboard-navigable menu and interactive elements
- [ ] SEO: per-page `<title>` and `<meta description>`, Open Graph tags (og:title, og:description, og:image), favicon
- [ ] Performance: `loading="lazy"` on all below-fold images, React.lazy code splitting for route-level pages
- [ ] Cross-browser check: Chrome, Safari, Firefox
- [ ] Run `npm run build` and verify clean production build with no warnings
- [ ] Test production build locally with `npx serve dist`

### Definition of Done
- All pages render correctly at 4 breakpoints (375px, 768px, 1024px, 1440px) with no overflow, cut-off text, or broken layouts
- Lighthouse accessibility score >= 90
- All images have descriptive alt text
- Keyboard-only navigation works: can reach all links, buttons, and interactive elements via Tab/Enter
- Each page has a unique `<title>` and `<meta description>`
- `npm run build` completes with zero errors
- Production build serves correctly via `npx serve dist` with all routes, images, and external links working
- No console errors on any page
