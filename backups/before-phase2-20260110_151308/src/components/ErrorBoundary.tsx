import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            const isDevelopment = import.meta.env.DEV;

            return (
                <div style={{
                    padding: '40px',
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff'
                }}>
                    <div style={{ maxWidth: '600px', textAlign: 'center' }}>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#ef4444' }}>
                            Что-то пошло не так
                        </h1>
                        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#94a3b8' }}>
                            Произошла непредвиденная ошибка. Пожалуйста, обновите страницу или свяжитесь с поддержкой.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '12px 24px',
                                fontSize: '1rem',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            Обновить страницу
                        </button>

                        {isDevelopment && (
                            <div style={{
                                marginTop: '2rem',
                                textAlign: 'left',
                                background: '#0f0f0f',
                                padding: '1rem',
                                borderRadius: '8px',
                                overflow: 'auto'
                            }}>
                                <h3 style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>Debug Info (dev only):</h3>
                                <pre style={{ fontSize: '0.875rem', color: '#ef4444', whiteSpace: 'pre-wrap' }}>
                                    {this.state.error?.toString()}
                                </pre>
                                <pre style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                                    {this.state.error?.stack}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
