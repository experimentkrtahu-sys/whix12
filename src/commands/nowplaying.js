const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } = require("discord.js");

const TRACKS_PER_PAGE = 10;

function formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    return [hours > 0 ? hours : null, minutes.toString().padStart(2, "0"), seconds.toString().padStart(2, "0")].filter(Boolean).join(":");
}

function buildProgressBar(position, total) {
    const barLength = 12;
    const progress = total > 0 ? Math.round((position / total) * barLength) : 0;
    const filled = "▰".repeat(Math.min(progress, barLength));
    const empty = "▱".repeat(barLength - filled.length);
    return `${filled}${empty}  \`${formatDuration(position)} / ${formatDuration(total)}\``;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("nowplaying")
        .setDescription("Show the currently playing song"),

    async execute(interactionOrMessage) {
        const isInteraction = interactionOrMessage.isChatInputCommand?.();
        const player = interactionOrMessage.client.music.getPlayer(interactionOrMessage.guildId);
        
        if (!player || !player.queue.current) {
            const msg = "Nothing is playing.";
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        const track = player.queue.current;
        const position = player.position || 0;
        const loopMode = player.loop || "none";
        const loopLabel = loopMode === "none" ? "Off" : loopMode === "track" ? "🔂 Track" : "🔁 Queue";
        const volumePercent = player.volume || 100;
        const progressBar = buildProgressBar(position, track.length);

        const embed = new EmbedBuilder()
            .setAuthor({ name: "Now Playing", iconURL: "https://cdn.discordapp.com/emojis/932636806121271318.gif" })
            .setTitle(track.title)
            .setURL(track.uri)
            .setThumbnail(track.thumbnail)
            .setColor("#5865F2")
            .setDescription(progressBar)
            .addFields(
                { name: "Duration", value: `\`${formatDuration(track.length)}\``, inline: true },
                { name: "Author", value: `\`${track.author}\``, inline: true },
                { name: "Requester", value: `${track.requester}`, inline: true },
                { name: "Volume", value: `\`${volumePercent}%\``, inline: true },
                { name: "Loop", value: `\`${loopLabel}\``, inline: true }
            )
            .setFooter({ text: "Use buttons below to control playback" });

        const pauseEmoji = player.paused ? "1484519220409536634" : "1484519427939766283";
        const pauseLabel = player.paused ? "Resume" : "Pause";

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("music_previous").setEmoji("1484520309368553472").setLabel("Previous").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("music_pause").setEmoji(pauseEmoji).setLabel(pauseLabel).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("music_skip").setEmoji("⏭️").setLabel("Skip").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("music_stop").setEmoji("1484519672836526170").setLabel("Stop").setStyle(ButtonStyle.Danger)
        );
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("music_loop").setEmoji("1484520026789773504").setLabel("Loop").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("music_shuffle").setEmoji("1484520211964100749").setLabel("Shuffle").setStyle(ButtonStyle.Secondary)
        );

        const oldMsgData = player.data.get("nowPlayingMessage");
        if (oldMsgData) {
            try {
                const oldChannel = interactionOrMessage.client.channels.cache.get(oldMsgData.channelId);
                if (oldChannel) {
                    const oldMsg = await oldChannel.messages.fetch(oldMsgData.messageId);
                    if (oldMsg) {
                        const disabledRows = oldMsg.components.map(row => {
                            return new ActionRowBuilder().addComponents(
                                row.components.map(c => new ButtonBuilder(c.data).setDisabled(true))
                            );
                        });
                        await oldMsg.edit({ components: disabledRows });
                    }
                }
            } catch (err) {}
        }

        const msg = await (isInteraction 
            ? interactionOrMessage.reply({ embeds: [embed], components: [row1, row2], fetchReply: true })
            : interactionOrMessage.reply({ embeds: [embed], components: [row1, row2] }));

        player.data.set("nowPlayingMessage", { messageId: msg.id, channelId: msg.channel.id });
        return msg;
    }
};
