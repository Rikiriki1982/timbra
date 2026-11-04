// Edge Function "invite-user": invita un dipendente con le funzioni native di Supabase.
// Solo Proprietario e Admin possono chiamarla. La chiave di servizio resta qui sul server, mai nell'app.
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

    // chi sta chiamando?
    const caller = createClient(url, anon, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
    const { data: { user } } = await caller.auth.getUser()
    if (!user) return json({ error: 'Non autenticato' }, 401)
    const admin = createClient(url, svc)
    const { data: me } = await admin.from('profiles').select('role,active').eq('id', user.id).single()
    if (!me || !me.active || !['admin', 'super'].includes(me.role)) return json({ error: 'Permesso negato' }, 403)

    const b = await req.json()
    const email = String(b.email ?? '').trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: 'Email non valida' }, 400)
    const role = b.role === 'admin' ? 'admin' : 'user'
    if (role === 'admin' && me.role !== 'super') return json({ error: 'Solo il Proprietario può invitare un Admin' }, 403)
    const redirectTo = String(b.redirectTo ?? '')

    // utente già presente: nuovo link per impostare/reimpostare la password
    const { data: ex } = await admin.from('profiles').select('id,role').eq('email', email).maybeSingle()
    if (ex) {
      if (me.role === 'admin' && ex.role !== 'user') return json({ error: 'Permesso negato' }, 403)
      const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo } })
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true, existing: true, link: data.properties.action_link })
    }

    const name = String(b.name ?? '').trim()
    let id: string
    let link: string | undefined
    if (b.mode === 'email') {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { name }, redirectTo })
      if (error) return json({ error: error.message }, 400)
      id = data.user.id
    } else {
      const { data, error } = await admin.auth.admin.generateLink({ type: 'invite', email, options: { data: { name }, redirectTo } })
      if (error) return json({ error: error.message }, 400)
      id = data.user.id
      link = data.properties.action_link
    }

    // profilo già configurato con ruolo e permessi scelti
    const { error: pe } = await admin.from('profiles').upsert({
      id, email, name, role,
      can_punch: b.canPunch !== false,
      can_edit_past: b.canEditPast === true,
      can_request: b.canRequest !== false,
      invited_by: user.id,
    }, { onConflict: 'id' })
    if (pe) return json({ error: pe.message }, 400)
    return json({ ok: true, link })
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500)
  }
})
