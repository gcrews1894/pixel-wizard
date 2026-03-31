import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function validatePixels(
  pixels: unknown,
  gridW: number,
  gridH: number,
): (string | null)[][] | null {
  if (!Array.isArray(pixels) || pixels.length !== gridH) return null;
  for (const row of pixels) {
    if (!Array.isArray(row) || row.length !== gridW) return null;
    for (const cell of row) {
      if (cell !== null && (typeof cell !== 'string' || !HEX_RE.test(cell))) return null;
    }
  }
  return pixels as (string | null)[][];
}

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

  // Call Claude
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 8192,
    system: `You are a pixel art generator. Given a subject and canvas size, you output a pixel art grid.
The grid must have exactly ${gridH} rows and ${gridW} columns.
Each cell must be either a hex color string (e.g. "#e94560") or null for transparent/empty.
Use null generously for the background — only fill cells that are part of the subject.
Use a small, harmonious palette of 5–8 colors.
Draw in classic retro game sprite style: clean shapes, clear silhouette, centered on the canvas.
Think carefully about each row before outputting it.`,
    tools: [
      {
        name: 'render_pixel_art',
        description: `Output the completed ${gridW}×${gridH} pixel art grid`,
        input_schema: {
          type: 'object',
          properties: {
            pixels: {
              type: 'array',
              description: `Array of exactly ${gridH} rows, each with exactly ${gridW} cells`,
              items: {
                type: 'array',
                items: {},
              },
            },
          },
          required: ['pixels'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'render_pixel_art' },
    messages: [
      {
        role: 'user',
        content: `Generate pixel art of: ${prompt.trim()}\nCanvas size: ${gridW} columns × ${gridH} rows`,
      },
    ],
  });

  // Extract tool result
  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    return new Response(JSON.stringify({ error: 'No pixel data returned' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const input = toolUse.input as { pixels: unknown };
  const pixels = validatePixels(input.pixels, gridW, gridH);
  if (!pixels) {
    return new Response(JSON.stringify({ error: 'Invalid pixel data from model' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ pixels }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
