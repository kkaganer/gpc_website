import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useEvents } from '../../hooks/useEvents'
import { deleteEvent } from '../../hooks/useEventMutations'
import Badge from '../../components/ui/Badge'
import ConfirmModal from '../../components/admin/ConfirmModal'

export default function EventsManager() {
  const { events, loading, error } = useEvents()
  const [deleting, setDeleting] = useState(null)
  const [list, setList] = useState([])

  useEffect(() => {
    document.title = 'Manage Events | GPC Admin'
  }, [])

  useEffect(() => {
    setList(events)
  }, [events])

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteEvent(deleting)
      setList((prev) => prev.filter((e) => e.id !== deleting))
    } catch (err) {
      alert('Failed to delete event.')
    }
    setDeleting(null)
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
          <h1 className="font-heading text-2xl font-bold text-dark">Events</h1>
          <p className="text-gray-500 text-sm mt-1">Manage GPC community events</p>
        </div>
        <Link
          to="/admin/events/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-dark text-white text-sm font-bold hover:scale-[1.02] transition-transform"
        >
          <Plus size={18} />
          New Event
        </Link>
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
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Status</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((event) => (
                <tr key={event.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {event.image_url && (
                        <img src={event.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="font-semibold text-dark">{event.title}</p>
                        <p className="text-gray-400 text-xs">{event.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(event.date)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={event.status}>
                      {event.status === 'sold-out' ? 'Sold Out' : event.status === 'upcoming' ? 'Upcoming' : 'Past'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/events/${event.id}/edit`}
                        className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => setDeleting(event.id)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    No events yet. Create your first event!
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
          message="Are you sure you want to delete this event? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
