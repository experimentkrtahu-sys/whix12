const { Kazagumo } = require("kazagumo");
const { Connectors } = require("shoukaku");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const queueStore = require("./utils/queueStore");
const logger = require("./utils/logger");

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

function buildProgressBar(position, total) {
    const barLength = 12;
    const progress = total > 0 ? Math.round((position / total) * barLength) : 0;
    const filled = "▰".repeat(Math.min(progress, barLength));
    const empty = "▱".repeat(barLength - filled.length);
    return `${filled}${empty}  \`${formatDuration(position)} / ${formatDuration(total)}\``;
}

async function disablePreviousMessage(client, player) {
    const oldMsgData = player.data.get("nowPlayingMessage");
    if (oldMsgData) {
        try {
            const oldChannel = client.channels.cache.get(oldMsgData.channelId);
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
        } catch (err) {
            // Ignore if message already deleted or not found
        }
        player.data.delete("nowPlayingMessage");
    }
}

module.exports = (client) => {
    const kazagumo = new Kazagumo(
        {
            defaultSearchEngine: "ytsearch",
            send: (guildId, payload) => {
                const guild = client.guilds.cache.get(guildId);
                if (guild) guild.shard.send(payload);
            }
        },
        new Connectors.DiscordJS(client),
        [
            {
                name: "Main",
                url: process.env.LAVALINK_URL || "whizbot.railway.internal:2333",
                auth: process.env.LAVALINK_PASSWORD || "youshallnotpass"
            }
        ],
        {
            reconnectTries: 5,
            reconnectInterval: 5000
        }
    );

    // --- Lavalink Watchdog ---
    kazagumo.shoukaku.on("ready", (name) => {
        logger.lavalink("CONNECTED", name);
    });

    kazagumo.shoukaku.on("error", (name, error) => {
        logger.lavalink("ERROR", name, error.message || error);
    });

    kazagumo.shoukaku.on("close", (name, code, reason) => {
        logger.lavalink("CLOSED", name, `Code: ${code}, Reason: ${reason || "N/A"}`);
    });

    kazagumo.shoukaku.on("disconnect", (name, players, moved) => {
        logger.lavalink("DISCONNECTED", name, `Players: ${players.size}, Moved: ${moved}`);
    });

    kazagumo.shoukaku.on("reconnecting", (name, reconnectsLeft, reconnectInterval) => {
        logger.lavalink("RECONNECTING", name, `${reconnectsLeft} tries left, interval: ${reconnectInterval}ms`);
    });

    // --- Voice Reconnect Handling ---
    kazagumo.on("playerMoved", (player, state, channels) => {
        if (!channels.newChannelId) {
            logger.info(`Player kicked from voice in guild ${player.guildId}`);
            player.destroy();
        } else if (channels.newChannelId !== channels.oldChannelId) {
            logger.info(`Player moved to ${channels.newChannelId} in guild ${player.guildId}`);
            player.voiceId = channels.newChannelId;
        }
    });

    kazagumo.on("playerStart", async (player, track) => {
        console.log(`Now playing: ${track.title} in guild ${player.guildId}`);
        player.data.set("lastTrack", track);
        updateCache(player);

        await disablePreviousMessage(client, player);

        const channel = client.channels.cache.get(player.textId);
        if (channel) {
            const loopMode = player.loop || "none";
            const loopLabel = loopMode === "none" ? "Off" : loopMode === "track" ? "🔂 Track" : "🔁 Queue";
            const volumePercent = player.volume || 100;
            const progressBar = buildProgressBar(0, track.length);

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

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("music_previous").setEmoji("1484520309368553472").setLabel("Previous").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("music_pause").setEmoji("1484519427939766283").setLabel("Pause/Resume").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("music_skip").setEmoji("⏭️").setLabel("Skip").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId("music_stop").setEmoji("1484519672836526170").setLabel("Stop").setStyle(ButtonStyle.Danger)
            );
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("music_loop").setEmoji("1484520026789773504").setLabel("Loop").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("music_shuffle").setEmoji("1484520211964100749").setLabel("Shuffle").setStyle(ButtonStyle.Secondary)
            );

            try {
                const msg = await channel.send({ embeds: [embed], components: [row1, row2] });
                player.data.set("nowPlayingMessage", { messageId: msg.id, channelId: msg.channel.id });
            } catch (err) {
                console.error("Failed to send now playing message:", err);
            }
        }
    });

    kazagumo.on("queueAdd", (player) => {
        updateCache(player);
    });

    kazagumo.on("playerDestroy", async (player) => {
        console.log(`Player destroyed in guild ${player.guildId}`);
        await disablePreviousMessage(client, player);
        queueStore.saveQueue(player.guildId, null);
    });

    kazagumo.on("playerEmpty", async (player) => {
        console.log(`Queue empty in guild ${player.guildId}`);
        await disablePreviousMessage(client, player);

        const autoplay = player.data.get("autoplay") ?? true;
        const lastTrack = player.data.get("lastTrack");

        if (autoplay && lastTrack) {
            console.log(`Autoplay triggered for guild ${player.guildId}`);
            try {
                // Search for related tracks
                // A common way is to search for the last track's title + author
                // and skip the current one if possible, or search for "related to"
                const result = await kazagumo.search(`${lastTrack.author} music`, {
                    requester: lastTrack.requester
                });

                if (result.tracks.length) {
                    const availableTracks = result.tracks.filter(t => t.uri !== lastTrack.uri);
                    if (availableTracks.length) {
                        const randomIndex = Math.floor(Math.random() * Math.min(10, availableTracks.length));
                        const relatedTrack = availableTracks[randomIndex];

                        player.queue.add(relatedTrack);
                        player.play();

                        const textChannel = client.channels.cache.get(player.textId);
                        if (textChannel) {
                            textChannel.send(`✨ **Autoplay:** Now playing related track: **${relatedTrack.title}**`);
                        }
                        return; // Don't clear cache yet if we found a track
                    }
                }
            } catch (error) {
                console.error("Autoplay Error:", error);
            }
        }

        queueStore.saveQueue(player.guildId, null);
    });

    function updateCache(player) {
        const data = {
            guildId: player.guildId,
            voiceId: player.voiceId,
            textId: player.textId,
            loop: player.loop || "none",
            queue: player.queue.map(t => ({
                title: t.title,
                uri: t.uri,
                author: t.author,
                length: t.length,
                thumbnail: t.thumbnail,
                requester: t.requester ? { id: t.requester.id, tag: t.requester.tag } : null
            })),
            current: player.queue.current ? {
                title: player.queue.current.title,
                uri: player.queue.current.uri,
                author: player.queue.current.author,
                length: player.queue.current.length,
                thumbnail: player.queue.current.thumbnail,
                requester: player.queue.current.requester ? { id: player.queue.current.requester.id, tag: player.queue.current.requester.tag } : null
            } : null
        };
        queueStore.saveQueue(player.guildId, data);
    }

    return kazagumo;
};