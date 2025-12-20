import { Shield, CheckCircle, AlertTriangle, XCircle, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const SecurityStatus = () => {
  const securityScore = 87;
  const checks = [
    { name: 'Firewall Active', status: 'ok' as const },
    { name: 'SSL Certificate', status: 'ok' as const },
    { name: 'DDoS Protection', status: 'ok' as const },
    { name: 'Malware Scan', status: 'warning' as const },
    { name: 'Failed Login Attempts', status: 'ok' as const },
    { name: '2FA Enabled', status: 'error' as const },
  ];

  const getIcon = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const scoreColor = securityScore >= 80 ? 'text-success' : securityScore >= 60 ? 'text-warning' : 'text-destructive';

  return (
    <div className="dashboard-card">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Security Status</h3>
      </div>

      {/* Security Score */}
      <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-muted/50 border border-border">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-success/30 flex items-center justify-center">
            <span className={cn("text-xl font-bold", scoreColor)}>{securityScore}</span>
          </div>
          <Lock className="absolute -bottom-1 -right-1 h-5 w-5 text-primary bg-card rounded-full p-0.5" />
        </div>
        <div>
          <p className="font-medium text-foreground">Security Score</p>
          <p className="text-sm text-muted-foreground">Your server is well protected</p>
        </div>
      </div>

      {/* Security Checks */}
      <div className="space-y-2">
        {checks.map((check) => (
          <div
            key={check.name}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm text-foreground">{check.name}</span>
            {getIcon(check.status)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityStatus;
