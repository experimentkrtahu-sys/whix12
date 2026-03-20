const { PermissionsBitField } = require("discord.js");

/**
 * Check if the bot has required voice channel permissions.
 * Returns an error message string if missing permissions, or null if OK.
 */
function checkVoicePermissions(voiceChannel, guild) {
    const botMember = guild.members.me;
    if (!botMember) return null;

    const perms = voiceChannel.permissionsFor(botMember);
    const missing = [];

    if (!perms.has(PermissionsBitField.Flags.Connect)) missing.push("Connect");
    if (!perms.has(PermissionsBitField.Flags.Speak)) missing.push("Speak");
    if (!perms.has(PermissionsBitField.Flags.ViewChannel)) missing.push("View Channel");

    if (missing.length > 0) {
        return `❌ I'm missing voice permissions: **${missing.join(", ")}**. Please update my role permissions.`;
    }
    return null;
}

/**
 * Check if the bot has required text channel permissions.
 * Returns an error message string if missing permissions, or null if OK.
 */
function checkTextPermissions(textChannel, guild) {
    const botMember = guild.members.me;
    if (!botMember) return null;

    const perms = textChannel.permissionsFor(botMember);
    const missing = [];

    if (!perms.has(PermissionsBitField.Flags.SendMessages)) missing.push("Send Messages");
    if (!perms.has(PermissionsBitField.Flags.EmbedLinks)) missing.push("Embed Links");

    if (missing.length > 0) {
        return `❌ I'm missing text channel permissions: **${missing.join(", ")}**. Please update my role permissions.`;
    }
    return null;
}

/**
 * Check if user has DJ permissions (has a role named "DJ" or is admin).
 */
function isDJ(member) {
    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
    return member.roles.cache.some(role => role.name.toLowerCase() === "dj");
}

module.exports = {
    checkVoicePermissions,
    checkTextPermissions,
    isDJ
};
