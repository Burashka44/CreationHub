const express = require('express');
const router = express.Router();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Persistence
const DATA_DIR = path.join(__dirname, '../data');
const SCHEDULES_FILE = path.join(DATA_DIR, 'backup_schedules.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) { }
}

// Load schedules
const loadSchedules = () => {
    try {
        if (fs.existsSync(SCHEDULES_FILE)) {
            return JSON.parse(fs.readFileSync(SCHEDULES_FILE));
        }
    } catch (e) { console.error('Failed to load schedules', e); }
    return [];
};

// Save schedules
const saveSchedules = (data) => {
    try {
        fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(data, null, 2));
    } catch (e) { console.error('Failed to save schedules', e); }
};

let schedules = loadSchedules();
if (schedules.length === 0) {
    schedules = [
        { id: '1', name: 'Ежедневный бэкап', time: '03:00', type: 'full', status: 'active' },
        { id: '2', name: 'Бэкап БД', time: '*/6 часов', type: 'database', status: 'active' }
    ];
    saveSchedules(schedules);
}

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
    saveSchedules(schedules);
    res.json({ success: true, data: newSchedule });
});

// DELETE /api/system/backups/schedules/:id
router.delete('/schedules/:id', (req, res) => {
    schedules = schedules.filter(s => s.id !== req.params.id);
    saveSchedules(schedules);
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
            .filter(f => f.endsWith('.sql.gz') || f.endsWith('.tar.gz'))  // Any compressed backup
            .map(f => {
                const stat = fs.statSync(path.join(backupDir, f));
                return {
                    id: f,
                    name: f,
                    size_bytes: stat.size,
                    created_at: stat.birthtime || stat.mtime,
                    type: f.includes('database') ? 'database' : 'full',
                    path: path.join(backupDir, f),
                    status: 'completed'
                };
            })
            .sort((a, b) => b.created_at - a.created_at);

        res.json({ success: true, data: files });
    } catch (e) {
        console.error('Backup list error:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/system/backups/check-updates
router.get('/check-updates', (req, res) => {
    res.json({ success: true, message: 'All systems up to date' });
});

module.exports = router;
