import { supabase, requireToken } from '../../_supabase.js'
import { withCors } from '../../_cors.js'

async function handler(req, res) {
  if (!requireToken(req, res)) return

  // /api/catalog/movie/supabase-movies.json  → slug = ["supabase-movies.json"]
  const slug = req.query.slug || []
  const idWithExt = slug[0] || ''
  const id = idWithExt.replace(/\.json$/i, '')

  if (id !== 'supabase-movies') return res.status(200).json({ metas: [] })

  const { data, error } = await supabase
    .from('movies')
    .select('id, title, poster, mob_poster, overview, year, language, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Catalog error:', error)
    return res.status(200).json({ metas: [] })
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
  res.status(200).json({ metas })
}
export default withCors(handler)
