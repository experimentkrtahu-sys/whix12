const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skip the current song"),

    async execute(interactionOrMessage) {
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

        player.skip();
        const successMsg = "Skipped the current track.";
        return isInteraction ? interactionOrMessage.reply(successMsg) : interactionOrMessage.reply(successMsg);
    }
};
