const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("autoplay")
        .setDescription("Toggle autoplay on or off"),

    async execute(interactionOrMessage) {
        const isInteraction = interactionOrMessage.isChatInputCommand?.();
        const player = interactionOrMessage.client.music.getPlayer(interactionOrMessage.guildId);

        if (!player) {
            const msg = "Nothing is playing right now. Start some music first!";
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        const currentState = player.data.get("autoplay") ?? true;
        const newState = !currentState;
        player.data.set("autoplay", newState);

        const statusLabel = newState ? "ON" : "OFF";
        const msg = `✨ **Autoplay** has been turned **${statusLabel}**.`;
        
        return isInteraction ? interactionOrMessage.reply(msg) : interactionOrMessage.reply(msg);
    }
};
