const { SlashCommandBuilder } = require("discord.js");
const { acquireLock, releaseLock } = require("../utils/queueLock");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("remove")
        .setDescription("Remove a specific track from the queue")
        .addIntegerOption(option => 
            option.setName("index")
                .setDescription("The queue number of the track to remove")
                .setRequired(true)),

    async execute(interactionOrMessage, queryFromArgs) {
        const isInteraction = interactionOrMessage.isChatInputCommand?.();
        const player = interactionOrMessage.client.music.getPlayer(interactionOrMessage.guildId);

        if (!player || player.queue.length === 0) {
            const msg = "There are no tracks in the queue to remove.";
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        const indexRaw = isInteraction ? interactionOrMessage.options.getInteger("index") : parseInt(queryFromArgs);
        
        if (isNaN(indexRaw) || indexRaw < 1 || indexRaw > player.queue.length) {
            const msg = `Please provide a valid number between 1 and ${player.queue.length}.`;
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        await acquireLock(interactionOrMessage.guildId);
        try {
            const targetIndex = parseInt(indexRaw) - 1;
            const removedTrack = player.queue[targetIndex];
            player.queue.remove(targetIndex);

            const msg = `🗑️ Removed **${removedTrack.title}** from the queue.`;
            return isInteraction ? interactionOrMessage.reply(msg) : interactionOrMessage.reply(msg);
        } finally {
            releaseLock(interactionOrMessage.guildId);
        }
    }
};
