const { SlashCommandBuilder } = require("discord.js");
const volumeStore = require("../utils/volumeStore");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("volume")
        .setDescription("Set the music volume")
        .addIntegerOption(option => 
            option.setName("amount")
                .setDescription("Volume percentage (0-100)")
                .setMinValue(0)
                .setMaxValue(100)
                .setRequired(false)),

    async execute(interactionOrMessage, queryFromArgs) {
        const isInteraction = interactionOrMessage.isChatInputCommand?.();
        const player = interactionOrMessage.client.music.getPlayer(interactionOrMessage.guildId);

        if (!player) {
            const msg = "Nothing is playing.";
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        if (!interactionOrMessage.member.voice.channel || interactionOrMessage.member.voice.channel.id !== player.voiceId) {
            const msg = "You need to be in the same voice channel as the bot.";
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        const volume = isInteraction 
            ? interactionOrMessage.options.getInteger("amount") 
            : (queryFromArgs ? parseInt(queryFromArgs) : null);

        if (volume === null) {
            const msg = `Current volume is: ${player.volume}%`;
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        if (isNaN(volume) || volume < 0 || volume > 100) {
            const msg = "Please provide a valid volume number between 0 and 100.";
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        player.setVolume(volume);
        volumeStore.saveVolume(interactionOrMessage.guildId, volume);
        const successMsg = `Set the volume to ${volume}%`;
        return isInteraction ? interactionOrMessage.reply(successMsg) : interactionOrMessage.reply(successMsg);
    }
};
