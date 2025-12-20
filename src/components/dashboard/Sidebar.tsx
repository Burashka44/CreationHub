import React, { useState } from 'react';
import { 
  LayoutDashboard, Briefcase, Database, Shield, 
  Youtube, Settings, ChevronLeft, ChevronRight,
  Activity, Bell, HardDrive, Network, History
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { id: 'channels', icon: Youtube, label: t('channels') },
    { id: 'data', icon: Database, label: t('data') },
    { id: 'network', icon: Network, label: 'Network' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'backups', icon: HardDrive, label: 'Backups' },
    { id: 'activity', icon: History, label: 'Activity' },
    { id: 'settings', icon: Settings, label: t('settings') },
  ];

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
      isOpen ? "w-64" : "w-16"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-sidebar-border px-4">
        <div className={cn(
          "flex items-center gap-3 transition-all duration-300",
          !isOpen && "justify-center"
        )}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Activity className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className={cn(
            "font-bold text-foreground transition-all duration-300 whitespace-nowrap",
            isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          )}>
            CreationHub
          </span>
        </div>
      </div>

      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "sidebar-item w-full group relative",
              activeTab === item.id && "active"
            )}
            title={!isOpen ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className={cn(
              "whitespace-nowrap transition-all duration-200",
              isOpen ? "opacity-100 ml-0" : "opacity-0 w-0 overflow-hidden absolute left-14 bg-popover px-2 py-1 rounded-md shadow-lg border border-border group-hover:opacity-100 group-hover:w-auto"
            )}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* User section */}
      <div className={cn(
        "p-3 border-t border-sidebar-border",
        !isOpen && "flex justify-center"
      )}>
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg bg-muted/50 transition-all",
          !isOpen && "p-2 bg-transparent"
        )}>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-primary">A</span>
          </div>
          <div className={cn(
            "transition-all duration-200",
            isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          )}>
            <p className="text-sm font-medium text-foreground">Admin</p>
            <p className="text-xs text-muted-foreground">admin@server.com</p>
          </div>
        </div>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>
    </aside>
  );
};

export default Sidebar;
