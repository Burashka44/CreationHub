import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Search, Moon, Sun, Globe, Settings, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Dashboard pages for search
const dashboardPages = [
  { name: 'Dashboard', path: '/', keywords: ['главная', 'home', 'main', 'дашборд'] },
  { name: 'Services', path: '/services', keywords: ['сервисы', 'docker', 'контейнеры', 'services'] },
  { name: 'Network', path: '/network', keywords: ['сеть', 'vpn', 'dns', 'network', 'трафик'] },
  { name: 'Media Analytics', path: '/media', keywords: ['медиа', 'youtube', 'telegram', 'аналитика'] },
  { name: 'AI Hub', path: '/ai', keywords: ['ai', 'искусственный', 'интеллект', 'gpt', 'нейросеть'] },
  { name: 'Admins', path: '/admins', keywords: ['админы', 'пользователи', 'admins', 'users'] },
  { name: 'Settings', path: '/settings', keywords: ['настройки', 'settings', 'конфиг', 'api'] },
];

const DashboardHeader = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof dashboardPages>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close results on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search handler
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const q = query.toLowerCase();
    const matches = dashboardPages.filter(page =>
      page.name.toLowerCase().includes(q) ||
      page.keywords.some(k => k.includes(q))
    );
    setSearchResults(matches);
    setShowResults(true);
  };

  // Navigate to page or Google
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchResults.length > 0) {
        // Navigate to first match
        navigate(searchResults[0].path);
        setSearchQuery('');
        setShowResults(false);
      } else if (searchQuery.length > 0) {
        // Google search
        window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
        setSearchQuery('');
        setShowResults(false);
      }
    }
  };

  const handleResultClick = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleGoogleSearch = () => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <Cpu className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">CreationHub</h1>
            <p className="text-xs text-muted-foreground">{t('dashboard')}</p>
          </div>
        </div>
      </div>

      {/* Unified Search */}
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-8" ref={searchRef}>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по Dashboard или Google..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />

          {/* Search Results Dropdown */}
          {showResults && (searchResults.length > 0 || searchQuery.length >= 2) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
              {searchResults.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/30">
                    Dashboard Pages
                  </div>
                  {searchResults.map((page) => (
                    <button
                      key={page.path}
                      onClick={() => handleResultClick(page.path)}
                      className="w-full px-4 py-2.5 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors"
                    >
                      <Search className="h-4 w-4 text-primary" />
                      <span className="text-foreground">{page.name}</span>
                    </button>
                  ))}
                </>
              )}

              {/* Google Search Option */}
              <div className="border-t border-border">
                <button
                  onClick={handleGoogleSearch}
                  className="w-full px-4 py-2.5 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-blue-400" />
                  <span className="text-foreground">Search Google for "{searchQuery}"</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem onClick={() => setLanguage('ru')} className={language === 'ru' ? 'bg-primary/10' : ''}>
              🇷🇺 Русский
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('en')} className={language === 'en' ? 'bg-primary/10' : ''}>
              🇬🇧 English
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <Settings className="h-5 w-5" />
        </Button>

        {user && (
          <Button variant="ghost" size="icon" onClick={logout} title="Sign Out">
            <LogOut className="h-5 w-5 text-destructive" />
          </Button>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;
