const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } = require("discord.js");

const TRACKS_PER_PAGE = 10;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Show the current music queue")
        .addIntegerOption(option =>
            option.setName("page")
                .setDescription("Page number to view")
                .setRequired(false)),

    async execute(interactionOrMessage, queryFromArgs) {
        const isInteraction = interactionOrMessage.isChatInputCommand?.();
        const player = interactionOrMessage.client.music.getPlayer(interactionOrMessage.guildId);

        if (!player || !player.queue.current) {
            const msg = "Nothing is playing.";
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        const queue = player.queue;
        const totalPages = Math.max(1, Math.ceil(queue.length / TRACKS_PER_PAGE));

        let page = isInteraction
            ? (interactionOrMessage.options.getInteger("page") || 1)
            : (queryFromArgs ? parseInt(queryFromArgs) || 1 : 1);
        page = Math.max(1, Math.min(page, totalPages));

        const { embed, row } = buildQueuePage(player, page, totalPages);

        const msg = await (isInteraction
            ? interactionOrMessage.reply({ embeds: [embed], components: row ? [row] : [], fetchReply: true })
            : interactionOrMessage.reply({ embeds: [embed], components: row ? [row] : [] }));

        if (!row) return;

        // Collect button interactions for 60 seconds
        const collector = msg.createMessageComponentCollector({ time: 60000 });

        collector.on("collect", async (btnInteraction) => {
            if (btnInteraction.customId === "queue_prev") {
                page = Math.max(1, page - 1);
            } else if (btnInteraction.customId === "queue_next") {
                page = Math.min(totalPages, page + 1);
            }

            const updated = buildQueuePage(player, page, Math.max(1, Math.ceil(player.queue.length / TRACKS_PER_PAGE)));
            await btnInteraction.update({ embeds: [updated.embed], components: updated.row ? [updated.row] : [] });
        });

        collector.on("end", async () => {
            try {
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("queue_prev").setEmoji("⬅️").setLabel("Previous").setStyle(ButtonStyle.Secondary).setDisabled(true),
                    new ButtonBuilder().setCustomId("queue_next").setEmoji("➡️").setLabel("Next").setStyle(ButtonStyle.Secondary).setDisabled(true)
                );
                await msg.edit({ components: [disabledRow] });
            } catch (err) {}
        });
    }
};

function buildQueuePage(player, page, totalPages) {
    const queue = player.queue;
    const current = queue.current;
    const start = (page - 1) * TRACKS_PER_PAGE;
    const end = start + TRACKS_PER_PAGE;
    const tracks = queue.slice(start, end);

    const trackList = tracks.length > 0
        ? tracks.map((t, i) => `\`${start + i + 1}.\` [${t.title}](${t.uri}) — \`${formatDuration(t.length)}\``).join("\n")
        : "No upcoming tracks.";

    const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setAuthor({ name: "Music Queue" })
        .setDescription(
            `**Now Playing:**\n🎶 [${current.title}](${current.uri}) — \`${formatDuration(current.length)}\`\n\n**Up Next:**\n${trackList}`
        )
        .setFooter({ text: `Page ${page}/${totalPages} • ${queue.length} track${queue.length !== 1 ? "s" : ""} in queue` });

    let row = null;
    if (totalPages > 1) {
        row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("queue_prev").setEmoji("⬅️").setLabel("Previous").setStyle(ButtonStyle.Secondary).setDisabled(page <= 1),
            new ButtonBuilder().setCustomId("queue_next").setEmoji("➡️").setLabel("Next").setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages)
        );
    }

    return { embed, row };
}

function formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    return [
        hours > 0 ? hours : null,
        minutes.toString().padStart(2, "0"),
        seconds.toString().padStart(2, "0")
    ].filter(Boolean).join(":");
}
