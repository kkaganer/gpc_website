import { useState, useEffect } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { fetchAdminUsers, createAdminUser, deleteAdminUser } from '../../lib/adminApi'
import ConfirmModal from '../../components/admin/ConfirmModal'

export default function UsersManager() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    document.title = 'Users | GPC Admin'
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminUsers()
      setUsers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteAdminUser(deleting)
      setDeleting(null)
      loadUsers()
    } catch (err) {
      setError(err.message)
      setDeleting(null)
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-dark">Users</h1>
          <p className="text-gray-500 text-sm mt-1">Manage admin users who can access this portal</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-dark text-white text-sm font-bold hover:scale-[1.02] transition-transform"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

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
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Email</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Created</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Last Sign In</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-500 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-dark">{u.email}</p>
                    {u.id === currentUser?.id && (
                      <span className="text-xs text-primary font-medium">You</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(u.created_at)}</td>
                  <td className="px-6 py-4 text-gray-600">{formatDateTime(u.last_sign_in_at)}</td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => setDeleting(u.id)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {deleting && (
        <ConfirmModal
          title="Delete User"
          message="Are you sure you want to remove this user? They will no longer be able to log in to the admin portal."
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false)
            loadUsers()
          }}
        />
      )}
    </div>
  )
}

function AddUserModal({ onClose, onCreated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await createAdminUser(email, password)
      onCreated()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-dark">Add New User</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-dark mb-1">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-dark mb-1">Temporary Password *</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-gray-400 mt-1">
              The user can reset their password from the login page.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-dark text-white text-sm font-bold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
