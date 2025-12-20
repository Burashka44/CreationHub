import React from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ServiceCardProps {
  name: string;
  description: string;
  url: string;
  port: number;
  icon: React.ReactNode;
  isOnline?: boolean;
}

const ServiceCard = ({ name, description, url, port, icon, isOnline = true }: ServiceCardProps) => {
  const { t } = useLanguage();

  const handleClick = () => {
    window.open(url, '_blank');
  };

  return (
    <div 
      className="service-card group"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs px-2 py-1 rounded-full",
            isOnline ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
          )}>
            {isOnline ? t('online') : t('offline')}
          </span>
          <div className={cn(
            isOnline ? "status-online" : "status-offline"
          )} />
        </div>
      </div>
      
      <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
        {name}
      </h3>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
        {description}
      </p>
      
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-muted-foreground">:{port}</span>
        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
};

export default ServiceCard;
