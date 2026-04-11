// Shared newsletter renderer — pure string-builder with no runtime dependencies.
// Imported by both the Deno edge function (generate-newsletter/index.ts) and
// the browser editor (src/lib/newsletter/renderer.ts, which is a byte-for-byte
// mirror of this file).
//
// The `createRenderers(theme, brand)` factory returns a set of bound render
// functions that use the given theme/brand closures, so each renderer body
// stays nearly identical to the pre-refactor code.

// ---------- Types ----------

export type ThemeColors = {
  page: string
  dark: string
  body: string
  black: string
  pink: string
  blue: string
  skyBlue: string
  lavender: string
  butter: string
  paleBlue: string
  purple: string
  footer: string
  muted: string
}

export type Fonts = {
  heading: string
  wordmark: string
  body: string
}

export type BrandConfig = {
  subscribeUrl: string
  instagramUrl: string
  websiteUrl: string
  donateUrl: string
  newsEmail: string
  logoUrl: string
  instagramIcon: string
}

// Metadata passed to every render call
export type NewsletterMetadata = {
  todayLong: string
  weekOf: string
}

// Block types — discriminated union
export type MastheadBlock = {
  id: string
  type: 'masthead'
  enabled: boolean
  wordmark?: string
  tagline?: string
  logoUrl?: string
}

export type SubscribeBlock = {
  id: string
  type: 'subscribe'
  enabled: boolean
  label: string
  url: string
}

export type IntroBlock = {
  id: string
  type: 'intro'
  enabled: boolean
  message: string
  signature?: string
}

export type FeaturedBlock = {
  id: string
  type: 'featured'
  enabled: boolean
  mode: 'auto' | 'manual'
  eventId?: string | null
  overrides?: Partial<EventData>
}

export type EventFilter = {
  source: 'london_events' | 'gpc_events'
  dateFrom?: number // days-from-now offset
  dateTo?: number
  areas?: 'se-london' | 'outside-se-london' | 'all'
  recurring?: boolean
}

export type EventSectionBlock = {
  id: string
  type: 'eventSection'
  enabled: boolean
  title: string
  kicker?: string
  mode: 'auto' | 'manual'
  filter: EventFilter
  eventIds?: string[]
  overrides?: Record<string, Partial<EventData>>
  gotNewsFooter?: boolean
}

export type PresentingBlock = {
  id: string
  type: 'presenting'
  enabled: boolean
  mode: 'auto' | 'manual'
  advertiserId?: string | null
  overrides?: Partial<AdvertiserData>
}

export type DonationStripBlock = {
  id: string
  type: 'donationStrip'
  enabled: boolean
  message?: string
  linkLabel?: string
  linkUrl?: string
}

export type RegularsBlock = {
  id: string
  type: 'regulars'
  enabled: boolean
  mode: 'auto' | 'manual'
  eventIds?: string[]
  overrides?: Record<string, Partial<EventData>>
}

export type SupporterBlock = {
  id: string
  type: 'supporter'
  enabled: boolean
  mode: 'auto' | 'manual'
  advertiserId?: string | null
  overrides?: Partial<AdvertiserData>
}

export type FooterBlock = {
  id: string
  type: 'footer'
  enabled: boolean
  cicText?: string
  unsubscribeLabel?: string
}

export type TextBlock = {
  id: string
  type: 'textBlock'
  enabled: boolean
  htmlContent: string
  align?: 'left' | 'center'
  bgColor?: string
}

export type ImageBlock = {
  id: string
  type: 'imageBlock'
  enabled: boolean
  imageUrl: string
  linkUrl?: string
  caption?: string
  align?: 'left' | 'center' | 'full'
}

export type CtaBlock = {
  id: string
  type: 'ctaBlock'
  enabled: boolean
  label: string
  url: string
  bgColor?: string
  textColor?: string
  align?: 'left' | 'center'
}

export type DividerBlock = {
  id: string
  type: 'divider'
  enabled: boolean
  style?: 'solid' | 'dotted'
  color?: string
}

export type Block =
  | MastheadBlock
  | SubscribeBlock
  | IntroBlock
  | FeaturedBlock
  | EventSectionBlock
  | PresentingBlock
  | DonationStripBlock
  | RegularsBlock
  | SupporterBlock
  | FooterBlock
  | TextBlock
  | ImageBlock
  | CtaBlock
  | DividerBlock

export type NewsletterConfig = {
  version: 2
  theme: Partial<ThemeColors>
  metadata: NewsletterMetadata
  blocks: Block[]
}

// Data model — the shape of resolved events and advertisers
export type EventData = {
  id?: string
  title?: string
  venue?: string
  description?: string
  date?: string
  time?: string
  location?: string
  area?: string
  age_range?: string
  price?: string
  is_free?: boolean
  url?: string
  image_url?: string
  ticket_url?: string
  slug?: string
  day_of_week?: number | null
  recurring_time?: string
  // Editor-only marker: when set to true on an override, the renderer skips
  // this row. Used by the "Exclude from this newsletter" toggle.
  excluded?: boolean
}

export type AdvertiserData = {
  id?: string
  advertiser_name?: string
  contact_email?: string
  event_title?: string
  event_description?: string
  event_url?: string
  image_url?: string
  is_brand_sponsor?: boolean
  ad_type?: string
}

export type ResolvedData = {
  events: Record<string, EventData>
  advertisers: Record<string, AdvertiserData>
  autoEventsByBlockId: Record<string, EventData[]>       // results of auto-mode event queries, keyed by block.id
  autoAdvertiserByBlockId: Record<string, AdvertiserData | null>
  autoFeaturedEvent: EventData | null                     // the singleton featured GPC event when featured block is in auto mode
  autoRegulars: EventData[]
}

// ---------- Defaults ----------

export const DEFAULT_COLORS: ThemeColors = {
  page: '#ffffff',
  dark: '#1f2d3d',
  body: '#3b3f44',
  black: '#000000',
  pink: '#fc16a0',
  blue: '#0092ff',
  skyBlue: '#76bae3',
  lavender: '#eef0ff',
  butter: '#fffad7',
  paleBlue: '#d2ebf8',
  purple: '#785cf1',
  footer: '#eff2f7',
  muted: '#6b6b7d',
}

export const DEFAULT_FONTS: Fonts = {
  heading: 'tahoma, geneva, sans-serif',
  wordmark: 'verdana, geneva, sans-serif',
  body: 'arial, helvetica, sans-serif',
}

export const DEFAULT_BRAND: BrandConfig = {
  subscribeUrl:
    'https://51297dd9.sibforms.com/serve/MUIFABZzIxkfNU_V57t_MOrGiJJSy1__hBpAYzja2pBanbdx1i6Bp_IUNK0gC9nIIQnVxTtz0rSaLHKhruUHKiTF7hZ70GeITq95O1wHd6J5EmchzdqYYEmaVICm36thRTUCH3lzvNzEdAYklr3XgX_YsPj-URiiusBsahwDMcPAh6x23h6RXMOlro6n8f3VAFYKE6n1vMdy45qQ',
  instagramUrl: 'https://www.instagram.com/gpc.community/',
  websiteUrl: 'https://www.gpccommunity.co.uk/',
  donateUrl: 'https://www.zeffy.com/en-GB/donation-form/buy-the-gpc-team-a-coffee',
  newsEmail: 'gpc.communitynews@gmail.com',
  logoUrl: 'https://www.gpccommunity.co.uk/images/site-logo.png',
  instagramIcon:
    'https://creative-assets.mailinblue.com/editor/social-icons/rounded_colored/instagram_32px.png',
}

const SE_LONDON_AREAS = ['Greenwich', 'Lewisham', 'Southwark', 'Tower Hamlets', 'Bromley']
const DAY_NAMES_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export { SE_LONDON_AREAS, DAY_NAMES_LONG }

// ---------- Pure utilities ----------

export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function formatDateLong(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function nearestFriday(todayIso: string): string {
  const d = new Date(todayIso + 'T00:00:00')
  const dow = d.getDay()
  const daysUntilFriday = (5 - dow + 7) % 7
  d.setDate(d.getDate() + daysUntilFriday)
  return d.toISOString().split('T')[0]
}

export function isGpcHosted(ev: EventData): boolean {
  const title = String(ev?.title || '').toLowerCase()
  return title.includes('gpc ')
}

// ---------- Renderer factory ----------

export type RendererOptions = {
  // When true, editable text interpolations get a data-edit="block|item|field"
  // attribute and the generated <head> includes hover styling. Used only for
  // the preview iframe in the admin editor. Default false — Save / Copy HTML
  // and the edge function all use clean output.
  editMode?: boolean
}

export function createRenderers(
  themeOverride: Partial<ThemeColors> = {},
  brandOverride: Partial<BrandConfig> = {},
  fontsOverride: Partial<Fonts> = {},
  options: RendererOptions = {}
) {
  const C: ThemeColors = { ...DEFAULT_COLORS, ...themeOverride }
  const F: Fonts = { ...DEFAULT_FONTS, ...fontsOverride }
  const B: BrandConfig = { ...DEFAULT_BRAND, ...brandOverride }
  const editMode = Boolean(options.editMode)

  // Emits ` data-edit="blockId|itemId|field"` when edit mode is on, empty
  // string otherwise. Leading space included so it can be interpolated
  // directly inside an opening tag.
  function editAttr(blockId: string, field = '', itemId = ''): string {
    if (!editMode) return ''
    return ` data-edit="${blockId}|${itemId}|${field}"`
  }

  function renderMastheadBlock(block: MastheadBlock): string {
    if (!block.enabled) return ''
    const logo = block.logoUrl || B.logoUrl
    const wordmark = escapeHtml(block.wordmark || "What's On Guide")
    const tagline = escapeHtml(
      block.tagline || 'Local events and activities for families - please share with your friends'
    )
    return `
  <tr><td align="center" style="padding:24px 20px 8px 20px;background-color:${C.page};">
    <img src="${escapeHtml(logo)}" width="102" alt="Greenwich Parents & Carers" style="display:block;width:102px;max-width:102px;height:auto;border:0;outline:none;text-decoration:none;"${editAttr(block.id, 'logoUrl')}>
  </td></tr>
  <tr><td align="center" style="padding:12px 20px 0 20px;background-color:${C.page};">
    <h2 style="margin:0;font-family:${F.heading};font-size:22px;line-height:1.3;color:${C.black};font-weight:bold;"${editAttr(block.id)}>Greenwich Parents &amp; Carers</h2>
  </td></tr>
  <tr><td align="center" style="padding:4px 20px 0 20px;background-color:${C.page};">
    <div style="font-family:${F.wordmark};font-size:36px;line-height:1.2;color:${C.black};font-weight:bold;"${editAttr(block.id, 'wordmark')}>${wordmark}</div>
  </td></tr>
  <tr><td align="center" style="padding:8px 20px 0 20px;background-color:${C.page};">
    <p style="margin:0;font-family:${F.body};font-size:16px;line-height:1.5;color:${C.body};"${editAttr(block.id, 'tagline')}><em>${tagline}</em></p>
  </td></tr>`
  }

  function renderSubscribeBlock(block: SubscribeBlock): string {
    if (!block.enabled) return ''
    const label = escapeHtml(block.label || 'Subscribe')
    const url = escapeHtml(block.url || B.subscribeUrl)
    return `
  <tr><td align="center" style="padding:20px 20px 20px 20px;background-color:${C.page};">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="v-text-anchor:middle;width:136px;height:45px;" arcsize="10%" strokecolor="${C.pink}" fillcolor="${C.pink}">
      <w:anchorlock/>
      <center style="color:#ffffff;font-family:verdana,sans-serif;font-size:18px;font-weight:bold;">${label}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-- -->
    <a href="${url}" style="display:inline-block;background-color:${C.pink};color:#ffffff;font-family:${F.wordmark};font-size:18px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:4px;mso-hide:all;"${editAttr(block.id, 'label')}>${label}</a>
    <!--<![endif]-->
  </td></tr>`
  }

  function renderIntroBlock(block: IntroBlock, metadata: NewsletterMetadata): string {
    if (!block.enabled) return ''
    const intro = escapeHtml(block.message || '')
    const signature = block.signature !== undefined ? block.signature : '- Aster'
    return `
  <tr><td style="padding:0 20px 24px 20px;background-color:${C.page};">
    <p style="margin:0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.body};"${editAttr(block.id, 'message')}>
      <strong>${escapeHtml(metadata.todayLong)}</strong> - ${intro} <em>${escapeHtml(signature)}</em>
    </p>
  </td></tr>`
  }

  function renderFeaturedBlock(block: FeaturedBlock, resolved: EventData | null): string {
    if (!block.enabled) return ''
    // merge overrides on top of resolved
    const event: EventData | null = resolved
      ? { ...resolved, ...(block.overrides || {}) }
      : block.mode === 'manual' && block.overrides
        ? block.overrides
        : null
    if (!event || (!event.title && !event.image_url)) return ''

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
          <img src="${escapeHtml(event.image_url)}" width="285" alt="${title}" style="display:block;width:285px;max-width:285px;height:auto;border:0;outline:none;text-decoration:none;margin:0 auto;"${editAttr(block.id, 'image_url')}>
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
        <a href="${escapeHtml(event.ticket_url)}" style="display:inline-block;background-color:${C.blue};color:#ffffff;font-family:${F.body};font-size:16px;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:8px;mso-hide:all;"${editAttr(block.id, 'ticket_url')}>Buy Tickets</a>
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
            <h4 style="margin:0;font-family:${F.heading};font-size:20px;line-height:1.25;color:${C.pink};font-weight:bold;"${editAttr(block.id, 'title')}>${title}</h4>
          </td></tr>
          ${description ? `<tr><td align="center" style="padding:0 4px 8px 4px;">
            <p style="margin:0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.body};text-align:center;"${editAttr(block.id, 'description')}>${description}</p>
          </td></tr>` : ''}
          ${metaLine ? `<tr><td align="center" style="padding:0 4px 4px 4px;">
            <p style="margin:0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.body};text-align:center;"${editAttr(block.id, 'date')}>${metaLine}</p>
          </td></tr>` : ''}
          ${cta}
        </table>
      </td></tr>
    </table>
  </td></tr>`
  }

  function renderEventRowContent(ev: EventData, blockId = ''): string {
    const parts: string[] = []
    const evId = ev.id || ''

    if (ev.is_free) {
      parts.push(`<span style="color:${C.pink};"${editAttr(blockId, 'price', evId)}><strong>FREE </strong></span>`)
      parts.push(`<span style="color:${C.black};"><strong>- </strong></span>`)
    } else if (ev.price) {
      parts.push(`<span style="color:${C.pink};"${editAttr(blockId, 'price', evId)}><strong>${escapeHtml(ev.price)} </strong></span>`)
      parts.push(`<span style="color:${C.black};"><strong>- </strong></span>`)
    }

    const venueBit = ev.venue ? ` - ${escapeHtml(ev.venue)}` : ''
    parts.push(`<span style="color:${C.black};"${editAttr(blockId, 'title', evId)}><strong>${escapeHtml(ev.title || '')}${venueBit}</strong></span>`)

    if (ev.description) {
      parts.push(`<span style="color:${C.black};"${editAttr(blockId, 'description', evId)}> - ${escapeHtml(ev.description)}</span>`)
    }

    if (ev.url) {
      parts.push(
        ` <span style="color:${C.black};">| </span><a href="${escapeHtml(ev.url)}" target="_blank" rel="noopener noreferrer" style="color:${C.blue};text-decoration:underline;"${editAttr(blockId, 'url', evId)}><strong>Info</strong></a>`
      )
    }

    const metaBits: string[] = []
    if (ev.date) metaBits.push(formatDateShort(ev.date))
    if (ev.time) metaBits.push(escapeHtml(ev.time))
    if (ev.age_range) metaBits.push(`Age ${escapeHtml(ev.age_range)}`)
    if (ev.location) metaBits.push(escapeHtml(ev.location))

    if (metaBits.length > 0) {
      parts.push(
        `<br><span style="color:${C.muted};font-size:13px;"${editAttr(blockId, 'date', evId)}>${metaBits.join(' &middot; ')}</span>`
      )
    }

    return parts.join('')
  }

  function renderEventRow(ev: EventData, blockId = ''): string {
    const content = renderEventRowContent(ev, blockId)
    const highlight = isGpcHosted(ev)
    if (highlight) {
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

  function renderEventSectionBlock(block: EventSectionBlock, resolved: EventData[]): string {
    if (!block.enabled || !resolved || resolved.length === 0) return ''
    // apply per-event overrides if any + drop excluded rows
    const overrides = block.overrides || {}
    const events: EventData[] = []
    for (const ev of resolved) {
      const override = ev.id ? overrides[ev.id] : undefined
      const merged = override ? { ...ev, ...override } : ev
      if (merged.excluded) continue
      events.push(merged)
    }
    if (events.length === 0) return ''
    const rows = events.map((ev) => renderEventRow(ev, block.id)).join('')
    const kicker = block.kicker
      ? `<p style="margin:0 0 4px 0;font-family:${F.body};font-size:12px;line-height:1.3;color:${C.muted};text-transform:uppercase;letter-spacing:1px;">${escapeHtml(block.kicker)}</p>`
      : ''
    const gotNews = block.gotNewsFooter
      ? `<tr><td align="center" style="padding:14px 0 4px 0;">
          <p style="margin:0;font-family:${F.body};font-size:17px;line-height:1.4;color:${C.body};text-align:center;">
            <strong style="color:${C.pink};">Got news to share? Tell us </strong>
            <a href="mailto:${B.newsEmail}" style="color:${C.blue};text-decoration:underline;"><strong>${B.newsEmail}</strong></a>
          </p>
        </td></tr>`
      : ''

    return `
  <tr><td style="padding:18px 20px 12px 20px;background-color:${C.page};">
    ${kicker}
    <h3 style="margin:0 0 8px 0;font-family:${F.heading};font-size:28px;line-height:1.2;color:${C.skyBlue};font-weight:bold;"${editAttr(block.id, 'title')}>${escapeHtml(block.title)}</h3>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      ${rows}
      ${gotNews}
    </table>
  </td></tr>`
  }

  function renderPresentingBlock(block: PresentingBlock, advertiserIn: AdvertiserData | null): string {
    if (!block.enabled) return ''
    // Merge overrides on top of the resolved advertiser
    const advertiser: AdvertiserData | null = advertiserIn
      ? { ...advertiserIn, ...(block.overrides || {}) }
      : block.overrides && Object.keys(block.overrides).length > 0
        ? (block.overrides as AdvertiserData)
        : null
    if (!advertiser) return ''

    const advertiserName = escapeHtml(advertiser.advertiser_name || '')
    const description = escapeHtml(advertiser.event_description || '')
    const websiteUrl = advertiser.event_url || ''
    const isBrand = Boolean(advertiser.is_brand_sponsor)

    const headline = isBrand
      ? advertiserName
      : escapeHtml(advertiser.event_title || advertiser.advertiser_name || '')

    const eyebrow = isBrand
      ? 'Proudly supported by'
      : `Presented by ${advertiserName}`

    const imageAlt = advertiserName || 'Sponsor'
    let leftColumn: string
    if (advertiser.image_url) {
      const imgTag = `<img src="${escapeHtml(advertiser.image_url)}" width="240" alt="${imageAlt}" style="display:block;width:100%;max-width:240px;height:auto;border:0;outline:none;text-decoration:none;"${editAttr(block.id, 'image_url')}>`
      leftColumn = websiteUrl
        ? `<a href="${escapeHtml(websiteUrl)}" target="_blank" style="text-decoration:none;">${imgTag}</a>`
        : imgTag
    } else {
      leftColumn = `<div style="font-family:${F.heading};font-size:26px;line-height:1.2;color:${C.pink};font-weight:bold;text-align:center;padding:20px 8px;"${editAttr(block.id, 'advertiser_name')}>${advertiserName}</div>`
    }

    const cta =
      !isBrand && websiteUrl
        ? `<!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(websiteUrl)}" style="v-text-anchor:middle;width:119px;height:42px;" arcsize="20%" strokecolor="${C.blue}" fillcolor="${C.blue}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:arial,sans-serif;font-size:16px;font-weight:bold;">Tickets</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-- -->
        <a href="${escapeHtml(websiteUrl)}" target="_blank" style="display:inline-block;background-color:${C.blue};color:#ffffff;font-family:${F.body};font-size:16px;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:8px;mso-hide:all;"${editAttr(block.id, 'event_url')}>Tickets</a>
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
          <p style="margin:0 0 6px 0;font-family:${F.body};font-size:13px;line-height:1.3;color:${C.muted};"${editAttr(block.id, 'advertiser_name')}><em>${eyebrow}</em></p>
          <h4 style="margin:0 0 10px 0;font-family:${F.heading};font-size:20px;line-height:1.25;color:${C.pink};font-weight:bold;"${editAttr(block.id, 'event_title')}>${headline}</h4>
          ${description ? `<p style="margin:0 0 14px 0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.body};"${editAttr(block.id, 'event_description')}>${description}</p>` : ''}
          ${cta}
        </td>
      </tr>
    </table>
  </td></tr>`
  }

  function renderDonationStripBlock(block: DonationStripBlock): string {
    if (!block.enabled) return ''
    const linkLabel = escapeHtml(block.linkLabel || 'buy our volunteers a coffee')
    const linkUrl = escapeHtml(block.linkUrl || B.donateUrl)
    const messagePrefix = escapeHtml(
      block.message || 'A big thank you to everyone who has bought us coffees!'
    )
    return `
  <tr><td style="padding:12px 20px 18px 20px;background-color:${C.page};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${C.paleBlue}" style="background-color:${C.paleBlue};">
      <tr><td align="center" style="padding:16px 20px;">
        <p style="margin:0;font-family:${F.body};font-size:16px;line-height:1.5;color:${C.black};text-align:center;"${editAttr(block.id, 'message')}>
          <strong>${messagePrefix} &#x1F970;</strong> You can now
          <a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color:${C.blue};text-decoration:underline;"${editAttr(block.id, 'linkLabel')}><strong>${linkLabel}</strong></a>
          <strong> to say thanks for the newsletter.</strong>
        </p>
      </td></tr>
    </table>
  </td></tr>`
  }

  function renderRegularsBlock(block: RegularsBlock, resolved: EventData[]): string {
    if (!block.enabled || !resolved || resolved.length === 0) return ''

    // Apply per-row overrides and drop excluded rows
    const overrides = block.overrides || {}
    const merged: EventData[] = []
    for (const ev of resolved) {
      const override = ev.id ? overrides[ev.id] : undefined
      const row = override ? { ...ev, ...override } : ev
      if (row.excluded) continue
      merged.push(row)
    }
    if (merged.length === 0) return ''

    const sortOrder = (d: number | null | undefined) => {
      if (d === null || d === undefined) return 99
      return d === 0 ? 7 : d
    }
    const sorted = [...merged].sort((a, b) => sortOrder(a.day_of_week) - sortOrder(b.day_of_week))

    const rows = sorted
      .map((ev) => {
        const parts: string[] = []
        const evId = ev.id || ''
        if (ev.is_free) {
          parts.push(`<span style="color:${C.pink};"${editAttr(block.id, 'price', evId)}><strong>FREE</strong></span>`)
          parts.push(`<span style="color:${C.black};"><strong> </strong>- </span>`)
        } else if (ev.price) {
          parts.push(`<span style="color:${C.pink};"${editAttr(block.id, 'price', evId)}><strong>${escapeHtml(ev.price)}</strong></span>`)
          parts.push(`<span style="color:${C.black};"><strong> </strong>- </span>`)
        }

        parts.push(`<span style="color:${C.black};"${editAttr(block.id, 'title', evId)}><strong>${escapeHtml(ev.title || '')}</strong></span>`)

        const detailBits: string[] = []
        if (ev.location) detailBits.push(escapeHtml(ev.location))
        else if (ev.venue) detailBits.push(escapeHtml(ev.venue))

        const dayLabel =
          ev.day_of_week !== null && ev.day_of_week !== undefined ? DAY_NAMES_LONG[ev.day_of_week] : ''
        const whenBit = ev.recurring_time ? escapeHtml(ev.recurring_time) : dayLabel
        if (whenBit) detailBits.push(whenBit)

        if (detailBits.length > 0) {
          parts.push(`<span style="color:${C.black};"${editAttr(block.id, 'location', evId)}> - ${detailBits.join(' - ')}</span>`)
        }

        if (ev.url) {
          parts.push(
            ` <span style="color:${C.black};">- </span><a href="${escapeHtml(ev.url)}" target="_blank" rel="noopener noreferrer" style="color:${C.blue};text-decoration:underline;"${editAttr(block.id, 'url', evId)}><strong>Info</strong></a>`
          )
        }

        return `<p style="margin:0 0 6px 0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.black};">${parts.join('')}</p>`
      })
      .join('')

    return `
  <tr><td style="padding:18px 20px 12px 20px;background-color:${C.page};">
    <h3 style="margin:0 0 8px 0;font-family:${F.heading};font-size:26px;line-height:1.2;color:${C.skyBlue};font-weight:bold;"${editAttr(block.id)}>Regular activities</h3>
    <p style="margin:0 0 12px 0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.black};"><em>Some only operate during term-time. Please check before travelling.</em></p>
    ${rows}
  </td></tr>`
  }

  function renderSupporterBlock(block: SupporterBlock, advertiserIn: AdvertiserData | null): string {
    if (!block.enabled) return ''
    const advertiser: AdvertiserData | null = advertiserIn
      ? { ...advertiserIn, ...(block.overrides || {}) }
      : block.overrides && Object.keys(block.overrides).length > 0
        ? (block.overrides as AdvertiserData)
        : null
    if (!advertiser) return ''

    const name = escapeHtml(advertiser.advertiser_name || 'our supporter')
    const quote = advertiser.event_description ? escapeHtml(advertiser.event_description) : ''
    const linkUrl = advertiser.event_url || '#'
    const emailHref = advertiser.contact_email
      ? `mailto:${advertiser.contact_email}?subject=I%20saw%20your%20ad%20in%20the%20GPC%20What's%20On%20Guide`
      : '#'

    const logo = advertiser.image_url
      ? `<tr><td align="center" style="padding:10px 0 12px 0;">
        <a href="${escapeHtml(linkUrl)}" target="_blank" style="text-decoration:none;">
          <img src="${escapeHtml(advertiser.image_url)}" width="169" alt="${name}" style="display:block;width:169px;max-width:169px;height:auto;border:0;outline:none;text-decoration:none;border-radius:8px;margin:0 auto;"${editAttr(block.id, 'image_url')}>
        </a>
      </td></tr>`
      : ''

    return `
  <tr><td style="padding:20px 20px 24px 20px;background-color:${C.page};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr><td align="center" style="padding:0 0 4px 0;">
        <h4 style="margin:0;font-family:${F.heading};font-size:22px;line-height:1.2;color:${C.pink};font-weight:bold;"${editAttr(block.id)}>Give some love to our supporter!</h4>
      </td></tr>
      ${logo}
      ${quote ? `<tr><td align="center" style="padding:0 20px 12px 20px;">
        <p style="margin:0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.body};text-align:center;"${editAttr(block.id, 'event_description')}><em>&ldquo;${quote}&rdquo;</em></p>
      </td></tr>` : ''}
      <tr><td align="center" style="padding:8px 0 4px 0;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(emailHref)}" style="v-text-anchor:middle;width:220px;height:48px;" arcsize="18%" strokecolor="${C.purple}" fillcolor="${C.purple}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:arial,sans-serif;font-size:15px;font-weight:bold;">Email ${name.toUpperCase()}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-- -->
        <a href="${escapeHtml(emailHref)}" style="display:inline-block;background-color:${C.purple};color:#ffffff;font-family:${F.body};font-size:15px;font-weight:bold;text-decoration:none;padding:13px 22px;border-radius:8px;mso-hide:all;"${editAttr(block.id, 'contact_email')}>Email ${name}</a>
        <!--<![endif]-->
      </td></tr>
      <tr><td align="center" style="padding:16px 0 0 0;">
        <p style="margin:0;font-family:${F.body};font-size:15px;line-height:1.5;color:${C.body};text-align:center;">
          <strong style="color:${C.pink};">Want to feature your business? Email us </strong>
          <a href="mailto:${B.newsEmail}" style="color:${C.blue};text-decoration:underline;"><strong>${B.newsEmail}</strong></a>
        </p>
      </td></tr>
    </table>
  </td></tr>`
  }

  function renderFooterBlock(block: FooterBlock): string {
    if (!block.enabled) return ''
    const cicText = escapeHtml(
      block.cicText || 'Community Interest Company no. 16387545. SE10 9JT, London'
    )
    const unsubscribeLabel = escapeHtml(block.unsubscribeLabel || 'No longer live in Greenwich?')
    return `
  <tr><td style="padding:0;background-color:${C.page};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${C.footer}" style="background-color:${C.footer};">
      <tr><td align="center" style="padding:20px 20px 12px 20px;">
        <a href="${B.instagramUrl}" target="_blank" style="text-decoration:none;">
          <img src="${B.instagramIcon}" width="32" alt="Instagram" style="display:block;width:32px;max-width:32px;height:auto;border:0;outline:none;text-decoration:none;">
        </a>
      </td></tr>
      <tr><td align="center" style="padding:0 20px 4px 20px;">
        <a href="${B.websiteUrl}" target="_blank" style="font-family:${F.body};font-size:14px;color:${C.blue};text-decoration:underline;"><strong>www.gpccommunity.co.uk</strong></a>
      </td></tr>
      <tr><td align="center" style="padding:4px 20px;">
        <p style="margin:0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.body};text-align:center;">Disclaimer: While we try to ensure accuracy, we take no responsibility for the information above. Please check before travelling.</p>
      </td></tr>
      <tr><td align="center" style="padding:8px 20px 2px 20px;">
        <h4 style="margin:0;font-family:${F.heading};font-size:18px;line-height:1.2;color:${C.dark};font-weight:bold;">Greenwich Parents &amp; Carers</h4>
      </td></tr>
      <tr><td align="center" style="padding:2px 20px 12px 20px;">
        <p style="margin:0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.body};text-align:center;"${editAttr(block.id, 'cicText')}>${cicText}</p>
      </td></tr>
      <tr><td align="center" style="padding:0 20px 20px 20px;">
        <p style="margin:0;font-family:${F.body};font-size:13px;line-height:1.55;color:${C.body};text-align:center;"${editAttr(block.id, 'unsubscribeLabel')}><em>${unsubscribeLabel}</em> <a href="#" style="color:${C.blue};text-decoration:underline;">Unsubscribe</a></p>
      </td></tr>
    </table>
  </td></tr>`
  }

  function renderTextBlock(block: TextBlock): string {
    if (!block.enabled || !block.htmlContent) return ''
    const align = block.align || 'left'
    const bgColor = block.bgColor || C.page
    // htmlContent is already sanitised by the browser sanitiser before it reaches here
    return `
  <tr><td style="padding:12px 20px;background-color:${bgColor};">
    <div style="font-family:${F.body};font-size:15px;line-height:1.6;color:${C.body};text-align:${align};"${editAttr(block.id, 'htmlContent')}>${block.htmlContent}</div>
  </td></tr>`
  }

  function renderImageBlock(block: ImageBlock): string {
    if (!block.enabled || !block.imageUrl) return ''
    const align = block.align || 'center'
    const caption = block.caption
      ? `<p style="margin:8px 0 0 0;font-family:${F.body};font-size:13px;line-height:1.4;color:${C.muted};text-align:${align};"${editAttr(block.id, 'caption')}><em>${escapeHtml(block.caption)}</em></p>`
      : ''
    const width = align === 'full' ? 560 : 400
    const imgTag = `<img src="${escapeHtml(block.imageUrl)}" width="${width}" alt="${escapeHtml(block.caption || '')}" style="display:block;width:100%;max-width:${width}px;height:auto;border:0;outline:none;text-decoration:none;margin:0 auto;"${editAttr(block.id, 'imageUrl')}>`
    const wrapped = block.linkUrl
      ? `<a href="${escapeHtml(block.linkUrl)}" target="_blank" style="text-decoration:none;">${imgTag}</a>`
      : imgTag
    return `
  <tr><td align="${align === 'full' ? 'center' : align}" style="padding:12px 20px;background-color:${C.page};">
    ${wrapped}
    ${caption}
  </td></tr>`
  }

  function renderCtaBlock(block: CtaBlock): string {
    if (!block.enabled || !block.url) return ''
    const align = block.align || 'center'
    const label = escapeHtml(block.label || 'Learn more')
    const bg = block.bgColor || C.blue
    const text = block.textColor || '#ffffff'
    return `
  <tr><td align="${align}" style="padding:16px 20px;background-color:${C.page};">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(block.url)}" style="v-text-anchor:middle;width:180px;height:44px;" arcsize="18%" strokecolor="${bg}" fillcolor="${bg}">
      <w:anchorlock/>
      <center style="color:${text};font-family:arial,sans-serif;font-size:15px;font-weight:bold;">${label}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-- -->
    <a href="${escapeHtml(block.url)}" target="_blank" style="display:inline-block;background-color:${bg};color:${text};font-family:${F.body};font-size:15px;font-weight:bold;text-decoration:none;padding:13px 26px;border-radius:8px;mso-hide:all;"${editAttr(block.id, 'label')}>${label}</a>
    <!--<![endif]-->
  </td></tr>`
  }

  function renderDividerBlock(block: DividerBlock): string {
    if (!block.enabled) return ''
    const style = block.style || 'solid'
    const color = block.color || C.muted
    return `
  <tr><td style="padding:8px 20px;background-color:${C.page};"${editAttr(block.id)}>
    <div style="border-top:1px ${style} ${color};height:0;line-height:0;font-size:0;">&nbsp;</div>
  </td></tr>`
  }

  function renderBlock(block: Block, metadata: NewsletterMetadata, resolved: ResolvedData): string {
    switch (block.type) {
      case 'masthead':
        return renderMastheadBlock(block)
      case 'subscribe':
        return renderSubscribeBlock(block)
      case 'intro':
        return renderIntroBlock(block, metadata)
      case 'featured': {
        const resolvedEvent =
          block.mode === 'manual' && block.eventId
            ? resolved.events[block.eventId] || null
            : resolved.autoFeaturedEvent
        return renderFeaturedBlock(block, resolvedEvent)
      }
      case 'eventSection': {
        let events: EventData[] = []
        if (block.mode === 'manual' && block.eventIds) {
          events = block.eventIds
            .map((id) => resolved.events[id])
            .filter((ev): ev is EventData => Boolean(ev))
        } else {
          events = resolved.autoEventsByBlockId[block.id] || []
        }
        return renderEventSectionBlock(block, events)
      }
      case 'presenting': {
        const advertiser =
          block.mode === 'manual' && block.advertiserId
            ? resolved.advertisers[block.advertiserId] || null
            : resolved.autoAdvertiserByBlockId[block.id] || null
        return renderPresentingBlock(block, advertiser)
      }
      case 'donationStrip':
        return renderDonationStripBlock(block)
      case 'regulars': {
        let events: EventData[] = []
        if (block.mode === 'manual' && block.eventIds) {
          events = block.eventIds
            .map((id) => resolved.events[id])
            .filter((ev): ev is EventData => Boolean(ev))
        } else {
          events = resolved.autoRegulars
        }
        return renderRegularsBlock(block, events)
      }
      case 'supporter': {
        const advertiser =
          block.mode === 'manual' && block.advertiserId
            ? resolved.advertisers[block.advertiserId] || null
            : resolved.autoAdvertiserByBlockId[block.id] || null
        return renderSupporterBlock(block, advertiser)
      }
      case 'footer':
        return renderFooterBlock(block)
      case 'textBlock':
        return renderTextBlock(block)
      case 'imageBlock':
        return renderImageBlock(block)
      case 'ctaBlock':
        return renderCtaBlock(block)
      case 'divider':
        return renderDividerBlock(block)
      default:
        return ''
    }
  }

  function renderNewsletter(config: NewsletterConfig, resolved: ResolvedData): string {
    const sections = config.blocks.map((block) => renderBlock(block, config.metadata, resolved)).join('')

    // Preheader: pull from the first intro block's message if present
    const introBlock = config.blocks.find((b): b is IntroBlock => b.type === 'intro' && b.enabled)
    const preheader = escapeHtml(introBlock?.message || '').slice(0, 120)

    const editStyles = editMode
      ? `
  /* Edit-mode hover affordance (stripped from the email output) */
  [data-edit] { cursor: pointer; transition: background-color 0.1s, outline 0.1s; }
  [data-edit]:hover { background-color: rgba(252,22,160,0.08) !important; outline: 1px dashed #fc16a0 !important; outline-offset: 2px; }`
      : ''

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
  }${editStyles}
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

  return {
    renderNewsletter,
    renderBlock,
    // expose atomic renderers too for direct use / testing
    renderMastheadBlock,
    renderSubscribeBlock,
    renderIntroBlock,
    renderFeaturedBlock,
    renderEventRow,
    renderEventRowContent,
    renderEventSectionBlock,
    renderPresentingBlock,
    renderDonationStripBlock,
    renderRegularsBlock,
    renderSupporterBlock,
    renderFooterBlock,
    renderTextBlock,
    renderImageBlock,
    renderCtaBlock,
    renderDividerBlock,
  }
}

// Convenience: default renderer with no overrides
export function renderNewsletterWithDefaults(
  config: NewsletterConfig,
  resolved: ResolvedData
): string {
  const renderers = createRenderers(config.theme)
  return renderers.renderNewsletter(config, resolved)
}
