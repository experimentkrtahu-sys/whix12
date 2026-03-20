const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.join(__dirname, '..', '..', 'queue_cache.json');

let queueCache = {};
if (fs.existsSync(QUEUE_FILE)) {
    try {
        queueCache = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    } catch (err) {
        console.error("Failed to parse queue cache:", err);
    }
}

function saveQueue(guildId, data) {
    if (data === null) {
        delete queueCache[guildId];
    } else {
        queueCache[guildId] = data;
    }
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queueCache, null, 2), 'utf8');
}

function getQueue(guildId) {
    return queueCache[guildId];
}

module.exports = {
    saveQueue,
    getQueue
};
