import { supabase, requireToken } from '../../_supabase.js'
import { withCors } from '../../_cors.js'

async function handler(req, res) {
  if (!requireToken(req, res)) return

  try {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title, poster, mob_poster, overview, year, language')
      .limit(200)

    if (error) {
      console.error('Catalog select error:', error)
      return res.status(200).json({ metas: [], debug: { error: String(error.message || error) } })
    }

    const metas = (data || []).map(m => ({
      id: String(m.id),
      type: 'movie',
      name: m.title || `Movie ${m.id}`,
      poster: m.poster || m.mob_poster || undefined,
      description: m.overview || undefined,
      year: m.year || undefined,
      language: m.language || undefined
    }))

    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ metas, debug: { count: metas.length } })
  } catch (e) {
    console.error('Catalog fatal:', e)
    return res.status(200).json({ metas: [], debug: { fatal: String(e.message || e) } })
  }
}
export default withCors(handler)
