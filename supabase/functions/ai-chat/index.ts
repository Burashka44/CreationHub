import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AVAILABLE_MODELS = {
  'gemini-flash': 'google/gemini-2.5-flash',
  'gemini-pro': 'google/gemini-2.5-pro',
  'gemini-lite': 'google/gemini-2.5-flash-lite',
  'gpt-5': 'openai/gpt-5',
  'gpt-5-mini': 'openai/gpt-5-mini',
  'gpt-5-nano': 'openai/gpt-5-nano',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type, model: requestedModel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = "Ты полезный AI ассистент. Отвечай четко и по делу.";
    const model = AVAILABLE_MODELS[requestedModel as keyof typeof AVAILABLE_MODELS] || AVAILABLE_MODELS['gemini-flash'];

    if (type === 'summarize') {
      systemPrompt = "Ты эксперт по суммаризации текста. Твоя задача - сократить текст до ключевых тезисов, сохраняя основной смысл. Выдели главные идеи и представь их в структурированном виде.";
    } else if (type === 'chat') {
      systemPrompt = "Ты умный AI ассистент. Помогай пользователю с любыми вопросами. Будь дружелюбным и полезным.";
    }

    console.log('AI Chat request:', { type, model, messagesCount: messages.length });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log('AI response received, length:', content.length);

    return new Response(JSON.stringify({ content, model }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Chat error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
