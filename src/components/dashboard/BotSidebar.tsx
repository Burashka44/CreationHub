import React, { useState, createContext, useContext } from 'react';
import {
  LayoutDashboard, Users, BarChart3,
  Settings, ChevronLeft, ChevronRight,
  Bot, Megaphone, ArrowLeft
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// Reusing the same context pattern for consistency
interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useBotSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    return { isOpen: true, setIsOpen: () => { } };
  }
  return context;
};

export const BotSidebarProvider = ({ children }: { children: React.ReactNode }) => {
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

const BotSidebar = ({ mobile = false, onNavigate }: SidebarProps = {}) => {
  const { t } = useLanguage();
  const { isOpen, setIsOpen } = useBotSidebar();
  const location = useLocation();

  const menuItems = [
    { path: '/bots', icon: LayoutDashboard, labelKey: 'stats' }, // Dashboard/Overview
    { path: '/bots/list', icon: Bot, labelKey: 'myBots' },
  ];

  const showExpanded = mobile || isOpen;

  return (
    <aside className={cn(
      "flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300", // Darker theme for Bot section distinction
      mobile ? "w-full h-full" : "fixed inset-y-0 left-0 z-50",
      !mobile && (isOpen ? "w-64" : "w-16")
    )}>
      {/* Header with Back Button */}
      <div className="h-16 flex items-center border-b border-slate-800 px-4">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-3 transition-all duration-300 text-slate-400 hover:text-white",
            !showExpanded && "justify-center w-full"
          )}
          title="Back to Main Dashboard"
        >
          <ArrowLeft className="h-5 w-5 shrink-0" />
          <span className={cn(
            "font-semibold transition-all duration-300 whitespace-nowrap overflow-hidden",
            showExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
          )}>
            Exit Bot Studio
          </span>
        </Link>
      </div>

       {/* Project Label */}
       {showExpanded && (
        <div className="px-4 py-4">
          <h2 className="text-xs uppercase text-slate-500 font-bold tracking-wider">
            Bot Management
          </h2>
        </div>
      )}

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin py-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          // Exact match fix for root
          const isExactActive = item.path === '/bots' ? location.pathname === '/bots' : isActive;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={mobile ? onNavigate : undefined}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-3 rounded-lg text-slate-400 transition-all duration-200",
                "hover:text-white hover:bg-slate-800",
                isExactActive && "text-blue-400 bg-blue-400/10 hover:bg-blue-400/20",
                !showExpanded && "justify-center px-2"
              )}
              title={!showExpanded ? t(item.labelKey) : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className={cn(
                "whitespace-nowrap transition-all duration-200 overflow-hidden",
                showExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
              )}>
                {/* Fallback translation until keys added */}
                {
                  item.labelKey === 'stats' ? 'Overview' :
                  item.labelKey === 'myBots' ? 'My Bots' :
                  item.labelKey === 'adCampaigns' ? 'Ad Campaigns' :
                  item.labelKey === 'analytics' ? 'Analytics' :
                  'Settings'
                }
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Collapse button - only on desktop */}
      {!mobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center h-12 border-t border-slate-800 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      )}
    </aside>
  );
};

export default BotSidebar;
