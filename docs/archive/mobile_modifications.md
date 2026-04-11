# Mobile Modifications Report

**Tested with**: Playwright on iPhone X viewport (375x812, 2x device scale)
**Pages tested**: Home, About, Events, What's On, Gallery, Mobile Nav
**Date**: 2026-03-31

---

## Critical Issues

### 1. Mobile Navigation Menu Overlaps Page Content
**File**: `src/components/layout/Navbar.jsx`
**Issue**: When the mobile hamburger menu opens, it renders as a side drawer but the page content is still fully visible and interactive behind it. The menu items appear to overlay the page content (newsletter banner, hero section) making both unreadable.
**Fix**:
- Add a semi-transparent backdrop/overlay behind the drawer when open
- Consider making the mobile menu full-screen or adding `fixed inset-0 bg-black/50` backdrop
- The drawer at `w-64` (256px) leaves only 119px of viewport — consider `w-full` or `max-w-[80vw]`

### 2. Newsletter Banner Input Too Narrow on Mobile
**File**: `src/components/home/NewsletterBanner.jsx`
**Issue**: The email input has a fixed `w-48` (192px) width. On a 375px screen the input + subscribe button barely fit, leaving a cramped layout.
**Fix**:
- Change input to `w-full sm:w-48` so it fills available space on mobile
- Consider stacking the input and button vertically on mobile: `flex-col sm:flex-row`

### 3. What's On Filters Don't Stack on Mobile
**File**: `src/components/whatson/EventFilters.jsx`
**Issue**: All 6 filter controls (event type, date, price, age, postcode, radius) display in a single `flex flex-wrap` row. On 375px they wrap into multiple rows but each control is tiny (38px height, some as narrow as 57px). Touch targets are too small and the layout feels cramped.
**Fix**:
- Change to `grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2`
- Make each select `w-full` within its grid cell on mobile
- Increase touch target height: `py-3` instead of `py-2` on mobile
- Consider a collapsible "Filters" section on mobile

### 4. Submit Event Modal Not Mobile-Friendly
**File**: `src/components/whatson/SubmitEventModal.jsx`
**Issue**: Modal uses `max-w-lg` (512px, wider than 375px viewport). Form fields use `grid grid-cols-2` which creates ~156px wide inputs on mobile — too cramped to type in.
**Fix**:
- Change form grids to `grid grid-cols-1 sm:grid-cols-2 gap-3`
- Reduce modal padding: `p-4 sm:p-6`
- Make modal full-width on mobile: `w-full sm:max-w-lg`

---

## High Priority Issues

### 5. Hamburger Menu Button Slightly Too Small
**File**: `src/components/layout/Navbar.jsx`
**Issue**: The hamburger button is `p-2` which renders at 40x40px. Apple's HIG recommends minimum 44x44px tap targets.
**Fix**: Change to `p-2.5` or add `min-w-[44px] min-h-[44px]` to meet accessibility guidelines.

### 6. Event Card Images Too Tall on Mobile
**File**: `src/components/home/UpcomingEvents.jsx`
**Issue**: Event card images use fixed `h-80` (320px) height — that's 85% of the visible viewport on mobile, pushing card text far below the fold.
**Fix**: Make height responsive: `h-48 sm:h-64 md:h-80`

### 7. Footer Links Too Small for Touch
**File**: `src/components/layout/Footer.jsx`
**Issue**: Footer navigation links (Home, About, Events, Gallery) render at only 22px height — well below the 44px minimum tap target.
**Fix**:
- Add `py-2` to footer links to increase tap area
- Or wrap links in a container with adequate spacing: `space-y-3`

### 8. What's On "Add to Calendar" Links Too Small
**File**: `src/components/whatson/LondonEventCard.jsx`
**Issue**: "Add to Calendar" links render at 112x16px — far too small for a touch target on mobile.
**Fix**: Add `py-2` padding to increase touch area to at least 44px height.

### 9. What's On Badge Text Too Small
**File**: `src/components/whatson/LondonEventCard.jsx`
**Issue**: Category/price badges use `text-[11px]` which is below the 12px minimum for mobile readability.
**Fix**: Change to `text-xs` (12px) on mobile: `text-xs sm:text-[11px]` or just `text-xs` everywhere.

---

## Medium Priority Issues

### 10. What's On Page Header Layout Crowded
**File**: `src/components/whatson/` (header area)
**Issue**: The page title "Greenwich Parents & Carers" and "Submit Event" button compete for space in the header. The title text wraps to 3 lines and the button sits right next to it.
**Fix**:
- Stack title and button vertically on mobile
- Make "Submit Event" button full-width on mobile below the title

### 11. What's On View Toggle Buttons Too Small
**File**: `src/components/whatson/EventFilters.jsx`
**Issue**: List/map view toggle buttons are only 30x30px (`p-1.5`).
**Fix**: Increase to `p-2.5` for 44x44px touch targets on mobile.

### 12. Event Map Takes Over Mobile Screen
**File**: `src/components/whatson/EventMap.jsx`
**Issue**: Map has `minHeight: 500px` which is taller than the visible viewport (812px minus navbar). User must scroll extensively.
**Fix**: Use responsive height: `minHeight: '300px'` on mobile, `500px` on desktop. Can use a CSS class with responsive values.

### 13. Stats Section Excessive Gap
**File**: `src/components/home/Stats.jsx`
**Issue**: `gap-10` between stat items is excessive on a single-column mobile layout.
**Fix**: Change to `gap-6 md:gap-10`

### 14. Gallery Filter Buttons Close to Minimum Size
**File**: `src/components/gallery/GalleryFilter.jsx`
**Issue**: Filter buttons (All, Events, Meetups, Community) are 42px tall — just under the 44px minimum.
**Fix**: Increase padding slightly: `py-2.5` instead of `py-2`

---

## Low Priority / Polish

### 15. Decorative Divider Margins
**File**: Multiple components (SectionHeading or similar)
**Issue**: The pink `w-16 h-1` decorative dividers use `mx-auto` which creates 140px margins on each side. Not a functional issue but contributes to excessive whitespace in the automated spacing report.
**Fix**: No change needed — these are intentionally centered decorative elements.

### 16. About Page Team Member Images
**File**: `src/components/about/Team.jsx`
**Issue**: Team member circular images (`w-32 h-32`) with `mx-auto` are centered correctly. The `border-4` on 128px images is fine. No functional issue.
**Fix**: No change needed.

### 17. About Page Values Icons
**File**: `src/components/about/Values.jsx`
**Issue**: Value icon containers (`w-16 h-16`) use `mx-auto` creating 108px margins. Centered intentionally.
**Fix**: No change needed.

---

## Summary by Component

| Component | Issues | Severity |
|-----------|--------|----------|
| Navbar.jsx | Menu overlay, small hamburger button | Critical, High |
| NewsletterBanner.jsx | Fixed input width | Critical |
| EventFilters.jsx | Filters don't stack, small toggles | Critical, Medium |
| SubmitEventModal.jsx | Grid doesn't stack, too wide | Critical |
| UpcomingEvents.jsx | Image too tall | High |
| Footer.jsx | Small link tap targets | High |
| LondonEventCard.jsx | Small calendar links, small badges | High |
| EventMap.jsx | Map too tall | Medium |
| Stats.jsx | Excessive gap | Medium |
| GalleryFilter.jsx | Buttons slightly undersized | Medium |

---

## Screenshots
Mobile screenshots are saved in `./mobile-screenshots/` for reference:
- `home-viewport.png` / `home-full.png`
- `about-viewport.png` / `about-full.png`
- `events-viewport.png` / `events-full.png`
- `whats-on-viewport.png` / `whats-on-full.png`
- `gallery-viewport.png` / `gallery-full.png`
- `nav-menu-open.png`
