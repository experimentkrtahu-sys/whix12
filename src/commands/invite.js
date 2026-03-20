const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("invite")
        .setDescription("Get the bot invite link"),

    async execute(interactionOrMessage) {
        const isInteraction = interactionOrMessage.isChatInputCommand?.();
        const clientId = interactionOrMessage.client.user.id;
        const link = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=3147776&scope=bot%20applications.commands`;
        const msg = `🔗 **[Click here to invite me to your server!](${link})**`;
        return isInteraction ? interactionOrMessage.reply(msg) : interactionOrMessage.reply(msg);
    }
};
