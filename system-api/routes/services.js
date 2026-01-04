const express = require('express');
const axios = require('axios');
const router = express.Router();

// Service registry with health endpoints
const SERVICES = {
    // AI Services
    'ai-chat': { name: 'AI Chat (Ollama)', url: 'http://creationhub_ollama:11434', health: '/api/tags', port: 11434, category: 'ai' },
    'ai-transcribe': { name: 'AI Transcribe (Whisper)', url: 'http://creationhub-ai-transcribe:8000', health: '/health', port: 8000, category: 'ai' },
    'ai-translate': { name: 'AI Translate', url: 'http://creationhub-ai-translate:5000', health: '/languages', port: 5000, category: 'ai' },
    'ai-tts': { name: 'AI TTS', url: 'http://creationhub-ai-tts:5500', health: '/', port: 5500, category: 'ai' },

    // Core Infrastructure
    'postgres': { name: 'PostgreSQL', url: 'http://creationhub-postgres:5432', health: null, port: 5432, category: 'core' },
    'redis': { name: 'Redis', url: 'http://creationhub-redis:6379', health: null, port: 6379, category: 'core' },

    // Admin
    'portainer': { name: 'Portainer', url: 'http://creationhub-portainer:9000', health: '/api/status', port: 9000, category: 'admin' },
    'adminer': { name: 'Adminer', url: 'http://creationhub-adminer:8080', health: '/', port: 8083, category: 'admin' },
    'dozzle': { name: 'Dozzle Logs', url: 'http://creationhub-dozzle:8080', health: '/', port: 8888, category: 'admin' },
    'grafana': { name: 'Grafana', url: 'http://creationhub-grafana:3000', health: '/api/health', port: 3001, category: 'admin' },

    // Automation
    'n8n': { name: 'n8n Workflows', url: 'http://creationhub-n8n:5678', health: '/healthz', port: 5678, category: 'automation' },
    'browserless': { name: 'Browserless', url: 'http://creationhub-browserless:3000', health: '/', port: 3002, category: 'automation' },

    // Media
    'nextcloud': { name: 'Nextcloud', url: 'http://creationhub-nextcloud:80', health: '/status.php', port: 8081, category: 'media' },
    'filebrowser': { name: 'File Browser', url: 'http://creationhub-filebrowser:80', health: '/health', port: 8082, category: 'media' },
    'yt-dlp': { name: 'YouTube DL', url: 'http://creationhub-yt-dlp:8080', health: '/', port: 8084, category: 'media' },

    // Network
    'npm': { name: 'Nginx Proxy Manager', url: 'http://creationhub-npm:81', health: '/api/', port: 81, category: 'network' },
    'wireguard-ui': { name: 'WireGuard UI', url: 'http://creationhub-wireguard-ui:5000', health: '/', port: 5003, category: 'network' },
    'vpn-manager': { name: 'VPN Manager', url: 'http://creationhub-vpn-manager:5000', health: '/status', port: 5001, category: 'network' },

    // System
    'healthchecks': { name: 'Healthchecks', url: 'http://creationhub-healthchecks:8000', health: '/', port: 8001, category: 'system' },
    'homepage': { name: 'Homepage', url: 'http://192.168.1.220:8085', health: '/', port: 8085, category: 'system' },
    'glances': { name: 'Glances', url: 'http://192.168.1.220:61208', health: '/api/4/cpu', port: 61208, category: 'system' },

    // Media (additional)
    'iopaint': { name: 'IOPaint', url: 'http://creationhub-iopaint:8080', health: '/', port: 8585, category: 'media' },
    'rsshub': { name: 'RSSHub', url: 'http://creationhub-rsshub:1200', health: '/', port: 1200, category: 'media' },
    'channel-manager': { name: 'Channel Manager', url: 'http://creationhub-channel-manager:5002', health: '/', port: 5002, category: 'automation' }
};

// Get all services with their status
router.get('/list', (req, res) => {
    res.json(SERVICES);
});

// Check health of a specific service
router.get('/health/:serviceId', async (req, res) => {
    const service = SERVICES[req.params.serviceId];
    if (!service) {
        return res.status(404).json({ error: 'Service not found' });
    }

    if (!service.health) {
        return res.json({ status: 'unknown', message: 'No health endpoint defined' });
    }

    try {
        const response = await axios.get(`${service.url}${service.health}`, { timeout: 3000 });
        res.json({ status: 'healthy', code: response.status });
    } catch (e) {
        res.json({ status: 'unhealthy', error: e.message });
    }
});

// Aggregate health check keyed by PORT (for Dashboard integration)
router.get('/status-by-port', async (req, res) => {
    const results = {};
    const checks = [];

    // Create array of check promises
    for (const service of Object.values(SERVICES)) {
        if (!service.port) continue;

        const check = (async () => {
            const portKey = service.port.toString();
            try {
                if (!service.health) {
                    // If no health check, just check if port is reachable via simple connect equivalent
                    // For now, assume 'online' if it's in the list, or maybe better to skip?
                    // Let's rely on the URL connection check
                    await axios.get(service.url, { timeout: 1500 });
                } else {
                    await axios.get(`${service.url}${service.health}`, { timeout: 1500 });
                }
                results[portKey] = 'online';
            } catch (e) {
                // Determine if it's offline or just an error
                if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND' || e.code === 'ETIMEDOUT') {
                    results[portKey] = 'offline';
                } else {
                    // 404/401/500 means service IS running but returned error -> still "online" in terms of "is it reachable?"
                    // But for "Service Status" we usually want "Healthy".
                    // Let's stick to 'offline' for network errors and 'online' for HTTP errors (since the service IS up)
                    // unless it's a critical health check failure.
                    // Simplified: connection error = offline, response error = online (but maybe unhealthy)
                    results[portKey] = 'online';
                }
            }
        })();
        checks.push(check);
    }

    await Promise.all(checks);
    res.json(results);
});

// Aggregate health check for all services
router.get('/health', async (req, res) => {
    const results = {};

    for (const [id, service] of Object.entries(SERVICES)) {
        if (!service.health) {
            results[id] = { status: 'unknown', name: service.name };
            continue;
        }

        try {
            await axios.get(`${service.url}${service.health}`, { timeout: 2000 });
            results[id] = { status: 'healthy', name: service.name };
        } catch (e) {
            results[id] = { status: 'unhealthy', name: service.name, error: e.message };
        }
    }

    res.json(results);
});

module.exports = router;
