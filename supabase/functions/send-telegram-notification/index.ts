import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TelegramRequest {
  chat_id?: string;
  message: string;
  notify_all?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN is not set");
      return new Response(
        JSON.stringify({ error: "Telegram bot token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { chat_id, message, notify_all }: TelegramRequest = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const chatIds: string[] = [];

    if (notify_all) {
      // Fetch all admins who have telegram_chat_id and receive_notifications enabled
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      
      const adminsResponse = await fetch(
        `${supabaseUrl}/rest/v1/admins?receive_notifications=eq.true&is_active=eq.true&telegram_chat_id=not.is.null`,
        {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
          },
        }
      );
      
      const admins = await adminsResponse.json();
      console.log(`Found ${admins.length} admins to notify`);
      
      for (const admin of admins) {
        if (admin.telegram_chat_id) {
          chatIds.push(admin.telegram_chat_id);
        }
      }
    } else if (chat_id) {
      chatIds.push(chat_id);
    } else {
      return new Response(
        JSON.stringify({ error: "Either chat_id or notify_all must be provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];
    
    for (const id of chatIds) {
      try {
        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: id,
              text: message,
              parse_mode: "HTML",
            }),
          }
        );

        const result = await telegramResponse.json();
        console.log(`Message sent to ${id}:`, result.ok);
        results.push({ chat_id: id, success: result.ok, error: result.description });
      } catch (error) {
        console.error(`Error sending to ${id}:`, error);
        results.push({ chat_id: id, success: false, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent_to: chatIds.length,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-telegram-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
