import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-customer-auth',
};

// Transcrição gratuita via Groq (Whisper). O Groq oferece transcrição
// gratuita/altíssimo free-tier e é uma das inferências de Whisper mais
// rápidas do mercado. Usamos whisper-large-v3 (mais preciso que o turbo
// para letras cantadas) SEM prompt (o prompt vazava na transcrição) e
// com filtragem anti-alucinação via verbose_json.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY não configurada");
    }

    const audioData = await req.arrayBuffer();
    if (!audioData || audioData.byteLength === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum dado de áudio enviado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentType = req.headers.get("content-type") || "audio/mpeg";
    const extMap: Record<string, string> = {
      "audio/mpeg": "mp3", "audio/mp3": "mp3",
      "audio/wav": "wav", "audio/wave": "wav", "audio/x-wav": "wav",
      "audio/mp4": "m4a", "audio/m4a": "m4a", "audio/x-m4a": "m4a", "audio/aac": "m4a",
      "audio/ogg": "ogg", "audio/flac": "flac", "audio/webm": "webm",
    };
    const base = contentType.split(";")[0].trim().toLowerCase();
    const ext = extMap[base] || "mp3";
    const filename = `audio.${ext}`;

    console.log(`Transcrevendo (${filename}, ${audioData.byteLength} bytes) via Groq Whisper`);

    const blob = new Blob([audioData], { type: contentType });

    const form = new FormData();
    form.append("file", blob, filename);
    // whisper-large-v3 é o mais preciso do Groq para letras cantadas.
    // Não enviamos `prompt` — Whisper ecoa o prompt em trechos silenciosos
    // (era o que causava "Sertanejo, forró, samba..." aparecendo).
    form.append("model", "whisper-large-v3");
    form.append("language", "pt");
    form.append("response_format", "verbose_json");
    form.append("temperature", "0");

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body: form,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro Groq [${response.status}]: ${errorText}`);
      return new Response(
        JSON.stringify({ error: `Falha na transcrição: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();

    // Filtragem anti-alucinação: remove segmentos com alta prob. de silêncio
    // ou baixa confiança, colapsa repetições consecutivas (loops típicos do
    // Whisper), e detecta se o resultado inteiro é uma repetição patológica.
    let finalText: string = (result.text || "").trim();
    if (Array.isArray(result.segments)) {
      const kept: string[] = [];
      let lastNorm = "";
      let repeatCount = 0;
      for (const seg of result.segments) {
        const noSpeech = typeof seg.no_speech_prob === "number" ? seg.no_speech_prob : 0;
        const logprob = typeof seg.avg_logprob === "number" ? seg.avg_logprob : 0;
        const compression = typeof seg.compression_ratio === "number" ? seg.compression_ratio : 1;
        if (noSpeech > 0.6) continue;               // silêncio
        if (logprob < -1.0) continue;                // baixíssima confiança
        if (compression > 2.4) continue;             // segmento repetitivo
        const text = (seg.text || "").trim();
        if (!text) continue;
        const norm = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
        if (norm && norm === lastNorm) {
          repeatCount++;
          if (repeatCount >= 1) continue;            // pula repetições imediatas
        } else {
          repeatCount = 0;
        }
        kept.push(text);
        lastNorm = norm;
      }
      if (kept.length) finalText = kept.join(" ").replace(/\s+/g, " ").trim();
    }

    console.log("Transcrição concluída");

    return new Response(
      JSON.stringify({ text: finalText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na transcrição:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Erro ao transcrever áudio" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
