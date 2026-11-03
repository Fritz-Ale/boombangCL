const express = require('express');
const NotificationController = require('../controllers/api/NotificationController');

const router = express.Router();

// API-to-server notifications must be authenticated; do not expose state changes publicly.
router.use((req, res, next) => {
    const secret = process.env.EMULATOR_API_TOKEN;
    if (!secret || req.get('X-Emulator-Token') !== secret) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }
    next();
});

// Internal notification endpoints
router.post('/notify-credits-update', (req, res) => {
    NotificationController.notifyCreditsUpdate(req, res);
});

router.post('/notify-inventory-update', (req, res) => {
    NotificationController.notifyInventoryUpdate(req, res);
});

module.exports = router;