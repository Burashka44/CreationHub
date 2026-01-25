import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import BotSidebar, { BotSidebarProvider, useBotSidebar } from "@/components/dashboard/BotSidebar";
import { cn } from "@/lib/utils";

const BotLayoutContent = () => {
    const { isOpen } = useBotSidebar();
    const [isMobile, setIsMobile] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Handle responsiveness
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close mobile menu on navigation
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex h-screen bg-background overflow-hidden font-inter">
            {/* Desktop Sidebar */}
            {!isMobile && <BotSidebar />}

            {/* Content Area */}
            <div className={cn(
                "flex-1 flex flex-col h-full transition-all duration-300 overflow-hidden",
                !isMobile && (isOpen ? "ml-64" : "ml-16")
            )}>
                {/* Mobile Header */}
                {isMobile && (
                    <header className="h-16 border-b px-4 flex items-center justify-between bg-background z-20">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <Menu className="h-6 w-6" />
                        </Button>
                        <span className="font-semibold">Bot Management</span>
                        <div className="w-10" /> {/* Spacer */}
                    </header>
                )}

                {/* Mobile Sidebar Overlay */}
                {isMobile && mobileMenuOpen && (
                    <div className="fixed inset-0 z-50 flex">
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <div className="relative w-64 h-full bg-background z-50 animate-in slide-in-from-left">
                            <BotSidebar mobile onNavigate={() => setMobileMenuOpen(false)} />
                        </div>
                    </div>
                )}

                {/* Main Content Scroll Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth scrollbar-thin">
                    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

const BotLayout = () => {
    return (
        <BotSidebarProvider>
            <BotLayoutContent />
        </BotSidebarProvider>
    );
};

export default BotLayout;
