import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Copy, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function NewsletterEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const iframeRef = useRef(null)

  const [draft, setDraft] = useState(null)
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState('preview')

  useEffect(() => {
    document.title = 'Edit Newsletter | GPC Admin'
    loadDraft()
  }, [id])

  async function loadDraft() {
    const { data } = await supabase
      .from('newsletter_drafts')
      .select('*')
      .eq('id', id)
      .single()
    if (data) {
      setDraft(data)
      setHtml(data.content_html || '')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (iframeRef.current && html && mode === 'preview') {
      const doc = iframeRef.current.contentDocument
      doc.open()
      doc.write(html)
      doc.close()
    }
  }, [html, mode])

  async function handleSave() {
    setSaving(true)
    await supabase
      .from('newsletter_drafts')
      .update({ content_html: html, status: 'approved' })
      .eq('id', id)
    setSaving(false)
    navigate('/admin/newsletter')
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(html)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('Failed to copy.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Newsletter not found.</p>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate('/admin/newsletter')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-dark mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Newsletters
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-dark">{draft.title}</h1>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:border-primary/50 transition-colors"
          >
            {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy HTML'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-dark text-white text-sm font-bold hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save & Approve'}
          </button>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        <button
          onClick={() => setMode('preview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'preview' ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:text-dark'
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setMode('edit')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'edit' ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:text-dark'
          }`}
        >
          Edit HTML
        </button>
      </div>

      {mode === 'preview' ? (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <iframe
            ref={iframeRef}
            title="Newsletter Preview"
            className="w-full border-0"
            style={{ minHeight: '80vh' }}
            sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      ) : (
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          className="w-full h-[80vh] px-4 py-3 rounded-2xl border border-gray-200 font-mono text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      )}
    </div>
  )
}
