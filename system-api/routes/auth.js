const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is required');
}

// Helper to log activity
const logActivity = async (action, details, userId = null, ip = 'unknown') => {
    try {
        await pool.query(
            'INSERT INTO activity_logs (activity_type, description, metadata) VALUES ($1, $2, $3)',
            [action, details, JSON.stringify({ user_id: userId, ip_address: ip })]
        );
    } catch (e) {
        console.error('Failed to log activity:', e);
    }
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    try {
        // TEMPORARY RECOVERY MODE (Expires: 24 hours from 2026-01-07 19:35 UTC+3)
        const RECOVERY_EXPIRY = new Date('2026-01-08T19:35:00+03:00');
        const now = new Date();

        if (now < RECOVERY_EXPIRY && password === process.env.RECOVERY_PASSWORD) {
            const token = jwt.sign({ role: 'admin', email, recovery: true }, JWT_SECRET, { expiresIn: '24h' });
            await logActivity('LOGIN_SUCCESS', `RECOVERY MODE: ${email} logged in (expires ${RECOVERY_EXPIRY.toISOString()})`, null, ip);
            console.warn(`⚠️  RECOVERY MODE ACTIVE - Expires: ${RECOVERY_EXPIRY.toISOString()}`);
            return res.json({
                success: true,
                token,
                user: { email, role: 'admin', id: '00000000-0000-0000-0000-000000000000', recovery: true },
                warning: 'Recovery mode - please create hashed admin account ASAP'
            });
        }

        // Proper authentication: Check user in database
        const userResult = await pool.query('SELECT * FROM admins WHERE email = $1 AND is_active = true', [email]);

        if (userResult.rows.length === 0) {
            await logActivity('LOGIN_FAILED', `Failed login attempt for non-existent user: ${email}`, null, ip);
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        // Check password hash (bcrypt)
        const bcrypt = require('bcryptjs');
        const passwordMatch = await bcrypt.compare(password, user.password_hash || '');

        if (!passwordMatch) {
            await logActivity('LOGIN_FAILED', `Failed login for ${email} (invalid password)`, user.id, ip);
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Update last login
        await pool.query('UPDATE admins SET last_login_at = NOW() WHERE id = $1', [user.id]);

        // Generate JWT token
        const token = jwt.sign(
            { role: user.role, email: user.email, id: user.id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        await logActivity('LOGIN_SUCCESS', `User ${email} logged in successfully`, user.id, ip);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name
            }
        });

    } catch (e) {
        console.error('Login error:', e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    await logActivity('LOGOUT', 'User logged out', null, ip);
    res.json({ success: true });
});

// GET /api/auth/check
router.get('/check', (req, res) => {
    // Validate token if present header
    res.json({ success: true, user: { role: 'guest' } });
});

module.exports = router;
