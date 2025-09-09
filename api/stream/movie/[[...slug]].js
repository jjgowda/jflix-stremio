import { supabase, requireToken, maybeSignSupabaseUrl } from '../../_supabase.js'
import { withCors } from '../../_cors.js'

async function handler(req, res) {
  if (!requireToken(req, res)) return

  // Example: /api/stream/movie/733.json → slug = ["733.json"]
  const slug = req.query.slug || []
  const last = slug[slug.length - 1] || ''
  const idStr = last.replace(/\.json$/i, '')
  const id = idStr.trim()

  if (!id) {
    return res.status(200).json({ streams: [], debug: { fatal: 'No id parsed from URL', slug } })
  }

  try {
    const { data, error } = await supabase
      .from('movies')
      .select('title, url')
      .eq('id', id)   // Supabase will coerce string "733" to int
      .single()

    if (error || !data) {
      return res.status(200).json({ streams: [], debug: { id, error: error?.message } })
    }

    const ttl = Number(process.env.SIGNED_URL_TTL || 90)
    const playableUrl = await maybeSignSupabaseUrl(data.url, ttl)

    if (!playableUrl) {
      return res.status(200).json({ streams: [], debug: { id, reason: 'url missing or signing failed' } })
    }

    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({
      streams: [
        { name: 'Direct MKV', title: data.title || `Movie ${id}`, url: playableUrl }
      ]
    })
  } catch (e) {
    res.status(200).json({ streams: [], debug: { fatal: e.message, slug } })
  }
}

export default withCors(handler)
