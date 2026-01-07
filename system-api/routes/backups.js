const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = process.env.BACKUP_DIR || '/backups';

// Ensure backup dir exists
if (!fs.existsSync(BACKUP_DIR)) {
    try {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    } catch (e) {
        console.error('Failed to create backup dir:', e);
    }
}

// GET /api/system/backups/list
router.get('/list', (req, res) => {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.sql') || f.endsWith('.zip') || f.endsWith('.tar.gz'))
            .sort().reverse();
        res.json({ success: true, files });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/system/backups/usage
router.get('/usage', (req, res) => {
    // Get directory size for "Used"
    exec(`du -sb ${BACKUP_DIR} | cut -f1`, (err1, stdout1) => {
        const usedBytes = parseInt(stdout1) || 0;
        const usedGB = (usedBytes / (1024 * 1024 * 1024)).toFixed(1);

        // Get filesystem size for "Total"
        exec(`df -B1 ${BACKUP_DIR} | tail -1 | awk '{print $2}'`, (err2, stdout2) => {
            const totalBytes = parseInt(stdout2) || 0;
            const totalGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(1);

            // Calculate percentage based on folder usage relative to disk total
            const percentage = totalBytes > 0 ? ((usedBytes / totalBytes) * 100).toFixed(1) : 0;

            res.json({
                success: true,
                data: {
                    total: parseFloat(totalGB),
                    used: parseFloat(usedGB),
                    percentage: parseFloat(percentage)
                }
            });
        });
    });
});

// POST /api/system/backups/run
router.post('/run', (req, res) => {
    const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Improved backup command using pg_dump via docker exec if needed, or calling internal script
    // For now, assuming we are inside the container or have access
    const cmd = `pg_dump -h creationhub_postgres -U postgres postgres > "${filepath}"`;

    // Note: This requires pg-client installed and PGPASSWORD set
    const env = { ...process.env, PGPASSWORD: process.env.POSTGRES_PASSWORD || 'changeme' };

    exec(cmd, { env }, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
        res.json({ success: true, file: filename });
    });
});

module.exports = router;
