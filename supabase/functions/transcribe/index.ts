// Edge Function "transcribe": trascrive un vocale (es. da WhatsApp) in testo italiano.
// Può chiamarla ogni utente attivo. La chiave del servizio (GROQ_API_KEY) resta qui sul server, mai nell'app.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const svc = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const caller = createClient(url, anon, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
    const { data: { user } } = await caller.auth.getUser()
    if (!user) return json({ error: 'Non autenticato' }, 401)
    const { data: me } = await createClient(url, svc).from('profiles').select('active').eq('id', user.id).single()
    if (!me || !me.active) return json({ error: 'Permesso negato' }, 403)

    const key = Deno.env.get('GROQ_API_KEY')
    if (!key) return json({ error: 'Trascrizione non ancora attivata: manca la chiave del servizio.' }, 501)

    const fd = await req.formData()
    const f = fd.get('file')
    if (!(f instanceof File) || f.size === 0) return json({ error: 'Nessun file audio' }, 400)
    if (f.size > 20 * 1024 * 1024) return json({ error: 'Vocale troppo lungo (massimo 20 MB)' }, 413)

    const t = (f.type || '').toLowerCase(), n = (f.name || '').toLowerCase()
    const ext = /ogg|opus/.test(t) || /\.(ogg|opus)$/.test(n) ? 'ogg'
      : /mpeg|mp3/.test(t) || n.endsWith('.mp3') ? 'mp3'
      : /mp4|m4a|aac/.test(t) || /\.(m4a|mp4|aac)$/.test(n) ? 'm4a'
      : /wav/.test(t) || n.endsWith('.wav') ? 'wav'
      : /webm/.test(t) || n.endsWith('.webm') ? 'webm'
      : /flac/.test(t) || n.endsWith('.flac') ? 'flac' : 'ogg'

    const out = new FormData()
    out.append('file', new File([await f.arrayBuffer()], 'vocale.' + ext, { type: 'audio/' + ext }))
    out.append('model', 'whisper-large-v3')
    out.append('language', 'it')
    out.append('response_format', 'json')
    out.append('temperature', '0')
    const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST', headers: { Authorization: 'Bearer ' + key }, body: out,
    })
    if (!r.ok) {
      const msg = (await r.text()).slice(0, 200)
      return json({ error: r.status === 429 ? 'Troppe richieste di trascrizione: riprova tra un minuto.' : 'Servizio di trascrizione: ' + msg }, 502)
    }
    const j = await r.json()
    return json({ text: String(j.text ?? '').trim() })
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500)
  }
})
