import { supabase } from './_supabase.js';

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase.from('movies')
      .select('id, title').limit(1);
    if (error) throw error;
    res.status(200).json({
      ok: true,
      movies_sample: data,
      env_seen: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        ANON: !!process.env.SUPABASE_ANON_KEY,
        SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, env_seen: {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      ANON: !!process.env.SUPABASE_ANON_KEY,
      SERVICE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }});
  }
}
