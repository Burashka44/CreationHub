const express = require('express');
const { exec } = require('child_process');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(express.json());

// AI Service configurations
const AI_SERVICES = {
    ollama: {
        container: 'creationhub_ollama',
        port: 11434,
        healthCheck: 'http://localhost:11434/api/tags',
        idleTimeout: 5 * 60 * 1000, // 5 minutes
    },
    whisper: {
        container: 'creationhub-ai-transcribe',
        port: 8000,
        healthCheck: 'http://localhost:8000/health',
        idleTimeout: 5 * 60 * 1000,
    },
    translate: {
        container: 'creationhub-ai-translate',
        port: 5000,
        healthCheck: 'http://localhost:5000/languages',
        idleTimeout: 10 * 60 * 1000, // 10 minutes (slow to start)
    },
    tts: {
        container: 'creationhub-ai-tts',
        port: 10200,
        healthCheck: null, // Wyoming protocol, no HTTP health
        idleTimeout: 5 * 60 * 1000,
    }
};

// Track last activity per service
const lastActivity = {};
const startingServices = new Set();

// Execute shell command
const execAsync = (cmd) => new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout.trim());
    });
});

// Check if container is running
async function isContainerRunning(container) {
    try {
        const result = await execAsync(`docker inspect -f '{{.State.Running}}' ${container} 2>/dev/null`);
        return result === 'true';
    } catch {
        return false;
    }
}

// Start container and wait for health
async function startService(serviceName) {
    const service = AI_SERVICES[serviceName];
    if (!service) throw new Error(`Unknown service: ${serviceName}`);

    if (startingServices.has(serviceName)) {
        console.log(`[${serviceName}] Already starting, waiting...`);
        // Wait for startup
        for (let i = 0; i < 60; i++) {
            await new Promise(r => setTimeout(r, 1000));
            if (await isContainerRunning(service.container)) {
                await new Promise(r => setTimeout(r, 2000)); // Extra wait for health
                return;
            }
        }
        throw new Error(`Timeout waiting for ${serviceName}`);
    }

    const running = await isContainerRunning(service.container);
    if (running) {
        console.log(`[${serviceName}] Already running`);
        return;
    }

    console.log(`[${serviceName}] Starting container...`);
    startingServices.add(serviceName);

    try {
        await execAsync(`docker start ${service.container}`);

        // Wait for container to be healthy
        const startTime = Date.now();
        const timeout = 120000; // 2 minutes max

        while (Date.now() - startTime < timeout) {
            if (await isContainerRunning(service.container)) {
                // Additional health check if available
                if (service.healthCheck) {
                    try {
                        const response = await fetch(service.healthCheck, { timeout: 2000 });
                        if (response.ok) {
                            console.log(`[${serviceName}] Ready!`);
                            return;
                        }
                    } catch { }
                } else {
                    // No health check, just wait a bit
                    await new Promise(r => setTimeout(r, 3000));
                    console.log(`[${serviceName}] Started (no health check)`);
                    return;
                }
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        throw new Error(`Timeout starting ${serviceName}`);
    } finally {
        startingServices.delete(serviceName);
    }
}

// Stop container
async function stopService(serviceName) {
    const service = AI_SERVICES[serviceName];
    if (!service) return;

    const running = await isContainerRunning(service.container);
    if (!running) return;

    console.log(`[${serviceName}] Stopping due to idle timeout...`);
    await execAsync(`docker stop ${service.container}`);
    console.log(`[${serviceName}] Stopped`);
}

// Update activity timestamp
function updateActivity(serviceName) {
    lastActivity[serviceName] = Date.now();
}

// Idle checker
setInterval(async () => {
    const now = Date.now();
    for (const [name, service] of Object.entries(AI_SERVICES)) {
        const last = lastActivity[name] || 0;
        if (last > 0 && now - last > service.idleTimeout) {
            await stopService(name);
            delete lastActivity[name];
        }
    }
}, 30000); // Check every 30 seconds

// Middleware to start service on-demand
function onDemandMiddleware(serviceName) {
    return async (req, res, next) => {
        try {
            await startService(serviceName);
            updateActivity(serviceName);
            next();
        } catch (error) {
            console.error(`[${serviceName}] Start failed:`, error.message);
            res.status(503).json({ error: `Service ${serviceName} unavailable`, details: error.message });
        }
    };
}

// Proxy to Ollama
app.use('/api/ai/chat',
    onDemandMiddleware('ollama'),
    createProxyMiddleware({
        target: 'http://localhost:11434',
        changeOrigin: true,
        pathRewrite: { '^/api/ai/chat': '/api' },
        onProxyRes: () => updateActivity('ollama'),
    })
);

// Proxy to Whisper
app.use('/api/ai/transcribe',
    onDemandMiddleware('whisper'),
    createProxyMiddleware({
        target: 'http://localhost:8000',
        changeOrigin: true,
        pathRewrite: { '^/api/ai/transcribe': '' },
        onProxyRes: () => updateActivity('whisper'),
    })
);

// Proxy to LibreTranslate
app.use('/api/ai/translate',
    onDemandMiddleware('translate'),
    createProxyMiddleware({
        target: 'http://localhost:5000',
        changeOrigin: true,
        pathRewrite: { '^/api/ai/translate': '' },
        onProxyRes: () => updateActivity('translate'),
    })
);

// Status endpoint
app.get('/api/ai/status', async (req, res) => {
    const status = {};
    for (const [name, service] of Object.entries(AI_SERVICES)) {
        status[name] = {
            running: await isContainerRunning(service.container),
            lastActivity: lastActivity[name] || null,
            idleTimeout: service.idleTimeout,
        };
    }
    res.json(status);
});

// Manual control endpoints
app.post('/api/ai/:service/start', async (req, res) => {
    try {
        await startService(req.params.service);
        updateActivity(req.params.service);
        res.json({ status: 'started' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ai/:service/stop', async (req, res) => {
    try {
        await stopService(req.params.service);
        res.json({ status: 'stopped' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 9292;
app.listen(PORT, () => {
    console.log(`AI Gateway running on port ${PORT}`);
    console.log('Services:', Object.keys(AI_SERVICES).join(', '));
});
