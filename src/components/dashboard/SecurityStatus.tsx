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
      // Load security settings from DB - using actual column names
      // Note: security_settings not in generated types, using type casting
      const { data: settings } = await (supabase as any)
        .from('security_settings')
        .select('ufw_status, fail2ban_status, ssh_port, last_check_at')
        .single();

      // Load 2FA setting from app_settings
      const { data: appSettings } = await supabase
        .from('app_settings')
        .select('key, value')
        .eq('key', 'security');

      // Create a fresh copy of checks to update
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

      // Parse security settings from direct DB columns
      if (settings) {
        // UFW Firewall
        const ufwCheck = newChecks.find(c => c.nameKey === 'firewall');
        if (ufwCheck) {
          if (settings.ufw_status === 'active') {
            ufwCheck.status = 'ok';
            ufwCheck.detail = 'Active';
          } else if (settings.ufw_status === 'inactive') {
            ufwCheck.status = 'error';
            ufwCheck.detail = 'Inactive';
          } else {
            ufwCheck.status = 'warning';
            ufwCheck.detail = settings.ufw_status || 'Unknown';
          }
        }

        // Fail2Ban
        const f2bCheck = newChecks.find(c => c.nameKey === 'fail2ban');
        if (f2bCheck) {
          if (settings.fail2ban_status === 'active') {
            f2bCheck.status = 'ok';
            f2bCheck.detail = 'Running';
          } else if (settings.fail2ban_status === 'inactive') {
            f2bCheck.status = 'warning';
            f2bCheck.detail = 'Not running';
          } else {
            f2bCheck.status = 'warning';
            f2bCheck.detail = settings.fail2ban_status || 'Unknown';
          }
        }

        // Updates - set to unknown for now (no column in DB for this)
        const updCheck = newChecks.find(c => c.nameKey === 'updates');
        if (updCheck) {
          updCheck.status = 'warning';
          updCheck.detail = 'Check manually';
        }
      } else {
        // No settings found - likely first boot
        const ufwCheck = newChecks.find(c => c.nameKey === 'firewall');
        if (ufwCheck) { ufwCheck.detail = 'No Data'; ufwCheck.status = 'warning'; }

        const f2bCheck = newChecks.find(c => c.nameKey === 'fail2ban');
        if (f2bCheck) { f2bCheck.detail = 'No Data'; f2bCheck.status = 'warning'; }

        const updCheck = newChecks.find(c => c.nameKey === 'updates');
        if (updCheck) { updCheck.detail = 'Unknown'; updCheck.status = 'warning'; }
      }

      // 2FA from app settings
      if (appSettings && appSettings[0]?.value) {
        const settingsValue = appSettings[0].value as any;
        if (settingsValue.twoFactor !== undefined) {
          const tfaCheck = newChecks.find(c => c.nameKey === '2fa');
          if (tfaCheck) {
            tfaCheck.status = settingsValue.twoFactor ? 'ok' : 'warning';
            tfaCheck.detail = settingsValue.twoFactor ? 'Enabled' : 'Disabled';
          }
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
    const interval = setInterval(loadSecurityStatus, 60000);
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
    <div className="dashboard-card flex flex-col h-full">
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

      <div className="space-y-2 flex-1">
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
