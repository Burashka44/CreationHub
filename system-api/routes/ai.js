const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const router = express.Router();

const upload = multer({ dest: '/tmp/uploads/' });

// Service URLs (internal docker network)
const SERVICES = {
    CHAT: 'http://creationhub_ollama:11434/api/chat',
    TRANSCRIBE: 'http://creationhub-ai-transcribe:8000/v1/audio/transcriptions',
    TTS: 'http://creationhub-ai-tts:10200/process',
    TRANSLATE: 'http://creationhub-ai-translate:5000/translate'
};

// Health Check
router.get('/healthz', (req, res) => {
    res.json({ status: 'ok', services: SERVICES });
});

// Chat Proxy (Ollama)
router.post('/chat', async (req, res) => {
    try {
        const response = await axios.post(SERVICES.CHAT, req.body, {
            responseType: req.body.stream ? 'stream' : 'json'
        });

        if (req.body.stream) {
            response.data.pipe(res);
        } else {
            res.json(response.data);
        }
    } catch (error) {
        console.error('Chat Error:', error.message);
        res.status(502).json({ error: 'AI Chat service unavailable' });
    }
});

// Transcribe Proxy (Faster-Whisper)
router.post('/transcribe', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));
        formData.append('model', 'medium'); // Default model

        const response = await axios.post(SERVICES.TRANSCRIBE, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        // Cleanup
        fs.unlinkSync(req.file.path);

        res.json(response.data);
    } catch (error) {
        console.error('Transcribe Error:', error.message);
        if (req.file) fs.unlinkSync(req.file.path); // Cleanup on error
        res.status(502).json({ error: 'Transcription service unavailable' });
    }
});

// TTS Proxy (Piper)
router.post('/tts', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Text required' });

        const response = await axios.get(SERVICES.TTS, {
            params: { text, output_file: '-' }, // Piper usually outputs to stdout or file
            responseType: 'arraybuffer'
        });

        res.set('Content-Type', 'audio/wav');
        res.send(response.data);
    } catch (error) {
        console.error('TTS Error:', error.message);
        res.status(502).json({ error: 'TTS service unavailable' });
    }
});

// Translate Proxy (LibreTranslate)
router.post('/translate', async (req, res) => {
    try {
        const response = await axios.post(SERVICES.TRANSLATE, {
            q: req.body.text,
            source: req.body.source || 'auto',
            target: req.body.target || 'en'
        });
        res.json(response.data);
    } catch (error) {
        console.error('Translate Error:', error.message);
        res.status(502).json({ error: 'Translation service unavailable' });
    }
});

// Image Generation Proxy (Stub)
router.post('/image', async (req, res) => {
    // Requires Stable Diffusion service
    res.status(503).json({ error: 'Image generation service not installed. Please ask admin to install Stable Diffusion.' });
});

// AV Dubbing Proxy (Stub)
router.post('/av', async (req, res) => {
    // Requires complex AV pipeline
    res.status(503).json({ error: 'AV Dubbing service not installed.' });
});

// Video Cleaning Proxy (Stub)
router.post('/clean', async (req, res) => {
    // Requires Propainter/etc
    res.status(503).json({ error: 'Video cleaning service not installed.' });
});

module.exports = router;
