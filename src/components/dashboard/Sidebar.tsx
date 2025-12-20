import React, { useState } from 'react';
import { 
  LayoutDashboard, Briefcase, Database, Shield, 
  Youtube, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { id: 'work', icon: Briefcase, label: t('work') },
    { id: 'data', icon: Database, label: t('data') },
    { id: 'admin', icon: Shield, label: t('admin') },
    { id: 'channels', icon: Youtube, label: t('channels') },
    { id: 'settings', icon: Settings, label: t('settings') },
  ];

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
      isOpen ? "w-64" : "w-16"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-sidebar-border">
        <span className={cn(
          "font-bold text-primary transition-all duration-300",
          isOpen ? "text-xl" : "text-sm"
        )}>
          {isOpen ? "CreationHub" : "CH"}
        </span>
      </div>

      <div className="flex-1 py-6 px-3 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "sidebar-item w-full",
              activeTab === item.id && "active"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className={cn(
              "whitespace-nowrap transition-opacity duration-200",
              isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
            )}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>
    </aside>
  );
};

export default Sidebar;
