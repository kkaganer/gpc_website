import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SE_LONDON_AREAS = ['Greenwich', 'Lewisham', 'Southwark', 'Tower Hamlets', 'Bromley']
const DAY_NAMES_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ---------- Design tokens (Brevo visual language) ----------
const C = {
  page: '#ffffff',
  dark: '#1f2d3d',       // heading dark
  body: '#3b3f44',       // body copy
  black: '#000000',      // row body text
  pink: '#fc16a0',       // hot pink — Subscribe, FREE, pull-quote H4s
  blue: '#0092ff',       // electric blue — links, Buy Tickets buttons
  skyBlue: '#76bae3',    // section H3 headings
  lavender: '#eef0ff',   // featured + presenting card background
  butter: '#fffad7',     // GPC meetup highlight background
  paleBlue: '#d2ebf8',   // donation strip background
  purple: '#785cf1',     // supporter email button
  footer: '#eff2f7',     // footer background
  muted: '#6b6b7d',      // venue / subtle meta
}

const F = {
  heading: "tahoma, geneva, sans-serif",
  wordmark: "verdana, geneva, sans-serif",
  body: "arial, helvetica, sans-serif",
}

const SUBSCRIBE_URL =
  'https://51297dd9.sibforms.com/serve/MUIFABZzIxkfNU_V57t_MOrGiJJSy1__hBpAYzja2pBanbdx1i6Bp_IUNK0gC9nIIQnVxTtz0rSaLHKhruUHKiTF7hZ70GeITq95O1wHd6J5EmchzdqYYEmaVICm36thRTUCH3lzvNzEdAYklr3XgX_YsPj-URiiusBsahwDMcPAh6x23h6RXMOlro6n8f3VAFYKE6n1vMdy45qQ'
const INSTAGRAM_URL = 'https://www.instagram.com/gpc.community/'
const WEBSITE_URL = 'https://www.gpccommunity.co.uk/'
const DONATE_URL = 'https://www.zeffy.com/en-GB/donation-form/buy-the-gpc-team-a-coffee'
const NEWS_EMAIL = 'gpc.communitynews@gmail.com'
const LOGO_URL = 'https://www.gpccommunity.co.uk/images/site-logo.png'
const INSTAGRAM_ICON =
  'https://creative-assets.mailinblue.com/editor/social-icons/rounded_colored/instagram_32px.png'

// ---------- Utilities ----------

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDateLong(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function nearestFriday(todayIso: string): string {
  const d = new Date(todayIso + 'T00:00:00')
  const dow = d.getDay()
  const daysUntilFriday = (5 - dow + 7) % 7
  d.setDate(d.getDate() + daysUntilFriday)
  return d.toISOString().split('T')[0]
}

function isGpcHosted(ev: any): boolean {
  const title = String(ev?.title || '').toLowerCase()
  return title.includes('gpc ')
}

// ---------- Section renderers ----------

function renderHeader(todayLong: string, introMessage: string): string {
  const intro = escapeHtml(introMessage || '')
  return `
  <tr><td align="center" style="padding:24px 20px 8px 20px;background-color:${C.page};">
    <img src="${LOGO_URL}" width="102" alt="Greenwich Parents & Carers" style="display:block;width:102px;max-width:102px;height:auto;border:0;outline:none;text-decoration:none;">
  </td></tr>
  <tr><td align="center" style="padding:12px 20px 0 20px;background-color:${C.page};">
    <h2 style="margin:0;font-family:${F.heading};font-size:22px;line-height:1.3;color:${C.black};font-weight:bold;">Greenwich Parents &amp; Carers</h2>
  </td></tr>
  <tr><td align="center" style="padding:4px 20px 0 20px;background-color:${C.page};">
    <div style="font-family:${F.wordmark};font-size:36px;line-height:1.2;color:${C.black};font-weight:bold;">What&rsquo;s On Guide</div>
  </td></tr>
  <tr><td align="center" style="padding:8px 20px 0 20px;background-color:${C.page};">
    <p style="margin:0;font-family:${F.body};font-size:16px;line-height:1.5;color:${C.body};"><em>Local events and activities for families - please share with your friends</em></p>
  </td></tr>
  <tr><td align="center" style="padding:20px 20px 20px 20px;background-color:${C.page};">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${SUBSCRIBE_URL}" style="v-text-anchor:middle;width:136px;height:45px;" arcsize="10%" strokecolor="${C.pink}" fillcolor="${C.pink}">
      <w:anchorlock/>
      <center style="color:#ffffff;font-family:verdana,sans-serif;font-size:18px;font-weight:bold;">Subscribe</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-- -->
    <a href="${SUBSCRIBE_URL}" style="display:inline-block;background-color:${C.pink};color:#ffffff;font-family:${F.wordmark};font-size:18px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:4px;mso-hide:all;">Subscribe</a>
    <!--<![endif]-->
  </td></tr>
  <tr><td style="padding:0 20px 24px 20px;background-color:${C.page};">
    <p style="margin:0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.body};">
      <strong>${escapeHtml(todayLong)}</strong> - ${intro} <em>- Aster</em>
    </p>
  </td></tr>`
}

function renderFeaturedBlock(event: any): string {
  if (!event) return ''

  const linkUrl =
    event.ticket_url ||
    (event.slug ? `https://www.gpccommunity.co.uk/events/${event.slug}` : '#')
  const title = escapeHtml(event.title || '')
  const description = escapeHtml(event.description || '')

  const metaParts: string[] = []
  if (event.date) metaParts.push(formatDateShort(event.date))
  if (event.time) metaParts.push(escapeHtml(event.time))
  if (event.location) metaParts.push(escapeHtml(event.location))
  if (event.price) metaParts.push(escapeHtml(event.price))
  const metaLine = metaParts.join(' | ')

  const image = event.image_url
    ? `<tr><td align="center" style="padding:8px 0 12px 0;">
        <a href="${escapeHtml(linkUrl)}" target="_blank" style="text-decoration:none;">
          <img src="${escapeHtml(event.image_url)}" width="285" alt="${title}" style="display:block;width:285px;max-width:285px;height:auto;border:0;outline:none;text-decoration:none;margin:0 auto;">
        </a>
      </td></tr>`
    : ''

  const cta = event.ticket_url
    ? `<tr><td align="center" style="padding:16px 0 4px 0;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(event.ticket_url)}" style="v-text-anchor:middle;width:145px;height:44px;" arcsize="20%" strokecolor="${C.blue}" fillcolor="${C.blue}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:arial,sans-serif;font-size:16px;font-weight:bold;">Buy Tickets</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-- -->
        <a href="${escapeHtml(event.ticket_url)}" style="display:inline-block;background-color:${C.blue};color:#ffffff;font-family:${F.body};font-size:16px;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:8px;mso-hide:all;">Buy Tickets</a>
        <!--<![endif]-->
      </td></tr>`
    : ''

  return `
  <tr><td style="padding:0;background-color:${C.page};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${C.lavender}" style="background-color:${C.lavender};">
      <tr><td style="padding:20px 20px 24px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          ${image}
          <tr><td align="center" style="padding:4px 0 0 0;">
            <p style="margin:0;font-family:${F.body};font-size:15px;line-height:1.3;color:${C.body};"><em>GPC invites you to...</em></p>
          </td></tr>
          <tr><td align="center" style="padding:6px 0 10px 0;">
            <h4 style="margin:0;font-family:${F.heading};font-size:20px;line-height:1.25;color:${C.pink};font-weight:bold;">${title}</h4>
          </td></tr>
          ${description ? `<tr><td align="center" style="padding:0 4px 8px 4px;">
            <p style="margin:0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.body};text-align:center;">${description}</p>
          </td></tr>` : ''}
          ${metaLine ? `<tr><td align="center" style="padding:0 4px 4px 4px;">
            <p style="margin:0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.body};text-align:center;">${metaLine}</p>
          </td></tr>` : ''}
          ${cta}
        </table>
      </td></tr>
    </table>
  </td></tr>`
}

function renderEventRowContent(ev: any): string {
  // Build the one-paragraph line matching the Brevo style:
  // {FREE or £price pink} - <strong>{title} - {venue}</strong> - {description} | {date, time} | Age {age} | {link}
  const parts: string[] = []

  if (ev.is_free) {
    parts.push(`<span style="color:${C.pink};"><strong>FREE </strong></span>`)
    parts.push(`<span style="color:${C.black};"><strong>- </strong></span>`)
  } else if (ev.price) {
    parts.push(`<span style="color:${C.pink};"><strong>${escapeHtml(ev.price)} </strong></span>`)
    parts.push(`<span style="color:${C.black};"><strong>- </strong></span>`)
  }

  // Title (+ venue if present)
  const venueBit = ev.venue ? ` - ${escapeHtml(ev.venue)}` : ''
  parts.push(`<span style="color:${C.black};"><strong>${escapeHtml(ev.title || '')}${venueBit}</strong></span>`)

  // Description stays on the title line
  if (ev.description) {
    parts.push(`<span style="color:${C.black};"> - ${escapeHtml(ev.description)}</span>`)
  }

  // Info link on the title line
  if (ev.url) {
    parts.push(
      ` <span style="color:${C.black};">| </span><a href="${escapeHtml(ev.url)}" target="_blank" rel="noopener noreferrer" style="color:${C.blue};text-decoration:underline;"><strong>Info</strong></a>`
    )
  }

  // Date / time / age / location always on their own row below
  const metaBits: string[] = []
  if (ev.date) metaBits.push(formatDateShort(ev.date))
  if (ev.time) metaBits.push(escapeHtml(ev.time))
  if (ev.age_range) metaBits.push(`Age ${escapeHtml(ev.age_range)}`)
  if (ev.location) metaBits.push(escapeHtml(ev.location))

  if (metaBits.length > 0) {
    parts.push(
      `<br><span style="color:${C.muted};font-size:13px;">${metaBits.join(' &middot; ')}</span>`
    )
  }

  return parts.join('')
}

function renderEventRow(ev: any): string {
  const content = renderEventRowContent(ev)
  const highlight = isGpcHosted(ev)
  if (highlight) {
    // Yellow-highlighted GPC meetup row (matches original r32-c / r33-c rounded yellow cells)
    return `
    <tr><td style="padding:6px 0 10px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${C.butter}" style="background-color:${C.butter};border-radius:20px;">
        <tr><td style="padding:10px 14px;">
          <p style="margin:0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.black};">${content}</p>
        </td></tr>
      </table>
    </td></tr>`
  }
  return `
  <tr><td style="padding:10px 0;">
    <p style="margin:0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.black};">${content}</p>
  </td></tr>`
}

function renderEventSection(title: string, events: any[] | null, opts?: { gotNewsFooter?: boolean }): string {
  if (!events || events.length === 0) return ''
  const rows = events.map(renderEventRow).join('')

  const gotNews =
    opts?.gotNewsFooter
      ? `<tr><td align="center" style="padding:14px 0 4px 0;">
          <p style="margin:0;font-family:${F.body};font-size:17px;line-height:1.4;color:${C.body};text-align:center;">
            <strong style="color:${C.pink};">Got news to share? Tell us </strong>
            <a href="mailto:${NEWS_EMAIL}" style="color:${C.blue};text-decoration:underline;"><strong>${NEWS_EMAIL}</strong></a>
          </p>
        </td></tr>`
      : ''

  return `
  <tr><td style="padding:18px 20px 12px 20px;background-color:${C.page};">
    <h3 style="margin:0 0 8px 0;font-family:${F.heading};font-size:28px;line-height:1.2;color:${C.skyBlue};font-weight:bold;">${escapeHtml(title)}</h3>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      ${rows}
      ${gotNews}
    </table>
  </td></tr>`
}

function renderPresentingBlock(advertiser: any): string {
  if (!advertiser) return ''

  const advertiserName = escapeHtml(advertiser.advertiser_name || '')
  const description = escapeHtml(advertiser.event_description || '')
  const websiteUrl = advertiser.event_url || ''
  const isBrand = Boolean(advertiser.is_brand_sponsor)

  // Headline shown as the big pink H4:
  //  - brand mode → advertiser name
  //  - event mode → event title (fall back to advertiser name if title is missing)
  const headline = isBrand
    ? advertiserName
    : escapeHtml(advertiser.event_title || advertiser.advertiser_name || '')

  // Eyebrow italic line above the headline:
  //  - brand mode → "Proudly supported by"
  //  - event mode → "Presented by {advertiser_name}"
  const eyebrow = isBrand
    ? 'Proudly supported by'
    : `Presented by ${advertiserName}`

  // Image block — optional. In brand mode the logo itself is the clickable link
  // to the sponsor's website. In event mode it links to the event URL.
  const imageLinkUrl = websiteUrl || '#'
  const imageAlt = advertiserName || 'Sponsor'
  let leftColumn: string
  if (advertiser.image_url) {
    const imgTag = `<img src="${escapeHtml(advertiser.image_url)}" width="240" alt="${imageAlt}" style="display:block;width:100%;max-width:240px;height:auto;border:0;outline:none;text-decoration:none;">`
    leftColumn = websiteUrl
      ? `<a href="${escapeHtml(websiteUrl)}" target="_blank" style="text-decoration:none;">${imgTag}</a>`
      : imgTag
  } else {
    // Fallback: centred pink sponsor name so the block still has visual weight
    leftColumn = `<div style="font-family:${F.heading};font-size:26px;line-height:1.2;color:${C.pink};font-weight:bold;text-align:center;padding:20px 8px;">${advertiserName}</div>`
  }

  // CTA button — only in event mode, and only if an event URL is present.
  const cta =
    !isBrand && websiteUrl
      ? `<!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(websiteUrl)}" style="v-text-anchor:middle;width:119px;height:42px;" arcsize="20%" strokecolor="${C.blue}" fillcolor="${C.blue}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:arial,sans-serif;font-size:16px;font-weight:bold;">Tickets</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-- -->
        <a href="${escapeHtml(websiteUrl)}" target="_blank" style="display:inline-block;background-color:${C.blue};color:#ffffff;font-family:${F.body};font-size:16px;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:8px;mso-hide:all;">Tickets</a>
        <!--<![endif]-->`
      : ''

  return `
  <tr><td style="padding:0;background-color:${C.page};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${C.lavender}" style="background-color:${C.lavender};">
      <tr>
        <td width="50%" valign="middle" align="center" style="padding:24px 12px 24px 20px;" class="gpc-col-50">
          ${leftColumn}
        </td>
        <td width="50%" valign="top" style="padding:24px 20px 24px 12px;" class="gpc-col-50">
          <p style="margin:0 0 6px 0;font-family:${F.body};font-size:13px;line-height:1.3;color:${C.muted};"><em>${eyebrow}</em></p>
          <h4 style="margin:0 0 10px 0;font-family:${F.heading};font-size:20px;line-height:1.25;color:${C.pink};font-weight:bold;">${headline}</h4>
          ${description ? `<p style="margin:0 0 14px 0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.body};">${description}</p>` : ''}
          ${cta}
        </td>
      </tr>
    </table>
  </td></tr>`
}

function renderDonationStrip(): string {
  return `
  <tr><td style="padding:12px 20px 18px 20px;background-color:${C.page};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${C.paleBlue}" style="background-color:${C.paleBlue};">
      <tr><td align="center" style="padding:16px 20px;">
        <p style="margin:0;font-family:${F.body};font-size:16px;line-height:1.5;color:${C.black};text-align:center;">
          <strong>A big thank you to everyone who has bought us coffees! &#x1F970;</strong> You can now
          <a href="${DONATE_URL}" target="_blank" rel="noopener noreferrer" style="color:${C.blue};text-decoration:underline;"><strong>buy our volunteers a coffee</strong></a>
          <strong> to say thanks for the newsletter.</strong>
        </p>
      </td></tr>
    </table>
  </td></tr>`
}

function renderRegularsBlock(events: any[] | null): string {
  if (!events || events.length === 0) return ''

  const sortOrder = (d: number | null | undefined) => {
    if (d === null || d === undefined) return 99
    return d === 0 ? 7 : d
  }
  const sorted = [...events].sort((a, b) => sortOrder(a.day_of_week) - sortOrder(b.day_of_week))

  const rows = sorted
    .map((ev) => {
      const parts: string[] = []
      if (ev.is_free) {
        parts.push(`<span style="color:${C.pink};"><strong>FREE</strong></span>`)
        parts.push(`<span style="color:${C.black};"><strong> </strong>- </span>`)
      } else if (ev.price) {
        parts.push(`<span style="color:${C.pink};"><strong>${escapeHtml(ev.price)}</strong></span>`)
        parts.push(`<span style="color:${C.black};"><strong> </strong>- </span>`)
      }

      parts.push(`<span style="color:${C.black};"><strong>${escapeHtml(ev.title || '')}</strong></span>`)

      const detailBits: string[] = []
      if (ev.location) detailBits.push(escapeHtml(ev.location))
      else if (ev.venue) detailBits.push(escapeHtml(ev.venue))

      const dayLabel =
        ev.day_of_week !== null && ev.day_of_week !== undefined ? DAY_NAMES_LONG[ev.day_of_week] : ''
      const whenBit = ev.recurring_time ? escapeHtml(ev.recurring_time) : dayLabel
      if (whenBit) detailBits.push(whenBit)

      if (detailBits.length > 0) {
        parts.push(`<span style="color:${C.black};"> - ${detailBits.join(' - ')}</span>`)
      }

      if (ev.url) {
        parts.push(
          ` <span style="color:${C.black};">- </span><a href="${escapeHtml(ev.url)}" target="_blank" rel="noopener noreferrer" style="color:${C.blue};text-decoration:underline;"><strong>Info</strong></a>`
        )
      }

      return `<p style="margin:0 0 6px 0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.black};">${parts.join('')}</p>`
    })
    .join('')

  return `
  <tr><td style="padding:18px 20px 12px 20px;background-color:${C.page};">
    <h3 style="margin:0 0 8px 0;font-family:${F.heading};font-size:26px;line-height:1.2;color:${C.skyBlue};font-weight:bold;">Regular activities</h3>
    <p style="margin:0 0 12px 0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.black};"><em>Some only operate during term-time. Please check before travelling.</em></p>
    ${rows}
  </td></tr>`
}

function renderSupporterBlock(advertiser: any): string {
  if (!advertiser) return ''

  const name = escapeHtml(advertiser.advertiser_name || 'our supporter')
  const nameUpper = name.toUpperCase()
  const quote = advertiser.event_description ? escapeHtml(advertiser.event_description) : ''
  const linkUrl = advertiser.event_url || '#'
  const emailHref = advertiser.contact_email
    ? `mailto:${advertiser.contact_email}?subject=I%20saw%20your%20ad%20in%20the%20GPC%20What's%20On%20Guide`
    : '#'

  const logo = advertiser.image_url
    ? `<tr><td align="center" style="padding:10px 0 12px 0;">
        <a href="${escapeHtml(linkUrl)}" target="_blank" style="text-decoration:none;">
          <img src="${escapeHtml(advertiser.image_url)}" width="169" alt="${name}" style="display:block;width:169px;max-width:169px;height:auto;border:0;outline:none;text-decoration:none;border-radius:8px;margin:0 auto;">
        </a>
      </td></tr>`
    : ''

  return `
  <tr><td style="padding:20px 20px 24px 20px;background-color:${C.page};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr><td align="center" style="padding:0 0 4px 0;">
        <h4 style="margin:0;font-family:${F.heading};font-size:22px;line-height:1.2;color:${C.pink};font-weight:bold;">Give some love to our supporter!</h4>
      </td></tr>
      ${logo}
      ${quote ? `<tr><td align="center" style="padding:0 20px 12px 20px;">
        <p style="margin:0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.body};text-align:center;"><em>&ldquo;${quote}&rdquo;</em></p>
      </td></tr>` : ''}
      <tr><td align="center" style="padding:8px 0 4px 0;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(emailHref)}" style="v-text-anchor:middle;width:220px;height:48px;" arcsize="18%" strokecolor="${C.purple}" fillcolor="${C.purple}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:arial,sans-serif;font-size:15px;font-weight:bold;">Email ${nameUpper}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-- -->
        <a href="${escapeHtml(emailHref)}" style="display:inline-block;background-color:${C.purple};color:#ffffff;font-family:${F.body};font-size:15px;font-weight:bold;text-decoration:none;padding:13px 22px;border-radius:8px;mso-hide:all;">Email ${name}</a>
        <!--<![endif]-->
      </td></tr>
      <tr><td align="center" style="padding:16px 0 0 0;">
        <p style="margin:0;font-family:${F.body};font-size:15px;line-height:1.5;color:${C.body};text-align:center;">
          <strong style="color:${C.pink};">Want to feature your business? Email us </strong>
          <a href="mailto:${NEWS_EMAIL}" style="color:${C.blue};text-decoration:underline;"><strong>${NEWS_EMAIL}</strong></a>
        </p>
      </td></tr>
    </table>
  </td></tr>`
}

function renderFooter(): string {
  return `
  <tr><td style="padding:0;background-color:${C.page};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${C.footer}" style="background-color:${C.footer};">
      <tr><td align="center" style="padding:20px 20px 12px 20px;">
        <a href="${INSTAGRAM_URL}" target="_blank" style="text-decoration:none;">
          <img src="${INSTAGRAM_ICON}" width="32" alt="Instagram" style="display:block;width:32px;max-width:32px;height:auto;border:0;outline:none;text-decoration:none;">
        </a>
      </td></tr>
      <tr><td align="center" style="padding:0 20px 4px 20px;">
        <a href="${WEBSITE_URL}" target="_blank" style="font-family:${F.body};font-size:14px;color:${C.blue};text-decoration:underline;"><strong>www.gpccommunity.co.uk</strong></a>
      </td></tr>
      <tr><td align="center" style="padding:4px 20px;">
        <p style="margin:0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.body};text-align:center;">Disclaimer: While we try to ensure accuracy, we take no responsibility for the information above. Please check before travelling.</p>
      </td></tr>
      <tr><td align="center" style="padding:8px 20px 2px 20px;">
        <h4 style="margin:0;font-family:${F.heading};font-size:18px;line-height:1.2;color:${C.dark};font-weight:bold;">Greenwich Parents &amp; Carers</h4>
      </td></tr>
      <tr><td align="center" style="padding:2px 20px 12px 20px;">
        <p style="margin:0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.body};text-align:center;">Community Interest Company no. 16387545. SE10 9JT, London</p>
      </td></tr>
      <tr><td align="center" style="padding:0 20px 20px 20px;">
        <p style="margin:0;font-family:${F.body};font-size:13px;line-height:1.55;color:${C.body};text-align:center;"><em>No longer live in Greenwich?</em> <a href="#" style="color:${C.blue};text-decoration:underline;">Unsubscribe</a></p>
      </td></tr>
    </table>
  </td></tr>`
}

function renderNewsletter(opts: {
  todayLong: string
  introMessage: string
  featuredEvent: any
  thisWeek: any[]
  presenting: any
  comingUp: any[]
  furtherToTravel: any[]
  regulars: any[]
  supporter: any
}): string {
  const sections = [
    renderHeader(opts.todayLong, opts.introMessage),
    renderFeaturedBlock(opts.featuredEvent),
    renderEventSection('This Week', opts.thisWeek, { gotNewsFooter: true }),
    renderPresentingBlock(opts.presenting),
    renderEventSection('Coming up', opts.comingUp),
    renderDonationStrip(),
    renderEventSection('Further to travel', opts.furtherToTravel),
    renderRegularsBlock(opts.regulars),
    renderSupporterBlock(opts.supporter),
    renderFooter(),
  ].join('')

  const preheader = escapeHtml(opts.introMessage || '').slice(0, 120)

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="format-detection" content="telephone=no">
<base target="_blank">
<title>What&rsquo;s On Guide</title>
<!--[if mso]>
<xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<![endif]-->
<style type="text/css">
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
  body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: ${C.page}; }
  a { color: ${C.blue}; }
  @media only screen and (max-width: 620px) {
    .gpc-shell { width: 100% !important; }
    .gpc-col-50 { display: block !important; width: 100% !important; box-sizing: border-box !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${C.page};opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${C.page}" style="background-color:${C.page};">
  <tr><td align="center">
    <table role="presentation" class="gpc-shell" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background-color:${C.page};">
      ${sections}
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ---------- Handler ----------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json().catch(() => ({}))
    const introMessage: string = body.intro_message || ''
    const todayIso = new Date().toISOString().split('T')[0]
    const weekOfDate: string = body.week_of || nearestFriday(todayIso)

    const weekStart = todayIso
    const weekEnd = addDays(todayIso, 7)
    const comingUpStart = addDays(todayIso, 8)
    const comingUpEnd = addDays(todayIso, 21)

    // Featured GPC event
    const { data: featuredEvent } = await supabase
      .from('gpc_events')
      .select('*')
      .gte('date', todayIso)
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle()

    const seLondonCsv = `(${SE_LONDON_AREAS.map((a) => `"${a}"`).join(',')})`

    // This Week — SE London, next 7 days
    const { data: thisWeek } = await supabase
      .from('london_events')
      .select('*')
      .eq('approved', true)
      .eq('is_recurring', false)
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .in('area', SE_LONDON_AREAS)
      .order('date', { ascending: true })

    // Coming up — SE London, days 8..21
    const { data: comingUp } = await supabase
      .from('london_events')
      .select('*')
      .eq('approved', true)
      .eq('is_recurring', false)
      .gte('date', comingUpStart)
      .lte('date', comingUpEnd)
      .in('area', SE_LONDON_AREAS)
      .order('date', { ascending: true })

    // Further to travel — NOT SE London, across both windows
    const { data: furtherToTravel } = await supabase
      .from('london_events')
      .select('*')
      .eq('approved', true)
      .eq('is_recurring', false)
      .gte('date', weekStart)
      .lte('date', comingUpEnd)
      .not('area', 'in', seLondonCsv)
      .order('date', { ascending: true })

    // Regular activities — all recurring approved rows
    const { data: regulars } = await supabase
      .from('london_events')
      .select('*')
      .eq('approved', true)
      .eq('is_recurring', true)

    // Presenting advertiser — featured-ad for this Friday.
    // Accept both 'confirmed' and 'included' so that advertisers remain visible
    // after the first Generate run (which auto-flips them to 'included').
    const { data: presenting } = await supabase
      .from('newsletter_advertisers')
      .select('*')
      .eq('newsletter_date', weekOfDate)
      .eq('ad_type', 'featured-ad')
      .in('status', ['confirmed', 'included'])
      .limit(1)
      .maybeSingle()

    // Supporter advertiser — logo-sponsor for this Friday
    const { data: supporter } = await supabase
      .from('newsletter_advertisers')
      .select('*')
      .eq('newsletter_date', weekOfDate)
      .eq('ad_type', 'logo-sponsor')
      .in('status', ['confirmed', 'included'])
      .limit(1)
      .maybeSingle()

    const todayLong = formatDateLong(todayIso)

    const htmlContent = renderNewsletter({
      todayLong,
      introMessage,
      featuredEvent,
      thisWeek: thisWeek || [],
      presenting,
      comingUp: comingUp || [],
      furtherToTravel: furtherToTravel || [],
      regulars: regulars || [],
      supporter,
    })

    const title = `GPC Newsletter - Week of ${weekOfDate}`
    const { data: draft, error: insertError } = await supabase
      .from('newsletter_drafts')
      .insert({
        title,
        content_html: htmlContent,
        content_json: {
          featured_event: featuredEvent || null,
          this_week: thisWeek || [],
          presenting: presenting || null,
          coming_up: comingUp || [],
          further_to_travel: furtherToTravel || [],
          regulars: regulars || [],
          supporter: supporter || null,
          intro_message: introMessage,
        },
        status: 'draft',
        week_of: weekOfDate,
        events_included: [
          ...(featuredEvent ? [{ type: 'gpc', id: featuredEvent.id, title: featuredEvent.title }] : []),
          ...(thisWeek || []).map((e: any) => ({ type: 'london', id: e.id, title: e.title })),
          ...(comingUp || []).map((e: any) => ({ type: 'london', id: e.id, title: e.title })),
          ...(furtherToTravel || []).map((e: any) => ({ type: 'london', id: e.id, title: e.title })),
          ...(presenting ? [{ type: 'advertiser', id: presenting.id, title: presenting.event_title }] : []),
          ...(supporter ? [{ type: 'advertiser', id: supporter.id, title: supporter.event_title }] : []),
        ],
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Mark the two used advertisers as 'included'
    const usedAdvertiserIds = [presenting?.id, supporter?.id].filter(Boolean)
    if (usedAdvertiserIds.length > 0) {
      await supabase
        .from('newsletter_advertisers')
        .update({ status: 'included' })
        .in('id', usedAdvertiserIds)
        .eq('status', 'confirmed') // leave already-included rows alone on regenerate
    }

    return new Response(
      JSON.stringify({ success: true, draft_id: draft.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
