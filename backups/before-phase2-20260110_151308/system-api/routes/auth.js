const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Database connection pool (optimized)
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    max: 10,                      // Maximum 10 connections
    idleTimeoutMillis: 30000,     // Close idle connections after 30s
    connectionTimeoutMillis: 2000, // Connection timeout 2s
});

// Handle pool errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
    process.exit(-1);
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is required');
}

// Helper to log activity
const logActivity = async (action, details, userId = null, ip = 'unknown') => {
    try {
        const metadata = {
            user_id: userId,
            ip_address: ip,
            timestamp: new Date().toISOString(),
            user_agent: 'system-api'
        };

        await pool.query(
            'INSERT INTO activity_logs (activity_type, description, metadata) VALUES ($1, $2, $3)',
            [action, details, JSON.stringify(metadata)]
        );

        // Log to console for monitoring/SIEM integration
        console.log(JSON.stringify({
            level: 'audit',
            action,
            details,
            ...metadata
        }));
    } catch (e) {
        console.error('Failed to log activity:', e.message);
    }
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    try {
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
        // Don't leak stack traces in production
        const errorMessage = process.env.NODE_ENV === 'production'
            ? 'Authentication failed'
            : e.message;
        res.status(500).json({ success: false, error: errorMessage });
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
