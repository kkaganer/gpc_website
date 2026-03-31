import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Verify the caller is authenticated
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !caller) {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }

  // GET — list all users
  if (req.method === 'GET') {
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 100 })
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    return res.status(200).json({ users: data.users })
  }

  // POST — create a new user or send invite
  if (req.method === 'POST') {
    const { email, password, invite } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    if (invite) {
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email)
      if (error) {
        return res.status(400).json({ error: error.message })
      }
      return res.status(201).json({ user: data.user })
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error) {
      return res.status(400).json({ error: error.message })
    }
    return res.status(201).json({ user: data.user })
  }

  // DELETE — remove a user
  if (req.method === 'DELETE') {
    const { userId } = req.body
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }
    if (userId === caller.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' })
    }

    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
      return res.status(400).json({ error: error.message })
    }
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
