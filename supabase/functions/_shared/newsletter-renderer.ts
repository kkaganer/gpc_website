// Shared newsletter renderer — pure string-builder with no runtime dependencies.
// Imported by both the Deno edge function (generate-newsletter/index.ts) and the
// browser editor, which reaches across the supabase/ boundary to import this very
// file. There is no mirror copy: one file, two runtimes.
//
// The `createRenderers(theme, brand, fonts, options)` factory returns a set of
// bound render functions closed over the resolved theme, so each renderer body
// reads as plain markup with tokens interpolated.
//
// EMAIL HTML IS NOT WEB HTML. Tables, inline styles and explicit bgcolor are
// deliberate. No flexbox, no grid, no <style> rules beyond the reset, no webfont
// link — Poppins falls back to Trebuchet MS and Nunito to Verdana, and the
// hierarchy has to hold on the fallbacks because Gmail will never load either.

// ---------- Types ----------

export type ThemeColors = {
  /** Warm ground behind the whole email. */
  page: string
  /** White card sitting on the warm ground. */
  card: string
  /** Headings, dark bands, footer. */
  dark: string
  /** Body copy. */
  body: string
  /** The strongest text weight of colour. */
  black: string
  /** Brand pink. FILLS AND RULES ONLY — 3.6:1 on white, it fails as text. */
  pink: string
  /** The AA-safe pink, for anything pink that is read rather than looked at. */
  pinkText: string
  /** The tint plate a paid-placement label sits on. */
  pinkTint: string
  /** Meta lines. The lightest text allowed. */
  muted: string
  /** Preheader and fine print only — below AA at body size. */
  faint: string
  /** Card borders and the rules between rows. */
  hairline: string
  /** The FREE plate. */
  green: string
  /** Footer band. */
  footer: string
}

export type Fonts = {
  heading: string
  wordmark: string
  body: string
}

export type BrandConfig = {
  subscribeUrl: string
  instagramUrl: string
  instagramHandle: string
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
  /** The inbox preview line. Falls back to a slice of the intro when unset. */
  preheader?: string
}

export type MastheadBlock = {
  id: string
  type: 'masthead'
  enabled: boolean
  wordmark?: string
  /** Rendered only when set. The masthead carries the edition date instead. */
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
  /** The small uppercase line above the title. */
  eyebrow?: string
  overrides?: Partial<EventData>
}

export type EventFilter = {
  source: 'london_events' | 'gpc_events'
  dateFrom?: number
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
  /**
   * `picks` is the numbered card from the redesign: a lead item and a short
   * numbered tail, capped by `limit`. `list` is the long-form paragraph list the
   * newsletter used to be made of, kept so a long edition is still buildable.
   */
  layout?: 'list' | 'picks'
  /** Hard cap on rendered rows. Unset means all of them. */
  limit?: number
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
  /**
   * Manual mode: which advertisers fill the row, in order. Plural because a week
   * sells several logo slots; the row used to render exactly one however many
   * were booked.
   */
  advertiserIds?: string[]
  /** Keyed by advertiser id, since the block now holds several. */
  overrides?: Record<string, Partial<AdvertiserData>>
  heading?: string
}

/**
 * The one filled button in the email: through to this week's guide on the site.
 *
 * Its own block type rather than a configured `ctaBlock` because the label has to
 * carry the true event count and the href has to track the edition date, and both
 * come from resolved data rather than from anything an editor types.
 */
export type EditionCtaBlock = {
  id: string
  type: 'editionCta'
  enabled: boolean
  /** `{count}` is substituted. Default: "See all {count} events →". */
  label?: string
  /** Overrides the derived /whats-on/{weekOf} destination. */
  url?: string
  note?: string
}

export type FooterBlock = {
  id: string
  type: 'footer'
  enabled: boolean
  cicText?: string
  unsubscribeLabel?: string
  /**
   * The ESP's unsubscribe merge tag. Left configurable rather than guessed: the
   * old renderer shipped a literal href="#" here, so the link in every sent
   * edition went nowhere. Defaults to EmailOctopus's tag -- see renderFooterBlock.
   */
  unsubscribeUrl?: string
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
  | EditionCtaBlock
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
  /** Last day of a run. Null/absent for a one-off — see the meta line below. */
  end_date?: string
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
  logo_bg?: string
  ad_type?: string
  // Migration 033. All nullable: a booking taken before it has none of them, and
  // the card renders without the label table rather than showing empty rows.
  event_when?: string
  event_price?: string
  event_where?: string
  cta_label?: string
}

export type ResolvedData = {
  events: Record<string, EventData>
  advertisers: Record<string, AdvertiserData>
  autoEventsByBlockId: Record<string, EventData[]>       // results of auto-mode event queries, keyed by block.id
  autoAdvertiserByBlockId: Record<string, AdvertiserData | null>
  /** Supporter blocks: every logo booked for the week, in order. */
  autoAdvertisersByBlockId: Record<string, AdvertiserData[]>
  autoFeaturedEvent: EventData | null                     // the singleton featured GPC event when featured block is in auto mode
  autoRegulars: EventData[]
  /**
   * How many things are on the edition page this week.
   *
   * NOT derivable from the blocks above: the email carries five picks and the
   * page carries the lot, so counting what the email rendered would understate it
   * by an order of magnitude. Both the CTA label and the WhatsApp message need
   * the real number.
   */
  editionEventCount: number
}

// ---------- Defaults ----------

// The site's own tokens (docs/design-system.md), not the email's old palette.
// Pink is a fill and a rule; pinkText is the only pink allowed to carry meaning.
export const DEFAULT_COLORS: ThemeColors = {
  page: '#fffaf5',
  card: '#ffffff',
  dark: '#2d1b4e',
  body: '#4a5565',
  black: '#1a1a2e',
  pink: '#fc16a0',
  pinkText: '#d1067f',
  pinkTint: '#fff5fb',
  muted: '#6a7282',
  faint: '#99a1af',
  hairline: '#f3f4f6',
  green: '#00c950',
  footer: '#2d1b4e',
}

// No <link> to Google Fonts anywhere in the output: Gmail strips it, Outlook
// ignores it, and a webfont that loads in one client and not another is worse
// than none. The fallbacks are the design.
export const DEFAULT_FONTS: Fonts = {
  heading: "'Poppins','Trebuchet MS',Verdana,sans-serif",
  wordmark: "'Poppins','Trebuchet MS',Verdana,sans-serif",
  body: "'Nunito',Verdana,Geneva,sans-serif",
}

export const DEFAULT_BRAND: BrandConfig = {
  subscribeUrl:
    'https://51297dd9.sibforms.com/serve/MUIFABZzIxkfNU_V57t_MOrGiJJSy1__hBpAYzja2pBanbdx1i6Bp_IUNK0gC9nIIQnVxTtz0rSaLHKhruUHKiTF7hZ70GeITq95O1wHd6J5EmchzdqYYEmaVICm36thRTUCH3lzvNzEdAYklr3XgX_YsPj-URiiusBsahwDMcPAh6x23h6RXMOlro6n8f3VAFYKE6n1vMdy45qQ',
  instagramUrl: 'https://www.instagram.com/gpc.community/',
  instagramHandle: '@gpc.community',
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

/** Supporter logo tile, in CSS px. Logos are normalised to this at upload
 *  (see src/lib/logoNormalise.js), so the renderer can state both dimensions. */
export const SUPPORTER_LOGO = { width: 260, height: 160 }

/** The supporter logo as it sits in the email row: the normalised 260x160 plate
 *  at half size, so two tiles fit side by side inside the 600px shell and the
 *  artwork is still legible. */
export const SUPPORTER_ROW_LOGO = { width: 130, height: 80 }

/** The presenting photo, at the shell's full inner width. */
export const PRESENTING_IMAGE = { width: 552, height: 200 }

// ---------- WhatsApp ----------

/** WhatsApp shows a "Read more" fold past roughly this many characters. */
export const WHATSAPP_MAX = 1000

/**
 * The edition page both deliveries point at.
 *
 * ONE implementation, called by the WhatsApp message and by the email's button,
 * because they were built separately and drifted: WhatsApp hardcoded the apex
 * domain while the button derived www from `BrandConfig.websiteUrl`, so the two
 * "same" links were two origins, and an `editionCta` url set in the editor moved
 * the button without moving the message. Both serve the page, so nothing was
 * visibly broken -- which is why it survived. Change the destination here and it
 * changes in both places, which is the only guarantee worth having.
 */
export function editionUrl(
  weekOf: string | undefined,
  opts: { siteUrl?: string; override?: string } = {},
): string {
  if (opts.override) return opts.override
  const root = (opts.siteUrl || DEFAULT_BRAND.websiteUrl).replace(/\/$/, '')
  return weekOf ? `${root}/whats-on/${weekOf}` : `${root}/whats-on`
}

/** The `editionCta` block's url override, if the config carries one. */
function editionCtaOverride(config: NewsletterConfig): string | undefined {
  const block = (config?.blocks || []).find(
    (b): b is EditionCtaBlock => b?.type === 'editionCta' && b.enabled !== false,
  )
  return block?.url || undefined
}

/**
 * Strip anything WhatsApp cannot render.
 *
 * WhatsApp supports *bold*, _italic_, ~strike~ and monospace. Not HTML, not
 * markdown links. Anything else arrives as literal punctuation, so entities are
 * decoded back to characters rather than left as &amp;.
 */
export function toPlainText(input: unknown): string {
  return String(input ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Build the pasteable WhatsApp message for an edition.
 *
 * Deliberately short: its whole job is to earn the tap through to the edition
 * page, where the full list and every outbound link live. Highlights are named
 * rather than listed so the message survives the fold on a phone.
 */
export function renderWhatsapp(
  config: NewsletterConfig,
  resolved: ResolvedData,
  opts: { siteUrl?: string; eventCount?: number } = {},
): string {
  // Same URL the email's button carries, override included -- see editionUrl.
  const url = editionUrl(config?.metadata?.weekOf, {
    siteUrl: opts.siteUrl,
    override: editionCtaOverride(config),
  })

  const events: EventData[] = []
  for (const list of Object.values(resolved?.autoEventsByBlockId || {})) {
    for (const ev of list || []) {
      if (!ev?.excluded && ev?.title) events.push(ev)
    }
  }
  for (const ev of Object.values(resolved?.events || {})) {
    if (!ev?.excluded && ev?.title) events.push(ev)
  }

  const seen = new Set<string>()
  const names: string[] = []
  for (const ev of events) {
    const t = toPlainText(ev.title)
    if (!t || seen.has(t)) continue
    seen.add(t)
    if (names.length < 4) names.push(t)
  }

  // The edition page's count, not the email's. Since the email became five picks
  // plus a link, counting the blocks it rendered would have WhatsApp announcing
  // "5 things for families in Greenwich" for a week with forty on the page.
  const total = Number.isInteger(opts.eventCount)
    ? opts.eventCount
    : Number.isInteger(resolved?.editionEventCount) && resolved.editionEventCount > 0
      ? resolved.editionEventCount
      : seen.size
  const countPhrase = total && total > 0
    ? `${total} things for families in Greenwich`
    : 'This week for families in Greenwich'

  const highlights = names.length
    ? ` \u2014 ${names.slice(0, -1).join(', ')}${names.length > 1 ? ' and ' : ''}${names[names.length - 1]}`
    : ''

  const lines = [
    `*What's On this week*`,
    '',
    `${countPhrase}${highlights}.`,
    '',
    `Full guide: ${url}`,
  ]

  let out = lines.join('\n')
  if (out.length > WHATSAPP_MAX) {
    // Trim the highlight sentence, never the link -- the link is the point.
    const tail = `.\n\nFull guide: ${url}`
    const head = `*What's On this week*\n\n${countPhrase}`
    const room = WHATSAPP_MAX - head.length - tail.length
    const trimmed = room > 0 ? highlights.slice(0, room).replace(/[,\s\u2014]+$/, '') : ''
    out = `${head}${trimmed}${tail}`
  }
  return out
}

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

/**
 * The masthead date: "Friday 12 June".
 *
 * Distinct from formatDateLong, which is the "12 Jun 2026" stamp the intro line
 * used to carry. The masthead names the day of the week because the whole promise
 * of the thing is that it arrives on a Friday.
 */
export function formatEditionDateLong(iso: string): string {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

export function formatDateShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

// A calendar date has no time zone, so all of these parse AND serialise in UTC.
//
// They used to parse local ('2026-09-08T00:00:00', no Z) and serialise UTC
// (toISOString), which is a day out for the whole of British Summer Time: local
// midnight on the 8th is 23:00Z on the 7th, so every result rounded down a day.
// nearestFriday returned a THURSDAY from late March to late October, and the
// browser and the Deno function -- one in London, one on a UTC server -- did not
// even agree with each other.
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

export function nearestFriday(todayIso: string): string {
  const d = new Date(`${todayIso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return todayIso
  const daysUntilFriday = (5 - d.getUTCDay() + 7) % 7
  d.setUTCDate(d.getUTCDate() + daysUntilFriday)
  return d.toISOString().split('T')[0]
}

/** Today, as a calendar date, in the same UTC frame as everything above. */
export function todayIso(): string {
  return new Date().toISOString().split('T')[0]
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

  const siteRoot = B.websiteUrl.replace(/\/$/, '')

  /** An absolute URL on the site. Every href in an email has to be absolute. */
  function siteUrl(path: string): string {
    return `${siteRoot}/${String(path).replace(/^\//, '')}`
  }

  // MIRROR: clickUrl in api/click.js. Serverless functions cannot import from
  // src/, so the shape is duplicated on purpose. If one changes, change the other.
  function trackedUrl(rawUrl: string, advertiserId?: string, editionDate = ''): string {
    if (!rawUrl || !advertiserId) return rawUrl
    const params = new URLSearchParams({ id: advertiserId, source: 'email' })
    if (editionDate) params.set('date', editionDate)
    return `${siteRoot}/click?${params.toString()}`
  }

  // ---------- Shared bits of furniture ----------

  // The 64x4 rule under a heading. A table rather than a div: Outlook's Word
  // engine collapses an empty div to nothing, and this is load-bearing brand.
  function pinkRule(align: 'left' | 'center' = 'left'): string {
    const margin = align === 'center' ? 'margin:12px auto;' : 'margin:10px 0 0 0;'
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}" style="${margin}border-collapse:collapse;"><tr><td width="64" height="4" bgcolor="${C.pink}" style="width:64px;height:4px;background-color:${C.pink};border-radius:9999px;font-size:0;line-height:0;">&nbsp;</td></tr></table>`
  }

  /** The small uppercase label above a heading or inside a dark card. */
  function eyebrow(text: string, color: string, attr = ''): string {
    return `<div style="font-family:${F.body};font-weight:700;font-size:11px;line-height:16px;letter-spacing:0.08em;text-transform:uppercase;color:${color};"${attr}>${text}</div>`
  }

  /** The green FREE plate. The one thing parents scan for. */
  function freePill(size: 'lead' | 'row' = 'row'): string {
    const fs = size === 'lead' ? '11px' : '10px'
    const pad = size === 'lead' ? '3px 10px' : '2px 9px'
    return `<span style="display:inline-block;background-color:${C.green};color:${C.dark};font-family:${F.body};font-weight:700;font-size:${fs};letter-spacing:0.06em;padding:${pad};border-radius:9999px;">FREE</span>`
  }

  // "Fri 12 Jun, 10.30am · Charlton House Library · £10". Price is appended only
  // when it is not free, because a FREE row already carries the green plate and
  // saying it twice makes the plate look like decoration.
  function eventMetaLine(ev: EventData, opts: { withPrice?: boolean } = {}): string {
    const bits: string[] = []
    const when: string[] = []
    if (ev.date) when.push(formatDateShort(ev.date))
    if (ev.time) when.push(escapeHtml(ev.time))
    if (when.length) bits.push(when.join(', '))
    const where = ev.location || ev.venue
    if (where) bits.push(escapeHtml(where))
    if (ev.age_range) bits.push(`Age ${escapeHtml(ev.age_range)}`)
    if (opts.withPrice && !ev.is_free && ev.price) bits.push(escapeHtml(ev.price))
    return bits.join(' &middot; ')
  }

  /** Where a listing row points. Prefers a booking link over the site page. */
  function eventHref(ev: EventData): string {
    if (ev.ticket_url) return ev.ticket_url
    if (ev.url) return ev.url
    if (ev.slug) return siteUrl(`events/${ev.slug}`)
    return ''
  }

  // ---------- Masthead ----------

  function renderMastheadBlock(block: MastheadBlock, metadata: NewsletterMetadata): string {
    if (!block.enabled) return ''
    const logo = block.logoUrl || B.logoUrl
    const wordmark = escapeHtml(block.wordmark || "What's On Guide")
    // The tagline is opt-in now. The masthead's job is the name, the rule and the
    // date; the old standing sentence sat between the wordmark and the date and
    // pushed the first real content below the fold on a phone.
    const tagline = block.tagline ? escapeHtml(block.tagline) : ''
    const editionDate = escapeHtml(formatEditionDateLong(metadata.weekOf) || metadata.todayLong || '')
    return `
  <tr><td align="center" style="padding:28px 24px 20px 24px;background-color:${C.page};">
    <img src="${escapeHtml(logo)}" width="132" alt="Greenwich Parents &amp; Carers" style="width:132px;max-width:132px;height:auto;display:block;border:0;outline:none;text-decoration:none;margin:0 auto 14px auto;">
    <div style="font-family:${F.wordmark};font-weight:700;font-size:28px;line-height:34px;color:${C.dark};"${editAttr(block.id, 'wordmark')}>${wordmark}</div>
    ${pinkRule('center')}
    <div style="font-family:${F.body};font-weight:700;font-size:14px;line-height:20px;letter-spacing:0.025em;text-transform:uppercase;color:${C.muted};">${editionDate}</div>
    ${tagline ? `<div style="font-family:${F.body};font-size:15px;line-height:24px;color:${C.body};padding-top:10px;"${editAttr(block.id, 'tagline')}>${tagline}</div>` : ''}
  </td></tr>`
  }

  function renderSubscribeBlock(block: SubscribeBlock): string {
    if (!block.enabled) return ''
    const label = escapeHtml(block.label || 'Subscribe')
    const url = escapeHtml(block.url || B.subscribeUrl)
    return `
  <tr><td align="center" style="padding:4px 24px 20px 24px;background-color:${C.page};">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="v-text-anchor:middle;width:180px;height:44px;" arcsize="50%" strokecolor="${C.pink}" fillcolor="${C.card}">
      <w:anchorlock/>
      <center style="color:#d1067f;font-family:arial,sans-serif;font-size:15px;font-weight:bold;">${label}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-- -->
    <a href="${url}" style="display:inline-block;background-color:${C.card};color:${C.pinkText};border:2px solid ${C.pink};font-family:${F.body};font-size:15px;font-weight:700;text-decoration:none;padding:11px 26px;border-radius:9999px;mso-hide:all;"${editAttr(block.id, 'label')}>${label}</a>
    <!--<![endif]-->
  </td></tr>`
  }

  function renderIntroBlock(block: IntroBlock, _metadata: NewsletterMetadata): string {
    if (!block.enabled) return ''
    const message = escapeHtml(block.message || '')
    const signature = block.signature ? escapeHtml(block.signature) : ''
    if (!message && !signature) return ''
    // Centred, and no longer prefixed with the date: the masthead above carries
    // the date now, and it read as a dateline stapled to a sentence.
    return `
  <tr><td align="center" style="padding:4px 40px 26px 40px;background-color:${C.page};">
    <div style="font-family:${F.body};font-size:16px;line-height:26px;color:${C.body};text-align:center;"${editAttr(block.id, 'message')}>${message}</div>
    ${signature ? `<div style="font-family:${F.body};font-size:16px;line-height:26px;font-weight:700;color:${C.dark};padding-top:8px;"${editAttr(block.id, 'signature')}>${signature}</div>` : ''}
  </td></tr>`
  }

  // ---------- Featured: the dark card ----------

  function renderFeaturedBlock(block: FeaturedBlock, resolvedIn: EventData | null): string {
    if (!block.enabled) return ''
    const ev: EventData | null = resolvedIn
      ? { ...resolvedIn, ...(block.overrides || {}) }
      : block.overrides && Object.keys(block.overrides).length > 0
        ? (block.overrides as EventData)
        : null
    if (!ev || !ev.title) return ''

    const href = eventHref(ev)
    const title = escapeHtml(ev.title)
    const kicker = escapeHtml(block.eyebrow || 'From GPC')

    const whenBits: string[] = []
    if (ev.date) whenBits.push(formatDateShort(ev.date))
    if (ev.time) whenBits.push(escapeHtml(ev.time))
    whenBits.push(ev.is_free ? 'Free entry' : escapeHtml(ev.price || ''))
    const whenLine = whenBits.filter(Boolean).join(' &middot; ')
    const where = escapeHtml(ev.location || ev.venue || '')

    // Full-bleed at the top of the card when there is artwork. The fair poster is
    // the single most-looked-at thing in the edition it appears in.
    const image = ev.image_url
      ? `<tr><td style="padding:0;font-size:0;line-height:0;">
        <img src="${escapeHtml(ev.image_url)}" width="552" alt="${title}" style="display:block;width:100%;max-width:552px;height:auto;border:0;outline:none;text-decoration:none;border-radius:16px 16px 0 0;"${editAttr(block.id, 'image_url')}>
      </td></tr>`
      : ''

    const cta = href
      ? `<div style="padding-top:16px;"><a href="${escapeHtml(href)}" target="_blank" style="font-family:${F.body};font-weight:700;font-size:15px;line-height:22px;color:#ffffff;text-decoration:none;border-bottom:2px solid ${C.pink};padding-bottom:2px;"${editAttr(block.id, 'ticket_url')}>Find out more &rarr;</a></div>`
      : ''

    return `
  <tr><td style="padding:26px 24px 0 24px;background-color:${C.page};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.dark}" style="background-color:${C.dark};border-collapse:collapse;border-radius:16px;">
      ${image}
      <tr><td style="padding:26px 26px 28px 26px;">
        ${eyebrow(kicker, C.pink, editAttr(block.id, 'eyebrow'))}
        <div style="font-family:${F.heading};font-weight:700;font-size:26px;line-height:33px;color:#ffffff;padding-top:8px;"${editAttr(block.id, 'title')}>${title}</div>
        <div style="font-family:${F.body};font-size:16px;line-height:26px;color:#ffffff;padding-top:10px;"${editAttr(block.id, 'description')}>
          ${whenLine}${where ? `<br><span style="color:rgba(255,255,255,.6);">${where}</span>` : ''}
        </div>
        ${cta}
      </td></tr>
    </table>
  </td></tr>`
  }

  // ---------- Event rows: the long-form list ----------
  //
  // Kept whole, restyled. This is no longer in the default edition, but a week
  // with something worth spelling out still wants it, and deleting it would have
  // made "put the full list back" a code change rather than a click.

  function renderEventRowContent(ev: EventData, blockId = ''): string {
    const parts: string[] = []
    const evId = ev.id || ''

    if (ev.is_free) {
      parts.push(`<span style="color:${C.pinkText};"${editAttr(blockId, 'price', evId)}><strong>FREE</strong></span>`)
      parts.push(`<span style="color:${C.black};"><strong> </strong>- </span>`)
    } else if (ev.price) {
      parts.push(`<span style="color:${C.pinkText};"${editAttr(blockId, 'price', evId)}><strong>${escapeHtml(ev.price)}</strong></span>`)
      parts.push(`<span style="color:${C.black};"><strong> </strong>- </span>`)
    }

    const venueSuffix = ev.venue ? ` - ${escapeHtml(ev.venue)}` : ''
    parts.push(`<span style="color:${C.black};"${editAttr(blockId, 'title', evId)}><strong>${escapeHtml(ev.title || '')}${venueSuffix}</strong></span>`)

    if (ev.description) {
      parts.push(`<span style="color:${C.black};"${editAttr(blockId, 'description', evId)}> - ${escapeHtml(ev.description)}</span>`)
    }

    const href = eventHref(ev)
    if (href) {
      parts.push(` <span style="color:${C.black};">| </span><a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="color:${C.pinkText};text-decoration:underline;"${editAttr(blockId, 'url', evId)}><strong>Info</strong></a>`)
    }

    const meta = eventMetaLine(ev)
    if (meta) {
      parts.push(`<br><span style="font-size:13px;color:${C.muted};">${meta}</span>`)
    }
    return parts.join('')
  }

  function renderEventRow(ev: EventData, blockId = ''): string {
    const content = renderEventRowContent(ev, blockId)
    // A GPC-hosted row gets the warm plate so it reads as ours without needing a
    // label that says so.
    if (isGpcHosted(ev)) {
      return `
    <tr><td style="padding:6px 0 10px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="background-color:${C.page};border-collapse:collapse;border-radius:12px;">
        <tr><td style="padding:10px 14px;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.black};">${content}</td></tr>
      </table>
    </td></tr>`
    }
    return `
    <tr><td style="padding:10px 0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.black};">${content}</td></tr>`
  }

  // ---------- Picks: the numbered card ----------

  function renderPickRow(ev: EventData, index: number, blockId: string, isLast: boolean): string {
    const evId = ev.id || ''
    const number = String(index + 1).padStart(2, '0')
    const lead = index === 0
    const gpc = isGpcHosted(ev)

    const plate = gpc && !lead
      ? ` bgcolor="${C.page}" `
      : ' '
    const plateStyle = gpc && !lead ? `background-color:${C.page};` : ''
    const radius = isLast ? 'border-radius:0 0 16px 16px;' : ''
    const rule = lead ? '' : `border-top:1px solid ${C.hairline};`
    const pad = lead ? '22px 22px 18px 22px' : '16px 22px'

    const meta = eventMetaLine(ev, { withPrice: true })
    const free = ev.is_free ? `<div style="padding-bottom:${lead ? '8px' : '6px'};">${freePill(lead ? 'lead' : 'row')}</div>` : ''

    const title = lead
      ? `<div style="font-family:${F.heading};font-weight:700;font-size:22px;line-height:29px;color:${C.dark};"${editAttr(blockId, 'title', evId)}>${escapeHtml(ev.title || '')}</div>`
      : `<div style="font-family:${F.heading};font-weight:600;font-size:18px;line-height:25px;color:${C.dark};"${editAttr(blockId, 'title', evId)}>${escapeHtml(ev.title || '')}</div>`

    // The lead gets its description; the tail is title and meta only. Five equal
    // paragraphs is a list, and the point of a picks card is that one of them is
    // the pick.
    const description = lead && ev.description
      ? `<div style="font-family:${F.body};font-size:15px;line-height:24px;color:${C.body};padding-top:8px;"${editAttr(blockId, 'description', evId)}>${escapeHtml(ev.description)}</div>`
      : ''

    const numberStyle = lead
      ? `font-family:${F.heading};font-weight:700;font-size:24px;line-height:28px;color:${C.pink};`
      : `font-family:${F.heading};font-weight:700;font-size:18px;line-height:26px;color:${C.pink};`

    return `
      <tr><td${plate}style="${plateStyle}padding:${pad};${rule}${radius}">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="42" valign="top" style="width:42px;${numberStyle}">${number}</td>
          <td valign="top">
            ${free}${title}
            ${meta ? `<div style="font-family:${F.body};font-size:14px;line-height:22px;color:${C.muted};padding-top:${lead ? '6px' : '4px'};"${editAttr(blockId, 'location', evId)}>${meta}</div>` : ''}
            ${description}
          </td>
        </tr></table>
      </td></tr>`
  }

  function renderPicksSection(block: EventSectionBlock, rows: EventData[]): string {
    if (rows.length === 0) return ''
    const title = escapeHtml(block.title || "This week's picks")
    return `
  <tr><td style="padding:28px 24px 6px 24px;background-color:${C.page};">
    <div style="font-family:${F.heading};font-weight:700;font-size:22px;line-height:28px;color:${C.dark};"${editAttr(block.id)}>${title}</div>
    ${pinkRule('left')}
  </td></tr>
  <tr><td style="padding:14px 24px 0 24px;background-color:${C.page};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.card}" style="background-color:${C.card};border-collapse:collapse;border-radius:16px;border:1px solid ${C.hairline};">
      ${rows.map((ev, i) => renderPickRow(ev, i, block.id, i === rows.length - 1)).join('')}
    </table>
  </td></tr>`
  }

  function renderEventSectionBlock(block: EventSectionBlock, resolved: EventData[]): string {
    if (!block.enabled || !resolved || resolved.length === 0) return ''

    const overrides = block.overrides || {}
    const merged: EventData[] = []
    for (const ev of resolved) {
      const override = ev.id ? overrides[ev.id] : undefined
      const row = override ? { ...ev, ...override } : ev
      if (row.excluded) continue
      merged.push(row)
    }
    if (merged.length === 0) return ''

    const capped =
      Number.isInteger(block.limit) && (block.limit as number) > 0
        ? merged.slice(0, block.limit as number)
        : merged

    if (block.layout === 'picks') return renderPicksSection(block, capped)

    const gotNews = block.gotNewsFooter
      ? `
    <tr><td align="center" style="padding:14px 0 4px 0;">
      <p style="margin:0;font-family:${F.body};font-size:16px;line-height:1.5;color:${C.body};text-align:center;">
        <strong style="color:${C.pinkText};">Got news to share? Tell us </strong>
        <a href="mailto:${B.newsEmail}" style="color:${C.pinkText};text-decoration:underline;"><strong>${B.newsEmail}</strong></a>
      </p>
    </td></tr>`
      : ''

    return `
  <tr><td style="padding:18px 24px 12px 24px;background-color:${C.page};">
    ${block.kicker ? eyebrow(escapeHtml(block.kicker), C.muted, editAttr(block.id, 'kicker')) : ''}
    <div style="font-family:${F.heading};font-weight:700;font-size:24px;line-height:30px;color:${C.dark};"${editAttr(block.id)}>${escapeHtml(block.title || '')}</div>
    ${pinkRule('left')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
      ${capped.map((ev) => renderEventRow(ev, block.id)).join('')}
      ${gotNews}
    </table>
  </td></tr>`
  }

  // ---------- The one filled button ----------

  function renderEditionCtaBlock(
    block: EditionCtaBlock,
    metadata: NewsletterMetadata,
    resolved: ResolvedData
  ): string {
    if (!block.enabled) return ''
    const count = Number.isInteger(resolved?.editionEventCount) ? resolved.editionEventCount : 0
    // Shared with renderWhatsapp so the button and the WhatsApp message cannot
    // point at different places. Passes this render's brand root rather than the
    // default, since a caller may have overridden websiteUrl.
    const href = escapeHtml(
      editionUrl(metadata.weekOf, { siteUrl: siteRoot, override: block.url })
    )
    const template = block.label || 'See all {count} events →'
    // A week we could not count says "See the full guide" rather than "See all 0".
    const label = escapeHtml(
      count > 0
        ? template.replace('{count}', String(count))
        : 'See the full guide →'
    )
    const note = escapeHtml(
      block.note || 'Times, prices and booking links for every one of them.'
    )
    return `
  <tr><td style="padding:30px 24px 10px 24px;background-color:${C.page};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr><td align="center" bgcolor="${C.pink}" style="background-color:${C.pink};background-image:linear-gradient(to right, ${C.pink}, ${C.dark});border-radius:9999px;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="v-text-anchor:middle;width:552px;height:68px;" arcsize="50%" stroke="f" fillcolor="${C.pink}">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:arial,sans-serif;font-size:22px;font-weight:bold;">${label}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-- -->
        <a href="${href}" target="_blank" style="display:block;padding:21px 24px;font-family:${F.heading};font-weight:700;font-size:22px;line-height:26px;color:#ffffff;text-decoration:none;text-align:center;mso-hide:all;"${editAttr(block.id, 'label')}>${label}</a>
        <!--<![endif]-->
      </td></tr>
    </table>
    <div style="font-family:${F.body};font-size:13px;line-height:20px;color:${C.muted};text-align:center;padding-top:12px;"${editAttr(block.id, 'note')}>${note}</div>
  </td></tr>`
  }

  // ---------- Presenting: paid tier 1 ----------

  // The unsold slot. Same width and same pink rule as the sold card, dashed
  // rather than solid so it reads as an offer rather than a placeholder.
  // Deliberately image-free: a stock photo here would compete with the picks
  // below it, and there is no advertiser whose photo it could honestly be.
  function renderPresentingHouseAd(): string {
    const month = new Date().toLocaleDateString('en-GB', { month: 'long' })
    const subject = encodeURIComponent(`Advertising in the What's On Guide`)
    const href = `mailto:${B.newsEmail}?subject=${subject}`
    return `
  <tr><td style="padding:0 24px 12px 24px;background-color:${C.page};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.pinkTint}" style="background-color:${C.pinkTint};border-collapse:collapse;border:1px dashed ${C.pink};border-radius:16px;">
      <tr><td align="center" style="padding:30px 32px;">
        ${eyebrow('This space', C.pinkText)}
        <div style="font-family:${F.heading};font-weight:700;font-size:22px;line-height:30px;color:${C.dark};padding-top:8px;">Want to feature your business?</div>
        <div style="font-family:${F.body};font-size:15px;line-height:24px;color:${C.body};padding-top:8px;">One business per edition reaches 1,800+ Greenwich parents here.</div>
        <div style="padding-top:10px;">
          <a href="${href}" style="font-family:${F.body};font-weight:700;font-size:15px;line-height:44px;color:${C.pinkText};text-decoration:none;border-bottom:2px solid ${C.pink};">Talk to us about ${month} &rarr;</a>
        </div>
      </td></tr>
    </table>
  </td></tr>`
  }

  // The When / Price / Where table. Rows appear only when the booking carries
  // them (migration 033), so a booking taken before it renders as description
  // only rather than as three empty labels.
  function presentingDetails(advertiser: AdvertiserData, blockId: string): string {
    const rows: Array<[string, string, string]> = [
      ['When', advertiser.event_when || '', 'event_when'],
      ['Price', advertiser.event_price || '', 'event_price'],
      ['Where', advertiser.event_where || '', 'event_where'],
    ]
    const present = rows.filter(([, value]) => value)
    if (present.length === 0) return ''
    return `
        <tr><td style="padding:10px 20px 0 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:${F.body};font-size:14px;line-height:22px;color:${C.body};">
            ${present
              .map(
                ([label, value, field]) => `<tr>
              <td width="86" valign="top" style="width:86px;padding:5px 0;font-family:${F.body};font-weight:700;color:${C.muted};font-size:12px;letter-spacing:0.025em;text-transform:uppercase;">${label}</td>
              <td valign="top" style="padding:5px 0;"${editAttr(blockId, field)}>${escapeHtml(value)}</td>
            </tr>`
              )
              .join('')}
          </table>
        </td></tr>`
  }

  function renderPresentingBlock(
    block: PresentingBlock,
    advertiserIn: AdvertiserData | null,
    editionDate = ''
  ): string {
    if (!block.enabled) return ''
    const advertiser: AdvertiserData | null = advertiserIn
      ? { ...advertiserIn, ...(block.overrides || {}) }
      : block.overrides && Object.keys(block.overrides).length > 0
        ? (block.overrides as AdvertiserData)
        : null
    // An unsold slot is GPC's own invitation at the same footprint, never a gap.
    // Collapsing it made a quiet week look like a broken template, and it threw
    // away the one placement most likely to sell the next one.
    if (!advertiser) return renderPresentingHouseAd()

    const advertiserName = escapeHtml(advertiser.advertiser_name || '')
    const description = escapeHtml(advertiser.event_description || '')
    const href = trackedUrl(advertiser.event_url || '', advertiser.id, editionDate)
    const isBrand = Boolean(advertiser.is_brand_sponsor)
    const headline = isBrand
      ? advertiserName
      : escapeHtml(advertiser.event_title || advertiser.advertiser_name || '')
    const ctaLabel = escapeHtml(
      advertiser.cta_label || (isBrand ? 'Visit the website' : 'Find out more')
    )
    const plate = escapeHtml(advertiser.logo_bg || C.card)

    // Brand mode shows the logo on its plate at its own size; event mode shows the
    // photograph full-bleed across the card.
    const media = advertiser.image_url
      ? isBrand
        ? `<tr><td align="center" bgcolor="${plate}" style="background-color:${plate};padding:26px 20px 6px 20px;">
          <img src="${escapeHtml(advertiser.image_url)}" width="${SUPPORTER_LOGO.width}" height="${SUPPORTER_LOGO.height}" alt="${advertiserName}" style="display:block;width:${SUPPORTER_LOGO.width}px;max-width:${SUPPORTER_LOGO.width}px;height:${SUPPORTER_LOGO.height}px;border:0;outline:none;text-decoration:none;border-radius:12px;margin:0 auto;"${editAttr(block.id, 'image_url')}>
        </td></tr>`
        : `<tr><td style="padding:0;font-size:0;line-height:0;">
          <img src="${escapeHtml(advertiser.image_url)}" width="${PRESENTING_IMAGE.width}" alt="${advertiserName}" style="display:block;width:100%;max-width:${PRESENTING_IMAGE.width}px;height:auto;border:0;outline:none;text-decoration:none;"${editAttr(block.id, 'image_url')}>
        </td></tr>`
      : ''

    // One anchor around the whole card: tier 1 is sold on "one click target, one
    // number to report". Outlook's Word engine will only make the inline content
    // clickable, which is why the CTA line sits inside as styled text rather than
    // as a nested anchor -- an <a> inside an <a> is invalid and Gmail drops it.
    const card = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.card}" style="background-color:${C.card};border-collapse:collapse;border:1px solid ${C.hairline};border-top:3px solid ${C.pink};border-radius:16px;">
        <tr><td bgcolor="${C.pinkTint}" style="background-color:${C.pinkTint};padding:9px 20px;font-family:${F.body};font-weight:700;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${C.pinkText};border-radius:16px 16px 0 0;">
          ${isBrand ? 'Proudly supported by &middot; paid placement' : 'Presenting partner &middot; paid placement'}
        </td></tr>
        ${media}
        <tr><td style="padding:20px 20px 6px 20px;">
          <div style="font-family:${F.heading};font-weight:700;font-size:21px;line-height:28px;color:${C.dark};"${editAttr(block.id, isBrand ? 'advertiser_name' : 'event_title')}>${headline}</div>
          ${description ? `<div style="font-family:${F.body};font-size:15px;line-height:24px;color:${C.body};padding-top:6px;"${editAttr(block.id, 'event_description')}>${description}</div>` : ''}
        </td></tr>
        ${isBrand ? '' : presentingDetails(advertiser, block.id)}
        ${
          href
            ? `<tr><td bgcolor="${C.card}" style="background-color:${C.card};padding:14px 20px 16px 20px;border-top:1px solid ${C.hairline};">
          <span style="font-family:${F.body};font-weight:700;font-size:15px;line-height:22px;color:${C.pinkText};border-bottom:2px solid ${C.pink};padding-bottom:2px;"${editAttr(block.id, 'cta_label')}>${ctaLabel} &rarr;</span>
        </td></tr>`
            : ''
        }
      </table>`

    return `
  <tr><td style="padding:0 24px 8px 24px;background-color:${C.page};">
    ${href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer sponsored" style="display:block;text-decoration:none;color:${C.black};">${card}</a>` : card}
  </td></tr>
  <tr><td style="padding:0 24px 4px 24px;background-color:${C.page};font-family:${F.body};font-size:11px;line-height:18px;color:${C.faint};">
    Paid placement. GPC does not run this.
  </td></tr>`
  }

  // ---------- Donation strip ----------

  function renderDonationStripBlock(block: DonationStripBlock): string {
    if (!block.enabled) return ''
    const linkLabel = escapeHtml(block.linkLabel || 'buy our volunteers a coffee')
    const linkUrl = escapeHtml(block.linkUrl || B.donateUrl)
    const messagePrefix = escapeHtml(
      block.message || 'A big thank you to everyone who has bought us coffees!'
    )
    return `
  <tr><td style="padding:12px 24px 18px 24px;background-color:${C.page};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.card}" style="background-color:${C.card};border-collapse:collapse;border:1px solid ${C.hairline};border-radius:16px;">
      <tr><td align="center" style="padding:18px 20px;">
        <div style="font-family:${F.body};font-size:15px;line-height:24px;color:${C.body};text-align:center;"${editAttr(block.id, 'message')}>
          <strong style="color:${C.dark};">${messagePrefix} &#x1F970;</strong>
          <a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color:${C.pinkText};text-decoration:underline;font-weight:700;"${editAttr(block.id, 'linkLabel')}>${linkLabel}</a>
        </div>
      </td></tr>
    </table>
  </td></tr>`
  }

  // ---------- Regulars ----------

  function renderRegularsBlock(block: RegularsBlock, resolved: EventData[]): string {
    if (!block.enabled || !resolved || resolved.length === 0) return ''

    const overrides = block.overrides || {}
    const merged: EventData[] = []
    for (const ev of resolved) {
      const override = ev.id ? overrides[ev.id] : undefined
      const row = override ? { ...ev, ...override } : ev
      if (row.excluded) continue
      merged.push(row)
    }
    if (merged.length === 0) return ''

    // Sunday is 0 in the column but reads last in a week that starts on Monday,
    // and a row with no day sorts to the end. Twin of regularSortOrder in
    // src/lib/editionGroups.js, which orders the same rows on the web page.
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
          parts.push(`<span style="color:${C.pinkText};"${editAttr(block.id, 'price', evId)}><strong>FREE</strong></span>`)
          parts.push(`<span style="color:${C.black};"><strong> </strong>- </span>`)
        } else if (ev.price) {
          parts.push(`<span style="color:${C.pinkText};"${editAttr(block.id, 'price', evId)}><strong>${escapeHtml(ev.price)}</strong></span>`)
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
            ` <span style="color:${C.black};">- </span><a href="${escapeHtml(ev.url)}" target="_blank" rel="noopener noreferrer" style="color:${C.pinkText};text-decoration:underline;"${editAttr(block.id, 'url', evId)}><strong>Info</strong></a>`
          )
        }

        return `<p style="margin:0 0 6px 0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.black};">${parts.join('')}</p>`
      })
      .join('')

    return `
  <tr><td style="padding:18px 24px 12px 24px;background-color:${C.page};">
    <div style="font-family:${F.heading};font-weight:700;font-size:24px;line-height:30px;color:${C.dark};"${editAttr(block.id)}>Regular activities</div>
    ${pinkRule('left')}
    <p style="margin:12px 0 12px 0;font-family:${F.body};font-size:14px;line-height:1.55;color:${C.muted};">Some only run during term-time. Please check before travelling.</p>
    ${rows}
  </td></tr>`
  }

  // ---------- Supporters: paid tier 2 ----------

  function supporterTile(advertiser: AdvertiserData, blockId: string, editionDate: string, span: 1 | 2): string {
    const name = escapeHtml(advertiser.advertiser_name || 'our supporter')
    const href = escapeHtml(trackedUrl(advertiser.event_url || '', advertiser.id, editionDate) || siteUrl('advertise'))
    // The plate is the td's bgcolor as well as the image's, so a blocked image
    // (Gmail's default on first open) degrades to a tidy tile carrying the name,
    // not a broken-image icon on a white hole.
    const plate = escapeHtml(advertiser.logo_bg || C.card)
    const inner = advertiser.image_url
      ? `<img src="${escapeHtml(advertiser.image_url)}" width="${SUPPORTER_ROW_LOGO.width}" height="${SUPPORTER_ROW_LOGO.height}" alt="${name}" style="display:block;width:${SUPPORTER_ROW_LOGO.width}px;max-width:${SUPPORTER_ROW_LOGO.width}px;height:${SUPPORTER_ROW_LOGO.height}px;border:0;outline:none;text-decoration:none;margin:0 auto;"${editAttr(blockId, 'image_url', advertiser.id || '')}>`
      : `<span style="font-family:${F.body};font-weight:700;font-size:15px;line-height:22px;color:${C.dark};"${editAttr(blockId, 'advertiser_name', advertiser.id || '')}>${name}</span>`
    const colspan = span === 2 ? ' colspan="2"' : ''
    const width = span === 2 ? '100%' : '50%'
    return `<td${colspan} width="${width}" align="center" valign="middle" bgcolor="${plate}" style="width:${width};background-color:${plate};border:1px solid ${C.hairline};border-radius:12px;padding:12px 14px;">
          <a href="${href}" target="_blank" rel="noopener noreferrer sponsored" style="display:block;text-decoration:none;">${inner}</a>
        </td>`
  }

  function renderSupporterBlock(
    block: SupporterBlock,
    advertisersIn: AdvertiserData[],
    editionDate = ''
  ): string {
    if (!block.enabled) return ''

    const overrides = block.overrides || {}
    const list = (advertisersIn || [])
      .map((a) => (a.id && overrides[a.id] ? { ...a, ...overrides[a.id] } : a))
      .filter((a) => a && (a.advertiser_name || a.image_url))

    // Only what is sold. No house tile and no placeholder: below capacity the row
    // simply gets shorter, and at zero the section is not rendered at all --
    // heading, tiles, invitation and all. The unsold presenting slot above is
    // already carrying the one "advertise with us" the edition needs.
    if (list.length === 0) return ''

    const rows: string[] = []
    for (let i = 0; i < list.length; i += 2) {
      const pair = list.slice(i, i + 2)
      // A lone tile on the last row spans both columns rather than sitting beside
      // an empty cell. A grid with a hole in it reads as broken.
      const cells =
        pair.length === 2
          ? pair.map((a) => supporterTile(a, block.id, editionDate, 1)).join('')
          : supporterTile(pair[0], block.id, editionDate, 2)
      rows.push(`<tr>${cells}</tr>`)
    }

    const heading = escapeHtml(block.heading || 'Supported this week by')
    const subject = encodeURIComponent(`Supporting the What's On Guide`)

    return `
  <tr><td align="center" style="padding:34px 24px 0 24px;background-color:${C.page};">
    ${eyebrow(heading, C.muted, editAttr(block.id, 'heading'))}
  </td></tr>
  <tr><td style="padding:14px 18px 0 18px;background-color:${C.page};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:6px;">
      ${rows.join('')}
    </table>
  </td></tr>
  <tr><td align="center" style="padding:16px 24px 4px 24px;background-color:${C.page};">
    <a href="mailto:${B.newsEmail}?subject=${subject}" style="font-family:${F.body};font-size:14px;line-height:44px;color:${C.pinkText};text-decoration:underline;">Want to feature your business?</a>
  </td></tr>`
  }

  // ---------- Footer ----------

  function renderFooterBlock(block: FooterBlock): string {
    if (!block.enabled) return ''
    const cicText = escapeHtml(block.cicText || 'GPC CIC no. 16387545 · SE10 9JT London')
    const unsubscribeLabel = escapeHtml(block.unsubscribeLabel || 'No longer live in Greenwich?')
    // EmailOctopus's merge tag by default. The capitalisation is exact -- the tag
    // is {{UnsubscribeURL}}, and EmailOctopus REFUSES to send a campaign whose
    // HTML does not contain it, so a typo here is a blocked send rather than a
    // silent one.
    //
    // Was Brevo's '{{ unsubscribe }}' until the subscriber list moved to
    // EmailOctopus on 2026-09-11; before that the renderer shipped a literal
    // "#", so the unsubscribe link in every sent edition went nowhere -- which
    // is a legal problem, not a cosmetic one. Two ESP moves, two chances to
    // ship a dead unsubscribe link, which is why this stays configurable: a
    // wrong tag can be corrected from the draft config without a deploy.
    const unsubscribeUrl = escapeHtml(block.unsubscribeUrl || '{{UnsubscribeURL}}')
    return `
  <tr><td style="padding:18px 0 0 0;background-color:${C.page};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.footer}" style="background-color:${C.footer};border-collapse:collapse;">
      <tr><td align="center" style="padding:28px 32px 30px 32px;font-family:${F.body};font-size:13px;line-height:22px;color:rgba(255,255,255,.6);text-align:center;">
        <div style="font-family:${F.heading};font-weight:700;font-size:15px;line-height:22px;color:#ffffff;padding-bottom:10px;">Greenwich Parents &amp; Carers</div>
        <div${editAttr(block.id, 'cicText')}>${cicText}</div>
        <div><a href="${B.instagramUrl}" target="_blank" style="color:#ffffff;text-decoration:none;font-weight:700;line-height:44px;">${escapeHtml(B.instagramHandle)}</a></div>
        <div style="padding-bottom:8px;"><a href="${B.websiteUrl}" target="_blank" style="color:rgba(255,255,255,.6);text-decoration:underline;">www.gpccommunity.co.uk</a></div>
        <div style="font-size:12px;line-height:18px;">While we try to ensure accuracy, we take no responsibility for the information above. Please check before travelling.</div>
        <div><span${editAttr(block.id, 'unsubscribeLabel')}>${unsubscribeLabel}</span> <a href="${unsubscribeUrl}" style="color:rgba(255,255,255,.6);text-decoration:underline;line-height:36px;">Unsubscribe</a></div>
      </td></tr>
    </table>
  </td></tr>`
  }

  // ---------- Free-form blocks ----------

  function renderTextBlock(block: TextBlock): string {
    if (!block.enabled) return ''
    const align = block.align === 'center' ? 'center' : 'left'
    const bg = block.bgColor || C.page
    return `
  <tr><td style="padding:12px 24px;background-color:${bg};">
    <div style="font-family:${F.body};font-size:15px;line-height:1.6;color:${C.body};text-align:${align};"${editAttr(block.id, 'htmlContent')}>${block.htmlContent || ''}</div>
  </td></tr>`
  }

  function renderImageBlock(block: ImageBlock): string {
    if (!block.enabled || !block.imageUrl) return ''
    const width = block.align === 'full' ? 552 : 400
    const align = block.align === 'left' ? 'left' : 'center'
    const img = `<img src="${escapeHtml(block.imageUrl)}" width="${width}" alt="${escapeHtml(block.caption || '')}" style="display:block;width:100%;max-width:${width}px;height:auto;border:0;outline:none;text-decoration:none;border-radius:12px;margin:${align === 'center' ? '0 auto' : '0'};"${editAttr(block.id, 'imageUrl')}>`
    return `
  <tr><td align="${align}" style="padding:12px 24px;background-color:${C.page};">
    ${block.linkUrl ? `<a href="${escapeHtml(block.linkUrl)}" target="_blank" style="text-decoration:none;">${img}</a>` : img}
    ${block.caption ? `<div style="font-family:${F.body};font-size:13px;line-height:1.4;color:${C.muted};font-style:italic;padding-top:8px;text-align:${align};"${editAttr(block.id, 'caption')}>${escapeHtml(block.caption)}</div>` : ''}
  </td></tr>`
  }

  function renderCtaBlock(block: CtaBlock): string {
    if (!block.enabled || !block.label) return ''
    const bg = block.bgColor || C.pink
    const fg = block.textColor || '#ffffff'
    const align = block.align === 'left' ? 'left' : 'center'
    const url = escapeHtml(block.url || '#')
    const label = escapeHtml(block.label)
    return `
  <tr><td align="${align}" style="padding:16px 24px;background-color:${C.page};">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="v-text-anchor:middle;width:200px;height:46px;" arcsize="50%" stroke="f" fillcolor="${bg}">
      <w:anchorlock/>
      <center style="color:${fg};font-family:arial,sans-serif;font-size:15px;font-weight:bold;">${label}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-- -->
    <a href="${url}" target="_blank" style="display:inline-block;background-color:${bg};color:${fg};font-family:${F.body};font-size:15px;font-weight:700;text-decoration:none;padding:13px 26px;border-radius:9999px;mso-hide:all;"${editAttr(block.id, 'label')}>${label}</a>
    <!--<![endif]-->
  </td></tr>`
  }

  function renderDividerBlock(block: DividerBlock): string {
    if (!block.enabled) return ''
    const style = block.style === 'dotted' ? 'dotted' : 'solid'
    const color = block.color || C.hairline
    return `
  <tr><td style="padding:8px 24px;background-color:${C.page};">
    <div style="border-top:1px ${style} ${color};height:0;line-height:0;font-size:0;">&nbsp;</div>
  </td></tr>`
  }

  // ---------- Dispatch and shell ----------

  function renderBlock(block: Block, metadata: NewsletterMetadata, resolved: ResolvedData): string {
    switch (block.type) {
      case 'masthead':
        return renderMastheadBlock(block, metadata)
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
        return renderPresentingBlock(block, advertiser, metadata.weekOf)
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
        // Manual mode names the businesses and their order; auto takes every logo
        // booked for the week. Either way it is a list -- the block used to hold
        // one advertiser, so a week that sold four showed one.
        const advertisers =
          block.mode === 'manual' && block.advertiserIds
            ? block.advertiserIds
                .map((id) => resolved.advertisers[id])
                .filter((a): a is AdvertiserData => Boolean(a))
            : resolved.autoAdvertisersByBlockId[block.id] || []
        return renderSupporterBlock(block, advertisers, metadata.weekOf)
      }
      case 'editionCta':
        return renderEditionCtaBlock(block, metadata, resolved)
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
    const sections = config.blocks
      .map((block) => renderBlock(block, config.metadata, resolved))
      .join('')

    // The inbox preview line. An explicit preheader wins; otherwise the intro is
    // borrowed, which is what the old renderer always did. Neither is allowed to
    // be empty, or the client fills the space with whatever markup comes first.
    const introBlock = config.blocks.find((b): b is IntroBlock => b.type === 'intro' && b.enabled)
    const count = Number.isInteger(resolved?.editionEventCount) ? resolved.editionEventCount : 0
    const fallback = count > 0
      ? `${count} things to do with the children this week.`
      : "This week's guide to what's on for families in Greenwich."
    const preheader = escapeHtml(
      config.metadata.preheader || introBlock?.message || fallback
    ).slice(0, 140)

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
  a { color: ${C.pinkText}; }
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
    renderPresentingHouseAd,
    renderEditionCtaBlock,
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
