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

    // Parse request body for optional channel_id filter
    let channelIdFilter: string | null = null;
    try {
      const body = await req.json();
      channelIdFilter = body?.channel_id || null;
    } catch {
      // No body or invalid JSON, sync all channels
    }

    // Get Telegram channels from database
    let query = supabase
      .from('media_channels')
      .select('*')
      .eq('platform', 'telegram')
      .eq('is_active', true);
    
    if (channelIdFilter) {
      query = query.eq('id', channelIdFilter);
    }

    const { data: channels, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching channels:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${channels?.length || 0} Telegram channels to update`);

    // Get active bot tokens
    const { data: bots, error: botsError } = await supabase
      .from('telegram_bots')
      .select('token, name')
      .eq('is_active', true)
      .limit(1);

    if (botsError || !bots?.length) {
      console.log('No active Telegram bots found');
      return new Response(
        JSON.stringify({ 
          error: 'No active Telegram bot configured', 
          configured: false,
          message: 'Добавьте активный Telegram бот для синхронизации статистики'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const botToken = bots[0].token;
    const botName = bots[0].name;
    const results = [];

    console.log(`Using bot: ${botName}`);

    for (const channel of channels || []) {
      if (!channel.username) {
        console.log(`Channel ${channel.name} has no username, skipping`);
        results.push({ 
          channel: channel.name, 
          success: false, 
          error: 'Не указан username канала' 
        });
        continue;
      }

      try {
        // Use Telegram Bot API to get chat info
        const chatResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/getChat?chat_id=@${channel.username}`
        );
        const chatData = await chatResponse.json();
        
        console.log(`getChat response for @${channel.username}:`, JSON.stringify(chatData));

        if (!chatData.ok) {
          console.log(`Error fetching chat info for ${channel.name}:`, chatData.description);
          results.push({ 
            channel: channel.name, 
            username: channel.username,
            success: false, 
            error: chatData.description || 'Не удалось получить информацию о канале',
            hint: 'Убедитесь, что бот добавлен в администраторы канала'
          });
          continue;
        }

        const chatInfo = chatData.result;

        // Get member count
        const memberResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/getChatMemberCount?chat_id=@${channel.username}`
        );
        const memberData = await memberResponse.json();
        
        console.log(`getChatMemberCount response for @${channel.username}:`, JSON.stringify(memberData));

        const subscribers = memberData.ok ? memberData.result : channel.subscribers;

        // Calculate growth (compare with previous value)
        const previousSubscribers = channel.subscribers || 0;
        const subscribersDiff = subscribers - previousSubscribers;
        const growthPercent = previousSubscribers > 0 
          ? ((subscribersDiff / previousSubscribers) * 100).toFixed(2) 
          : 0;

        const updateData: any = {
          subscribers: subscribers,
          last_synced_at: new Date().toISOString(),
        };

        // Update growth if we have previous data
        if (previousSubscribers > 0 && subscribersDiff !== 0) {
          updateData.growth = parseFloat(growthPercent as string);
        }

        // Get chat title if different from stored name
        if (chatInfo.title && chatInfo.title !== channel.name) {
          console.log(`Channel title changed: ${channel.name} -> ${chatInfo.title}`);
        }

        const { error: updateError } = await supabase
          .from('media_channels')
          .update(updateData)
          .eq('id', channel.id);

        if (updateError) {
          console.error(`Error updating channel ${channel.name}:`, updateError);
          results.push({ 
            channel: channel.name, 
            username: channel.username,
            success: false, 
            error: updateError.message 
          });
        } else {
          console.log(`Updated ${channel.name}: ${subscribers} subscribers (${subscribersDiff >= 0 ? '+' : ''}${subscribersDiff})`);
          results.push({ 
            channel: channel.name, 
            username: channel.username,
            subscribers,
            previous_subscribers: previousSubscribers,
            diff: subscribersDiff,
            growth_percent: growthPercent,
            chat_type: chatInfo.type,
            last_synced_at: updateData.last_synced_at,
            success: true 
          });
        }
      } catch (error: any) {
        console.error(`Error processing channel ${channel.name}:`, error);
        results.push({ 
          channel: channel.name, 
          username: channel.username,
          success: false, 
          error: error.message 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        results, 
        configured: true,
        bot_name: botName,
        summary: {
          total: results.length,
          success: successCount,
          failed: failCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in fetch-telegram-stats:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
