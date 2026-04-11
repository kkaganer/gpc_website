import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Plus, Check, X, Pencil, Trash2, Sparkles } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAllLondonEvents } from '../../hooks/useLondonEvents'
import ConfirmModal from '../../components/ui/ConfirmModal'

export default function LondonEventsManager() {
  const { events, loading, error, refetch } = useAllLondonEvents()
  const [tab, setTab] = useState('pending')
  const [deleting, setDeleting] = useState(null)
  const [discovering, setDiscovering] = useState(false)
  const [discoverError, setDiscoverError] = useState('')

  useEffect(() => {
    document.title = "What's On Manager | GPC Admin"
  }, [])

  const pending = events.filter((e) => !e.approved)
  const approved = events.filter((e) => e.approved)
  const displayed = tab === 'pending' ? pending : approved

  async function handleApprove(id) {
    await supabase.from('london_events').update({ approved: true }).eq('id', id)
    refetch()
  }

  async function handleReject(id) {
    await supabase.from('london_events').delete().eq('id', id)
    refetch()
  }

  async function handleDelete() {
    if (!deleting) return
    await supabase.from('london_events').delete().eq('id', deleting)
    setDeleting(null)
    refetch()
  }

  async function handleDiscover() {
    setDiscovering(true)
    setDiscoverError('')
    try {
      const { data, error: fnError } = await supabase.functions.invoke('discover-events')
      if (fnError) throw fnError
      refetch()
    } catch (err) {
      setDiscoverError('Failed to discover events. Make sure the edge function is deployed and the OPENAI_API_KEY secret is configured in Supabase.')
    } finally {
      setDiscovering(false)
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-dark">What's On in London</h1>
          <p className="text-gray-500 text-sm mt-1">Manage London-wide family events</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDiscover}
            disabled={discovering}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            <Sparkles size={18} />
            {discovering ? 'Discovering...' : 'Discover Events'}
          </button>
          <Link
            to="/admin/whats-on/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-dark text-white text-sm font-bold hover:scale-[1.02] transition-transform"
          >
            <Plus size={18} />
            Add Manually
          </Link>
        </div>
      </div>

      {discoverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
          {discoverError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'pending' ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:text-dark'
          }`}
        >
          Pending ({pending.length})
        </button>
        <button
          onClick={() => setTab('approved')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'approved' ? 'bg-white shadow-sm text-dark' : 'text-gray-500 hover:text-dark'
          }`}
        >
          Approved ({approved.length})
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Event</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Date</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Area</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Source</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((event) => (
                <tr key={event.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-dark">{event.title}</p>
                    <p className="text-gray-400 text-xs">{event.location}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(event.date)}</td>
                  <td className="px-6 py-4 text-gray-600">{event.area || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      event.source === 'perplexity' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {event.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!event.approved && (
                        <button
                          onClick={() => handleApprove(event.id)}
                          className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <Link
                        to={`/admin/whats-on/${event.id}/edit`}
                        className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </Link>
                      {tab === 'pending' ? (
                        <button
                          onClick={() => handleReject(event.id)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Reject"
                        >
                          <X size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setDeleting(event.id)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    {tab === 'pending'
                      ? 'No pending events. Use "Discover Events" to find London events with AI.'
                      : 'No approved events yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {deleting && (
        <ConfirmModal
          title="Delete Event"
          message="Are you sure you want to remove this event?"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
