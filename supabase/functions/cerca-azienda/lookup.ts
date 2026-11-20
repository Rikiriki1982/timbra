// Ricerca dati azienda/ente dal nome.
//  1) Enti pubblici (Comuni, scuole, ASL...): indice ufficiale IPA (indicepa.gov.it): P.IVA/C.F., indirizzo, PEC, codice SDI.
//  2) Partita IVA digitata: registro europeo VIES (ragione sociale e sede).
//  3) Aziende private: se è configurata una chiave di ricerca web (TAVILY_API_KEY, SERPER_API_KEY, BRAVE_API_KEY oppure GOOGLE_API_KEY + GOOGLE_CX)
//     cerca sul web, trova le partite IVA citate e le verifica su VIES.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const IPA = 'https://indicepa.gov.it/ipa-dati/api/3/action/datastore_search'
const IPA_ENTI = 'd09adf99-dc10-4349-8c53-27b1e5aa97b6'
const IPA_UO = '57bd2be0-4d3d-41cd-bdb8-2f0a60d6f490'

export type Result = {
  nome: string; piva: string; indirizzo: string; pec: string; sdi: string
  fonte: string; punteggio: number; verificata: boolean
}
type Hit = { title: string; url: string; snippet: string }

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
const STOP = new Set(['di', 'del', 'della', 'dei', 'delle', 'il', 'la', 'lo', 'srl', 'spa', 'snc', 'sas', 's', 'r', 'l', 'p', 'a', 'c', 'n', 'e', 'societa', 'unipersonale'])
const toks = (s: string) => norm(s).split(' ').filter((t) => t && !STOP.has(t))
export function similar(q: string, name: string): number {
  const a = toks(q), b = new Set(toks(name))
  if (!a.length || !b.size) return 0
  const hit = a.filter((t) => b.has(t)).length
  const extra = [...b].filter((t) => !a.includes(t)).length
  return Math.max(0, hit / a.length - Math.min(0.3, extra * 0.05))
}
export function pivaOk(p: string): boolean {
  if (!/^\d{11}$/.test(p)) return false
  let s = 0
  for (let i = 0; i < 11; i++) { let d = +p[i]; if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 } s += d }
  return s % 10 === 0
}
const cap = (s: string) => s.toLowerCase().replace(/(^|[\s'.(\-/])([a-zà-ú])/g, (_, a, b) => a + b.toUpperCase())
  .replace(/\bS\.?P\.?A\.?(?=\s|$|,)/gi, 'S.p.A.').replace(/\bS\.?R\.?L\.?(?=\s|$|,)/gi, 'S.r.l.')
  .replace(/\bS\.?N\.?C\.?(?=\s|$|,)/gi, 'S.n.c.').replace(/\bS\.?A\.?S\.?(?=\s|$|,)/gi, 'S.a.s.')
  .replace(/\b[IVXL]{2,}\b/gi, (x) => x.toUpperCase()).replace(/ ([A-Za-z]{2})$/, (_, x) => ' ' + x.toUpperCase())

async function get(url: string, headers: Record<string, string> = {}, ms = 9000): Promise<string> {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'it-IT,it;q=0.9', ...headers }, signal: AbortSignal.timeout(ms) })
  if (!r.ok) throw new Error(url.split('/')[2] + ' ' + r.status)
  return (await r.text()).slice(0, 400000)
}

/* ---------- VIES ---------- */
async function vies(p: string): Promise<{ valid: boolean; name: string; address: string } | null> {
  try {
    const j = JSON.parse(await get('https://ec.europa.eu/taxation_customs/vies/rest-api/ms/IT/vat/' + p, { Accept: 'application/json' }, 8000))
    const ok = (s: unknown) => (s && String(s).trim() && String(s).trim() !== '---' ? String(s).trim() : '')
    return { valid: !!j.isValid, name: ok(j.name), address: ok(j.address).replace(/\s*\n+\s*/g, ', ') }
  } catch { return null }
}

/* ---------- IPA: enti pubblici ---------- */
// deno-lint-ignore no-explicit-any
type Row = Record<string, any>
async function ipa(resource: string, params: Record<string, string>): Promise<Row[]> {
  const u = IPA + '?' + new URLSearchParams({ resource_id: resource, ...params })
  const j = JSON.parse(await get(u, { Accept: 'application/json' }))
  return j?.result?.records ?? []
}
async function fromIpa(q: string): Promise<Result[]> {
  let rows = await ipa(IPA_ENTI, { q, limit: '6' })
  if (!rows.length) { const t = toks(q).join(' '); if (t && t !== norm(q)) rows = await ipa(IPA_ENTI, { q: t, limit: '6' }) }
  const out: Result[] = []
  for (const r of rows) {
    const sim = similar(q, String(r.Denominazione_ente || ''))
    if (sim < 0.5) continue
    const mails: [string, string][] = [1, 2, 3, 4, 5].map((i) => [String(r['Mail' + i] || ''), String(r['Tipo_Mail' + i] || '')])
    const pec = (mails.find(([m, t]) => m && /pec/i.test(t)) || ['', ''])[0]
    let sdi = ''
    try {
      const uo = await ipa(IPA_UO, { filters: JSON.stringify({ Codice_IPA: r.Codice_IPA }), limit: '5' })
      sdi = String((uo.find((x) => /efattura|fattur/i.test(String(x.Descrizione_uo))) || uo[0] || {}).Codice_uni_uo || '')
    } catch { /* il codice SDI è facoltativo */ }
    const den = String(r.Denominazione_ente)
    const citta = (/^comune di\s+(.+)$/i.exec(den) || ['', ''])[1]
    const via = cap(String(r.Indirizzo || ''))
    const cf = String(r.Codice_fiscale_ente || '').replace(/\D/g, '')
    out.push({
      nome: den, piva: cf.length === 11 ? cf : '', pec, sdi,
      indirizzo: [via, [r.CAP, citta ? cap(citta) : ''].filter(Boolean).join(' ')].filter(Boolean).join(', '),
      fonte: 'IPA (indice ufficiale della PA)', punteggio: Math.round(sim * 100) / 100, verificata: true,
    })
  }
  return out
}

/* ---------- ricerca web (solo con chiave) ---------- */
function searchConfigured(): string {
  if (Deno.env.get('TAVILY_API_KEY')) return 'Tavily'
  if (Deno.env.get('SERPER_API_KEY')) return 'Serper'
  if (Deno.env.get('BRAVE_API_KEY')) return 'Brave'
  if (Deno.env.get('GOOGLE_API_KEY') && Deno.env.get('GOOGLE_CX')) return 'Google'
  return ''
}
async function viaTavily(q: string, key: string): Promise<Hit[]> {
  const r = await fetch('https://api.tavily.com/search', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify({ query: q, max_results: 8, search_depth: 'basic', country: 'italy' }), signal: AbortSignal.timeout(12000) })
  if (!r.ok) throw new Error('Tavily HTTP ' + r.status)
  const j = await r.json()
  return (j?.results ?? []).map((x: Row) => ({ title: String(x.title || ''), url: String(x.url || ''), snippet: String(x.content || '') }))
}
async function viaSerper(q: string, key: string): Promise<Hit[]> {
  const r = await fetch('https://google.serper.dev/search', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-KEY': key }, body: JSON.stringify({ q, gl: 'it', hl: 'it', num: 8 }), signal: AbortSignal.timeout(12000) })
  if (!r.ok) throw new Error('Serper HTTP ' + r.status)
  const j = await r.json()
  const kg = j?.knowledgeGraph ? [{ title: String(j.knowledgeGraph.title || ''), url: String(j.knowledgeGraph.website || j.knowledgeGraph.descriptionLink || 'https://www.google.it'), snippet: JSON.stringify(j.knowledgeGraph.attributes || {}) + ' ' + String(j.knowledgeGraph.description || '') }] : []
  return [...kg, ...(j?.organic ?? []).map((x: Row) => ({ title: String(x.title || ''), url: String(x.link || ''), snippet: String(x.snippet || '') }))]
}
async function viaBrave(q: string, key: string): Promise<Hit[]> {
  const j = JSON.parse(await get('https://api.search.brave.com/res/v1/web/search?count=8&country=IT&search_lang=it&q=' + encodeURIComponent(q), { 'X-Subscription-Token': key, Accept: 'application/json' }))
  return (j?.web?.results ?? []).map((x: Row) => ({ title: String(x.title || ''), url: String(x.url || ''), snippet: String(x.description || '') }))
}
async function viaGoogle(q: string, key: string, cx: string): Promise<Hit[]> {
  const j = JSON.parse(await get(`https://www.googleapis.com/customsearch/v1?num=8&gl=it&lr=lang_it&key=${key}&cx=${cx}&q=` + encodeURIComponent(q), { Accept: 'application/json' }))
  return (j?.items ?? []).map((x: Row) => ({ title: String(x.title || ''), url: String(x.link || ''), snippet: String(x.snippet || '') }))
}
// prova i motori nell'ordine Tavily, Serper, Brave, Google: se uno dà errore (ricerche finite, chiave scaduta...) passa al successivo
async function webSearch(q: string): Promise<Hit[]> {
  const env = (k: string) => Deno.env.get(k) || ''
  const list: [string, () => Promise<Hit[]>][] = []
  if (env('TAVILY_API_KEY')) list.push(['Tavily', () => viaTavily(q, env('TAVILY_API_KEY'))])
  if (env('SERPER_API_KEY')) list.push(['Serper', () => viaSerper(q, env('SERPER_API_KEY'))])
  if (env('BRAVE_API_KEY')) list.push(['Brave', () => viaBrave(q, env('BRAVE_API_KEY'))])
  if (env('GOOGLE_API_KEY') && env('GOOGLE_CX')) list.push(['Google', () => viaGoogle(q, env('GOOGLE_API_KEY'), env('GOOGLE_CX'))])
  const errs: string[] = []
  for (const [name, fn] of list) {
    try { const h = await fn(); if (h.length) return h; errs.push(name + ': nessun risultato') } catch (e) { errs.push((e as Error).message || name) }
  }
  throw new Error(errs.join(' → ') || 'nessuna chiave configurata')
}
const strip = (h: string) => h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()

async function fromWeb(q: string): Promise<Result[]> {
  const hits = await webSearch(`"${q}" partita iva sede legale`)
  const pages = await Promise.all(hits.slice(0, 4).map(async (h) => {
    try { return { h, text: strip(await get(h.url, {}, 7000)) } } catch { return { h, text: '' } }
  }))
  const cand = new Map<string, { score: number; title: string; url: string; ctx: string }>()
  const take = (text: string, h: Hit, rank: number, page: boolean) => {
    const re = /(?:p\.?\s?iva|partita\s+iva|vat(?:\s+number)?|c\.?\s?f\.?\s*\/?\s*p\.?\s?iva|codice\s+fiscale|cod\.?\s*fisc\.?)\W{0,25}(?:IT)?\s?(\d{11})\b/gi
    let m
    while ((m = re.exec(text))) {
      if (!pivaOk(m[1])) continue
      const ctx = text.slice(Math.max(0, m.index - 160), m.index + 200)
      const c = cand.get(m[1]) || { score: 0, title: h.title, url: h.url, ctx }
      c.score += (page ? 1 : 2) / (1 + rank * 0.3) + similar(q, h.title + ' ' + ctx) * 2
      cand.set(m[1], c)
    }
  }
  pages.forEach(({ h, text }, i) => { take(h.title + ' . ' + h.snippet, h, i, false); if (text) take(text, h, i, true) })
  const out: Result[] = []
  for (const [p, c] of [...cand.entries()].sort((a, b) => b[1].score - a[1].score).slice(0, 4)) {
    const v = await vies(p), host = new URL(c.url).hostname.replace(/^www\./, '')
    const sim = similar(q, v?.name || c.title + ' ' + c.ctx)
    out.push({
      nome: v?.name ? cap(v.name) : '', piva: p, indirizzo: v?.address ? cap(v.address) : '', pec: '', sdi: '',
      fonte: v?.valid ? 'Ricerca web + VIES (' + host + ')' : 'Ricerca web (' + host + ')',
      punteggio: Math.round((sim * 0.7 + (v?.valid ? 0.2 : 0) + Math.min(0.1, c.score / 50)) * 100) / 100, verificata: !!v?.valid,
    })
  }
  return out
}

export async function lookup(rawQ: string): Promise<{ risultati: Result[]; nota: string }> {
  const q = rawQ.trim().replace(/\s+/g, ' ').slice(0, 120)
  const digits = q.replace(/[\s.]/g, '').replace(/^IT/i, '')
  if (/^\d{11}$/.test(digits)) {
    const v = await vies(digits)
    if (!v || !v.valid) return { risultati: [], nota: 'Partita IVA non trovata nel registro VIES: controlla il numero.' }
    return { risultati: [{ nome: cap(v.name), piva: digits, indirizzo: cap(v.address), pec: '', sdi: '', fonte: 'VIES (registro europeo)', punteggio: 1, verificata: true }], nota: '' }
  }
  let res: Result[] = [], nota = '', errs: string[] = []
  try { res = await fromIpa(q) } catch (e) { errs.push('IPA: ' + (e as Error).message) }
  if (!res.length) {
    if (searchConfigured()) {
      try { res = await fromWeb(q) } catch (e) { errs.push('ricerca web: ' + (e as Error).message) }
    } else {
      nota = 'Non è un ente pubblico dell\'indice IPA. Per le aziende private scrivi la partita IVA e premi «Cerca dati» (la ricerca sul web per nome richiede una chiave di ricerca, non ancora attivata).'
    }
  }
  if (!res.length && !nota) nota = 'Nessun risultato per «' + q + '»' + (errs.length ? ' (' + errs.join('; ') + ')' : '') + '. Prova con il nome completo o con la partita IVA.'
  res.sort((a, b) => b.punteggio - a.punteggio)
  return { risultati: res, nota }
}
