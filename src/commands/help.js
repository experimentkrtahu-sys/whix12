const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Show all available commands"),

    async execute(interactionOrMessage) {
        const isInteraction = interactionOrMessage.isChatInputCommand?.();

        const embed = new EmbedBuilder()
            .setColor("#5865F2")
            .setAuthor({ name: "Music Bot — Command List" })
            .setDescription("Here are all available commands. Use `/command` or `!command`.")
            .addFields(
                { name: "🎵 Playback", value: [
                    "`/play <query>` — Play a song or playlist",
                    "`/skip` — Skip the current track",
                    "`/stop` — Stop playback and clear queue",
                    "`/pause` — Pause playback",
                    "`/resume` — Resume playback",
                    "`/seek <time>` — Seek to a timestamp (e.g. `1:30`)",
                ].join("\n") },
                { name: "📋 Queue", value: [
                    "`/queue [page]` — View the queue (paginated)",
                    "`/nowplaying` — Show current track info",
                    "`/remove <index>` — Remove a track from queue",
                    "`/clear` — Clear the entire queue",
                    "`/shuffle` — Shuffle upcoming tracks",
                    "`/loop [mode]` — Toggle loop (off/track/queue)",
                ].join("\n") },
                { name: "🔧 Settings", value: [
                    "`/volume [0-100]` — Set or view volume",
                    "`/autoplay` — Toggle autoplay mode",
                ].join("\n") },
                { name: "ℹ️ Info", value: [
                    "`/help` — Show this help menu",
                    "`/ping` — Check bot latency",
                    "`/uptime` — Show bot uptime",
                    "`/invite` — Get the bot invite link",
                    "`/support` — Get support server link",
                ].join("\n") }
            )
            .setFooter({ text: "Supports YouTube, Spotify, and direct search" });

        return isInteraction
            ? interactionOrMessage.reply({ embeds: [embed] })
            : interactionOrMessage.reply({ embeds: [embed] });
    }
};
