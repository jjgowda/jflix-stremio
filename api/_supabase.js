import { createClient } from '@supabase/supabase-js';

function reqEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(`Missing ENV ${name}`);
  }
  return v;
}

const SUPABASE_URL = reqEnv('SUPABASE_URL');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!KEY) {
  throw new Error('Missing ENV SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, KEY, { auth: { persistSession: false } });

export function requireToken(req, res) {
  const required = process.env.ADDON_TOKEN;
  if (!required) return true;
  if ((req.query?.token || '') === required) return true;
  res.status(401).json({ err: 'Unauthorized. Append ?token=<ADDON_TOKEN>' });
  return false;
}

export async function maybeSignSupabaseUrl(rawUrl, expiresIn = 90) {
  if (!rawUrl) return null;
  if (!rawUrl.startsWith('supabase://')) return rawUrl;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Signing requested but SUPABASE_SERVICE_ROLE_KEY is missing');
  }
  const withoutScheme = rawUrl.replace('supabase://', '');
  const slash = withoutScheme.indexOf('/');
  if (slash === -1) throw new Error('Invalid supabase:// URL. Use supabase://bucket/path/file.mkv');
  const bucket = withoutScheme.slice(0, slash);
  const objectPath = withoutScheme.slice(slash + 1);

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectPath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
