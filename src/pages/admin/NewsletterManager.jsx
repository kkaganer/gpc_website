import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Sparkles, Eye, Copy, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function NewsletterManager() {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    document.title = 'Newsletter | GPC Admin'
    fetchDrafts()
  }, [])

  async function fetchDrafts() {
    setLoading(true)
    const { data } = await supabase
      .from('newsletter_drafts')
      .select('*')
      .order('created_at', { ascending: false })
    setDrafts(data || [])
    setLoading(false)
  }

  async function handleGenerate() {
    setGenerating(true)
    setGenError('')
    try {
      const { error } = await supabase.functions.invoke('generate-newsletter')
      if (error) throw error
      await fetchDrafts()
    } catch (err) {
      setGenError('Failed to generate newsletter. Make sure the edge function is deployed and the API key is configured.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopyHtml(draft) {
    try {
      await navigator.clipboard.writeText(draft.content_html)
      setCopied(draft.id)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      alert('Failed to copy. Please try again.')
    }
  }

  async function handleMarkSent(id) {
    await supabase
      .from('newsletter_drafts')
      .update({ status: 'sent' })
      .eq('id', id)
    fetchDrafts()
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const statusColors = {
    draft: 'bg-amber-50 text-amber-600',
    approved: 'bg-blue-50 text-blue-600',
    sent: 'bg-green-50 text-green-600',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-dark">Newsletter</h1>
          <p className="text-gray-500 text-sm mt-1">Generate and manage weekly newsletters</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-dark text-white text-sm font-bold hover:scale-[1.02] transition-transform disabled:opacity-50"
        >
          <Sparkles size={18} />
          {generating ? 'Generating...' : "Generate This Week's Newsletter"}
        </button>
      </div>

      {genError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
          {genError}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && drafts.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <p className="text-gray-500">No newsletters yet. Click "Generate" to create your first one.</p>
        </div>
      )}

      {!loading && drafts.length > 0 && (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <div key={draft.id} className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-heading font-bold text-dark">{draft.title}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[draft.status]}`}>
                    {draft.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  Week of {formatDate(draft.week_of)} &middot; Created {formatDate(draft.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/newsletter/${draft.id}/edit`}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <Eye size={16} />
                  Preview
                </Link>
                <button
                  onClick={() => handleCopyHtml(draft)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                >
                  {copied === draft.id ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                  {copied === draft.id ? 'Copied!' : 'Copy HTML'}
                </button>
                {draft.status !== 'sent' && (
                  <button
                    onClick={() => handleMarkSent(draft.id)}
                    className="px-3 py-2 text-sm font-semibold text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    Mark as Sent
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
