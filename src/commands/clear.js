const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Clear all tracks from the queue"),

    async execute(interactionOrMessage) {
        const isInteraction = interactionOrMessage.isChatInputCommand?.();
        const player = interactionOrMessage.client.music.getPlayer(interactionOrMessage.guildId);

        if (!player) {
            const msg = "Nothing is playing.";
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        if (!player.queue.length) {
            const msg = "The queue is already empty.";
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        player.queue.clear();
        const msg = "🗑️ Cleared the queue.";
        return isInteraction ? interactionOrMessage.reply(msg) : interactionOrMessage.reply(msg);
    }
};
