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
        // Only scan /backups (which is mapped to the real backup disk via host symlink)
        const backupDir = '/backups';

        let allBackups = [];

        if (!fs.existsSync(backupDir)) {
            return res.json({ success: true, files: [] });
        }

        // Scan top-level entries
        const entries = fs.readdirSync(backupDir, { withFileTypes: true });

        entries.forEach(entry => {
            const fullPath = path.join(backupDir, entry.name);
            const stats = fs.statSync(fullPath);

            if (entry.isDirectory()) {
                // This is a backup directory (like golden_20260108_121934 or creationhub_v2.5_release)
                // Calculate directory size using du command
                try {
                    const { execSync } = require('child_process');
                    const sizeOutput = execSync(`du -sb "${fullPath}" 2>/dev/null | cut -f1`, { encoding: 'utf-8' }).trim();
                    const sizeBytes = parseInt(sizeOutput) || 0;

                    allBackups.push({
                        name: entry.name,
                        path: fullPath,
                        type: 'directory',
                        size: sizeBytes,
                        sizeFormatted: (sizeBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
                        date: stats.mtime,
                        dateFormatted: stats.mtime.toISOString().split('T')[0] + ' ' + stats.mtime.toTimeString().split(' ')[0]
                    });
                } catch (e) {
                    console.error('Error calculating dir size:', fullPath, e.message);
                }
            } else if (entry.name.endsWith('.sql.gz') || entry.name.endsWith('.tar.gz') || entry.name.endsWith('.sql')) {
                // Individual backup file
                allBackups.push({
                    name: entry.name,
                    path: fullPath,
                    type: 'file',
                    size: stats.size,
                    sizeFormatted: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
                    date: stats.mtime,
                    dateFormatted: stats.mtime.toISOString().split('T')[0] + ' ' + stats.mtime.toTimeString().split(' ')[0]
                });
            }
        });

        // Filter: Only show directories >1GB, keep all individual SQL files
        allBackups = allBackups.filter(backup => {
            if (backup.type === 'directory') {
                return backup.size > 1073741824; // >1GB
            }
            return true; // Keep all files
        });

        // Sort by date descending (newest first)
        allBackups.sort((a, b) => b.date - a.date);

        res.json({ success: true, files: allBackups });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET /api/system/backups/usage
router.get('/usage', (req, res) => {
    const backupDirs = ['/backups'];

    // Filter existing directories
    const existingDirs = backupDirs.filter(dir => fs.existsSync(dir));
    if (existingDirs.length === 0) {
        return res.json({
            success: true,
            data: { total: 0, used: 0, percentage: 0 }
        });
    }

    // Use du command for fast size calculation (much faster than Node.js recursive scan)
    const duCommands = existingDirs.map(d => `du -sb "${d}" 2>/dev/null || echo "0\t${d}"`);
    const duCmd = duCommands.join('; ') + '; true';

    exec(duCmd, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout) => {
        console.log('[BACKUP] du command:', duCmd);
        console.log('[BACKUP] du error:', err);
        console.log('[BACKUP] du output length:', stdout ? stdout.length : 0);

        let totalSize = 0;
        if (stdout) {
            // Parse du output: each line is "SIZE\tPATH" or "SIZE PATH"
            const lines = stdout.trim().split('\n');
            console.log('[BACKUP] Lines count:', lines.length);
            lines.forEach((line, idx) => {
                // Extract first number from each line (handles both tab and space separators)
                const match = line.match(/^(\d+)/);
                if (match) {
                    const size = parseInt(match[1]);
                    if (size) {
                        console.log(`[BACKUP] Line ${idx}: ${size} bytes`);
                        totalSize += size;
                    }
                }
            });
        }
        console.log('[BACKUP] Total size:', totalSize, 'bytes');

        const usedGB = (totalSize / (1024 * 1024 * 1024)).toFixed(1);

        // Get filesystem total from the first existing dir
        exec(`df -B1 "${existingDirs[0]}" | tail -1 | awk '{print $2}'`, (err2, stdout2) => {
            const totalBytes = parseInt(stdout2) || 0;
            const totalGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(1);
            const percentage = totalBytes > 0 ? ((totalSize / totalBytes) * 100).toFixed(1) : 0;

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

// GET /api/system/backups/download/:filename
router.get('/download/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join('/backups', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: 'Backup not found' });
        }

        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            // Directory - create tar.gz on-the-fly and stream it
            const archiveName = `${filename}.tar.gz`;
            res.setHeader('Content-Type', 'application/gzip');
            res.setHeader('Content-Disposition', `attachment; filename="${archiveName}"`);

            // Use tar command to create archive and pipe to response
            const { spawn } = require('child_process');
            const tar = spawn('tar', ['-czf', '-', '-C', '/backups', filename]);

            tar.stdout.pipe(res);
            tar.stderr.on('data', (data) => {
                console.error('tar stderr:', data.toString());
            });
            tar.on('error', (err) => {
                console.error('tar error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, error: 'Failed to create archive' });
                }
            });
        } else {
            // Regular file - just send it
            res.download(filePath, filename);
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
