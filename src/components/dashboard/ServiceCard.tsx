import React from 'react';
import { ExternalLink, Server, Database, HardDrive, Container, Terminal, FolderClosed, Shield, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ServiceCardProps {
  name: string;
  port: number;
  status: 'online' | 'offline';
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
  const isOnline = status === 'online';

  // FIX: Use current hostname instead of hardcoded IP
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const link = `http://${host}:${port}`;

  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="block">
      <div className="service-card group cursor-pointer hover:border-primary">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {serviceIcons[name] || <Server className="h-5 w-5" />}
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs px-2 py-1 rounded-full",
              isOnline ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
            )}>
              {isOnline ? t('online') : t('offline')}
            </span>
            <div className={cn(
              "w-2 h-2 rounded-full",
              isOnline ? "bg-success animate-pulse" : "bg-destructive"
            )} />
          </div>
        </div>

        <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
          {name}
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
