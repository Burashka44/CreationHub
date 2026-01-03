import React, { useState, createContext, useContext } from 'react';
import {
  LayoutDashboard, Database, Shield,
  Settings, ChevronLeft, ChevronRight,
  Activity, HardDrive, Network, History, Users, BarChart3, Sparkles, Server, Video
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    return { isOpen: true, setIsOpen: () => { } };
  }
  return context;
};

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

interface SidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

const Sidebar = ({ mobile = false, onNavigate }: SidebarProps = {}) => {
  const { t } = useLanguage();
  const { isOpen, setIsOpen } = useSidebar();
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, labelKey: 'dashboard' },
    { path: '/services', icon: Server, labelKey: 'services' },
    { path: '/media', icon: BarChart3, labelKey: 'mediaAnalytics' },
    { path: '/admins', icon: Users, labelKey: 'admins' },
    { path: '/ai-hub', icon: Sparkles, labelKey: 'aiHub' },
    { path: '/video-pipeline', icon: Video, labelKey: 'videoPipeline' },
    { path: '/network', icon: Network, labelKey: 'network' },
    { path: '/security', icon: Shield, labelKey: 'security' },
    { path: '/backups', icon: HardDrive, labelKey: 'backups' },
    { path: '/activity', icon: History, labelKey: 'activity' },
    { path: '/settings', icon: Settings, labelKey: 'settings' },
  ];

  // For mobile, always show expanded view and close on navigation
  const showExpanded = mobile || isOpen;

  return (
    <aside className={cn(
      "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
      mobile ? "w-full h-full" : "fixed inset-y-0 left-0 z-50",
      !mobile && (isOpen ? "w-64" : "w-16")
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center border-b border-sidebar-border px-4">
        <Link
          to="/"
          onClick={mobile ? onNavigate : undefined}
          className={cn(
            "flex items-center gap-3 transition-all duration-300",
            !showExpanded && "justify-center w-full"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Activity className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className={cn(
            "font-bold text-foreground transition-all duration-300 whitespace-nowrap overflow-hidden",
            showExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
          )}>
            CreationHub
          </span>
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={mobile ? onNavigate : undefined}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-3 rounded-lg text-muted-foreground transition-all duration-200",
                "hover:text-foreground hover:bg-secondary/50",
                isActive && "text-primary bg-primary/10 hover:bg-primary/15",
                !showExpanded && "justify-center px-2"
              )}
              title={!showExpanded ? t(item.labelKey) : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className={cn(
                "whitespace-nowrap transition-all duration-200 overflow-hidden",
                showExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
              )}>
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className={cn(
        "p-3 border-t border-sidebar-border",
        !showExpanded && "flex justify-center"
      )}>
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg bg-muted/50 transition-all",
          !showExpanded && "p-2 bg-transparent justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-primary">A</span>
          </div>
          <div className={cn(
            "transition-all duration-200 overflow-hidden",
            showExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
          )}>
            <p className="text-sm font-medium text-foreground">Admin</p>
            <p className="text-xs text-muted-foreground">admin@server.com</p>
          </div>
        </div>
      </div>

      {/* Collapse button - only on desktop */}
      {!mobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center h-12 border-t border-sidebar-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      )}
    </aside>
  );
};

export default Sidebar;
