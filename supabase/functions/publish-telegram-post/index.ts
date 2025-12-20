import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  channel_username: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  buttons?: Array<{ text: string; url: string }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { channel_username, text, parse_mode, disable_web_page_preview, disable_notification, buttons }: PublishRequest = await req.json();

    if (!channel_username || !text) {
      return new Response(
        JSON.stringify({ error: 'channel_username and text are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Publishing post to channel: @${channel_username}`);

    // Get active bot token
    const { data: bots, error: botsError } = await supabase
      .from('telegram_bots')
      .select('token')
      .eq('is_active', true)
      .limit(1);

    if (botsError || !bots?.length) {
      console.log('No active Telegram bots found');
      return new Response(
        JSON.stringify({ error: 'No active Telegram bot configured', configured: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const botToken = bots[0].token;

    // Build message payload
    const messagePayload: Record<string, any> = {
      chat_id: channel_username.startsWith('@') ? channel_username : `@${channel_username}`,
      text: text,
    };

    if (parse_mode) {
      messagePayload.parse_mode = parse_mode;
    }

    if (disable_web_page_preview) {
      messagePayload.disable_web_page_preview = true;
    }

    if (disable_notification) {
      messagePayload.disable_notification = true;
    }

    // Add inline keyboard with buttons if provided
    if (buttons && buttons.length > 0) {
      messagePayload.reply_markup = {
        inline_keyboard: buttons.map(btn => [{ text: btn.text, url: btn.url }])
      };
    }

    // Send message via Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messagePayload),
      }
    );

    const data = await response.json();

    if (data.ok) {
      console.log(`Post published successfully to @${channel_username}, message_id: ${data.result.message_id}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message_id: data.result.message_id,
          chat: data.result.chat,
          date: data.result.date
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error(`Failed to publish post: ${data.description}`);
      return new Response(
        JSON.stringify({ success: false, error: data.description }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in publish-telegram-post:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
