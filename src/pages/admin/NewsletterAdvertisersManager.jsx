import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Plus, Pencil, Trash2, Mail, Sparkles } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ConfirmModal from '../../components/ui/ConfirmModal'

const statusColors = {
  pending: 'bg-amber-50 text-amber-600',
  confirmed: 'bg-blue-50 text-blue-600',
  included: 'bg-pink-50 text-pink-600',
  completed: 'bg-green-50 text-green-600',
}

const adTypeLabels = {
  'free-listing': 'Free Listing',
  'featured-ad': 'Featured Ad',
  'logo-sponsor': 'Logo Sponsor',
}

export default function NewsletterAdvertisersManager() {
  const [advertisers, setAdvertisers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [filterDate, setFilterDate] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailText, setEmailText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const [parseResult, setParseResult] = useState(null)

  useEffect(() => {
    document.title = 'Newsletter Advertisers | GPC Admin'
    fetchAdvertisers()
  }, [])

  async function fetchAdvertisers() {
    setLoading(true)
    const { data } = await supabase
      .from('newsletter_advertisers')
      .select('*')
      .order('newsletter_date', { ascending: true })
    setAdvertisers(data || [])
    setLoading(false)
  }

  async function handleDelete() {
    if (!deleting) return
    await supabase.from('newsletter_advertisers').delete().eq('id', deleting)
    setDeleting(null)
    fetchAdvertisers()
  }

  async function handleParseEmail() {
    setParsing(true)
    setParseError('')
    setParseResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('parse-advertiser-email', {
        body: { emailText },
      })
      if (error) throw error
      if (!data?.success) throw new Error(data?.error || 'Failed to parse email')
      setParseResult(data)
      setEmailText('')
      setShowEmailModal(false)
      fetchAdvertisers()
    } catch (err) {
      setParseError(err.message || 'Failed to parse email. Make sure the edge function is deployed.')
    } finally {
      setParsing(false)
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Get unique newsletter dates for the filter dropdown
  const uniqueDates = [...new Set(advertisers.map((a) => a.newsletter_date))].sort()

  const filtered = advertisers.filter((a) => {
    if (filterDate && a.newsletter_date !== filterDate) return false
    if (filterStatus && a.status !== filterStatus) return false
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-dark">Newsletter Advertisers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage advertiser bookings for each newsletter</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-primary text-primary text-sm font-bold hover:bg-primary/5 transition-colors"
          >
            <Mail size={18} />
            Parse Email
          </button>
          <Link
            to="/admin/newsletter-advertisers/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-dark text-white text-sm font-bold hover:scale-[1.02] transition-transform"
          >
            <Plus size={18} />
            Add Advertiser
          </Link>
        </div>
      </div>

      {parseResult && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
          <span>Parsed {parseResult.parsed} entries, inserted {parseResult.inserted} as pending.</span>
          <button onClick={() => setParseResult(null)} className="text-green-500 hover:text-green-700 font-bold">Dismiss</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All dates</option>
          {uniqueDates.map((d) => (
            <option key={d} value={d}>{formatDate(d)}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="included">Included</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Advertiser</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Event</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Newsletter Date</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Type</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Status</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ad) => (
                <tr key={ad.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-dark">{ad.advertiser_name}</p>
                    {ad.contact_email && (
                      <p className="text-gray-400 text-xs">{ad.contact_email}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{ad.event_title}</td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(ad.newsletter_date)}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {adTypeLabels[ad.ad_type] || ad.ad_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[ad.status]}`}>
                      {ad.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/admin/newsletter-advertisers/${ad.id}/edit`}
                        className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => setDeleting(ad.id)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No advertisers found. Click "Add Advertiser" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {deleting && (
        <ConfirmModal
          title="Delete Advertiser"
          message="Are you sure you want to remove this advertiser entry?"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !parsing && setShowEmailModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full mx-4">
            <h3 className="font-heading font-bold text-lg text-dark">Parse Advertiser Email</h3>
            <p className="text-gray-500 text-sm mt-1">
              Paste an email from an advertiser and AI will extract the event details as pending entries.
            </p>

            {parseError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mt-4">
                {parseError}
              </div>
            )}

            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              rows={10}
              placeholder="Paste the email content here..."
              className="mt-4 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              disabled={parsing}
            />

            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => { setShowEmailModal(false); setEmailText(''); setParseError('') }}
                disabled={parsing}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-dark rounded-lg border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleParseEmail}
                disabled={parsing || !emailText.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-primary to-dark rounded-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                <Sparkles size={16} />
                {parsing ? 'Parsing...' : 'Parse Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
