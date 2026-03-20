// Per-guild queue lock to prevent race conditions
// when multiple users spam commands simultaneously.

const locks = new Map();

async function acquireLock(guildId) {
    while (locks.get(guildId)) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    locks.set(guildId, true);
}

function releaseLock(guildId) {
    locks.delete(guildId);
}

module.exports = {
    acquireLock,
    releaseLock
};
