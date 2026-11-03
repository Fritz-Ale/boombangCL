const express = require('express');
const http = require('http');
const crypto = require('node:crypto');
const { Server } = require('socket.io');
const ConsoleLogger = require('../utils/ConsoleLogger');
const logger = new ConsoleLogger();

// This set will store the valid, short-lived bot tokens.
const authorizedBotTokens = new Set();

module.exports = (port) => {
    const app = express();
    // SSL is terminated by the reverse proxy (nginx-proxy), so always use HTTP here.
    const server = http.createServer(app);

    console.log(`Using HTTP server (SSL terminated by reverse proxy).`);
    console.log(`Server will run on port ${port}.`);
    console.log(`CORS origin set to: ${process.env.CLIENT_URL}`);
    // Middleware to parse JSON bodies
    app.use(express.json());

    // Internal endpoint for the Laravel API to pre-authorize a bot token
    app.post('/internal/add-bot-token', (req, res) => {
        // Internal operations require an independent shared secret. The
        // emulator API token must not be reused as a browser-visible credential.
        const configured = process.env.BOT_PREAUTH_TOKEN || '';
        const received = req.get('X-Bot-Preauth-Token') || '';
        if (!configured || configured.startsWith('CHANGE_ME') || !received) return res.sendStatus(403);
        const expected = Buffer.from(configured);
        const provided = Buffer.from(received);
        if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
            return res.sendStatus(403);
        }
        const { token } = req.body || {};
        if (typeof token !== 'string' || !/^[a-zA-Z0-9]{40}$/.test(token)) {
            return res.status(400).json({ error: 'Invalid token format.' });
        }

        // Never log tokens: a leaked short-lived token can impersonate a bot.
        authorizedBotTokens.add(token);

        // The token is valid for 30 seconds. After that, remove it.
        const expiry = setTimeout(() => {
            authorizedBotTokens.delete(token);
            logger.log('Expired a short-lived bot token', 'info');
        }, 30000);
        // Do not hold the Node process open just for an expired bot token.
        expiry.unref?.();

        res.status(200).json({ success: true });
    });

    // Read-only authenticated statistics for Laravel; never expose player identities.
    // A separate internal token prevents exposing the emulator's API credentials.
    app.get('/internal/portal-stats', (req, res) => {
        const received = req.get('X-Portal-Stats-Token') || '';
        const configured = process.env.PORTAL_STATS_TOKEN || '';
        if (!configured || !received) return res.sendStatus(403);
        const a = Buffer.from(received);
        const b = Buffer.from(configured);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.sendStatus(403);
        const ConnectedUsersCollection = require('../collections/ConnectedUsersCollection');
        const playerIds = new Set();
        for (const user of ConnectedUsersCollection.getAll()) {
            if (user && !user.is_bot && user.id !== undefined) playerIds.add(String(user.id));
        }
        return res.set('Cache-Control', 'no-store').json({ online_players: playerIds.size });
    });

    // Configuración de CORS para Socket.io
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL, // URL del cliente
            methods: ['GET', 'POST'],        // Métodos permitidos
            allowedHeaders: ['Content-Type'], // Encabezados permitidos
            credentials: true,               // Permite cookies
        },
    });

    server.listen(port, () => {
        logger.log(`Server running on port ${port}`, 'success');
    });

    return { app, io, authorizedBotTokens, httpServer: server };
};