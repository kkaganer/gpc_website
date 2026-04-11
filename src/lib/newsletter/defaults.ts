// Default NewsletterConfig factory — mirrors the shape the edge function's
// legacy fallback constructs, so a brand-new editor session looks identical
// to what the "Generate newsletter" button produced before.

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
      { id: uid(), type: 'subscribe', enabled: true, label: 'Subscribe', url: '' },
      { id: uid(), type: 'intro', enabled: true, message: '', signature: '- Aster' },
      { id: uid(), type: 'featured', enabled: true, mode: 'auto' },
      {
        id: uid(),
        type: 'eventSection',
        enabled: true,
        title: 'This Week',
        mode: 'auto',
        filter: { source: 'london_events', dateFrom: 0, dateTo: 7, areas: 'se-london' },
        gotNewsFooter: true,
      },
      { id: uid(), type: 'presenting', enabled: true, mode: 'auto' },
      {
        id: uid(),
        type: 'eventSection',
        enabled: true,
        title: 'Coming up',
        mode: 'auto',
        filter: { source: 'london_events', dateFrom: 8, dateTo: 21, areas: 'se-london' },
      },
      { id: uid(), type: 'donationStrip', enabled: true },
      {
        id: uid(),
        type: 'eventSection',
        enabled: true,
        title: 'Further to travel',
        mode: 'auto',
        filter: { source: 'london_events', dateFrom: 0, dateTo: 21, areas: 'outside-se-london' },
      },
      { id: uid(), type: 'regulars', enabled: true, mode: 'auto' },
      { id: uid(), type: 'supporter', enabled: true, mode: 'auto' },
      { id: uid(), type: 'footer', enabled: true },
    ],
  }
}

export { uid }
