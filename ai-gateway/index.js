const express = require('express');
const { exec } = require('child_process');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    user: 'postgres',
    host: 'creationhub_postgres',
    database: 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    port: 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-creationhub-2024';

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

// Ping endpoint for checking external services
app.get('/api/ping', async (req, res) => {
    const { target } = req.query;
    if (!target) return res.status(400).json({ error: 'Target required (e.g. 192.168.1.220:5678)' });

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        // Use http protocol if not specified
        const url = target.startsWith('http') ? target : `http://${target}`;

        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        // 404 is technically functional, 401 is functional
        res.json({ ok: true, status: response.status });
    } catch (error) {
        res.status(503).json({ ok: false, error: error.message });
    }
});

// Auth Endpoints
app.post('/api/auth/login', async (req, res) => {
    // ... existing login code ...
    // (Wait, I need to make sure I don't overwrite the login code I just wrote if I use full replace)
    // I will use replace for the exact previous block.
    // Actually, I can just append register endpoint after login.
    // But I need to be careful with context.
    // I will view the file first to be safe, or just append to end of file before listen.
});
// Ignoring this tool call's content as I need to verify file content first.

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const result = await pool.query('SELECT * FROM public.admins WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        let isValid = false;
        if (user.password_hash) {
            isValid = await bcrypt.compare(password, user.password_hash);
        } else {
            // Migration: allow default password and hash it
            if (password === 'admin' && user.email === 'admin@example.com') {
                const hash = await bcrypt.hash(password, 10);
                await pool.query('UPDATE public.admins SET password_hash = $1 WHERE id = $2', [hash, user.id]);
                isValid = true;
            } else if (!user.password_hash) {
                // Temporary: if no hash, accept any password and set it? No, too dangerous.
                // Accept 'admin' for initial setup.
                if (password === 'admin') {
                    const hash = await bcrypt.hash(password, 10);
                    await pool.query('UPDATE public.admins SET password_hash = $1 WHERE id = $2', [hash, user.id]);
                    isValid = true;
                }
            }
        }

        if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

        // Generate JWT compatible with PostgREST
        const token = jwt.sign({
            role: user.role || 'web_user',
            email: user.email,
            // standard claims
            sub: user.id
        }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/register-admin', async (req, res) => {
    const { email, password, name, phone, telegram_username, telegram_chat_id, role, is_active } = req.body;

    // Check Auth
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        // Allow initial setup if 0 admins
        try {
            const countRes = await pool.query('SELECT count(*) FROM public.admins');
            if (parseInt(countRes.rows[0].count) > 0) {
                return res.status(401).json({ error: 'Authorization required' });
            }
        } catch (e) { console.error(e); }
    } else {
        try {
            const token = authHeader.split(' ')[1];
            jwt.verify(token, JWT_SECRET);
        } catch (e) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    }

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Name, Email and Password required' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO public.admins (email, password_hash, name, phone, telegram_username, telegram_chat_id, role, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, email, name`,
            [
                email,
                hash,
                name,
                phone || null,
                telegram_username || null,
                telegram_chat_id || null,
                role || 'admin',
                is_active !== undefined ? is_active : true
            ]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Create admin error:', err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 9292;
app.listen(PORT, () => {
    console.log(`AI Gateway running on port ${PORT}`);
    console.log('Services:', Object.keys(AI_SERVICES).join(', '));
});
