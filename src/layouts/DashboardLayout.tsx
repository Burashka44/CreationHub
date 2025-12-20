import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Sidebar, { SidebarProvider, useSidebar } from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { cn } from '@/lib/utils';
import { Outlet } from 'react-router-dom';

const DashboardLayoutContent = () => {
  const { isOpen } = useSidebar();
  
  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar />
      
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        isOpen ? "ml-64" : "ml-16"
      )}>
        <DashboardHeader />
        
        <main className="flex-1 p-4 lg:p-6 space-y-6 overflow-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const DashboardLayout = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SidebarProvider>
          <DashboardLayoutContent />
        </SidebarProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default DashboardLayout;
