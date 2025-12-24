const express = require('express');
const router = express.Router();

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
router.post('/run', (req, res) => {
    // Stub - pretend to run
    setTimeout(() => {
        console.log('Backup finished');
    }, 2000);
    res.json({ success: true, message: 'Backup started successfully (Stub)' });
});

// GET /api/system/backups/check-updates
router.get('/check-updates', (req, res) => {
    res.json({ success: true, message: 'All systems up to date' });
});

module.exports = router;
