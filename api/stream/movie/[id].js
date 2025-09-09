import { supabase, requireToken, maybeSignSupabaseUrl } from '../../_supabase.js'
import { withCors } from '../../_cors.js'

async function handler(req, res) {
  if (!requireToken(req, res)) return

  // Vercel gives id = "733.json" when hitting /stream/movie/733.json
  const rawId = req.query.id || ''
  const id = String(rawId).replace(/\.json$/i, '').trim()

  if (!id) {
    return res.status(200).json({ streams: [], debug: { fatal: 'No id parsed', rawId } })
  }

  try {
    const { data, error } = await supabase
      .from('movies')
      .select('title, url')
      .eq('id', id)
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
    res.status(200).json({ streams: [], debug: { fatal: e.message, rawId } })
  }
}

export default withCors(handler)
