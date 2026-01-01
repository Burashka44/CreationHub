const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'text/plain' }));

// Mount AI routes
const aiRoutes = require('./routes/ai');
const backupRoutes = require('./routes/backups');
const glancesRoutes = require('./routes/glances');
const servicesRoutes = require('./routes/services');
app.use('/api/ai', aiRoutes);
app.use('/api/system/backups', backupRoutes);
app.use('/api/system/glances', glancesRoutes);
app.use('/api/services', servicesRoutes);

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
        const content = fs.readFileSync(RESOLV_CONF_PATH, 'utf-8');
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

const axios = require('axios');

// ==================== GEO LOCATION ====================
app.get('/api/system/public-ip', async (req, res) => {
    try {
        const response = await axios.get('https://ipapi.co/json/', {
            headers: { 'User-Agent': 'CreationHub-SystemAPI/1.0' },
            timeout: 5000
        });
        res.json(response.data);
    } catch (e) {
        console.error('GeoIP fetch failed:', e.message);
        res.status(500).json({ error: true, reason: e.message });
    }
});

// ==================== HOST MONITORING ====================
app.post('/api/system/ping', async (req, res) => {
    const { host, method = 'ping' } = req.body;

    if (!host) {
        return res.status(400).json({ success: false, error: 'host required' });
    }

    try {
        const startTime = Date.now();
        let status = 'unknown';
        let latency = null;

        if (method === 'ping') {
            try {
                execSync(`ping -c 1 -W 2 ${host}`, { encoding: 'utf-8' });
                status = 'online';
                latency = Date.now() - startTime;
            } catch (e) {
                status = 'offline';
            }
        } else if (method === 'http') {
            try {
                execSync(`curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://${host}`, { encoding: 'utf-8' });
                status = 'online';
                latency = Date.now() - startTime;
            } catch (e) {
                status = 'offline';
            }
        }

        res.json({
            success: true,
            data: { host, status, latency, method }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'system-api' });
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

// Start server
app.listen(PORT, () => {
    console.log(`System API listening on port ${PORT}`);
    console.log(`WireGuard config dir: ${WG_CONFIG_DIR}`);
    console.log(`OS release: ${OS_RELEASE_PATH}`);
});
