import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
    user: any | null;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: async () => { },
    logout: () => { },
    isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Check local storage for token
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user_data');
        if (token && userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) {
                console.error("Failed to parse user data", e);
                localStorage.removeItem('user_data');
                localStorage.removeItem('access_token');
            }
            // Set supabase auth header manually if using postgrest directly
            // But supabase-js might need a session. 
            // We are using custom auth, so we might need to inject token into calls.

            // For now, let's assume the backend validates the token passed in headers
            // Supabase client automatically handles headers if we set session?
            // Actually, since we are mimicking Supabase Auth but using our own /api/auth/login,
            // we can set the global headers for supabase client here.
            // Or just store it.
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, pass: string) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: pass }), // gateway expects 'password'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Save token
            localStorage.setItem('access_token', data.token);
            localStorage.setItem('user_data', JSON.stringify(data.user));

            setUser(data.user);

            // Update supabase client headers to include our fresh token?
            // Supabase client uses its own auth state.
            // If we want RLS to work for this user, we need to pass this JWT to supabase calls.
            // Since we are using anon key usually, we need to override Authorization header.
            // But allow supabase-js to manage it might be tricky if we bypass GoTrue.
            // We can use: supabase.auth.setSession (if we had a real session).
            // Since we don't, we might need a custom client or interceptor.
            // Ideally, we replace supabase client usage with a custom one, OR we just set the header.

            // Hack: simply set the token in a way that our requests use it.
            // But standard supabase client reads from storage. 
            // If we use `supabase.functions.invoke`, it uses the token.

            toast.success('Welcome back!');
            navigate('/');
        } catch (error: any) {
            console.error('Login error:', error);
            toast.error(error.message);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        setUser(null);
        navigate('/login');
        toast.info('Logged out');
    };

    // Protect routes logic could go here or in a wrapper
    useEffect(() => {
        if (!isLoading && !user && location.pathname !== '/login') {
            // Redirect to login if strictly required. 
            // For now, allow public access if user doesn't want full lockdown?
            // The user complained about "admin logic". Let's enforce login for /admins page at least.
            // But better enforce for dashboard.
            navigate('/login');
        }
    }, [user, isLoading, location.pathname, navigate]);

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};
