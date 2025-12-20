import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all Telegram channels from database
    const { data: channels, error: fetchError } = await supabase
      .from('media_channels')
      .select('*')
      .eq('platform', 'telegram')
      .eq('is_active', true);

    if (fetchError) {
      console.error('Error fetching channels:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${channels?.length || 0} Telegram channels to update`);

    // Get active bot tokens
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
    const results = [];

    for (const channel of channels || []) {
      if (!channel.username) {
        console.log(`Channel ${channel.name} has no username, skipping`);
        continue;
      }

      try {
        // Use Telegram Bot API to get chat info
        const response = await fetch(
          `https://api.telegram.org/bot${botToken}/getChat?chat_id=@${channel.username}`
        );
        
        const data = await response.json();
        
        if (data.ok && data.result) {
          // Get member count
          const memberResponse = await fetch(
            `https://api.telegram.org/bot${botToken}/getChatMemberCount?chat_id=@${channel.username}`
          );
          const memberData = await memberResponse.json();
          
          const subscribers = memberData.ok ? memberData.result : 0;
          
          const updateData = {
            subscribers: subscribers,
            last_synced_at: new Date().toISOString(),
          };

          const { error: updateError } = await supabase
            .from('media_channels')
            .update(updateData)
            .eq('id', channel.id);

          if (updateError) {
            console.error(`Error updating channel ${channel.name}:`, updateError);
          } else {
            console.log(`Updated ${channel.name}: ${subscribers} subscribers`);
            results.push({ channel: channel.name, ...updateData, success: true });
          }
        } else {
          console.log(`Error fetching Telegram channel ${channel.name}:`, data.description);
          results.push({ channel: channel.name, success: false, error: data.description });
        }
      } catch (error) {
        console.error(`Error processing channel ${channel.name}:`, error);
        results.push({ channel: channel.name, success: false, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results, configured: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-telegram-stats:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
