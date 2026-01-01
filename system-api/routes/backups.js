const express = require('express');
const router = express.Router();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Mock backup data
let schedules = [
    { id: '1', name: 'Ежедневный бэкап', time: '03:00', type: 'full', status: 'active' },
    { id: '2', name: 'Бэкап БД', time: '*/6 часов', type: 'database', status: 'active' },
];

let presets = [
    { id: '1', name: 'Ежедневный полный', schedule: '0 3 * * *', type: 'full', retention: '30 дней', compression: true }
];

// GET /api/system/backups/schedules
router.get('/schedules', (req, res) => {
    res.json({ success: true, data: schedules });
});

// POST /api/system/backups/schedules
router.post('/schedules', (req, res) => {
    const newSchedule = {
        id: Math.random().toString(36).slice(2),
        ...req.body,
        status: 'active'
    };
    schedules.push(newSchedule);
    res.json({ success: true, data: newSchedule });
});

// DELETE /api/system/backups/schedules/:id
router.delete('/schedules/:id', (req, res) => {
    schedules = schedules.filter(s => s.id !== req.params.id);
    res.json({ success: true, message: 'Deleted' });
});

// POST /api/system/backups/run (Backup Now)
router.post('/run', async (req, res) => {
    const { type = 'database' } = req.body;
    const backupDir = process.env.BACKUP_DIR || '/backups';

    // Ensure backup dir exists
    if (!fs.existsSync(backupDir)) {
        try {
            fs.mkdirSync(backupDir, { recursive: true });
        } catch (e) {
            return res.status(500).json({ success: false, error: 'Cannot create backup directory: ' + e.message });
        }
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `backup_${type}_${timestamp}.${type === 'database' ? 'sql.gz' : 'tar.gz'}`;
    const filePath = path.join(backupDir, filename);

    try {
        if (type === 'database') {
            const dbUrl = process.env.POSTGRES_URL;
            if (!dbUrl) {
                return res.status(500).json({ success: false, error: 'POSTGRES_URL not configured' });
            }

            // Run pg_dump, pipe to gzip, write to file
            const command = `pg_dump "${dbUrl}" | gzip > "${filePath}"`;
            execSync(command, { stdio: 'inherit' });

            res.json({
                success: true,
                message: 'Backup created successfully',
                data: {
                    file: filename,
                    path: filePath,
                    size: fs.statSync(filePath).size,
                    created_at: new Date()
                }
            });
        } else {
            res.status(400).json({ success: false, error: 'Only database backups supported currently' });
        }
    } catch (error) {
        console.error('Backup failed:', error);
        res.status(500).json({ success: false, error: 'Backup failed: ' + error.message });
    }
});

// GET /api/system/backups/list
router.get('/list', (req, res) => {
    const backupDir = process.env.BACKUP_DIR || '/backups';
    try {
        if (!fs.existsSync(backupDir)) {
            return res.json({ success: true, data: [] });
        }

        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('backup_'))
            .map(f => {
                const stat = fs.statSync(path.join(backupDir, f));
                return {
                    name: f,
                    size: stat.size,
                    created_at: stat.birthtime,
                    type: f.includes('database') ? 'database' : 'full'
                };
            })
            .sort((a, b) => b.created_at - a.created_at);

        res.json({ success: true, data: files });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/system/backups/check-updates
router.get('/check-updates', (req, res) => {
    res.json({ success: true, message: 'All systems up to date' });
});

module.exports = router;
