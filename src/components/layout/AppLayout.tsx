import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Network,
    Shield,
    Settings,
    MessagesSquare,
    Sparkles,
    Video,
    Database,
    Users,
    ChartBar,
    HelpCircle,
    Menu,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';

const menuItems = [
    { icon: LayoutDashboard, label: { en: 'Dashboard', ru: 'Главная' }, path: '/' },
    { icon: MessagesSquare, label: { en: 'Services', ru: 'Сервисы' }, path: '/services' },
    { icon: Sparkles, label: { en: 'AI Hub', ru: 'AI Hub' }, path: '/ai-hub' },
    { icon: Video, label: { en: 'Pipeline', ru: 'Видео' }, path: '/video' },
    { icon: ChartBar, label: { en: 'Media', ru: 'Медиа' }, path: '/media' },
    { icon: Network, label: { en: 'Network', ru: 'Сеть' }, path: '/network' },
    { icon: Shield, label: { en: 'Security', ru: 'Безопасность' }, path: '/security' },
    { icon: Database, label: { en: 'Backups', ru: 'Бэкапы' }, path: '/backups' },
    { icon: Users, label: { en: 'Admins', ru: 'Админы' }, path: '/admins' },
    { icon: Settings, label: { en: 'Settings', ru: 'Настройки' }, path: '/settings' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const location = useLocation();
    const { language } = useLanguage();

    return (
        <nav className="flex flex-col gap-1 p-4">
            {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={onNavigate}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                            isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                    >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">
                            {item.label[language]}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}

export function AppLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50 flex items-center px-4">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h2 className="text-lg font-semibold">CreationHub</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
                    </SheetContent>
                </Sheet>
                <h1 className="ml-3 text-lg font-semibold">CreationHub</h1>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden md:block fixed left-0 top-0 h-screen w-64 bg-card border-r border-border">
                <div className="flex items-center h-14 px-4 border-b border-border">
                    <h1 className="text-xl font-bold">CreationHub</h1>
                </div>
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="md:ml-64 pt-14 md:pt-0 min-h-screen">
                <div className="p-4 md:p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
