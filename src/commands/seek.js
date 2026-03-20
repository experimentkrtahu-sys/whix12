const { SlashCommandBuilder } = require("discord.js");

function parseTime(timeString) {
    if (!timeString) return null;
    
    // Support "1:30" format
    if (timeString.includes(':')) {
        const parts = timeString.split(':');
        let seconds = 0;
        let p = 1;
        for (let i = parts.length - 1; i >= 0; i--) {
            seconds += parseInt(parts[i]) * p;
            p *= 60;
        }
        return seconds * 1000;
    }
    
    // Support "90s", "1m30s" format loosely or just seconds
    const secMatch = timeString.match(/(\d+)s/i);
    const minMatch = timeString.match(/(\d+)m/i);
    
    if (secMatch || minMatch) {
        let total = 0;
        if (minMatch) total += parseInt(minMatch[1]) * 60;
        if (secMatch) total += parseInt(secMatch[1]);
        return total * 1000;
    }
    
    // Just a number (in seconds)
    const num = parseInt(timeString);
    if (!isNaN(num)) return num * 1000;
    
    return null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("seek")
        .setDescription("Seek to a specific time in the current track")
        .addStringOption(option => 
            option.setName("time")
                .setDescription("Time to seek to (e.g. 1:30, 90, 1m30s)")
                .setRequired(true)),

    async execute(interactionOrMessage, queryFromArgs) {
        const isInteraction = interactionOrMessage.isChatInputCommand?.();
        const player = interactionOrMessage.client.music.getPlayer(interactionOrMessage.guildId);

        if (!player || !player.queue.current) {
            const msg = "Nothing is playing right now.";
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        if (!player.queue.current.isSeekable) {
            const msg = "This track is not seekable (typically a live stream).";
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        const timeStr = isInteraction ? interactionOrMessage.options.getString("time") : queryFromArgs;
        const ms = parseTime(timeStr);

        if (ms === null || isNaN(ms) || ms < 0 || ms > player.queue.current.length) {
            const msg = "Please provide a valid time within the track's duration.";
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        player.seek(ms);
        const msgText = `⏩ Seeked to **${timeStr}**.`;
        return isInteraction ? interactionOrMessage.reply(msgText) : interactionOrMessage.reply(msgText);
    }
};
