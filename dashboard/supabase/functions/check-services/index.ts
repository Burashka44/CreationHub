import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json().catch(() => ({}))
    const { service_id, server_ip } = body

    // Get services to check
    let query = supabase.from('services').select('*').eq('is_active', true)
    if (service_id) {
      query = query.eq('id', service_id)
    }

    const { data: services, error: servicesError } = await query

    if (servicesError) {
      console.error('Error fetching services:', servicesError)
      throw servicesError
    }

    const ip = server_ip || '192.168.1.220'
    const results = []
    const offlineServices: string[] = []

    for (const service of services || []) {
      const previousStatus = service.status
      const port = service.port.split(' ')[0]
      const url = service.url || `http://${ip}:${port}`
      
      let status = 'offline'
      let responseTime = null

      try {
        const startTime = Date.now()
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
        }).catch(() => null)

        clearTimeout(timeoutId)

        if (response) {
          status = 'online'
          responseTime = Date.now() - startTime
        }
      } catch (e) {
        console.log(`Service ${service.name} at ${url} is offline:`, e.message)
      }

      // Check if service went offline (was online, now offline)
      if (previousStatus === 'online' && status === 'offline') {
        offlineServices.push(service.name)
        console.log(`⚠️ Service ${service.name} went OFFLINE!`)
      }

      // Update service status
      await supabase
        .from('services')
        .update({
          status,
          response_time_ms: responseTime,
          last_check_at: new Date().toISOString(),
        })
        .eq('id', service.id)

      // Record uptime history
      await supabase
        .from('service_uptime')
        .insert({
          service_id: service.id,
          status,
          response_time_ms: responseTime,
        })

      results.push({
        id: service.id,
        name: service.name,
        status,
        response_time_ms: responseTime,
        status_changed: previousStatus !== status,
      })
    }

    // Send Telegram notification if any service went offline
    if (offlineServices.length > 0) {
      const message = `🚨 <b>Сервисы недоступны!</b>\n\n${offlineServices.map(s => `❌ ${s}`).join('\n')}\n\n⏰ ${new Date().toLocaleString('ru-RU')}`
      
      try {
        // Call the existing send-telegram-notification function
        const { error: notifyError } = await supabase.functions.invoke('send-telegram-notification', {
          body: {
            message,
            notify_all: true,
          }
        })

        if (notifyError) {
          console.error('Error sending Telegram notification:', notifyError)
        } else {
          console.log(`✅ Sent Telegram alert for ${offlineServices.length} offline services`)
        }
      } catch (e) {
        console.error('Failed to send Telegram notification:', e)
      }
    }

    console.log(`Checked ${results.length} services, ${offlineServices.length} went offline`)

    return new Response(
      JSON.stringify({ success: true, results, offline_alerts: offlineServices }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in check-services:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})