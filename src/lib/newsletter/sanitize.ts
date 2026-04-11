// Minimal HTML sanitiser for text-block rich-text content.
// Accepts only a small allowlist of tags/attrs so the result is email-safe.
//
// Allowed tags: strong, em, b, i, u, a, span, br, p
// Allowed attrs: href (on a, + target="_blank" injected), style (on span, only `color`)
//
// Anything else is stripped. Plain text within stripped elements is preserved.

const ALLOWED_TAGS = new Set(['strong', 'em', 'b', 'i', 'u', 'a', 'span', 'br', 'p'])

function sanitizeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtmlText(node.textContent || '')
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as Element
  const tag = el.tagName.toLowerCase()

  if (!ALLOWED_TAGS.has(tag)) {
    // Strip the tag but keep children
    let out = ''
    el.childNodes.forEach((c) => (out += sanitizeNode(c)))
    return out
  }

  // Normalise b/i to strong/em
  const outTag = tag === 'b' ? 'strong' : tag === 'i' ? 'em' : tag

  // Process attributes
  const attrs: string[] = []
  if (outTag === 'a') {
    const href = el.getAttribute('href') || ''
    if (href && /^(https?:|mailto:|#)/.test(href)) {
      attrs.push(`href="${escapeAttr(href)}"`)
      attrs.push('target="_blank"')
      attrs.push('rel="noopener noreferrer"')
    }
  } else if (outTag === 'span') {
    const style = el.getAttribute('style') || ''
    // Only allow `color: <value>;` declarations
    const colorMatch = style.match(/color\s*:\s*([^;]+)/i)
    if (colorMatch) {
      const color = colorMatch[1].trim()
      if (/^(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|[a-z]+)$/.test(color)) {
        attrs.push(`style="color:${escapeAttr(color)};"`)
      }
    }
  }

  // Void elements
  if (outTag === 'br') {
    return '<br>'
  }

  let inner = ''
  el.childNodes.forEach((c) => (inner += sanitizeNode(c)))

  const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : ''
  return `<${outTag}${attrStr}>${inner}</${outTag}>`
}

function escapeHtmlText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

export function sanitizeHtml(input: string): string {
  if (typeof DOMParser === 'undefined') return '' // SSR-safe no-op
  const doc = new DOMParser().parseFromString(`<div>${input}</div>`, 'text/html')
  const root = doc.body.firstChild
  if (!root) return ''
  let out = ''
  root.childNodes.forEach((c) => (out += sanitizeNode(c)))
  return out
}
