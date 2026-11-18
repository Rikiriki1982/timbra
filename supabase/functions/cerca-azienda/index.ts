// Edge Function "cerca-azienda": dal nome di un'azienda o di un ente trova partita IVA, sede e (se disponibili) PEC e codice SDI.
// Possono usarla solo Proprietario e Admin.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { lookup } from './lookup.ts'

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
    const { data: me } = await createClient(url, svc).from('profiles').select('role,active').eq('id', user.id).single()
    if (!me || !me.active || !['admin', 'super'].includes(me.role)) return json({ error: 'Permesso negato' }, 403)

    const { q } = await req.json().catch(() => ({ q: '' }))
    if (typeof q !== 'string' || q.trim().length < 3) return json({ error: 'Scrivi almeno 3 lettere del nome' }, 400)
    return json(await lookup(q))
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500)
  }
})
