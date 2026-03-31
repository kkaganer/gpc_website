import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ConfirmModal from '../../components/admin/ConfirmModal'

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
        <Link
          to="/admin/newsletter-advertisers/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-dark text-white text-sm font-bold hover:scale-[1.02] transition-transform"
        >
          <Plus size={18} />
          Add Advertiser
        </Link>
      </div>

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
    </div>
  )
}
