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

    // Prepare request to Groq Whisper API
    const groqFormData = new FormData();
    const blob = new Blob([audioData], { type: contentType });
    groqFormData.append("file", blob, filename);
    groqFormData.append("model", "whisper-large-v3");
    groqFormData.append("language", "pt");
    groqFormData.append("response_format", "json");

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
    console.log("Transcrição concluída com sucesso");

    return new Response(
      JSON.stringify({ text: result.text }),
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
