// Default NewsletterConfig factory.
//
// MIRROR: makeDefaultConfig in supabase/functions/generate-newsletter/index.ts
// builds the identical block sequence. Change both together, or a draft opened in
// the editor will not match the one the Generate button produced.
//
// The default edition is short on purpose: one paid placement, five picks and a
// button through to the week's page on the site. The long-form blocks -- the
// dated sections, the regulars list, the donation strip, the subscribe pill --
// are all still available in the editor's Add block menu; they are simply not
// what an ordinary week is made of any more.

import type { NewsletterConfig } from '../../../supabase/functions/_shared/newsletter-renderer'
import { formatDateLong } from '../../../supabase/functions/_shared/newsletter-renderer'

function uid(): string {
  return 'b_' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
}

export function defaultConfig(weekOfIso: string): NewsletterConfig {
  const todayIso = new Date().toISOString().split('T')[0]
  return {
    version: 2,
    theme: {},
    metadata: {
      todayLong: formatDateLong(todayIso),
      weekOf: weekOfIso,
    },
    blocks: [
      { id: uid(), type: 'masthead', enabled: true },
      { id: uid(), type: 'intro', enabled: true, message: '', signature: '— Aster' },
      // Above the picks: the paid slot is the first thing after the welcome, and
      // unsold it becomes GPC's own invitation at the same size.
      { id: uid(), type: 'presenting', enabled: true, mode: 'auto' },
      {
        id: uid(),
        type: 'eventSection',
        enabled: true,
        title: "This week's picks",
        layout: 'picks',
        limit: 5,
        mode: 'auto',
        filter: { source: 'london_events', dateFrom: 0, dateTo: 7, areas: 'se-london' },
      },
      { id: uid(), type: 'editionCta', enabled: true },
      { id: uid(), type: 'featured', enabled: true, mode: 'auto' },
      { id: uid(), type: 'supporter', enabled: true, mode: 'auto' },
      { id: uid(), type: 'footer', enabled: true },
    ],
  }
}

export { uid }
