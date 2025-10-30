const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3030;

// Load API config
let appConfig = { apiKey: '', apiEndpoint: '', imageEndpoint: '', resultEndpoint: '', chatAgent: '', imageAgent: '' };
try {
    const configPath = path.join(__dirname, 'app_config.json');
    if (fs.existsSync(configPath)) {
        appConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
} catch (err) {
    console.error('Failed to load app_config.json:', err.message);
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static(__dirname));


// Proxy endpoint for chat API (streaming)
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, agent } = req.body;
        const apiKey = req.headers.authorization?.split(' ')[1];

        if (!apiKey) {
            return res.status(401).json({ error: 'API key is missing' });
        }

        const fetch = (await import('node-fetch')).default;
        const response = await fetch(appConfig.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                messages,
                agent: agent || appConfig.chatAgent,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        // Stream the response back to client
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        response.body.pipe(res);

    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy endpoint for image generation
app.post('/api/generate-image', async (req, res) => {
    try {
        const { prompt } = req.body;
        const apiKey = req.headers.authorization?.split(' ')[1];

        if (!apiKey) {
            return res.status(401).json({ error: 'API key is missing' });
        }

        const fetch = (await import('node-fetch')).default;
        const response = await fetch(appConfig.imageEndpoint, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [{
                    role: 'user',
                    content: [{
                        type: 'text',
                        text: prompt
                    }]
                }],
                agent: appConfig.imageAgent
            })
        });

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Image generation API error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy endpoint for checking image result
app.get('/api/image-result', async (req, res) => {
    try {
        const { request_id } = req.query;
        const apiKey = req.headers.authorization?.split(' ')[1];

        if (!apiKey) {
            return res.status(401).json({ error: 'API key is missing' });
        }

        const fetch = (await import('node-fetch')).default;
        const response = await fetch(
            `${appConfig.resultEndpoint}?agent=${appConfig.imageAgent}&request_id=${request_id}`,
            {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Image result API error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌙 Dark Occult Dream Oracle Server running on http://localhost:${PORT}`);
    console.log(`✨ Open your browser and navigate to the URL above`);
});
