import { supabase, requireToken, maybeSignSupabaseUrl } from '../../_supabase.js'
import { withCors } from '../../_cors.js'

async function handler(req, res) {
  if (!requireToken(req, res)) return

  // Example: /api/stream/movie/733.json → slug = ["733.json"]
  const slug = req.query.slug || []
  const idWithExt = slug[0] || ''
  const id = idWithExt.replace(/\.json$/i, '')

  try {
    const { data, error } = await supabase
      .from('movies')
      .select('title, url')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('Stream lookup error:', error)
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
        {
          name: 'Direct MKV',
          title: data.title || `Movie ${id}`,
          url: playableUrl
        }
      ]
    })
  } catch (e) {
    console.error('Fatal stream error:', e)
    res.status(200).json({ streams: [], debug: { fatal: e.message } })
  }
}

export default withCors(handler)
