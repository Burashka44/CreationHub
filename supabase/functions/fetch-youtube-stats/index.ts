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
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    
    if (!youtubeApiKey) {
      console.log('YOUTUBE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'YouTube API key not configured', configured: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all YouTube channels from database
    const { data: channels, error: fetchError } = await supabase
      .from('media_channels')
      .select('*')
      .eq('platform', 'youtube')
      .eq('is_active', true);

    if (fetchError) {
      console.error('Error fetching channels:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${channels?.length || 0} YouTube channels to update`);

    const results = [];

    for (const channel of channels || []) {
      if (!channel.channel_id) {
        console.log(`Channel ${channel.name} has no channel_id, skipping`);
        continue;
      }

      try {
        // Fetch channel statistics from YouTube API
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channel.channel_id}&key=${youtubeApiKey}`
        );
        
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          const stats = data.items[0].statistics;
          const snippet = data.items[0].snippet;
          
          const updateData = {
            subscribers: parseInt(stats.subscriberCount) || 0,
            views: parseInt(stats.viewCount) || 0,
            videos_count: parseInt(stats.videoCount) || 0,
            last_synced_at: new Date().toISOString(),
          };

          const { error: updateError } = await supabase
            .from('media_channels')
            .update(updateData)
            .eq('id', channel.id);

          if (updateError) {
            console.error(`Error updating channel ${channel.name}:`, updateError);
          } else {
            console.log(`Updated ${channel.name}: ${updateData.subscribers} subs, ${updateData.views} views`);
            results.push({ channel: channel.name, ...updateData, success: true });
          }
        } else {
          console.log(`No data found for channel ${channel.name} (${channel.channel_id})`);
          results.push({ channel: channel.name, success: false, error: 'Channel not found' });
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
    console.error('Error in fetch-youtube-stats:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
