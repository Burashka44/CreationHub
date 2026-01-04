const express = require('express');
const axios = require('axios');
const router = express.Router();

// Glances runs on HOST, not in Docker
// Access via host.docker.internal or host IP
const GLANCES_URL = process.env.GLANCES_URL || 'http://host.docker.internal:61208';

// Proxy all Glances API endpoints
router.get('/cpu', async (req, res) => {
    try {
        const response = await axios.get(`${GLANCES_URL}/api/4/cpu`, { timeout: 5000 });
        res.json(response.data);
    } catch (e) {
        res.status(503).json({ error: 'Glances unavailable', details: e.message });
    }
});

router.get('/mem', async (req, res) => {
    try {
        const response = await axios.get(`${GLANCES_URL}/api/4/mem`, { timeout: 5000 });
        res.json(response.data);
    } catch (e) {
        res.status(503).json({ error: 'Glances unavailable', details: e.message });
    }
});

router.get('/sensors', async (req, res) => {
    try {
        const response = await axios.get(`${GLANCES_URL}/api/4/sensors`, { timeout: 5000 });
        res.json(response.data);
    } catch (e) {
        res.status(503).json({ error: 'Glances unavailable', details: e.message });
    }
});

router.get('/disk', async (req, res) => {
    try {
        const response = await axios.get(`${GLANCES_URL}/api/4/fs`, { timeout: 5000 });
        res.json(response.data);
    } catch (e) {
        res.status(503).json({ error: 'Glances unavailable', details: e.message });
    }
});

router.get('/gpu', async (req, res) => {
    try {
        const response = await axios.get(`${GLANCES_URL}/api/4/gpu`, { timeout: 5000 });
        res.json(response.data);
    } catch (e) {
        res.status(503).json({ error: 'Glances unavailable', details: e.message });
    }
});

router.get('/network', async (req, res) => {
    try {
        const response = await axios.get(`${GLANCES_URL}/api/4/network`, { timeout: 5000 });
        res.json(response.data);
    } catch (e) {
        res.status(503).json({ error: 'Glances unavailable', details: e.message });
    }
});

router.get('/all', async (req, res) => {
    try {
        const response = await axios.get(`${GLANCES_URL}/api/4/all`, { timeout: 5000 });
        res.json(response.data);
    } catch (e) {
        res.status(503).json({ error: 'Glances unavailable', details: e.message });
    }
});

module.exports = router;
