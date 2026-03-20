const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("shuffle")
        .setDescription("Shuffle the current queue"),

    async execute(interactionOrMessage) {
        const isInteraction = interactionOrMessage.isChatInputCommand?.();
        const player = interactionOrMessage.client.music.getPlayer(interactionOrMessage.guildId);

        if (!player || player.queue.length < 2) {
            const msg = "There are not enough tracks in the queue to shuffle.";
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        player.queue.shuffle();
        const msg = "🔀 Shuffled the queue.";
        return isInteraction ? interactionOrMessage.reply(msg) : interactionOrMessage.reply(msg);
    }
};
