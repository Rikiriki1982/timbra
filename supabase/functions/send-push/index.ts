// Edge Function "send-push": invia le notifiche push ai dispositivi registrati.
// La chiama solo il database (con un segreto condiviso), mai l'app: per questo non richiede il JWT.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: true })
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: rows } = await admin.from('push_config').select('k,v')
    const c: Record<string, string> = Object.fromEntries((rows ?? []).map((r) => [r.k, r.v]))
    if (!c.secret || req.headers.get('x-push-secret') !== c.secret) return json({ error: 'non autorizzato' }, 401)
    if (!c.vapid_public || !c.vapid_private) return json({ error: 'chiavi VAPID mancanti' }, 500)

    const b = await req.json()
    const ids = new Set<string>(Array.isArray(b.users) ? b.users : [])
    if (b.admins) {
      const { data } = await admin.from('profiles').select('id').in('role', ['admin', 'super']).eq('active', true)
      for (const r of data ?? []) ids.add(r.id)
    }
    if (b.exclude) ids.delete(b.exclude)
    if (!ids.size) return json({ sent: 0 })

    const { data: subs } = await admin.from('push_subs').select('id,endpoint,p256dh,auth').in('user_id', [...ids])
    if (!subs?.length) return json({ sent: 0 })

    webpush.setVapidDetails('mailto:apptimbra@gmail.com', c.vapid_public, c.vapid_private)
    const payload = JSON.stringify({
      title: String(b.title ?? 'Presenze & Ticket Pro').slice(0, 80),
      body: String(b.body ?? '').slice(0, 240),
      tag: b.tag ? String(b.tag) : undefined,
      url: String(b.url ?? './'),
    })
    let sent = 0
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600, urgency: 'high' })
        sent++
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) await admin.from('push_subs').delete().eq('id', s.id)   // dispositivo non più valido
      }
    }))
    return json({ sent, total: subs.length })
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500)
  }
})
