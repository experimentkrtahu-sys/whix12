const fs = require('fs');
const path = require('path');

const VOLUME_FILE = path.join(__dirname, '..', '..', 'volume_cache.json');

let volumeCache = {};
if (fs.existsSync(VOLUME_FILE)) {
    try {
        volumeCache = JSON.parse(fs.readFileSync(VOLUME_FILE, 'utf8'));
    } catch (err) {
        console.error("Failed to parse volume cache:", err);
    }
}

function saveVolume(guildId, volume) {
    volumeCache[guildId] = volume;
    fs.writeFileSync(VOLUME_FILE, JSON.stringify(volumeCache, null, 2), 'utf8');
}

function getVolume(guildId) {
    return volumeCache[guildId] !== undefined ? volumeCache[guildId] : 100;
}

module.exports = {
    saveVolume,
    getVolume
};
