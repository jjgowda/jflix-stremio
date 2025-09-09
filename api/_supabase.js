import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL,
  // Use service role if you want to sign private storage URLs; else anon is fine for public reads.
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

// optional: simple token guard for personal use
export function requireToken(req, res) {
  const required = process.env.ADDON_TOKEN;
  if (!required) return true;
  const tok = (req.query?.token || '').toString();
  if (tok === required) return true;
  res.status(401).json({ err: 'Unauthorized. Append ?token=<ADDON_TOKEN> to the URL.' });
  return false;
}

/**
 * If url is like: supabase://<bucket>/<path/to/file.mkv>
 * we’ll sign it for short-lived access.
 */
export async function maybeSignSupabaseUrl(rawUrl, expiresIn = 90) {
  if (!rawUrl) return null;
  if (!rawUrl.startsWith('supabase://')) return rawUrl; // normal http(s) links go through

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to sign supabase:// URLs');
  }

  const withoutScheme = rawUrl.replace('supabase://', '');
  const firstSlash = withoutScheme.indexOf('/');
  if (firstSlash === -1) throw new Error('Invalid supabase:// URL. Expected supabase://bucket/path');

  const bucket = withoutScheme.slice(0, firstSlash);
  const objectPath = withoutScheme.slice(firstSlash + 1);

  const { data, error } = await supabase
    .storage
    .from(bucket)
    .createSignedUrl(objectPath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}
