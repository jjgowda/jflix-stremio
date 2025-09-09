import { requireToken } from './_supabase.js';

export default async function handler(req, res) {
  if (!requireToken(req, res)) return;

  const manifest = {
    id: "com.you.supabase-mkv",
    version: "1.0.0",
    name: "Supabase MKV (Personal)",
    description: "Streams MKVs from your Supabase `movies` table",
    types: ["movie"],
    catalogs: [
      { type: "movie", id: "supabase-movies", name: "Supabase Movies" }
    ],
    resources: ["catalog", "stream"]
  };

  // Stremio caches the manifest; short TTL is fine
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).json(manifest);
}
