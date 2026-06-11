import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, track_id } = await req.json();
    if (!token || !track_id) {
      return new Response(JSON.stringify({ error: 'Missing token or track_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Validate token -> preview
    const { data: preview, error: pErr } = await supabase
      .from('music_previews')
      .select('id')
      .or(`share_token.eq.${token},slug.eq.${token}`)
      .maybeSingle();

    if (pErr || !preview) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate track belongs to that preview
    const { data: track, error: tErr } = await supabase
      .from('music_preview_tracks')
      .select('storage_path')
      .eq('id', track_id)
      .eq('preview_id', preview.id)
      .maybeSingle();

    if (tErr || !track?.storage_path) {
      return new Response(JSON.stringify({ error: 'Track not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: signed, error: sErr } = await supabase.storage
      .from('music-previews')
      .createSignedUrl(track.storage_path, 60 * 10);

    if (sErr || !signed?.signedUrl) {
      return new Response(JSON.stringify({ error: 'Failed to sign URL' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url: signed.signedUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
