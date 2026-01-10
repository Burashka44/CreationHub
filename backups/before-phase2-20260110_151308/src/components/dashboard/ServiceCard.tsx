import React from 'react';
import { ExternalLink, Server, Database, HardDrive, Container, Terminal, FolderClosed, Shield, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ServiceCardProps {
  name: string;
  port: number;
  status: 'online' | 'offline' | 'unknown';
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

const ServiceCard = ({ name, port, status }: ServiceCardProps) => {
  const { t } = useLanguage();

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'online': return 'bg-success/50 text-white';
      case 'offline': return 'bg-destructive/50 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getIndicatorColor = (s: string) => {
    switch (s) {
      case 'online': return 'bg-success animate-pulse';
      case 'offline': return 'bg-destructive';
      default: return 'bg-muted-foreground';
    }
  };

  // Map services to their correct URLs
  const getServiceUrl = (serviceName: string, port: number) => {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

    // Special URL mappings
    const specialUrls: Record<string, string> = {
      'Adminer': `http://${host}:8083`,
      'NPM': `http://${host}:81`,
      'Nginx Proxy Manager': `http://${host}:81`,
      'File Browser': `http://${host}:8082`,
      'FileBrowser': `http://${host}:8082`,
      'Dozzle': `http://${host}:8888`,
      'n8n': `http://${host}:5678`,
      'Nextcloud': `http://${host}:8081`,
      'Healthchecks': `http://${host}:8001`,
      'RSShub': `http://${host}:1200`,
      'RSSHub': `http://${host}:1200`,
      'Portainer': `http://${host}:9000`,
      'IOPaint': `http://${host}:8585`,
      'Video Processor': `http://${host}:8686`,
      'SAM 2': `http://${host}:8787`,
      'VPN Manager': `http://${host}:5001`,
      'WireGuard UI': `http://${host}:5003`,
      'Browserless': `http://${host}:3002`,
    };

    // Check if service has special URL
    if (specialUrls[serviceName]) {
      return specialUrls[serviceName];
    }

    // Default: use port
    return `http://${host}:${port}`;
  };

  const link = getServiceUrl(name, port);

  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="block h-full">
      <div className="h-full min-h-[120px] flex flex-col justify-between p-3 rounded-lg border border-border bg-muted/50 hover:bg-emerald-500/10 hover:border-primary/30 transition-all duration-300 group">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {serviceIcons[name] || <Server className="h-5 w-5" />}
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs px-2 py-1 rounded-full",
              getStatusColor(status)
            )}>
              {status === 'online' ? t('online') : (status === 'offline' ? t('offline') : 'Unknown')}
            </span>
            <div className={cn(
              "w-2 h-2 rounded-full",
              getIndicatorColor(status)
            )} />
          </div>
        </div>

        <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
          {name}
        </h3>

        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-muted-foreground">{link.replace('http://', '')}</span>
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </a>
  );
};

export default ServiceCard;
