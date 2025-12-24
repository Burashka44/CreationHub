import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    
    const {
      cpu_percent,
      ram_percent,
      disk_percent,
      cpu_temp,
      gpu_temp,
      net_rx_bytes,
      net_tx_bytes,
    } = body

    console.log('Recording metrics:', { cpu_percent, ram_percent, disk_percent })

    const { data, error } = await supabase
      .from('system_metrics')
      .insert({
        cpu_percent: cpu_percent ?? null,
        ram_percent: ram_percent ?? null,
        disk_percent: disk_percent ?? null,
        cpu_temp: cpu_temp ?? null,
        gpu_temp: gpu_temp ?? null,
        net_rx_bytes: net_rx_bytes ?? 0,
        net_tx_bytes: net_tx_bytes ?? 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting metrics:', error)
      throw error
    }

    console.log('Metrics recorded successfully:', data?.id)

    return new Response(
      JSON.stringify({ success: true, id: data?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in record-system-metrics:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})