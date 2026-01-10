const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const axios = require('axios');
const os = require('os');
const redis = require('redis');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const NodeCache = require('node-cache');
const systemCache = new NodeCache(); // Standard cache

// Ensure log directory exists
const LOG_DIR = '/var/log/system-api';
if (!fs.existsSync(LOG_DIR)) {
    try {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    } catch (e) {
        console.error('Failed to create log directory:', e);
    }
}

// Logger Configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new DailyRotateFile({
            filename: path.join(LOG_DIR, 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        }),
        new DailyRotateFile({
            filename: path.join(LOG_DIR, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: 'error'
        })
    ]
});

// Override console methods to use logger
// console.log = (...args) => logger.info(args.join(' '));
// console.error = (...args) => logger.error(args.join(' '));
// console.warn = (...args) => logger.warn(args.join(' '));

// Redis Client Setup
const redisClient = redis.createClient({
    url: `redis://:${process.env.REDIS_PASSWORD}@creationhub_redis:6379`
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Connected to Redis'));

(async () => {
    try {
        await redisClient.connect();
    } catch (e) {
        console.error('Failed to connect to Redis:', e);
    }
})();

// Helper for executing commands in host network namespace (requires pid: host and privileged: true)
// This allows WireGuard commands to affect the host's network stack
const NSENTER_PREFIX = 'nsenter --net=/host-proc/1/ns/net ';

// Security constants
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION_64_CHAR_SECRET';

// ==================== ENV VALIDATION ====================
// Validate required environment variables on startup
const requiredEnv = [
    'JWT_SECRET',
    'POSTGRES_URL',
    'POSTGRES_PASSWORD'
];

console.log('🔍 Validating environment variables...');
let missingVars = [];

requiredEnv.forEach(key => {
    if (!process.env[key] || process.env[key] === 'CHANGEME' || process.env[key] === 'changeme') {
        missingVars.push(key);
    }
});

if (missingVars.length > 0) {
    console.error(`❌ FATAL: Missing or invalid required environment variables:`);
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.error(`\nPlease check your .env file and ensure all required variables are set.`);
    process.exit(1);
}

console.log('✅ All required environment variables are set');

// Warn about optional variables
if (!process.env.RATE_LIMIT_RPM) {
    console.warn(`⚠️  Using default RATE_LIMIT_RPM: 500`);
}
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

// Simple rate limiter (increased for dashboard polling)
// Redis-based Rate Limiter
const RATE_LIMIT_RPM = parseInt(process.env.RATE_LIMIT_RPM) || 500;
const RATE_LIMIT_WINDOW = 60; // 1 minute window

const rateLimiter = async (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    // Skip rate limiting for local network
    if (ip.includes('192.168.') || ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('::ffff:192.168')) {
        return next();
    }

    const key = `rate:${ip}`;

    try {
        const count = await redisClient.incr(key);

        // Set expiry on first request
        if (count === 1) {
            await redisClient.expire(key, RATE_LIMIT_WINDOW);
        }

        if (count > RATE_LIMIT_RPM) {
            const ttl = await redisClient.ttl(key);
            res.setHeader('Retry-After', ttl);
            return res.status(429).json({
                error: 'Too many requests',
                retryAfter: ttl
            });
        }

        next();
    } catch (e) {
        console.error('Rate Limiter Error:', e);
        // Fail open if Redis is down
        next();
    }
};

const app = express();

// Trust proxy - CRITICAL for getting real client IP through Nginx
app.set('trust proxy', true);

app.use(cors(corsOptions));
app.use(rateLimiter); // ENABLED: Protect against brute force

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;

        // Sanitize sensitive data from logs
        const sanitizedBody = req.body ? { ...req.body } : {};
        if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
        if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';

        const log = {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            body: Object.keys(sanitizedBody).length > 0 ? sanitizedBody : undefined
        };
        // Only log non-health check requests or errors
        if (req.path !== '/health' && req.path !== '/api/system/glances/cpu') {
            if (res.statusCode >= 400) {
                logger.error('Request failed', log);
            } else if (duration > 1000) {
                logger.warn('Slow request', log);
            } else {
                // Debug level for normal requests (optional, to avoid noise)
                // logger.debug('Request completed', log);
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
const authRoutes = require('./routes/auth');

app.use('/api/ai', aiRoutes);
app.use('/api/system/backups', backupRoutes);
app.use('/api/system/glances', glancesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 9191;

// Host paths (mounted from host)
const WG_CONFIG_DIR = process.env.WG_CONFIG_DIR || '/etc/wireguard';
const OS_RELEASE_PATH = process.env.OS_RELEASE_PATH || '/etc/os-release';
const RESOLV_CONF_PATH = process.env.RESOLV_CONF_PATH || '/etc/resolv.conf';

// ==================== OS INFO ====================
app.get('/api/system/os', (req, res) => {
    // Check Cache (10 minutes)
    const cached = systemCache.get('os_info');
    if (cached) return res.json(cached);

    try {
        let osPath = process.env.OS_RELEASE_PATH || '/host-os-release';
        if (!fs.existsSync(osPath)) osPath = '/etc/os-release';

        if (fs.existsSync(osPath)) {
            const lines = fs.readFileSync(osPath, 'utf-8').split('\n');
            const info = {};
            lines.forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) info[key] = value.replace(/"/g, '');
            });

            let kernel = 'Unknown';
            try {
                kernel = execSync('uname -r').toString().trim();
            } catch (e) { }

            // Show EXACT host OS version (PRETTY_NAME from host /etc/os-release)
            const kernelShort = kernel.split('-').slice(0, 2).join('-'); // "6.8.0-90" from "6.8.0-90-generic"

            const result = {
                name: info.PRETTY_NAME || 'Linux',  // Full name from host: "Ubuntu 24.04.3 LTS"
                version: kernelShort,                 // Kernel: "6.8.0-90"
                arch: os.arch(),
                kernel: kernel
            };

            systemCache.set('os_info', result, 600); // Cache for 10 minutes
            res.json(result);
        } else {
            res.json({ name: 'Linux Container', version: 'Unknown', arch: os.arch(), kernel: 'Unknown' });
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/system/uptime', (req, res) => {
    try {
        const hostProcUptime = '/host-proc/uptime';
        let uptimeSeconds = 0;

        if (fs.existsSync(hostProcUptime)) {
            uptimeSeconds = parseFloat(fs.readFileSync(hostProcUptime, 'utf8').split(' ')[0]);
        } else {
            uptimeSeconds = os.uptime();
        }

        const days = Math.floor(uptimeSeconds / (3600 * 24));
        const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);

        // Better formatting: hide "0d" if less than 1 day
        let prettyUptime;
        if (days > 0) {
            prettyUptime = `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            prettyUptime = `${hours}h ${minutes}m`;
        } else {
            prettyUptime = `${minutes}m`;
        }

        res.json({
            uptime: prettyUptime,
            pretty: prettyUptime,
            seconds: uptimeSeconds,
            days: days,
            hours: hours,
            minutes: minutes
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ==================== NETWORK STATS ====================
app.get('/api/system/network', (req, res) => {
    // Check Cache (3 seconds - fast updates but reduced file I/O)
    const cached = systemCache.get('network_stats');
    if (cached) return res.json(cached);

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

        const result = { success: true, data: interfaces };
        systemCache.set('network_stats', result, 3); // Cache for 3 seconds
        res.json(result);
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

// POST - Toggle WireGuard interface up/down (manual commands to avoid DNS/resolvconf issues)
app.post('/api/system/wireguard/toggle', (req, res) => {
    try {
        const { interface: iface, action } = req.body; // action: 'up' or 'down'
        const safeName = (iface || 'wg0').replace(/[^a-zA-Z0-9_-]/g, '');
        const configPath = path.join(WG_CONFIG_DIR, `${safeName}.conf`);

        if (!['up', 'down'].includes(action)) {
            return res.status(400).json({ success: false, error: 'action must be "up" or "down"' });
        }

        // Check if config exists
        if (!fs.existsSync(configPath)) {
            return res.status(404).json({ success: false, error: `Config ${safeName}.conf not found` });
        }

        try {
            if (action === 'up') {
                // Parse config to get address and peer info
                const configContent = fs.readFileSync(configPath, 'utf-8');
                const addressMatch = configContent.match(/Address\s*=\s*([^\n]+)/i);
                const privateKeyMatch = configContent.match(/PrivateKey\s*=\s*([^\n]+)/i);

                if (!addressMatch || !privateKeyMatch) {
                    return res.status(400).json({ success: false, error: 'Invalid config: missing Address or PrivateKey' });
                }

                const address = addressMatch[1].trim();

                // Check if interface already exists
                try {
                    execSync(`${NSENTER_PREFIX}ip link show ${safeName} 2>/dev/null`, { encoding: 'utf-8' });
                    // Interface exists, just bring it up
                    execSync(`${NSENTER_PREFIX}ip link set ${safeName} up`, { encoding: 'utf-8' });
                    return res.json({ success: true, message: `Interface ${safeName} brought up`, isActive: true });
                } catch (e) {
                    // Interface doesn't exist, create it
                }

                // Create interface
                execSync(`${NSENTER_PREFIX}ip link add dev ${safeName} type wireguard`, { encoding: 'utf-8' });

                // Strip wg-quick specific directives for wg setconf
                const wgOnlyLines = configContent.split('\n').filter(line => {
                    const trimmed = line.trim().toLowerCase();
                    // Remove wg-quick specific directives
                    return !trimmed.startsWith('address') &&
                        !trimmed.startsWith('dns') &&
                        !trimmed.startsWith('mtu') &&
                        !trimmed.startsWith('table') &&
                        !trimmed.startsWith('preup') &&
                        !trimmed.startsWith('postup') &&
                        !trimmed.startsWith('predown') &&
                        !trimmed.startsWith('postdown') &&
                        !trimmed.startsWith('saveconfig');
                }).join('\n');

                // Write stripped config to temp file
                const tempConfigPath = `/tmp/${safeName}_stripped.conf`;
                fs.writeFileSync(tempConfigPath, wgOnlyLines);

                // Apply stripped config (using wg setconf)
                execSync(`${NSENTER_PREFIX}wg setconf ${safeName} ${tempConfigPath}`, { encoding: 'utf-8' });

                // Clean up temp file
                fs.unlinkSync(tempConfigPath);

                // Add address
                execSync(`${NSENTER_PREFIX}ip -4 address add ${address} dev ${safeName}`, { encoding: 'utf-8' });

                // Set MTU and bring up
                execSync(`${NSENTER_PREFIX}ip link set mtu 1420 up dev ${safeName}`, { encoding: 'utf-8' });

                // Add default route through WireGuard for VPN
                try {
                    execSync(`${NSENTER_PREFIX}ip route add 0.0.0.0/1 dev ${safeName}`, { encoding: 'utf-8' });
                    execSync(`${NSENTER_PREFIX}ip route add 128.0.0.0/1 dev ${safeName}`, { encoding: 'utf-8' });
                } catch (routeErr) {
                    // Routes may already exist or fail, that's okay
                }

                res.json({ success: true, message: `Interface ${safeName} is now up`, isActive: true });
            } else {
                // Down - delete interface
                try {
                    // Remove routes first
                    try {
                        execSync(`${NSENTER_PREFIX}ip route del 0.0.0.0/1 dev ${safeName} 2>/dev/null`, { encoding: 'utf-8' });
                        execSync(`${NSENTER_PREFIX}ip route del 128.0.0.0/1 dev ${safeName} 2>/dev/null`, { encoding: 'utf-8' });
                    } catch (e) { }

                    execSync(`${NSENTER_PREFIX}ip link delete dev ${safeName}`, { encoding: 'utf-8' });
                    res.json({ success: true, message: `Interface ${safeName} is now down`, isActive: false });
                } catch (e) {
                    // Interface may not exist
                    res.json({ success: true, message: `Interface ${safeName} was already down`, isActive: false });
                }
            }
        } catch (e) {
            res.status(500).json({ success: false, error: `WireGuard toggle failed: ${e.message}` });
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET - WireGuard status (quick check)
app.get('/api/system/wireguard/status', async (req, res) => {
    const iface = req.query.interface || 'wg0';

    // SECURITY: Strict allowlist validation - only alphanumeric and single hyphen
    if (!/^wg[0-9]{1,2}$/.test(iface)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid interface name. Must match pattern: wg0-wg99'
        });
    }

    const safeName = iface; // Already validated

    try {
        // Check if interface is up (using nsenter to access host network namespace)
        const checkCmd = `${NSENTER_PREFIX}ip link show ${safeName} 2>/dev/null | grep -q 'state UP' && echo "up" || echo "down"`;
        const { stdout: status } = await execPromise(checkCmd, { encoding: 'utf-8' });

        res.json({ success: true, isActive: status.trim() === 'up', interface: safeName });
    } catch (e) {
        // Interface doesn't exist or error
        res.json({ success: true, isActive: false, interface: safeName, note: 'Interface not found' });
    }
});

// ==================== WIFI CONTROL ====================
// GET - WiFi status
// GET - WiFi status
app.get('/api/system/wifi/status', async (req, res) => {
    try {
        // Check if WiFi is enabled using nmcli or rfkill
        let isEnabled = false;
        let interface_name = 'unknown';

        try {
            // Try nmcli first
            const result = (await execPromise('nmcli radio wifi', { encoding: 'utf-8' })).stdout.trim();
            isEnabled = result === 'enabled';

            // Get active interface
            try {
                const ifaceResult = (await execPromise("nmcli -t -f DEVICE,TYPE device | grep wifi | cut -d: -f1 | head -1", { encoding: 'utf-8' })).stdout.trim();
                if (ifaceResult) interface_name = ifaceResult;
            } catch (e) { }
        } catch (e) {
            // Fallback to rfkill
            try {
                const rfkill = (await execPromise('rfkill list wifi', { encoding: 'utf-8' })).stdout;
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
// POST - Toggle WiFi on/off
app.post('/api/system/wifi/toggle', async (req, res) => {
    try {
        const { action } = req.body; // 'on' or 'off'

        if (!['on', 'off'].includes(action)) {
            return res.status(400).json({ success: false, error: 'action must be "on" or "off"' });
        }

        try {
            // Use nmcli to toggle WiFi
            await execPromise(`nmcli radio wifi ${action}`, { encoding: 'utf-8' });
            res.json({ success: true, message: `WiFi turned ${action}`, isActive: action === 'on' });
        } catch (e) {
            // Fallback to rfkill
            try {
                const rfkillAction = action === 'on' ? 'unblock' : 'block';
                await execPromise(`rfkill ${rfkillAction} wifi`, { encoding: 'utf-8' });
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

// Duplicate route definitions removed

// ==================== DNS CONFIG ====================
app.get('/api/system/dns', (req, res) => {
    // Check Cache (10 minutes)
    const cached = systemCache.get('dns_info');
    if (cached) return res.json(cached);

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

        const result = {
            success: true,
            data: {
                nameservers,
                search,
                raw: content
            }
        };
        systemCache.set('dns_info', result, 600); // Cache for 10 minutes
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ==================== GEO LOCATION ====================
app.get('/api/system/public-ip', async (req, res) => {
    // Check cache first (1 hour)
    const cached = systemCache.get('public_ip');
    if (cached) {
        // Add Age header or property if needed
        return res.json({ ...cached, cached: true });
    }

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
                timeout: 5000
            });
            if (response.data && response.data.ip) {
                const result = normalize(response.data, 'ipapi');
                systemCache.set('public_ip', result, 3600); // 1 hour
                return res.json(result);
            }
        } catch (e) {
            console.warn('Primary GeoIP failed, trying fallback:', e.message);
        }

        // Try Fallback: ipwho.is (No SSL requirement, very rate-limit friendly)
        const response = await axios.get('http://ipwho.is/', { timeout: 5000 });
        if (response.data && response.data.success) {
            const result = normalize(response.data, 'ipwhois');
            systemCache.set('public_ip', result, 3600); // 1 hour
            return res.json(result);
        } else {
            throw new Error('Fallback provider returned error');
        }

    } catch (e) {
        console.error('All GeoIP providers failed:', e.message);

        // If we have stale cache (via systemCache check above, but here we failed),
        // node-cache removes expired items so we can't easily get 'stale' data unless useTtl is false.
        // We accept that if cache expires and API fails, we return error.

        // Return error
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
                await execPromise(`ping -c 1 -W 2 ${pingTarget}`, { encoding: 'utf-8' });
                status = 'online';
                latency = Date.now() - startTime;
            } catch (e) {
                status = 'offline';
            }
        } else if (method === 'http') {
            try {
                await execPromise(`curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://${safeHost}`, { encoding: 'utf-8' });
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
// ==================== SERVER ACTIONS (Quick Actions) ====================
app.post('/api/system/actions', async (req, res) => {
    const { action } = req.body;
    let result = { success: true };

    try {
        switch (action) {
            case 'nginx':
                // Reload Nginx container
                try {
                    await execPromise('docker exec creationhub nginx -s reload', { timeout: 10000 });
                    result.message = 'Nginx configuration reloaded';
                } catch (e) {
                    throw new Error('Failed to reload Nginx: ' + e.message);
                }
                break;

            case 'cache':
                // Clear system caches using privileged alpine container to access host
                try {
                    await execPromise('docker run --rm --privileged --pid=host alpine nsenter -t 1 -m -u -n -i -- sh -c "sync && echo 3 > /proc/sys/vm/drop_caches"', { timeout: 10000 });
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
                    const { stdout: updates } = await execPromise('docker run --rm --privileged --pid=host ubuntu:latest nsenter -t 1 -m -u -n -i -- sh -c "apt update >/dev/null && apt list --upgradable 2>/dev/null | grep -v Listing | wc -l"');
                    const count = parseInt(updates.trim());
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
                    const { stdout: failedUnits } = await execPromise('docker run --rm --privileged --pid=host alpine nsenter -t 1 -m -u -n -i -- sh -c "systemctl list-units --state=failed --no-legend | wc -l"');
                    const count = parseInt(failedUnits.trim());
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
                    await execPromise('docker run --rm --privileged --pid=host alpine nsenter -t 1 -m -u -n -i -- sh -c "shutdown -r +1"');
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
// Start server
const server = app.listen(PORT, () => {
    console.log(`System API listening on port ${PORT}`);
    console.log(`WireGuard config dir: ${WG_CONFIG_DIR}`);
    console.log(`OS release: ${OS_RELEASE_PATH}`);
});

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
    console.log(`${signal} received, shutting down gracefully...`);

    server.close(() => {
        console.log('HTTP server closed');
    });

    try {
        await redisClient.quit();
        console.log('Redis client disconnected');
    } catch (e) {
        console.error('Error disconnecting Redis:', e);
    }

    // Allow pending requests to complete (max 10s)
    setTimeout(() => {
        console.error('Forced shutdown due to timeout');
        process.exit(1);
    }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
