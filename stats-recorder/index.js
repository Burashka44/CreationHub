
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

        // Create Table
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

        // Grant Permissions to web_anon (for PostgREST reading)
        // Note: Adjust 'web_anon' or 'postgres' depending on PostgREST config.
        // Based on docker-compose, PGRST_DB_ANON_ROLE is 'postgres', so no extra grant needed if we connect as postgres.
        // But good practice if role changes.
        // await client.query(`GRANT SELECT ON system_metrics TO web_anon; `).catch(e => console.log('Grant failed (maybe role missing):', e.message));

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
                    // We want TOTAL bytes since boot/reset to calculate deltas in frontend?
                    // OR just store current rate (bytes/sec) to show "speed at that time"?
                    // Chart usually shows usage % or Speed. Let's store Speed (bytes/sec) for now as it's what glances returns in 'rate_per_sec'.
                    rx += iface.bytes_recv_rate_per_sec || 0;
                    tx += iface.bytes_sent_rate_per_sec || 0;
                }
            });
        }

        // Insert
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

async function main() {
    await initDB();

    // Collect immediately
    await collectStats();

    // Then every 60s
    setInterval(collectStats, 60000);
}

main().catch(console.error);
