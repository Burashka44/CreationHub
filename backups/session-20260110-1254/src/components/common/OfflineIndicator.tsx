
import { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';

const OfflineIndicator = () => {
    const [isOffline, setIsOffline] = useState(false);
    const [backendDown, setBackendDown] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            // Check network connectivity first
            if (!navigator.onLine) {
                setIsOffline(true);
                return;
            }

            try {
                // Check backend health
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), 3000);

                // Use explicit system health endpoint which proxies to system-api
                const res = await fetch('/api/system/health', {
                    signal: controller.signal,
                    headers: { 'Cache-Control': 'no-cache' }
                });

                clearTimeout(id);

                if (!res.ok) {
                    throw new Error('Backend error');
                }

                setIsOffline(false);
                setBackendDown(false);
            } catch (e) {
                console.error("Health check failed", e);
                // If we can't reach backend, we are "offline" in terms of functionality
                setBackendDown(true);
            }
        };

        // Check every 10 seconds
        const interval = setInterval(checkStatus, 10000);
        // Initial check
        checkStatus();

        // Listen for browser offline/online events
        window.addEventListener('offline', () => setIsOffline(true));
        window.addEventListener('online', () => setIsOffline(false));

        return () => {
            clearInterval(interval);
            window.removeEventListener('offline', () => setIsOffline(true));
            window.removeEventListener('online', () => setIsOffline(false));
        };
    }, []);

    if (!isOffline && !backendDown) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom duration-300">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${isOffline ? 'bg-destructive text-destructive-foreground border-destructive' : 'bg-warning text-warning-foreground border-warning-foreground/20'
                }`}>
                {isOffline ? <WifiOff className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">
                        {isOffline ? 'No Internet Connection' : 'System API Unreachable'}
                    </span>
                    <span className="text-xs opacity-90">
                        {isOffline ? 'Check your network settings.' : 'Backend services may be down.'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default OfflineIndicator;
