import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Verify caller is a logged-in Supabase user
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(
    authHeader.replace('Bearer ', ''),
  );
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Parse request
  let prompt: string, gridW: number, gridH: number;
  try {
    ({ prompt, gridW, gridH } = await req.json());
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) throw new Error();
    if (!Number.isInteger(gridW) || !Number.isInteger(gridH)) throw new Error();
    if (gridW < 1 || gridW > 128 || gridH < 1 || gridH > 128) throw new Error();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Call PixelLab API
  const pixellabRes = await fetch('https://api.pixellab.ai/v2/create-image-pixflux', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('PIXELLAB_API_KEY')!}`,
    },
    body: JSON.stringify({
      description: prompt.trim(),
      image_size: { width: gridW, height: gridH },
      no_background: true,
    }),
  });

  if (!pixellabRes.ok) {
    const errText = await pixellabRes.text();
    console.error('PixelLab API error:', pixellabRes.status, errText);
    return new Response(JSON.stringify({ error: 'PixelLab API error', detail: errText }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const data = await pixellabRes.json();

  // PixelLab returns the image as base64 — field may be at data.image or data.images[0]
  const imageBase64: string | undefined =
    data?.image?.base64 ??
    data?.images?.[0]?.base64 ??
    data?.data?.image?.base64 ??
    data?.data?.images?.[0]?.base64;

  if (!imageBase64) {
    console.error('PixelLab unexpected response shape:', JSON.stringify(data).slice(0, 500));
    return new Response(JSON.stringify({ error: 'No image data returned', detail: JSON.stringify(data).slice(0, 500) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Return the base64 image to the client — pixel extraction is done in the browser
  return new Response(JSON.stringify({ imageBase64, gridW, gridH }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
