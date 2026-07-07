import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-customer-auth',
};

// Transcrição via Lovable AI Gateway (gpt-4o-transcribe) — muito mais preciso
// para letras em português do que o Whisper hospedado no Groq, e sem os
// artefatos de "prompt echo" e loops de repetição do whisper-large-v3.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const audioData = await req.arrayBuffer();
    if (!audioData || audioData.byteLength === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum dado de áudio enviado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Nome do arquivo com extensão correta — o provider infere o container
    // pelo nome. Deriva do Content-Type; padrão mp3.
    const contentType = req.headers.get("content-type") || "audio/mpeg";
    const extMap: Record<string, string> = {
      "audio/mpeg": "mp3",
      "audio/mp3": "mp3",
      "audio/wav": "wav",
      "audio/wave": "wav",
      "audio/x-wav": "wav",
      "audio/mp4": "m4a",
      "audio/m4a": "m4a",
      "audio/x-m4a": "m4a",
      "audio/aac": "m4a",
      "audio/ogg": "ogg",
      "audio/flac": "flac",
      "audio/webm": "webm",
    };
    const base = contentType.split(";")[0].trim().toLowerCase();
    const ext = extMap[base] || "mp3";
    const filename = `audio.${ext}`;

    console.log(`Transcrevendo (${filename}, ${audioData.byteLength} bytes) via Lovable AI`);

    const form = new FormData();
    const blob = new Blob([audioData], { type: contentType });
    form.append("file", blob, filename);
    form.append("model", "openai/gpt-4o-transcribe");
    form.append("language", "pt");
    form.append("response_format", "json");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: form,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro Lovable AI [${response.status}]: ${errorText}`);

      // Fallback: se por algum motivo o gateway falhar, tenta Groq.
      const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
      if (GROQ_API_KEY && response.status >= 500) {
        console.log("Fallback para Groq whisper-large-v3-turbo");
        const groqForm = new FormData();
        groqForm.append("file", blob, filename);
        groqForm.append("model", "whisper-large-v3-turbo");
        groqForm.append("language", "pt");
        groqForm.append("response_format", "json");
        groqForm.append("temperature", "0");
        const groqResp = await fetch(
          "https://api.groq.com/openai/v1/audio/transcriptions",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
            body: groqForm,
          }
        );
        if (groqResp.ok) {
          const gr = await groqResp.json();
          return new Response(
            JSON.stringify({ text: gr.text || "" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(
        JSON.stringify({ error: `Falha na transcrição: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const text: string = result.text || "";
    console.log("Transcrição concluída com sucesso");

    return new Response(
      JSON.stringify({ text }),
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
