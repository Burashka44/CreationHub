const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const http = require('http');

// Docker Socket Path
const DOCKER_SOCKET = process.env.DOCKER_SOCKET || '/var/run/docker.sock';

// GET /api/system/services/status-by-port
// Checks services via Docker Socket for accurate "Up/Down" status
router.get('/status-by-port', async (req, res) => {
    const statuses = {};

    try {
        if (!fs.existsSync(DOCKER_SOCKET)) {
            console.warn('Docker socket not found at', DOCKER_SOCKET);
            return res.json({ success: false, error: 'Docker socket not available' });
        }

        const options = {
            socketPath: DOCKER_SOCKET,
            path: '/containers/json?all=1',
            method: 'GET'
        };

        const dockerReq = http.request(options, dockerRes => {
            let data = '';
            dockerRes.on('data', chunk => data += chunk);
            dockerRes.on('end', () => {
                try {
                    const containers = JSON.parse(data);
                    containers.forEach(c => {
                        const name = c.Names[0].replace(/^\//, ''); // Remove leading slash
                        const statusVal = c.State === 'running' ? 'online' : 'offline';

                        // Map by name
                        statuses[name] = statusVal;

                        // Map by public ports
                        if (c.Ports && Array.isArray(c.Ports)) {
                            c.Ports.forEach(p => {
                                if (p.PublicPort) {
                                    statuses[p.PublicPort] = statusVal;
                                    statuses[p.PublicPort.toString()] = statusVal;
                                }
                                if (p.PrivatePort) {
                                    statuses[p.PrivatePort] = statusVal;
                                    statuses[p.PrivatePort.toString()] = statusVal;
                                }
                            });
                        }
                    });

                    // Specific overrides/aliases if needed for internal services
                    if (statuses['creationhub_api']) statuses['3000'] = statuses['creationhub_api'];
                    if (statuses['creationhub_postgres']) statuses['5432'] = statuses['creationhub_postgres'];

                    res.json(statuses); // Direct object return as expected by frontend
                } catch (parseErr) {
                    res.status(500).json({ success: false, error: 'Failed to parse Docker response' });
                }
            });
        });

        dockerReq.on('error', err => {
            console.error('Docker socket request failed:', err);
            res.status(500).json({ success: false, error: err.message });
        });

        dockerReq.end();

    } catch (error) {
        console.error('Service check failed:', error);
        res.status(500).json({ success: false, errors: { general: error.message } });
    }
});

module.exports = router;
