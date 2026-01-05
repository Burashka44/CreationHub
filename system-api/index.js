const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const axios = require('axios');

// Security constants
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION_64_CHAR_SECRET';
const JWT_EXPIRES_IN = '7d';
const POSTGREST_URL = 'http://creationhub_api:3000';

// CORS configuration
const CORS_ORIGINS = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:5173', 'http://localhost:7777', 'http://localhost:9191', 'http://192.168.1.220:7777'];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        if (CORS_ORIGINS.includes(origin) || CORS_ORIGINS.includes('*')) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(null, false);
        }
    },
    credentials: true
};

// Simple rate limiter
const RATE_LIMIT_RPM = parseInt(process.env.RATE_LIMIT_RPM) || 200;
const rateLimitStore = new Map();

const rateLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    // Skip rate limiting for local network
    if (ip.includes('192.168.') || ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('::ffff:192.168')) {
        return next();
    }

    const now = Date.now();
    const windowMs = 60000; // 1 minute

    if (!rateLimitStore.has(ip)) {
        rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
        return next();
    }

    const record = rateLimitStore.get(ip);

    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
        return next();
    }

    record.count++;

    if (record.count > RATE_LIMIT_RPM) {
        res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
        return res.status(429).json({
            error: 'Too many requests',
            retryAfter: Math.ceil((record.resetTime - now) / 1000)
        });
    }

    next();
};

// Clean up rate limit store every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitStore.entries()) {
        if (now > record.resetTime + 300000) {
            rateLimitStore.delete(ip);
        }
    }
}, 300000);

const app = express();

// Trust proxy - CRITICAL for getting real client IP through Nginx
app.set('trust proxy', true);

app.use(cors(corsOptions));
// Rate limiter disabled - will re-enable with proper config later
// app.use(rateLimiter);

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const log = {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress
        };
        // Only log non-health check requests or errors
        if (req.path !== '/health' && req.path !== '/api/system/glances/cpu') {
            if (res.statusCode >= 400) {
                console.error(JSON.stringify({ level: 'error', ...log }));
            } else if (duration > 1000) {
                console.warn(JSON.stringify({ level: 'slow', ...log }));
            }
        }
    });
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.text({ type: 'text/plain' }));

// Mount AI routes
const aiRoutes = require('./routes/ai');
const backupRoutes = require('./routes/backups');
const glancesRoutes = require('./routes/glances');
const servicesRoutes = require('./routes/services');
const mediaRoutes = require('./routes/media');

app.use('/api/ai', aiRoutes);
app.use('/api/system/backups', backupRoutes);
app.use('/api/system/glances', glancesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/media', mediaRoutes);

const PORT = process.env.PORT || 9191;

// Host paths (mounted from host)
const WG_CONFIG_DIR = process.env.WG_CONFIG_DIR || '/etc/wireguard';
const OS_RELEASE_PATH = process.env.OS_RELEASE_PATH || '/etc/os-release';
const RESOLV_CONF_PATH = process.env.RESOLV_CONF_PATH || '/etc/resolv.conf';

// ==================== OS INFO ====================
app.get('/api/system/os', (req, res) => {
    try {
        const osRelease = fs.readFileSync(OS_RELEASE_PATH, 'utf-8');
        const lines = osRelease.split('\n');
        const info = {};

        lines.forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length) {
                info[key] = valueParts.join('=').replace(/"/g, '');
            }
        });

        // Also get kernel version
        try {
            info.KERNEL = execSync('uname -r').toString().trim();
        } catch (e) {
            info.KERNEL = 'unknown';
        }

        res.json({
            success: true,
            data: {
                pretty_name: info.PRETTY_NAME || 'Unknown Linux',
                name: info.NAME || 'Linux',
                version: info.VERSION || '',
                version_id: info.VERSION_ID || '',
                kernel: info.KERNEL,
                id: info.ID || 'linux',
                logo: info.ID || 'linux' // For icon mapping
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/system/uptime', (req, res) => {
    try {
        // uptime -p returns pretty output like "up 2 weeks, 3 days, 14 hours, 27 minutes"
        // uptime -s returns start time
        const pretty = execSync('uptime -p').toString().trim().replace('up ', '');
        const since = execSync('uptime -s').toString().trim();
        res.json({ success: true, pretty, since });
    } catch (e) {
        // Fallback to /proc/uptime
        try {
            const data = fs.readFileSync('/proc/uptime', 'utf8');
            const seconds = parseFloat(data.split(' ')[0]);
            const days = Math.floor(seconds / (3600 * 24));
            const hours = Math.floor((seconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            res.json({ success: true, pretty: `${days}d ${hours}h ${minutes}m`, since: 'unknown' });
        } catch (err) {
            res.status(500).json({ success: false, error: e.message });
        }
    }
});

// ==================== NETWORK STATS ====================
app.get('/api/system/network', (req, res) => {
    try {
        const data = fs.readFileSync('/proc/net/dev', 'utf8');
        const lines = data.split('\n');
        const interfaces = [];

        // Skip first 2 headers lines
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const [namePart, statsPart] = line.split(':');
            if (!statsPart) continue;

            const stats = statsPart.trim().split(/\s+/);
            // Linux /proc/net/dev format:
            // face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
            // Index: 0=rx_bytes, 1=rx_packets, 8=tx_bytes, 9=tx_packets

            interfaces.push({
                name: namePart,
                rx_bytes: parseInt(stats[0]),
                rx_packets: parseInt(stats[1]),
                tx_bytes: parseInt(stats[8]),
                tx_packets: parseInt(stats[9])
            });
        }

        res.json({ success: true, data: interfaces });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ==================== WIREGUARD CONFIG ====================
// GET - Read WireGuard config
app.get('/api/system/wireguard', (req, res) => {
    try {
        const configs = [];

        if (fs.existsSync(WG_CONFIG_DIR)) {
            const files = fs.readdirSync(WG_CONFIG_DIR).filter(f => f.endsWith('.conf'));

            for (const file of files) {
                const filePath = path.join(WG_CONFIG_DIR, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                configs.push({
                    name: file.replace('.conf', ''),
                    filename: file,
                    content: content
                });
            }
        }

        // Also check wg show for status
        let status = null;
        try {
            status = execSync('wg show 2>/dev/null || echo "not running"').toString().trim();
        } catch (e) {
            status = 'not installed';
        }

        res.json({
            success: true,
            data: {
                configs,
                status,
                config_dir: WG_CONFIG_DIR
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST - Write WireGuard config
app.post('/api/system/wireguard', (req, res) => {
    try {
        const { filename, content } = req.body;

        if (!filename || !content) {
            return res.status(400).json({ success: false, error: 'filename and content required' });
        }

        // Sanitize filename
        const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, '') + '.conf';
        const filePath = path.join(WG_CONFIG_DIR, safeName);

        // Backup existing if present
        if (fs.existsSync(filePath)) {
            fs.copyFileSync(filePath, filePath + '.bak');
        }

        // Write new config
        fs.writeFileSync(filePath, content, { mode: 0o600 });

        res.json({
            success: true,
            message: `Config saved to ${safeName}`,
            path: filePath
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST - Restart WireGuard interface
app.post('/api/system/wireguard/restart', (req, res) => {
    try {
        const { interface: iface } = req.body;
        const safeName = (iface || 'wg0').replace(/[^a-zA-Z0-9_-]/g, '');

        try {
            execSync(`wg-quick down ${safeName} 2>/dev/null || true`);
            execSync(`wg-quick up ${safeName}`);
            res.json({ success: true, message: `Interface ${safeName} restarted` });
        } catch (e) {
            res.status(500).json({ success: false, error: e.message });
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST - Toggle WireGuard interface up/down
app.post('/api/system/wireguard/toggle', (req, res) => {
    try {
        const { interface: iface, action } = req.body; // action: 'up' or 'down'
        const safeName = (iface || 'wg0').replace(/[^a-zA-Z0-9_-]/g, '');

        if (!['up', 'down'].includes(action)) {
            return res.status(400).json({ success: false, error: 'action must be "up" or "down"' });
        }

        try {
            execSync(`wg-quick ${action} ${safeName} 2>&1`);
            res.json({ success: true, message: `Interface ${safeName} is now ${action}`, isActive: action === 'up' });
        } catch (e) {
            // If already up/down, wg-quick will fail but we can check actual status
            try {
                const check = execSync(`ip link show ${safeName} 2>/dev/null | grep -q 'state UP' && echo "up" || echo "down"`, { encoding: 'utf-8' }).trim();
                res.json({ success: true, message: `Interface ${safeName} was already ${check}`, isActive: check === 'up' });
            } catch (checkErr) {
                res.status(500).json({ success: false, error: e.message });
            }
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET - WireGuard status (quick check)
app.get('/api/system/wireguard/status', (req, res) => {
    const iface = req.query.interface || 'wg0';
    const safeName = iface.replace(/[^a-zA-Z0-9_-]/g, '');

    try {
        // Check if interface is up
        const checkCmd = `ip link show ${safeName} 2>/dev/null | grep -q 'state UP' && echo "up" || echo "down"`;
        const status = execSync(checkCmd, { encoding: 'utf-8' }).trim();

        res.json({ success: true, isActive: status === 'up', interface: safeName });
    } catch (e) {
        // Interface doesn't exist or error
        res.json({ success: true, isActive: false, interface: safeName, note: 'Interface not found' });
    }
});

// ==================== WIFI CONTROL ====================
// GET - WiFi status
app.get('/api/system/wifi/status', (req, res) => {
    try {
        // Check if WiFi is enabled using nmcli or rfkill
        let isEnabled = false;
        let interface_name = 'unknown';

        try {
            // Try nmcli first
            const result = execSync('nmcli radio wifi', { encoding: 'utf-8' }).trim();
            isEnabled = result === 'enabled';

            // Get active interface
            try {
                const ifaceResult = execSync("nmcli -t -f DEVICE,TYPE device | grep wifi | cut -d: -f1 | head -1", { encoding: 'utf-8' }).trim();
                if (ifaceResult) interface_name = ifaceResult;
            } catch (e) { }
        } catch (e) {
            // Fallback to rfkill
            try {
                const rfkill = execSync('rfkill list wifi', { encoding: 'utf-8' });
                isEnabled = !rfkill.includes('Soft blocked: yes');
            } catch (e2) {
                return res.json({ success: false, error: 'WiFi control not available' });
            }
        }

        res.json({ success: true, isActive: isEnabled, interface: interface_name });
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

// POST - Toggle WiFi on/off
app.post('/api/system/wifi/toggle', (req, res) => {
    try {
        const { action } = req.body; // 'on' or 'off'

        if (!['on', 'off'].includes(action)) {
            return res.status(400).json({ success: false, error: 'action must be "on" or "off"' });
        }

        try {
            // Use nmcli to toggle WiFi
            execSync(`nmcli radio wifi ${action}`, { encoding: 'utf-8' });
            res.json({ success: true, message: `WiFi turned ${action}`, isActive: action === 'on' });
        } catch (e) {
            // Fallback to rfkill
            try {
                const rfkillAction = action === 'on' ? 'unblock' : 'block';
                execSync(`rfkill ${rfkillAction} wifi`, { encoding: 'utf-8' });
                res.json({ success: true, message: `WiFi turned ${action}`, isActive: action === 'on' });
            } catch (e2) {
                res.status(500).json({ success: false, error: 'WiFi control failed: ' + e.message });
            }
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// DELETE - Remove WireGuard config
app.delete('/api/system/wireguard/:name', (req, res) => {
    try {
        const { name } = req.params;
        const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '');
        const filePath = path.join(WG_CONFIG_DIR, safeName + '.conf');

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: 'Config not found' });
        }

        // Try to stop the interface first
        try {
            execSync(`wg-quick down ${safeName} 2>/dev/null || true`);
        } catch (e) {
            // Ignore - interface might not be running
        }

        // Delete the file
        fs.unlinkSync(filePath);

        res.json({ success: true, message: `Config ${safeName} deleted` });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// PUT - Rename WireGuard config
app.put('/api/system/wireguard/:name', (req, res) => {
    try {
        const { name } = req.params;
        const { newName } = req.body;

        if (!newName) {
            return res.status(400).json({ success: false, error: 'newName required' });
        }

        const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '');
        const safeNewName = newName.replace(/[^a-zA-Z0-9_-]/g, '');

        const oldPath = path.join(WG_CONFIG_DIR, safeName + '.conf');
        const newPath = path.join(WG_CONFIG_DIR, safeNewName + '.conf');

        if (!fs.existsSync(oldPath)) {
            return res.status(404).json({ success: false, error: 'Config not found' });
        }

        if (fs.existsSync(newPath)) {
            return res.status(400).json({ success: false, error: 'Config with new name already exists' });
        }

        // Rename the file
        fs.renameSync(oldPath, newPath);

        res.json({ success: true, message: `Config renamed from ${safeName} to ${safeNewName}` });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ==================== DNS CONFIG ====================
app.get('/api/system/dns', (req, res) => {
    try {
        // Try multiple possible paths for resolv.conf
        const paths = [
            RESOLV_CONF_PATH,
            '/etc/resolv.conf',
            '/host-etc/resolv.conf'
        ];

        let content = null;
        for (const p of paths) {
            try {
                if (fs.existsSync(p)) {
                    content = fs.readFileSync(p, 'utf-8');
                    break;
                }
            } catch (e) {
                // Try next path
            }
        }

        if (!content) {
            // Return default DNS if no file found
            return res.json({
                success: true,
                data: {
                    nameservers: ['8.8.8.8', '8.8.4.4'],
                    search: [],
                    raw: '# resolv.conf not accessible, showing defaults'
                }
            });
        }

        const nameservers = [];
        const search = [];

        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('nameserver ')) {
                nameservers.push(trimmed.split(' ')[1]);
            } else if (trimmed.startsWith('search ')) {
                search.push(...trimmed.split(' ').slice(1));
            }
        });

        res.json({
            success: true,
            data: {
                nameservers,
                search,
                raw: content
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ==================== GEO LOCATION ====================
// ==================== GEO LOCATION ====================
app.get('/api/system/public-ip', async (req, res) => {
    // Helper to normalize data
    const normalize = (data, source) => {
        if (source === 'ipapi') {
            return {
                ip: data.ip,
                city: data.city,
                region: data.region,
                country: data.country_name,
                country_code: data.country_code,
                latitude: data.latitude,
                longitude: data.longitude,
                org: data.org,
                source: 'ipapi.co'
            };
        }
        if (source === 'ipwhois') {
            return {
                ip: data.ip,
                city: data.city,
                region: data.region,
                country: data.country,
                country_code: data.country_code,
                latitude: data.latitude,
                longitude: data.longitude,
                org: data.connection?.org || data.org,
                source: 'ipwho.is'
            };
        }
        return data;
    };

    try {
        // Try Primary: ipapi.co
        try {
            const response = await axios.get('https://ipapi.co/json/', {
                headers: { 'User-Agent': 'CreationHub-SystemAPI/1.0' },
                timeout: 3000
            });
            if (response.data && response.data.ip) {
                return res.json(normalize(response.data, 'ipapi'));
            }
        } catch (e) {
            console.warn('Primary GeoIP failed, trying fallback:', e.message);
        }

        // Try Fallback: ipwho.is (No SSL requirement, very rate-limit friendly)
        const response = await axios.get('http://ipwho.is/', { timeout: 3000 });
        if (response.data && response.data.success) {
            return res.json(normalize(response.data, 'ipwhois'));
        } else {
            throw new Error('Fallback provider returned error');
        }

    } catch (e) {
        console.error('All GeoIP providers failed:', e.message);
        // Last resort: Return bare minimum if possible, or error
        res.status(500).json({ error: true, reason: 'Unable to determine public IP' });
    }
});

// GET - Service Status Check (for dashboard)
app.get('/api/system/ping', async (req, res) => {
    try {
        // Get all Docker containers
        const http = require('http');
        const options = {
            socketPath: '/var/run/docker.sock',
            path: '/containers/json?all=true',
            method: 'GET'
        };

        const dockerReq = http.request(options, (dockerRes) => {
            let data = '';
            dockerRes.on('data', chunk => data += chunk);
            dockerRes.on('end', () => {
                try {
                    const containers = JSON.parse(data);
                    const statuses = {};

                    containers.forEach(c => {
                        const name = c.Names[0].replace(/^\//, '');
                        statuses[name] = {
                            status: c.State === 'running' ? 'online' : 'offline',
                            state: c.State,
                            uptime: c.Status || 'unknown'
                        };
                    });

                    res.json({
                        status: 'ok',
                        timestamp: new Date().toISOString(),
                        services: statuses,
                        total: containers.length,
                        running: containers.filter(c => c.State === 'running').length
                    });
                } catch (e) {
                    res.status(500).json({ status: 'error', error: e.message });
                }
            });
        });

        dockerReq.on('error', (e) => {
            res.status(500).json({ status: 'error', error: e.message });
        });

        dockerReq.end();
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// POST - Host Monitoring (Legacy)
app.post('/api/system/ping', async (req, res) => {
    const { host, method = 'ping' } = req.body;

    if (!host) {
        return res.status(400).json({ success: false, error: 'host required' });
    }

    // SECURITY: Sanitize host to prevent command injection
    // Allow only: alphanumeric, dots, hyphens, colons (for ports), forward slashes (for paths)
    const safeHost = host.replace(/[^a-zA-Z0-9.\-:\/]/g, '');

    // Additional validation: must look like a valid hostname/IP
    const hostPattern = /^[a-zA-Z0-9][a-zA-Z0-9.\-:\/]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
    if (!hostPattern.test(safeHost) || safeHost.length > 253) {
        return res.status(400).json({ success: false, error: 'Invalid host format' });
    }

    try {
        const startTime = Date.now();
        let status = 'unknown';
        let latency = null;

        if (method === 'ping') {
            try {
                // Extract just hostname/IP for ping (no port or path)
                const pingTarget = safeHost.split(':')[0].split('/')[0];
                execSync(`ping -c 1 -W 2 ${pingTarget}`, { encoding: 'utf-8' });
                status = 'online';
                latency = Date.now() - startTime;
            } catch (e) {
                status = 'offline';
            }
        } else if (method === 'http') {
            try {
                execSync(`curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://${safeHost}`, { encoding: 'utf-8' });
                status = 'online';
                latency = Date.now() - startTime;
            } catch (e) {
                status = 'offline';
            }
        }

        res.json({
            success: true,
            data: { host: safeHost, status, latency, method }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Health check alias
app.get('/api/system/health', (req, res) => {
    res.json({ status: 'ok', service: 'system-api', uptime: process.uptime() });
});

// Main Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'system-api', uptime: process.uptime() });
});

// ==================== DOCKER CONTAINERS ====================
app.get('/api/system/docker', (req, res) => {
    const http = require('http');
    const options = {
        socketPath: '/var/run/docker.sock',
        path: '/containers/json',
        method: 'GET'
    };

    const dockerReq = http.request(options, (dockerRes) => {
        let data = '';
        dockerRes.on('data', chunk => data += chunk);
        dockerRes.on('end', () => {
            try {
                const containers = JSON.parse(data);
                const running = containers.filter(c => c.State === 'running').length;
                res.json({
                    success: true,
                    total: containers.length,
                    running,
                    containers: containers.map(c => ({
                        name: c.Names[0].replace(/^\//, ''),
                        status: c.Status,
                        state: c.State
                    }))
                });
            } catch (e) {
                res.json({ success: false, error: e.message });
            }
        });
    });

    dockerReq.on('error', (e) => {
        res.json({ success: false, error: e.message });
    });

    dockerReq.end();
});

// ==================== AUTH ====================
// Helper to query PostgREST
const queryPostgrest = (path) => {
    return new Promise((resolve, reject) => {
        http.get(`${POSTGREST_URL}${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        }).on('error', reject);
    });
};

// Secure login endpoint
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        // Query database for admin by email
        const admins = await queryPostgrest(`/admins?email=eq.${encodeURIComponent(email)}&limit=1`);

        if (!admins || admins.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const admin = admins[0];

        // Check if account is active
        if (!admin.is_active) {
            return res.status(401).json({ error: 'Account disabled' });
        }

        // If no password hash in DB, allow legacy login with default creds
        // This is temporary for migration - should be removed after setting passwords
        if (!admin.password_hash) {
            if (email === 'admin@example.com' && password === 'admin') {
                console.warn('WARNING: Using legacy hardcoded credentials - please set password in database');
                const token = jwt.sign(
                    { id: admin.id, email: admin.email, role: admin.role || 'admin' },
                    JWT_SECRET,
                    { expiresIn: JWT_EXPIRES_IN }
                );
                return res.json({
                    token,
                    user: { id: admin.id, email: admin.email, role: admin.role || 'admin', name: admin.name }
                });
            }
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password with bcrypt
        const isValid = await bcrypt.compare(password, admin.password_hash);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: admin.role || 'admin' },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            token,
            user: { id: admin.id, email: admin.email, role: admin.role || 'admin', name: admin.name }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Auth middleware for protected routes
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Endpoint to set/change password (protected)
app.post('/api/auth/set-password', authMiddleware, async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        const hash = await bcrypt.hash(newPassword, 12);

        // Update password in database via PostgREST
        const updateReq = http.request(`${POSTGREST_URL}/admins?id=eq.${req.user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });

        updateReq.write(JSON.stringify({ password_hash: hash }));
        updateReq.end();

        res.json({ success: true, message: 'Password updated' });
    } catch (error) {
        console.error('Set password error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// Verify token endpoint
app.get('/api/auth/verify', authMiddleware, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// ==================== SERVER ACTIONS (Quick Actions) ====================
app.post('/api/system/actions', async (req, res) => {
    const { action } = req.body;
    let result = { success: true };

    try {
        switch (action) {
            case 'nginx':
                // Reload Nginx container
                try {
                    execSync('docker exec creationhub nginx -s reload', { timeout: 10000 });
                    result.message = 'Nginx configuration reloaded';
                } catch (e) {
                    throw new Error('Failed to reload Nginx: ' + e.message);
                }
                break;

            case 'cache':
                // Clear system caches using privileged alpine container to access host
                try {
                    execSync('docker run --rm --privileged --pid=host alpine nsenter -t 1 -m -u -n -i -- sh -c "sync && echo 3 > /proc/sys/vm/drop_caches"', { timeout: 10000 });
                    result.message = 'System RAM cache cleared';
                } catch (e) {
                    throw new Error('Failed to clear cache: ' + e.message);
                }
                break;

            case 'backup':
                // Handled via /api/system/backups/run, but basic stub here just in case
                result.message = 'Please use Backup button';
                break;

            case 'update':
                // Check for updates on host
                try {
                    // This runs apt list on HOST via nsenter
                    const updates = execSync('docker run --rm --privileged --pid=host ubuntu:latest nsenter -t 1 -m -u -n -i -- sh -c "apt update >/dev/null && apt list --upgradable 2>/dev/null | grep -v Listing | wc -l"').toString().trim();
                    const count = parseInt(updates);
                    result.message = count > 0 ? `${count} system updates available` : 'System is up to date';
                } catch (e) {
                    // Fallback if ubuntu image failing or network issues
                    result.message = 'Update check failed (Network/Image error)';
                }
                break;

            case 'scan':
                // Basic system health scan
                try {
                    // Check failed systemd units on host
                    const failedUnits = execSync('docker run --rm --privileged --pid=host alpine nsenter -t 1 -m -u -n -i -- sh -c "systemctl list-units --state=failed --no-legend | wc -l"').toString().trim();
                    const count = parseInt(failedUnits);
                    if (count === 0) {
                        result.message = 'Security Scan: System Healthy (No failed services)';
                    } else {
                        result.message = `Security Scan: ${count} failed services found on host`;
                    }
                } catch (e) {
                    result.message = 'Scan failed';
                }
                break;

            case 'restart':
                // REBOOT HOST via nsenter
                try {
                    // Trigger reboot in 1 minute using 'shutdown -r +1' to allow response to return
                    execSync('docker run --rm --privileged --pid=host alpine nsenter -t 1 -m -u -n -i -- sh -c "shutdown -r +1"');
                    result.message = 'Server creating reboot task (1 min delay)...';
                } catch (e) {
                    result.message = 'Reboot command failed';
                }
                break;

            default:
                result.message = 'Action queued';
        }

        res.json(result);
    } catch (error) {
        console.error('Action error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== TELEGRAM NOTIFICATIONS ====================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

app.post('/api/telegram/send', async (req, res) => {
    const { chat_id, message } = req.body;

    if (!TELEGRAM_BOT_TOKEN) {
        return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not configured' });
    }

    if (!chat_id || !message) {
        return res.status(400).json({ error: 'chat_id and message required' });
    }

    try {
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: chat_id,
            text: message,
            parse_mode: 'HTML'
        });

        res.json({ success: true, result: response.data });
    } catch (error) {
        console.error('Telegram error:', error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data?.description || error.message });
    }
});

// Verify Telegram bot token and get bot info
app.post('/api/telegram/verify-bot', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Token required' });
    }

    try {
        const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);

        if (response.data.ok) {
            res.json({
                success: true,
                bot: {
                    id: response.data.result.id,
                    username: response.data.result.username,
                    first_name: response.data.result.first_name,
                    can_join_groups: response.data.result.can_join_groups,
                    can_read_all_group_messages: response.data.result.can_read_all_group_messages
                }
            });
        } else {
            res.status(400).json({ error: 'Invalid token' });
        }
    } catch (error) {
        res.status(400).json({ error: error.response?.data?.description || 'Invalid token' });
    }
});

// Get channel/chat info using bot token
app.post('/api/telegram/get-channel', async (req, res) => {
    const { token, channel_id } = req.body;

    if (!token || !channel_id) {
        return res.status(400).json({ error: 'Token and channel_id required' });
    }

    try {
        // Get chat info
        const chatResponse = await axios.get(`https://api.telegram.org/bot${token}/getChat`, {
            params: { chat_id: channel_id }
        });

        // Get member count
        let memberCount = 0;
        try {
            const countResponse = await axios.get(`https://api.telegram.org/bot${token}/getChatMemberCount`, {
                params: { chat_id: channel_id }
            });
            memberCount = countResponse.data.result || 0;
        } catch (e) {
            // Could not get member count - this is expected if bot doesn't have admin rights
        }

        if (chatResponse.data.ok) {
            res.json({
                success: true,
                channel: {
                    id: chatResponse.data.result.id,
                    type: chatResponse.data.result.type,
                    title: chatResponse.data.result.title,
                    username: chatResponse.data.result.username,
                    subscribers: memberCount,
                    description: chatResponse.data.result.description
                }
            });
        } else {
            res.status(400).json({ error: 'Channel not found or bot not admin' });
        }
    } catch (error) {
        res.status(400).json({ error: error.response?.data?.description || 'Failed to get channel' });
    }
});

// Sync all channel stats - gets subscriber counts
app.post('/api/telegram/sync-channels', async (req, res) => {
    const { token, channels } = req.body;

    if (!token || !channels || !Array.isArray(channels)) {
        return res.status(400).json({ error: 'Token and channels array required' });
    }

    const results = [];

    for (const channel of channels) {
        try {
            const countResponse = await axios.get(`https://api.telegram.org/bot${token}/getChatMemberCount`, {
                params: { chat_id: channel.username ? '@' + channel.username : channel.id }
            });

            results.push({
                id: channel.id,
                name: channel.name,
                success: true,
                subscribers: countResponse.data.result || 0
            });
        } catch (error) {
            results.push({
                id: channel.id,
                name: channel.name,
                success: false,
                error: error.response?.data?.description || error.message
            });
        }
    }

    res.json({ success: true, results });
});

// Publish post to channel
app.post('/api/telegram/publish', async (req, res) => {
    const { token, channel_id, text, parse_mode, disable_notification, buttons } = req.body;

    if (!token || !channel_id || !text) {
        return res.status(400).json({ error: 'Token, channel_id and text required' });
    }

    try {
        const payload = {
            chat_id: channel_id,
            text: text,
            parse_mode: parse_mode || 'HTML',
            disable_notification: disable_notification || false
        };

        // Add inline keyboard if buttons provided
        if (buttons && Array.isArray(buttons) && buttons.length > 0) {
            payload.reply_markup = {
                inline_keyboard: [
                    buttons.map(btn => ({ text: btn.text, url: btn.url }))
                ]
            };
        }

        const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, payload);

        if (response.data.ok) {
            res.json({
                success: true,
                message_id: response.data.result.message_id,
                chat_id: response.data.result.chat.id
            });
        } else {
            res.status(400).json({ error: 'Failed to send message' });
        }
    } catch (error) {
        res.status(400).json({ error: error.response?.data?.description || error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`System API listening on port ${PORT}`);
    console.log(`WireGuard config dir: ${WG_CONFIG_DIR}`);
    console.log(`OS release: ${OS_RELEASE_PATH}`);
});
