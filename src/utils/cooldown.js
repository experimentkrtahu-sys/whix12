// Per-user command cooldown system
const cooldowns = new Map();

/**
 * Check if a user is on cooldown for a command.
 * Returns remaining seconds if on cooldown, or 0 if free.
 */
function checkCooldown(userId, commandName, cooldownSeconds = 3) {
    const key = `${userId}-${commandName}`;
    const now = Date.now();
    const expiry = cooldowns.get(key);

    if (expiry && now < expiry) {
        return Math.ceil((expiry - now) / 1000);
    }

    cooldowns.set(key, now + cooldownSeconds * 1000);
    // Auto-cleanup after expiry
    setTimeout(() => cooldowns.delete(key), cooldownSeconds * 1000);
    return 0;
}

module.exports = { checkCooldown };
