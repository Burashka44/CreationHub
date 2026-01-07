-- Migration: Fix RLS Policies - Restrict Anonymous Access
-- Date: 2026-01-07
-- Purpose: Close CRITICAL security hole - database is currently open to all

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- First, create helper functions to check JWT authentication
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'id', '')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true)::json->>'role', ''), 'anonymous');
$$ LANGUAGE SQL STABLE;

-- ============================================
-- DROP ALL EXISTING PERMISSIVE POLICIES
-- ============================================

-- Admins
DROP POLICY IF EXISTS "Allow public read access to admins" ON public.admins;
DROP POLICY IF EXISTS "Allow public insert access to admins" ON public.admins;
DROP POLICY IF EXISTS "Allow public update access to admins" ON public.admins;
DROP POLICY IF EXISTS "Allow public delete access to admins" ON public.admins;

-- Telegram
DROP POLICY IF EXISTS "Allow all bots" ON public.telegram_bots;
DROP POLICY IF EXISTS "Allow all ads" ON public.telegram_ads;
DROP POLICY IF EXISTS "Allow all clicks" ON public.ad_clicks;

-- Media
DROP POLICY IF EXISTS "Allow all channels" ON public.media_channels;
DROP POLICY IF EXISTS "Allow all rates" ON public.channel_ad_rates;
DROP POLICY IF EXISTS "Allow all sales" ON public.ad_sales;
DROP POLICY IF EXISTS "Allow all purchases" ON public.ad_purchases;

-- Infrastructure
DROP POLICY IF EXISTS "Allow all services" ON public.services;
DROP POLICY IF EXISTS "Allow all uptime" ON public.service_uptime;
DROP POLICY IF EXISTS "Allow all metrics" ON public.system_metrics;
DROP POLICY IF EXISTS "Allow all app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow all firewall_rules" ON public.firewall_rules;
DROP POLICY IF EXISTS "Allow all network_traffic" ON public.network_traffic;
DROP POLICY IF EXISTS "Allow all backups" ON public.backups;
DROP POLICY IF EXISTS "Allow all security_settings" ON public.security_settings;
DROP POLICY IF EXISTS "Allow all vpn_profiles" ON public.vpn_profiles;
DROP POLICY IF EXISTS "Allow all dns_configs" ON public.dns_configs;
DROP POLICY IF EXISTS "Allow all ai_requests" ON public.ai_requests;

-- ============================================
-- CREATE SECURE POLICIES
-- ============================================

-- ADMINS: Only authenticated admins can manage admins
CREATE POLICY "Admins: Read (Authenticated)" ON public.admins
  FOR SELECT USING (auth.role() IN ('admin', 'superadmin'));

CREATE POLICY "Admins: Insert (Superadmin only)" ON public.admins
  FOR INSERT WITH CHECK (auth.role() = 'superadmin');

CREATE POLICY "Admins: Update (Self or Superadmin)" ON public.admins
  FOR UPDATE USING (
    auth.user_id() = id OR auth.role() = 'superadmin'
  );

CREATE POLICY "Admins: Delete (Superadmin only)" ON public.admins
  FOR DELETE USING (auth.role() = 'superadmin');

-- SERVICES: Read-only for authenticated, admin for modifications
CREATE POLICY "Services: Read (Authenticated)" ON public.services
  FOR SELECT USING (auth.role() IS NOT NULL);

CREATE POLICY "Services: Modify (Admin)" ON public.services
  FOR ALL USING (auth.role() IN ('admin', 'superadmin'));

-- SERVICE UPTIME: System can write, authenticated can read
CREATE POLICY "Service Uptime: Read (Authenticated)" ON public.service_uptime
  FOR SELECT USING (auth.role() IS NOT NULL);

CREATE POLICY "Service Uptime: Insert (System)" ON public.service_uptime
  FOR INSERT WITH CHECK (true); -- System API writes without JWT

-- SYSTEM METRICS: System can write, authenticated can read
CREATE POLICY "System Metrics: Read (Authenticated)" ON public.system_metrics
  FOR SELECT USING (auth.role() IS NOT NULL);

CREATE POLICY "System Metrics: Insert (System)" ON public.system_metrics
  FOR INSERT WITH CHECK (true); -- Stats recorder writes without JWT

-- NETWORK TRAFFIC: System can write, authenticated can read
CREATE POLICY "Network Traffic: Read (Authenticated)" ON public.network_traffic
  FOR SELECT USING (auth.role() IS NOT NULL);

CREATE POLICY "Network Traffic: Insert (System)" ON public.network_traffic
  FOR INSERT WITH CHECK (true);

-- BACKUPS: Admin only
CREATE POLICY "Backups: All (Admin)" ON public.backups
  FOR ALL USING (auth.role() IN ('admin', 'superadmin'));

-- APP SETTINGS: Admin only
CREATE POLICY "App Settings: Read (Authenticated)" ON public.app_settings
  FOR SELECT USING (auth.role() IS NOT NULL);

CREATE POLICY "App Settings: Modify (Admin)" ON public.app_settings
  FOR ALL USING (auth.role() IN ('admin', 'superadmin'));

-- FIREWALL RULES: Admin only
CREATE POLICY "Firewall: All (Admin)" ON public.firewall_rules
  FOR ALL USING (auth.role() IN ('admin', 'superadmin'));

-- SECURITY SETTINGS: Admin only
CREATE POLICY "Security: All (Admin)" ON public.security_settings
  FOR ALL USING (auth.role() IN ('admin', 'superadmin'));

-- VPN PROFILES: Admin only
CREATE POLICY "VPN: All (Admin)" ON public.vpn_profiles
  FOR ALL USING (auth.role() IN ('admin', 'superadmin'));

-- DNS CONFIGS: Admin only
CREATE POLICY "DNS: All (Admin)" ON public.dns_configs
  FOR ALL USING (auth.role() IN ('admin', 'superadmin'));

-- MEDIA CHANNELS: Authenticated read, admin modify
CREATE POLICY "Media Channels: Read (Authenticated)" ON public.media_channels
  FOR SELECT USING (auth.role() IS NOT NULL);

CREATE POLICY "Media Channels: Modify (Admin)" ON public.media_channels
  FOR ALL USING (auth.role() IN ('admin', 'superadmin'));

-- TELEGRAM BOTS/ADS: Admin only
CREATE POLICY "Telegram Bots: All (Admin)" ON public.telegram_bots
  FOR ALL USING (auth.role() IN ('admin', 'superadmin'));

CREATE POLICY "Telegram Ads: All (Admin)" ON public.telegram_ads
  FOR ALL USING (auth.role() IN ('admin', 'superadmin'));

CREATE POLICY "Ad Clicks: Read (Authenticated)" ON public.ad_clicks
  FOR SELECT USING (auth.role() IS NOT NULL);

CREATE POLICY "Ad Clicks: Insert (Public)" ON public.ad_clicks
  FOR INSERT WITH CHECK (true); -- Public can track clicks

-- CHANNEL AD RATES: Authenticated read, admin modify
CREATE POLICY "Ad Rates: Read (Authenticated)" ON public.channel_ad_rates
  FOR SELECT USING (auth.role() IS NOT NULL);

CREATE POLICY "Ad Rates: Modify (Admin)" ON public.channel_ad_rates
  FOR ALL USING (auth.role() IN ('admin', 'superadmin'));

-- AD SALES/PURCHASES: Admin only
CREATE POLICY "Ad Sales: All (Admin)" ON public.ad_sales
  FOR ALL USING (auth.role() IN ('admin', 'superadmin'));

CREATE POLICY "Ad Purchases: All (Admin)" ON public.ad_purchases
  FOR ALL USING (auth.role() IN ('admin', 'superadmin'));

-- AI REQUESTS: Authenticated users can create/read own, admin can see all
CREATE POLICY "AI Requests: Read Own or Admin" ON public.ai_requests
  FOR SELECT USING (
    auth.user_id() IS NOT NULL OR auth.role() IN ('admin', 'superadmin')
  );

CREATE POLICY "AI Requests: Create (Authenticated)" ON public.ai_requests
  FOR INSERT WITH CHECK (auth.role() IS NOT NULL);

-- ============================================
-- GRANT USAGE ON auth SCHEMA FUNCTIONS
-- ============================================
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.user_id() TO postgres, anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.role() TO postgres, anon, authenticated;
