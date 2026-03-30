import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body
  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  // Save to Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { error: dbError } = await supabase
    .from('newsletter_subscribers')
    .insert({ email })

  // Ignore duplicate email errors (23505)
  if (dbError && dbError.code !== '23505') {
    console.error('Database error:', dbError)
    return res.status(500).json({ error: 'Failed to save subscriber' })
  }

  // Add to Brevo
  const brevoKey = process.env.BREVO_API_KEY
  if (brevoKey) {
    try {
      const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': brevoKey,
        },
        body: JSON.stringify({
          email,
          updateEnabled: true,
        }),
      })

      if (!brevoRes.ok) {
        const brevoData = await brevoRes.json()
        if (brevoData.code !== 'duplicate_parameter') {
          console.error('Brevo error:', brevoData)
        }
      }
    } catch (err) {
      console.error('Brevo request failed:', err)
    }
  }

  return res.status(200).json({ success: true })
}
