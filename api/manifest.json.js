import { requireToken } from './_supabase.js';
import { withCors } from './_cors.js';

async function handler(req, res) {
  if (!requireToken(req, res)) return;
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).json({
    id: "com.you.supabase-mkv",
    version: "1.0.0",
    name: "Supabase MKV (Personal)",
    description: "Streams MKVs from your Supabase `movies` table",
    types: ["movie"],
    catalogs: [{ type: "movie", id: "supabase-movies", name: "Supabase Movies" }],
    resources: ["catalog", "stream"]
  });
}
export default withCors(handler);
