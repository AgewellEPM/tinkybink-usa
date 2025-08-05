import { NextRequest } from 'next/server';

export const runtime = 'edge'; // Run at edge for fastest response

export async function POST(request: NextRequest) {
  try {
    const { text, lang = 'en-US' } = await request.json();

    // Use Google's TTS API at the edge
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(
      text
    )}`;

    const audioResponse = await fetch(ttsUrl);
    const audioBuffer = await audioResponse.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Speech generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}