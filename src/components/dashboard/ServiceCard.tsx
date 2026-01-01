import React from 'react';
import { ExternalLink, Server, Database, HardDrive, Container, Terminal, FolderClosed, Shield, Activity, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ServiceCardProps {
  name: string;
  port: number;
  status: 'online' | 'offline';
  scope?: 'WAN' | 'LAN' | 'Closed';
}

const serviceIcons: Record<string, React.ReactNode> = {
  CreationHub: <Server className="h-5 w-5" />,
  Portainer: <Container className="h-5 w-5" />,
  NPM: <Shield className="h-5 w-5" />,
  n8n: <HardDrive className="h-5 w-5" />,
  FileBrowser: <FolderClosed className="h-5 w-5" />,
  Glances: <Activity className="h-5 w-5" />,
  Nginx: <Server className="h-5 w-5" />,
  PostgreSQL: <Database className="h-5 w-5" />,
  Redis: <HardDrive className="h-5 w-5" />,
  Docker: <Container className="h-5 w-5" />,
  SSH: <Terminal className="h-5 w-5" />,
  FTP: <FolderClosed className="h-5 w-5" />,
};

const ServiceCard = ({ name, port, status, scope = 'LAN' }: ServiceCardProps) => {
  const { t } = useLanguage();
  const isOnline = status === 'online';

  // FIX: Force LAN IP to solve "Address 100" Tailscale/VPN bug
  // Use current window hostname if available, fallback to 192.168.1.220
  const host = typeof window !== 'undefined' ? window.location.hostname : '192.168.1.220';
  const link = `http://${host}:${port}`;

  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="block">
      <div className="service-card group cursor-pointer hover:border-primary">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {serviceIcons[name] || <Server className="h-5 w-5" />}
          </div>
          <div className="flex items-center gap-2">
            {/* Status Badge */}
            <span className={cn(
              "text-xs px-2 py-1 rounded-full border",
              isOnline ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"
            )}>
              {isOnline ? t('online') : t('offline')}
            </span>

            {/* Scope Badge (Always Visible) */}
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded cursor-help transition-colors flex items-center gap-1",
              scope === 'WAN'
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
            )} title={scope === 'WAN' ? "Visible to Internet" : "LAN Only"}>
              {scope === 'WAN' ? <Globe className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
              {scope}
            </span>
          </div>
        </div>

        <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors flex items-center justify-between">
          {name}
          <div className={cn(
            "w-2 h-2 rounded-full",
            isOnline ? "bg-success animate-pulse" : "bg-destructive"
          )} />
        </h3>

        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-muted-foreground">{host}:{port}</span>
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </a>
  );
};

export default ServiceCard;
