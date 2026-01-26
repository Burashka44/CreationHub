import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';

export interface BotService {
    id: string;
    name: string;
    status: 'connected' | 'available' | 'disconnected';
    type: 'ai' | 'video' | 'db' | 'other';
}

export interface LogEntry {
    id: string;
    timestamp: string;
    level: 'info' | 'error' | 'warn' | 'debug';
    message: string;
}

export interface Bot {
    id: number;
    name: string;
    username: string;
    token: string;
    status: 'active' | 'stopped';
    users: number;
    storageTotal: number; // MB
    storageUsed: number; // MB
    sourceType: 'git' | 'zip';
    sourceUrl?: string; // Git URL or Filename
    services: BotService[];
    created_at: string;
    logs: LogEntry[];
    env: Record<string, string>;
}

interface BotContextType {
    bots: Bot[];
    addBot: (token: string, storageSize: number, gitUrl?: string, zipFile?: File) => void;
    deleteBot: (id: number) => void;
    toggleBotStatus: (id: number) => void;
    clearLogs: (id: number) => void;
    addLog: (id: number, level: LogEntry['level'], message: string) => void;
    updateEnv: (id: number, env: Record<string, string>) => void;
    stats: {
        totalBots: number;
        activeBots: number;
        totalUsers: number;
        totalStorage: number; // MB
        usedStorage: number; // MB
    };
}

const BotContext = createContext<BotContextType | undefined>(undefined);

export const BotProvider = ({ children }: { children: ReactNode }) => {
    const { t } = useLanguage();

    // Initial Mock Data
    const defaultBots: Bot[] = [
        { 
            id: 1, 
            name: "CreationHub Helper", 
            username: "@creationhub_helper_bot", 
            token: "***********",
            status: "active", 
            users: 540, 
            storageTotal: 500, 
            storageUsed: 120,
            sourceType: 'git',
            sourceUrl: 'github.com/creationhub/helper',
            created_at: new Date().toISOString(),
            services: [
                { id: 'db', name: 'PostgreSQL (Isolated)', status: 'connected', type: 'db' },
                { id: 'ai', name: 'Local LLM (Ollama)', status: 'connected', type: 'ai' },
            ],
            logs: [
                { id: '1', timestamp: new Date(Date.now() - 3600000).toISOString(), level: 'info', message: 'Bot started successfully' },
                { id: '2', timestamp: new Date(Date.now() - 3500000).toISOString(), level: 'info', message: 'Connected to PostgreSQL database' },
                { id: '3', timestamp: new Date(Date.now() - 3400000).toISOString(), level: 'warn', message: 'High memory usage: 85%' },
            ],
            env: {
                TOKEN: '***********',
                DB_HOST: 'localhost',
                DB_PORT: '5432'
            }
        },
        { 
            id: 2, 
            name: "Support Bot", 
            username: "@creationhub_support_bot", 
            token: "***********",
            status: "active", 
            users: 120, 
            storageTotal: 1000, 
            storageUsed: 450,
            sourceType: 'zip',
            sourceUrl: 'bot_v2.zip',
            created_at: new Date().toISOString(),
            services: [
                { id: 'db', name: 'PostgreSQL (Isolated)', status: 'connected', type: 'db' },
            ],
            logs: [
                 { id: '1', timestamp: new Date().toISOString(), level: 'info', message: 'Environment initialized' }
            ],
            env: {
                TOKEN: '***********',
                DEBUG: 'true'
            }
        },
    ];

    const [bots, setBots] = useState<Bot[]>(() => {
        const saved = localStorage.getItem('creationhub_bots');
        const loadedBots = saved ? JSON.parse(saved) : defaultBots;
        
        // Migrate old bot data to ensure logs and env exist
        return loadedBots.map((bot: any) => ({
            ...bot,
            logs: Array.isArray(bot.logs) ? bot.logs : [],
            env: bot.env || {}
        }));
    });

    // Save to localStorage whenever bots change
    React.useEffect(() => {
        localStorage.setItem('creationhub_bots', JSON.stringify(bots));
    }, [bots]);

    const addBot = (token: string, storageSize: number, gitUrl?: string, zipFile?: File) => {
        // Validation: Strict Unique Token Check
        if (bots.some(b => b.token === token)) {
            toast.error(t('tokenExistsError'));
            return;
        }

        // Auto-Discovery Simulation
        // In a real app, we would scan the environment or config
        const discoveredServices: BotService[] = [
            { id: 'db', name: 'PostgreSQL (Isolated)', status: 'connected', type: 'db' },
            // Auto-link Local AI if available
            { id: 'ai', name: 'Local LLM (Ollama)', status: 'connected', type: 'ai' },
            { id: 'video', name: 'Video Pipeline API', status: 'connected', type: 'video' },
        ];

        const newBot: Bot = {
            id: Date.now() + Math.floor(Math.random() * 1000), // Prevent collision
            name: `Bot ${token.substring(0, 8)}...`,
            username: `@new_bot_${Date.now()}`,
            token: token,
            status: 'stopped',
            users: 0,
            storageTotal: storageSize,
            storageUsed: 0, // Fresh volume
            sourceType: gitUrl ? 'git' : 'zip',
            sourceUrl: gitUrl || zipFile?.name || 'unknown',
            created_at: new Date().toISOString(),
            services: discoveredServices,
            logs: [],
            env: { TOKEN: token }
        };

        setBots(prev => [...prev, newBot]);
        toast.success(t('botCreatedSuccess'));
    };

    const deleteBot = (id: number) => {
        setBots(prev => prev.filter(b => b.id !== id));
        toast.success(t('botDeletedSuccess'));
    };

    const clearLogs = (id: number) => {
        setBots(prev => prev.map(b => b.id === id ? { ...b, logs: [] } : b));
        toast.success("Logs cleared");
    };

    const addLog = (id: number, level: LogEntry['level'], message: string) => {
        const newLog: LogEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            level,
            message
        };
        setBots(prev => prev.map(b => 
            b.id === id ? { ...b, logs: [newLog, ...b.logs].slice(0, 1000) } : b
        ));
    };

    const updateEnv = (id: number, env: Record<string, string>) => {
        setBots(prev => prev.map(b => b.id === id ? { ...b, env } : b));
        toast.success("Environment variables updated");
    };

    const toggleBotStatus = (id: number) => {
        setBots(prev => prev.map(b => {
             if (b.id === id) {
                 const newStatus = b.status === 'active' ? 'stopped' : 'active';
                 toast.success(`${t('botStatusChanged')} ${newStatus}`);
                 return { ...b, status: newStatus };
             }
             return b;
        }));
    };

    const stats = {
        totalBots: bots.length,
        activeBots: bots.filter(b => b.status === 'active').length,
        totalUsers: bots.reduce((acc, b) => acc + b.users, 0),
        totalStorage: bots.reduce((acc, b) => acc + b.storageTotal, 0),
        usedStorage: bots.reduce((acc, b) => acc + b.storageUsed, 0),
    };

    return (
        <BotContext.Provider value={{ bots, addBot, deleteBot, toggleBotStatus, clearLogs, addLog, updateEnv, stats }}>
            {children}
        </BotContext.Provider>
    );
};

export const useBots = () => {
    const context = useContext(BotContext);
    if (!context) {
        throw new Error('useBots must be used within a BotProvider');
    }
    return context;
};
