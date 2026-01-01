
const { Pool } = require('pg');
const axios = require('axios');

// Config
const DB_CONFIG = {
    connectionString: process.env.DATABASE_URL,
};

const GLANCES_URL = process.env.GLANCES_URL || 'http://192.168.1.220:61208/api/4';

const pool = new Pool(DB_CONFIG);

async function initDB() {
    const client = await pool.connect();
    try {
        console.log('Connected to DB. Initializing schema...');

        // Create system_metrics Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS system_metrics(
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp timestamptz DEFAULT now(),
    cpu_percent float,
    ram_percent float,
    net_rx_total bigint,
    net_tx_total bigint
);
`);

        console.log('Schema initialized.');
    } finally {
        client.release();
    }
}

async function collectStats() {
    try {
        // Fetch from Glances
        const [cpuRes, memRes, netRes] = await Promise.all([
            axios.get(`${GLANCES_URL}/cpu`),
            axios.get(`${GLANCES_URL}/mem`),
            axios.get(`${GLANCES_URL}/network`)
        ]);

        const cpu = typeof cpuRes.data.total === 'number' ? cpuRes.data.total : parseFloat(cpuRes.data.total || 0);
        const ram = typeof memRes.data.percent === 'number' ? memRes.data.percent : parseFloat(memRes.data.percent || 0);

        // Sum network traffic
        let rx = 0;
        let tx = 0;
        if (Array.isArray(netRes.data)) {
            netRes.data.forEach(iface => {
                if (iface.interface_name !== 'lo') {
                    rx += iface.bytes_recv_rate_per_sec || 0;
                    tx += iface.bytes_sent_rate_per_sec || 0;
                }
            });
        }

        // Insert metrics
        const client = await pool.connect();
        try {
            await client.query(
                'INSERT INTO system_metrics (cpu_percent, ram_percent, net_rx_total, net_tx_total) VALUES ($1, $2, $3, $4)',
                [cpu, ram, rx, tx]
            );
            console.log(`Recorded: CPU ${cpu}%, RAM ${ram}%`);
        } finally {
            client.release();
        }

    } catch (e) {
        console.error('Error collecting stats:', e.message);
    }
}

async function collectDiskSnapshots() {
    try {
        const fsRes = await axios.get(`${GLANCES_URL}/fs`);
        const disks = fsRes.data;

        if (!Array.isArray(disks)) return;

        const client = await pool.connect();
        try {
            for (const disk of disks) {
                const mount = disk.mnt_point;

                // Skip system/docker mounts
                if (mount.includes('/boot') || mount.includes('/etc') ||
                    mount.includes('docker') || mount.includes('overlay') ||
                    mount.startsWith('/run') || mount.startsWith('/sys') ||
                    mount.startsWith('/proc') || mount.startsWith('/dev')) {
                    continue;
                }

                // Only record significant disks (>10GB)
                const sizeGB = disk.size / 1024 / 1024 / 1024;
                if (sizeGB < 10) continue;

                let name = 'Disk';
                if (mount === '/' || mount === '/host') name = 'System';
                else if (mount.includes('media')) name = 'Media';
                else if (mount.includes('backup')) name = 'Backups';
                else name = mount.split('/').pop() || 'Other';

                await client.query(
                    `INSERT INTO disk_snapshots (name, mount_point, used_bytes, total_bytes, percent, fs_type) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [name, mount, disk.used, disk.size, disk.percent, disk.fs_type]
                );
            }
            console.log('Disk snapshots recorded');
        } finally {
            client.release();
        }
    } catch (e) {
        console.error('Error collecting disk snapshots:', e.message);
    }
}

async function cleanupOldData() {
    const client = await pool.connect();
    try {
        // Call the cleanup function we created in the database
        await client.query('SELECT public.cleanup_old_data()');
        console.log('Data cleanup completed (7-day retention)');
    } catch (e) {
        console.error('Cleanup error:', e.message);
    } finally {
        client.release();
    }
}

async function logActivity(actionKey, target, activityType = 'server') {
    const client = await pool.connect();
    try {
        await client.query(
            `INSERT INTO activity_logs (action_key, target, user_name, activity_type) VALUES ($1, $2, $3, $4)`,
            [actionKey, target, 'Stats Recorder', activityType]
        );
    } catch (e) {
        // Silently fail - activity log is not critical
    } finally {
        client.release();
    }
}

async function main() {
    await initDB();

    // Log startup
    await logActivity('serviceStarted', 'Stats Recorder', 'server');

    // Collect immediately
    await collectStats();
    await collectDiskSnapshots();

    // Run cleanup once at startup
    await cleanupOldData();

    // Stats every 60s
    setInterval(collectStats, 60000);

    // Disk snapshots every 5 minutes
    setInterval(collectDiskSnapshots, 300000);

    // Network traffic every 30s
    setInterval(async () => {
        try {
            const netRes = await axios.get(`${GLANCES_URL}/network`);
            if (Array.isArray(netRes.data)) {
                const client = await pool.connect();
                try {
                    for (const iface of netRes.data) {
                        if (iface.interface_name === 'lo') continue;
                        await client.query(
                            `INSERT INTO network_traffic (interface_name, rx_bytes, tx_bytes, rx_rate, tx_rate) 
                             VALUES ($1, $2, $3, $4, $5)`,
                            [
                                iface.interface_name,
                                iface.bytes_recv || 0,
                                iface.bytes_sent || 0,
                                iface.bytes_recv_rate_per_sec || 0,
                                iface.bytes_sent_rate_per_sec || 0
                            ]
                        );
                    }
                } finally {
                    client.release();
                }
            }
        } catch (e) {
            console.error('Network traffic error:', e.message);
        }
    }, 30000);

    // Cleanup every hour
    setInterval(cleanupOldData, 3600000);
}

main().catch(console.error);
