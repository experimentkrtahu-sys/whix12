const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loop")
        .setDescription("Toggle loop mode for the player")
        .addStringOption(option =>
            option.setName("mode")
                .setDescription("Loop mode")
                .setRequired(false)
                .addChoices(
                    { name: "None", value: "none" },
                    { name: "Track", value: "track" },
                    { name: "Queue", value: "queue" }
                )),

    async execute(interactionOrMessage, queryFromArgs) {
        const isInteraction = interactionOrMessage.isChatInputCommand?.();
        const player = interactionOrMessage.client.music.getPlayer(interactionOrMessage.guildId);

        if (!player) {
            const msg = "Nothing is playing right now.";
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        let mode = isInteraction ? interactionOrMessage.options.getString("mode") : (queryFromArgs ? queryFromArgs.toLowerCase() : null);

        if (!mode || !["none", "track", "queue"].includes(mode)) {
            // Cycle modes if none provided
            const currentLoop = player.loop; 
            if (currentLoop === "none") mode = "track";
            else if (currentLoop === "track") mode = "queue";
            else mode = "none";
        }

        player.setLoop(mode);
        const msg = `🔁 Loop mode set to: **${mode}**`;
        return isInteraction ? interactionOrMessage.reply(msg) : interactionOrMessage.reply(msg);
    }
};
