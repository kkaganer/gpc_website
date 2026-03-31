import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const MOBILE_VIEWPORT = { width: 375, height: 812 }; // iPhone X
const BASE_URL = 'http://localhost:5199';
const SCREENSHOT_DIR = './mobile-screenshots';

const pages = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'events', path: '/events' },
  { name: 'whats-on', path: '/whats-on' },
  { name: 'gallery', path: '/gallery' },
];

async function run() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: MOBILE_VIEWPORT,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  });

  const results = [];

  for (const pg of pages) {
    console.log(`\n=== Testing: ${pg.name} (${pg.path}) ===`);
    const page = await context.newPage();

    try {
      await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1500); // let animations settle

      // Full page screenshot
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/${pg.name}-full.png`,
        fullPage: true,
      });

      // Viewport screenshot
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/${pg.name}-viewport.png`,
        fullPage: false,
      });

      // Collect issues
      const issues = await page.evaluate(() => {
        const problems = [];
        const viewportWidth = window.innerWidth;

        // Check for horizontal overflow
        if (document.documentElement.scrollWidth > viewportWidth) {
          problems.push({
            type: 'horizontal-overflow',
            detail: `Page is ${document.documentElement.scrollWidth}px wide, viewport is ${viewportWidth}px`,
          });
        }

        // Find elements causing overflow
        const allElements = document.querySelectorAll('*');
        const overflowingEls = [];
        allElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > viewportWidth + 5 || rect.left < -5) {
            const tag = el.tagName.toLowerCase();
            const cls = el.className ? (typeof el.className === 'string' ? el.className.slice(0, 80) : '') : '';
            const id = el.id || '';
            overflowingEls.push({
              tag,
              id,
              class: cls,
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            });
          }
        });
        if (overflowingEls.length > 0) {
          problems.push({
            type: 'overflowing-elements',
            detail: overflowingEls.slice(0, 15),
          });
        }

        // Check text size (anything smaller than 12px on mobile is bad)
        const smallTextEls = [];
        allElements.forEach(el => {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          if (fontSize < 12 && el.textContent.trim().length > 0 && el.children.length === 0) {
            smallTextEls.push({
              tag: el.tagName.toLowerCase(),
              class: (typeof el.className === 'string' ? el.className.slice(0, 60) : ''),
              fontSize: fontSize,
              text: el.textContent.trim().slice(0, 50),
            });
          }
        });
        if (smallTextEls.length > 0) {
          problems.push({
            type: 'small-text',
            detail: smallTextEls.slice(0, 10),
          });
        }

        // Check tap target sizes (buttons/links smaller than 44x44)
        const smallTapTargets = [];
        document.querySelectorAll('a, button, input, select, textarea, [role="button"]').forEach(el => {
          const rect = el.getBoundingClientRect();
          if ((rect.width < 44 || rect.height < 44) && rect.width > 0 && rect.height > 0) {
            smallTapTargets.push({
              tag: el.tagName.toLowerCase(),
              class: (typeof el.className === 'string' ? el.className.slice(0, 60) : ''),
              text: el.textContent.trim().slice(0, 40),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            });
          }
        });
        if (smallTapTargets.length > 0) {
          problems.push({
            type: 'small-tap-targets',
            detail: smallTapTargets.slice(0, 15),
          });
        }

        // Check for fixed/sticky elements that might overlap content
        const fixedEls = [];
        allElements.forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.position === 'fixed' || style.position === 'sticky') {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              fixedEls.push({
                tag: el.tagName.toLowerCase(),
                class: (typeof el.className === 'string' ? el.className.slice(0, 60) : ''),
                position: style.position,
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              });
            }
          }
        });
        if (fixedEls.length > 0) {
          problems.push({
            type: 'fixed-sticky-elements',
            detail: fixedEls,
          });
        }

        // Check images without proper sizing
        const imgIssues = [];
        document.querySelectorAll('img').forEach(img => {
          const rect = img.getBoundingClientRect();
          if (rect.width > viewportWidth) {
            imgIssues.push({
              src: img.src.slice(-60),
              naturalWidth: img.naturalWidth,
              displayWidth: Math.round(rect.width),
            });
          }
        });
        if (imgIssues.length > 0) {
          problems.push({
            type: 'oversized-images',
            detail: imgIssues,
          });
        }

        // Check for content being cut off or hidden
        const hiddenOverflow = [];
        allElements.forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.overflow === 'hidden' || style.overflowX === 'hidden') {
            const rect = el.getBoundingClientRect();
            if (el.scrollWidth > rect.width + 5 && rect.width > 50) {
              hiddenOverflow.push({
                tag: el.tagName.toLowerCase(),
                class: (typeof el.className === 'string' ? el.className.slice(0, 60) : ''),
                visibleWidth: Math.round(rect.width),
                contentWidth: el.scrollWidth,
              });
            }
          }
        });
        if (hiddenOverflow.length > 0) {
          problems.push({
            type: 'hidden-overflow-content',
            detail: hiddenOverflow.slice(0, 10),
          });
        }

        // Check spacing - elements with very large padding/margin on mobile
        const spacingIssues = [];
        allElements.forEach(el => {
          const style = window.getComputedStyle(el);
          const pl = parseFloat(style.paddingLeft);
          const pr = parseFloat(style.paddingRight);
          const ml = parseFloat(style.marginLeft);
          const mr = parseFloat(style.marginRight);
          if (pl + pr > viewportWidth * 0.3 || ml + mr > viewportWidth * 0.3) {
            spacingIssues.push({
              tag: el.tagName.toLowerCase(),
              class: (typeof el.className === 'string' ? el.className.slice(0, 60) : ''),
              paddingLR: `${Math.round(pl)}/${Math.round(pr)}`,
              marginLR: `${Math.round(ml)}/${Math.round(mr)}`,
            });
          }
        });
        if (spacingIssues.length > 0) {
          problems.push({
            type: 'excessive-spacing',
            detail: spacingIssues.slice(0, 10),
          });
        }

        return problems;
      });

      results.push({ page: pg.name, path: pg.path, issues });
      console.log(`Found ${issues.length} issue categories`);
      issues.forEach(i => console.log(`  - ${i.type}: ${Array.isArray(i.detail) ? i.detail.length + ' items' : i.detail}`));

    } catch (err) {
      console.error(`Error on ${pg.name}: ${err.message}`);
      results.push({ page: pg.name, path: pg.path, error: err.message });
    }

    await page.close();
  }

  // Test navbar mobile menu
  console.log('\n=== Testing: Mobile Navigation ===');
  const navPage = await context.newPage();
  try {
    await navPage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await navPage.waitForTimeout(1000);

    // Look for hamburger menu
    const menuButton = await navPage.$('button[aria-label*="menu"], button[aria-label*="Menu"], .hamburger, [class*="hamburger"], [class*="mobile-menu"], button.md\\:hidden, button.lg\\:hidden');
    if (menuButton) {
      await menuButton.click();
      await navPage.waitForTimeout(500);
      await navPage.screenshot({
        path: `${SCREENSHOT_DIR}/nav-menu-open.png`,
        fullPage: false,
      });
      console.log('Mobile menu found and opened');

      // Check if menu covers full viewport
      const menuInfo = await navPage.evaluate(() => {
        const nav = document.querySelector('nav');
        const menuItems = document.querySelectorAll('nav a');
        return {
          menuItemCount: menuItems.length,
          menuItems: Array.from(menuItems).map(a => ({
            text: a.textContent.trim(),
            href: a.href,
            rect: {
              width: Math.round(a.getBoundingClientRect().width),
              height: Math.round(a.getBoundingClientRect().height),
            }
          })),
        };
      });
      results.push({ page: 'nav-menu', issues: [{ type: 'nav-info', detail: menuInfo }] });
    } else {
      console.log('No hamburger menu button found - potential issue!');
      results.push({ page: 'nav-menu', issues: [{ type: 'no-hamburger-menu', detail: 'Could not find mobile menu button' }] });
    }
  } catch (err) {
    console.error(`Nav test error: ${err.message}`);
  }
  await navPage.close();

  // Write results to JSON for analysis
  fs.writeFileSync(`${SCREENSHOT_DIR}/results.json`, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${SCREENSHOT_DIR}/results.json`);

  await browser.close();
}

run().catch(console.error);
