import { supabase, requireToken, maybeSignSupabaseUrl } from '../../_supabase.js';

export default async function handler(req, res) {
  if (!requireToken(req, res)) return;

  const { type, id } = req.query;
  if (type !== 'movie') return res.status(200).json({ streams: [] });

  const { data, error } = await supabase
    .from('movies')
    .select('title, url')
    .eq('id', id)
    .single();

  if (error || !data) {
    if (error) console.error('Stream lookup error:', error);
    return res.status(200).json({ streams: [] });
  }

  try {
    const playableUrl = await maybeSignSupabaseUrl(data.url, Number(process.env.SIGNED_URL_TTL || 90));
    if (!playableUrl) return res.status(200).json({ streams: [] });

    const stream = {
      name: "Direct MKV",
      title: data.title || `Movie ${id}`,
      url: playableUrl
    };

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ streams: [stream] });
  } catch (e) {
    console.error('Signing/URL error:', e);
    return res.status(200).json({ streams: [] });
  }
}
