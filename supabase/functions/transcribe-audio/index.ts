import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-customer-auth',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY não configurada");
    }

    // Get the audio data from the request body
    // We expect the file to be sent directly as the body
    const audioData = await req.arrayBuffer();
    
    if (!audioData || audioData.byteLength === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum dado de áudio enviado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Transcrevendo áudio, tamanho: ${audioData.byteLength} bytes`);

    // Determine content type from headers or default to audio/mpeg
    const contentType = req.headers.get("content-type") || "audio/mpeg";
    const filename = "audio.mp3"; // Groq needs a filename with extension

    // IMPORTANTE: NÃO enviar `prompt` para o Whisper. Em áudios com trechos
    // silenciosos ou de baixa qualidade, o modelo ecoa o prompt na transcrição
    // (foi o que causou "Sertanejo, forró, samba..." aparecendo no início).
    // Também evitamos temperature=0 puro, que amplifica loops de repetição
    // ("Bom dia de Tanajura..." repetido). O modelo turbo é mais estável.
    const groqFormData = new FormData();
    const blob = new Blob([audioData], { type: contentType });
    groqFormData.append("file", blob, filename);
    groqFormData.append("model", "whisper-large-v3-turbo");
    groqFormData.append("language", "pt");
    groqFormData.append("response_format", "verbose_json");
    groqFormData.append("temperature", "0");


    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro Groq API [${response.status}]: ${errorText}`);
      
      return new Response(
        JSON.stringify({ error: `Falha na transcrição: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();

    // Filtragem anti-alucinação: remove segmentos com alta prob. de silêncio
    // ou baixa confiança (avg_logprob), e colapsa repetições consecutivas.
    let finalText: string = result.text || "";
    if (Array.isArray(result.segments)) {
      const kept: string[] = [];
      let lastNorm = "";
      for (const seg of result.segments) {
        const noSpeech = typeof seg.no_speech_prob === "number" ? seg.no_speech_prob : 0;
        const logprob = typeof seg.avg_logprob === "number" ? seg.avg_logprob : 0;
        if (noSpeech > 0.6) continue;
        if (logprob < -1.0) continue;
        const text = (seg.text || "").trim();
        if (!text) continue;
        const norm = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
        if (norm && norm === lastNorm) continue; // repetição imediata
        kept.push(text);
        lastNorm = norm;
      }
      if (kept.length) finalText = kept.join(" ");
    }

    console.log("Transcrição concluída com sucesso");

    return new Response(
      JSON.stringify({ text: finalText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na transcrição:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao transcrever áudio" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
