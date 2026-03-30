import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Save to Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: dbError } = await supabase
      .from('newsletter_subscribers')
      .insert({ email })

    // Ignore duplicate email errors (23505)
    if (dbError && dbError.code !== '23505') {
      throw new Error(`Database error: ${dbError.message}`)
    }

    // Add to Brevo
    const brevoKey = Deno.env.get('BREVO_API_KEY')
    if (!brevoKey) {
      throw new Error('BREVO_API_KEY is not configured')
    }

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

    // Brevo returns 201 for new contact, 204 for updated
    if (!brevoRes.ok) {
      const brevoData = await brevoRes.json()
      // "Contact already exist" is fine
      if (brevoData.code !== 'duplicate_parameter') {
        console.error('Brevo error:', brevoData)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Subscribe error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
