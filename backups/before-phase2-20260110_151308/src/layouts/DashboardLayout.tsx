import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Mobile: Hamburger + Drawer */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar mobile onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Permanent Sidebar */}
      <aside className="hidden md:block fixed left-0 top-0 h-screen w-64 border-r bg-card z-40">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full md:ml-64">
        <DashboardHeader />
        <main className="flex-1 p-4 lg:p-6 space-y-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
