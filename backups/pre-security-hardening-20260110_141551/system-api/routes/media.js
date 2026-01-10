const express = require('express');
const axios = require('axios');
const router = express.Router();

// Helper: Extract Channel ID from URL
const extractChannelId = async (input, apiKey) => {
    // If it's already an ID (starts with UC and 24 chars)
    if (/^UC[\w-]{22}$/.test(input)) return input;

    // If it's a handle (@username)
    if (input.startsWith('@') || input.includes('youtube.com/@')) {
        const handle = input.split('@').pop();
        try {
            const res = await axios.get(`https://www.googleapis.com/youtube/v3/channels`, {
                params: {
                    part: 'id',
                    forHandle: '@' + handle,
                    key: apiKey
                }
            });
            if (res.data.items && res.data.items.length > 0) {
                return res.data.items[0].id;
            }
        } catch (e) {
            console.error('Handle lookup failed:', e.message);
        }
    }

    // If it's a standard URL
    // TODO: More complex scraping or searching might be needed for custom URLs without API
    return input; // Fallback: assume it is an ID or the user entered an ID
};

// GET /api/media/youtube/info
router.get('/youtube/info', async (req, res) => {
    const { input, key } = req.query;

    if (!input || !key) {
        return res.status(400).json({ error: 'Input (URL/ID) and API Key required' });
    }

    try {
        const channelId = await extractChannelId(input, key);

        if (!channelId) {
            return res.status(404).json({ error: 'Channel ID could not be resolved' });
        }

        const response = await axios.get(`https://www.googleapis.com/youtube/v3/channels`, {
            params: {
                part: 'snippet,statistics,brandingSettings',
                id: channelId,
                key: key
            }
        });

        if (!response.data.items || response.data.items.length === 0) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const channel = response.data.items[0];

        // Parse duration to seconds if needed, but here we just return raw or formatted data
        // We return a standardized format for our frontend
        const data = {
            platform: 'youtube',
            channel_id: channel.id,
            name: channel.snippet.title,
            description: channel.snippet.description,
            custom_url: channel.snippet.customUrl,
            published_at: channel.snippet.publishedAt,
            thumbnails: channel.snippet.thumbnails,
            subscribers: parseInt(channel.statistics.subscriberCount),
            views: parseInt(channel.statistics.viewCount),
            video_count: parseInt(channel.statistics.videoCount),
            hidden_subscriber_count: channel.statistics.hiddenSubscriberCount,
            channel_url: `https://youtube.com/${channel.snippet.customUrl || 'channel/' + channel.id}`,
            banner_url: channel.brandingSettings?.image?.bannerExternalUrl
        };

        res.json({ success: true, data });

    } catch (error) {
        console.error('YouTube API Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error?.message || error.message
        });
    }
});

module.exports = router;
