import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
    user: any | null;
    isLoading: boolean;
    login: (email: string, pass: string, remember?: boolean) => Promise<void>;
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
        // Check local storage then session storage for token
        let token = localStorage.getItem('access_token');
        let userData = localStorage.getItem('user_data');

        if (!token || !userData) {
            token = sessionStorage.getItem('access_token');
            userData = sessionStorage.getItem('user_data');
        }

        if (token && userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) {
                console.error("Failed to parse user data", e);
                localStorage.removeItem('user_data');
                localStorage.removeItem('access_token');
                sessionStorage.removeItem('user_data');
                sessionStorage.removeItem('access_token');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, pass: string, remember: boolean = false) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: pass }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Save token based on remember me preference
            if (remember) {
                localStorage.setItem('access_token', data.token);
                localStorage.setItem('user_data', JSON.stringify(data.user));
                // Clear session to avoid confusion
                sessionStorage.removeItem('access_token');
                sessionStorage.removeItem('user_data');
            } else {
                sessionStorage.setItem('access_token', data.token);
                sessionStorage.setItem('user_data', JSON.stringify(data.user));
                // Clear local
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_data');
            }

            setUser(data.user);

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
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user_data');
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
