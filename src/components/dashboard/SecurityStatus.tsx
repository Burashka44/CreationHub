import { ShieldCheck, CheckCircle, AlertTriangle, XCircle, Lock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityCheck {
  nameKey: string;
  label: string;
  status: 'ok' | 'warning' | 'error' | 'unknown';
  detail?: string;
}

const SecurityStatus = () => {
  const { t } = useLanguage();
  const [checks, setChecks] = useState<SecurityCheck[]>([
    { nameKey: 'firewall', label: 'UFW Firewall', status: 'unknown' },
    { nameKey: 'fail2ban', label: 'Fail2Ban', status: 'unknown' },
    { nameKey: 'ssl', label: 'SSL Certificate', status: 'unknown' },
    { nameKey: '2fa', label: '2FA', status: 'unknown' },
    { nameKey: 'updates', label: 'Security Updates', status: 'unknown' },
  ]);
  const [score, setScore] = useState(0);
  const [bannedIps, setBannedIps] = useState(0);

  useEffect(() => {
    const loadSecurityStatus = async () => {
      // Load security settings from DB
      const { data: settings } = await supabase
        .from('security_settings')
        .select('setting_key, setting_value');

      // Load 2FA setting from app_settings
      const { data: appSettings } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('key', 'security');

      // Create a fresh copy of checks to update
      // We re-initialize with default state to ensure clean slate (except maybe SSL which is consistent)
      // Actually, better to copy from current state or default.
      // Let's copy from defaults for simplicity in logic
      const newChecks: SecurityCheck[] = [
        { nameKey: 'firewall', label: 'UFW Firewall', status: 'unknown' },
        { nameKey: 'fail2ban', label: 'Fail2Ban', status: 'unknown' },
        { nameKey: 'ssl', label: 'SSL Certificate', status: 'unknown' },
        { nameKey: '2fa', label: '2FA', status: 'unknown' },
        { nameKey: 'updates', label: 'Security Updates', status: 'unknown' },
      ];

      // Check SSL
      const isHttps = window.location.protocol === 'https:';
      const sslCheck = newChecks.find(c => c.nameKey === 'ssl');
      if (sslCheck) {
        sslCheck.status = isHttps ? 'ok' : 'warning';
        sslCheck.detail = isHttps ? 'Valid' : 'HTTP only';
      }

      // Parse security settings if available
      if (settings && settings.length > 0) {
        settings.forEach((s: any) => {
          if (s.setting_key === 'realtime' && s.setting_value) {
            let val = s.setting_value;
            if (typeof val === 'string') {
              try {
                val = JSON.parse(val);
              } catch (e) {
                console.error("JSON parse error", e);
                return;
              }
            }

            // UFW
            const ufwCheck = newChecks.find(c => c.nameKey === 'firewall');
            if (ufwCheck && val.ufw) {
              ufwCheck.status = val.ufw.status === 'active' ? 'ok' : 'error';
              ufwCheck.detail = val.ufw.status === 'active' ? `${val.ufw.rules || 0} rules` : 'Inactive';
            }

            // Fail2Ban
            const f2bCheck = newChecks.find(c => c.nameKey === 'fail2ban');
            if (f2bCheck && val.fail2ban) {
              f2bCheck.status = val.fail2ban.status === 'active' ? 'ok' : 'warning';
              f2bCheck.detail = val.fail2ban.status === 'active' ? `${val.fail2ban.jails || 0} jails` : 'Not running';
              setBannedIps(val.fail2ban.banned || 0);
            }

            // Updates
            const updCheck = newChecks.find(c => c.nameKey === 'updates');
            if (updCheck && val.updates !== undefined) {
              updCheck.status = val.updates === 0 ? 'ok' : 'warning';
              updCheck.detail = val.updates === 0 ? 'Up to date' : `${val.updates} pending`;
            }
          }
        });
      } else {
        // No settings found - likely recorder not running or first boot
        const ufwCheck = newChecks.find(c => c.nameKey === 'firewall');
        if (ufwCheck) { ufwCheck.detail = 'No Data'; ufwCheck.status = 'warning'; }

        const f2bCheck = newChecks.find(c => c.nameKey === 'fail2ban');
        if (f2bCheck) { f2bCheck.detail = 'No Data'; f2bCheck.status = 'warning'; }

        const updCheck = newChecks.find(c => c.nameKey === 'updates');
        if (updCheck) { updCheck.detail = 'Unknown'; updCheck.status = 'warning'; }
      }

      // 2FA from app settings
      if (appSettings && appSettings[0]?.value?.twoFactor !== undefined) {
        const tfaCheck = newChecks.find(c => c.nameKey === '2fa');
        if (tfaCheck) {
          tfaCheck.status = appSettings[0].value.twoFactor ? 'ok' : 'warning';
          tfaCheck.detail = appSettings[0].value.twoFactor ? 'Enabled' : 'Disabled';
        }
      }

      // Calculate score
      const okCount = newChecks.filter(c => c.status === 'ok').length;
      const warningCount = newChecks.filter(c => c.status === 'warning').length;
      const totalChecks = newChecks.length;
      const calculatedScore = Math.round(((okCount + warningCount * 0.5) / totalChecks) * 100);

      setChecks(newChecks);
      setScore(calculatedScore);
    };

    loadSecurityStatus();

    // Refresh every 30 seconds
    const interval = setInterval(loadSecurityStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'unknown': return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';
  const scoreGradient = score >= 80
    ? 'from-emerald-500 to-emerald-600'
    : score >= 50
      ? 'from-amber-500 to-amber-600'
      : 'from-red-500 to-red-600';

  return (
    <div className="dashboard-card">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{t('securityStatus')}</h3>
        {bannedIps > 0 && (
          <span className="ml-auto text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
            {bannedIps} blocked
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border">
        <div className="relative">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${scoreGradient} flex items-center justify-center shadow-lg`}>
            <span className="text-xl font-bold text-white">{score}</span>
          </div>
          <Lock className="absolute -bottom-1 -right-1 h-5 w-5 text-primary bg-card rounded-full p-0.5" />
        </div>
        <div>
          <p className="font-medium text-foreground">Security Score</p>
          <p className={`text-sm ${scoreColor}`}>
            {score >= 80 ? 'Well Protected' : score >= 50 ? 'Needs Attention' : 'Critical'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {checks.map((check) => (
          <div
            key={check.nameKey}
            className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {getIcon(check.status)}
              <span className="text-sm text-foreground">{check.label}</span>
            </div>
            <span className={`text-xs ${check.status === 'ok' ? 'text-emerald-400' :
              check.status === 'warning' ? 'text-amber-400' :
                check.status === 'error' ? 'text-red-400' : 'text-muted-foreground'
              }`}>
              {check.detail || (check.status === 'unknown' ? 'Checking...' : check.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityStatus;
