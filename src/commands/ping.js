const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check the bot's latency"),

    async execute(interactionOrMessage) {
        const isInteraction = interactionOrMessage.isChatInputCommand?.();
        const ws = interactionOrMessage.client.ws.ping;
        const msg = `🏓 **Pong!** Latency: \`${ws}ms\``;
        return isInteraction ? interactionOrMessage.reply(msg) : interactionOrMessage.reply(msg);
    }
};
