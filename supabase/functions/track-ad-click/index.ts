import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple hash function for IP anonymization
const hashIP = async (ip: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const trackingCode = url.searchParams.get('code') || url.searchParams.get('utm_campaign');
    const redirectUrl = url.searchParams.get('redirect') || url.searchParams.get('url');
    
    // Also support POST body
    let bodyData: any = {};
    if (req.method === 'POST') {
      try {
        bodyData = await req.json();
      } catch (e) {
        // Body might be empty
      }
    }

    const code = trackingCode || bodyData.code || bodyData.tracking_code;
    const redirect = redirectUrl || bodyData.redirect || bodyData.url;

    if (!code) {
      console.log('No tracking code provided');
      return new Response(
        JSON.stringify({ error: 'No tracking code provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the ad by tracking code
    const { data: ad, error: adError } = await supabase
      .from('telegram_ads')
      .select('id, clicks, ad_link')
      .eq('tracking_code', code)
      .single();

    if (adError || !ad) {
      console.log('Ad not found for code:', code);
      return new Response(
        JSON.stringify({ error: 'Ad not found', code }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client info
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const referrer = req.headers.get('referer') || bodyData.referrer || null;

    // Hash the IP for privacy
    const ipHash = clientIP !== 'unknown' ? await hashIP(clientIP) : null;

    // Record the click
    const { error: clickError } = await supabase
      .from('ad_clicks')
      .insert({
        ad_id: ad.id,
        ip_hash: ipHash,
        user_agent: userAgent.substring(0, 500),
        referrer: referrer?.substring(0, 500) || null,
      });

    if (clickError) {
      console.error('Error recording click:', clickError);
    }

    // Increment clicks counter on the ad
    const { error: updateError } = await supabase
      .from('telegram_ads')
      .update({ clicks: (ad.clicks || 0) + 1 })
      .eq('id', ad.id);

    if (updateError) {
      console.error('Error updating click count:', updateError);
    }

    console.log(`Click recorded for ad ${ad.id}, code: ${code}`);

    // If redirect URL provided, redirect the user
    const finalRedirect = redirect || ad.ad_link;
    if (finalRedirect && req.method === 'GET') {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': finalRedirect,
        },
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        clicks: (ad.clicks || 0) + 1,
        redirect: finalRedirect
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in track-ad-click:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
