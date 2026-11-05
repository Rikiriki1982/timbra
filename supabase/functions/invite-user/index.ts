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

    // eliminazione di un utente (con o senza storico)
    if (b.action === 'delete') {
      const id = String(b.id ?? '')
      if (!id || id === user.id) return json({ error: 'Non puoi eliminare te stesso' }, 400)
      const { data: t } = await admin.from('profiles').select('id,role,name,email').eq('id', id).maybeSingle()
      if (!t) return json({ error: 'Utente non trovato' }, 404)
      if (t.role === 'super') return json({ error: 'Il Proprietario non si può eliminare' }, 403)
      if (me.role === 'admin' && t.role !== 'user') return json({ error: 'Permesso negato' }, 403)
      const keep = b.keepHistory === true

      await admin.from('profiles').update({ invited_by: null }).eq('invited_by', id)
      const { error: de } = await admin.auth.admin.deleteUser(id)   // elimina anche il profilo e le sue notifiche
      if (de) return json({ error: de.message }, 400)

      if (keep) {
        // lo storico resta (giorni, richieste, ticket) e il nome viene ricordato come "ex"
        await admin.from('docs').upsert({ coll: 'ex', id, data: { name: t.name, email: t.email, deleted: Date.now(), by: user.id } })
      } else {
        await admin.from('docs').delete().in('coll', ['days', 'reqs', 'tix']).eq('data->>uid', id)
      }
      // toglie l'utente dai ticket assegnati e dai gruppi
      const { data: tx } = await admin.from('docs').select('id,data').eq('coll', 'tix').contains('data', { assignees: [id] })
      for (const r of tx ?? []) {
        const d = r.data as Record<string, unknown>
        await admin.from('docs').update({ data: {
          ...d,
          assignees: ((d.assignees as string[]) ?? []).filter((x) => x !== id),
          assignUsers: ((d.assignUsers as string[]) ?? []).filter((x) => x !== id),
        } }).eq('coll', 'tix').eq('id', r.id)
      }
      const { data: gs } = await admin.from('docs').select('id,data').eq('coll', 'groups')
      for (const r of gs ?? []) {
        const d = r.data as Record<string, unknown>
        const m = (d.members as string[]) ?? []
        if (m.includes(id)) await admin.from('docs').update({ data: { ...d, members: m.filter((x) => x !== id) } }).eq('coll', 'groups').eq('id', r.id)
      }
      return json({ ok: true })
    }
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
