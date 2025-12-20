import React from 'react';
import { 
  LayoutDashboard, Briefcase, Database, Shield, 
  Youtube, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar = ({ isOpen, setIsOpen, activeTab, setActiveTab }: SidebarProps) => {
  const { t } = useLanguage();

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { id: 'work', icon: Briefcase, label: t('work') },
    { id: 'data', icon: Database, label: t('data') },
    { id: 'admin', icon: Shield, label: t('admin') },
    { id: 'channels', icon: Youtube, label: t('channels') },
    { id: 'settings', icon: Settings, label: t('settings') },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        isOpen ? "w-64" : "w-0 lg:w-20",
        "overflow-hidden"
      )}>
        <div className="flex-1 py-6 px-3 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) setIsOpen(false);
              }}
              className={cn(
                "sidebar-item w-full",
                activeTab === item.id && "active"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className={cn(
                "whitespace-nowrap transition-opacity duration-200",
                isOpen ? "opacity-100" : "lg:opacity-0 lg:w-0"
              )}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Collapse button - desktop only */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden lg:flex items-center justify-center h-12 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
