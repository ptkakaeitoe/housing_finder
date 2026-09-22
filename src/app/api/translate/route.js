import { createClient } from '@supabase/supabase-js';

const TARGETS = { th: 'th', my: 'my', zh: 'zh-CN' };
const MAX_LENGTH = 5000;

async function translateText(text, target, apiKey) {
  if (!text) return '';
  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, target, format: 'text' }),
  });
  if (!response.ok) throw new Error(`Translation request failed (${response.status})`);
  const data = await response.json();
  return data?.data?.translations?.[0]?.translatedText ?? '';
}

export async function POST(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!url || !anonKey) return Response.json({ error: 'Translation is not configured on the server.' }, { status: 503 });
  if (!apiKey) return Response.json({ error: 'GOOGLE_TRANSLATE_API_KEY is not set.' }, { status: 503 });
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return Response.json({ error: 'Sign in to translate listings.' }, { status: 401 });
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: auth, error: authError } = await client.auth.getUser(token);
  if (authError || !auth.user) return Response.json({ error: 'Your session is invalid. Sign in again.' }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }); }
  const title = String(body?.title ?? '');
  const description = String(body?.description ?? '');
  if (title.length > MAX_LENGTH || description.length > MAX_LENGTH) return Response.json({ error: 'Text is too long to translate.' }, { status: 400 });
  try {
    const results = {};
    for (const [locale, target] of Object.entries(TARGETS)) {
      const [translatedTitle, translatedDescription] = await Promise.all([
        translateText(title, target, apiKey),
        translateText(description, target, apiKey),
      ]);
      results[locale] = { title: translatedTitle, description: translatedDescription };
    }
    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 502 });
  }
}
