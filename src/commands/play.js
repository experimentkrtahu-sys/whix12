const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const spotify = require("../spotify");
const volumeStore = require("../utils/volumeStore");
const { acquireLock, releaseLock } = require("../utils/queueLock");
const { checkCooldown } = require("../utils/cooldown");
const { checkVoicePermissions, checkTextPermissions } = require("../utils/permissions");
const logger = require("../utils/logger");

const MAX_QUEUE_SIZE = 500;
const MAX_PLAYLIST_TRACKS = 100;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song from YouTube or Spotify")
        .addStringOption(option => 
            option.setName("query")
                .setDescription("The song name or URL to play")
                .setRequired(true)),
    
    async execute(interactionOrMessage, queryFromArgs) {
        const isInteraction = interactionOrMessage.isChatInputCommand?.();
        const query = isInteraction ? interactionOrMessage.options.getString("query") : queryFromArgs;
        
        // Safety check for empty query
        if (!query) {
            if (isInteraction) return interactionOrMessage.reply({ content: "Please provide a search query.", ephemeral: true });
            return interactionOrMessage.reply("Please provide a search query.");
        }

        const member = interactionOrMessage.member;
        const guild = interactionOrMessage.guild;
        const channel = interactionOrMessage.channel;
        const user = isInteraction ? interactionOrMessage.user : interactionOrMessage.author;

        if (!member.voice.channel) {
            const msg = "Join a voice channel first.";
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        // Cooldown check (3 seconds per user)
        const remaining = checkCooldown(user.id, "play", 3);
        if (remaining > 0) {
            const msg = `⏳ Please wait **${remaining}s** before using this command again.`;
            return isInteraction ? interactionOrMessage.reply({ content: msg, ephemeral: true }) : interactionOrMessage.reply(msg);
        }

        // Permission checks
        const voiceErr = checkVoicePermissions(member.voice.channel, guild);
        if (voiceErr) {
            return isInteraction ? interactionOrMessage.reply({ content: voiceErr, ephemeral: true }) : interactionOrMessage.reply(voiceErr);
        }
        const textErr = checkTextPermissions(channel, guild);
        if (textErr) {
            return isInteraction ? interactionOrMessage.reply({ content: textErr, ephemeral: true }) : interactionOrMessage.reply(textErr);
        }

        // Log command usage
        logger.command(guild.id, user.id, "play", query);

        // Defer if interaction (it might take time)
        if (isInteraction) await interactionOrMessage.deferReply();

        await acquireLock(guild.id);
        try {
            return await executePlay(interactionOrMessage, isInteraction, query, member, guild, channel, user);
        } finally {
            releaseLock(guild.id);
        }
    }
};

async function executePlay(interactionOrMessage, isInteraction, query, member, guild, channel, user) {
        const player = await interactionOrMessage.client.music.createPlayer({
            guildId: guild.id,
            textId: channel.id,
            voiceId: member.voice.channel.id,
            volume: volumeStore.getVolume(guild.id)
        });

        // Handle Spotify Links (Unofficial)
        const spotifyRegex = /(?:https:\/\/open\.spotify\.com\/|spotify:)(?:intl-[a-z]{2}\/)?(track|album|playlist)[/:]([a-zA-Z0-9]+)/;
        const spotifyMatch = query.match(spotifyRegex);
        
        if (spotifyMatch) {
            try {
                const trackNames = await spotify.getSpotifyData(query);
                if (!trackNames.length) {
                    const msg = "❌ No tracks found in that Spotify link.";
                    return isInteraction ? interactionOrMessage.editReply(msg) : interactionOrMessage.reply(msg);
                }

                const isPlaylist = trackNames.length > 1;
                const cappedNames = trackNames.slice(0, MAX_PLAYLIST_TRACKS);
                const capMsg = trackNames.length > MAX_PLAYLIST_TRACKS ? ` (capped at ${MAX_PLAYLIST_TRACKS})` : "";
                const progressMsg = `🔍 Processing **${cappedNames.length}**${capMsg} Spotify track(s)...`;
                let loadingMsg = isInteraction ? await interactionOrMessage.editReply(progressMsg) : await interactionOrMessage.reply(progressMsg);
                
                let loadedCount = 0;
                let duplicateCount = 0;
                for (const name of cappedNames) {
                    let result;
                    try {
                        result = await interactionOrMessage.client.music.search(name, { requester: user });
                    } catch (err) {
                        continue;
                    }
                    
                    if (result && result.tracks && result.tracks.length) {
                        const track = result.tracks[0];
                        const isDuplicate = player.queue.find(t => t.uri === track.uri) || (player.queue.current && player.queue.current.uri === track.uri);
                        if (!isDuplicate) {
                            if (player.queue.length >= MAX_QUEUE_SIZE) break;
                            player.queue.add(track);
                            loadedCount++;
                            if (!player.playing) player.play();
                        } else {
                            duplicateCount++;
                        }
                    }
                }

                const dupMsg = duplicateCount > 0 ? ` (Skipped **${duplicateCount}** duplicates)` : "";
                const successText = isPlaylist 
                    ? `✅ Successfully loaded **${loadedCount}** tracks from Spotify!${dupMsg}`
                    : (loadedCount > 0 ? `✅ Successfully loaded: **${trackNames[0]}**` : `❌ **${trackNames[0]}** is already in the queue.`);

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("music_pause").setEmoji("1484519427939766283").setLabel("Pause/Resume").setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId("music_skip").setEmoji("⏭️").setLabel("Skip").setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId("music_stop").setEmoji("1484519672836526170").setLabel("Stop").setStyle(ButtonStyle.Danger)
                );

                return isInteraction 
                    ? interactionOrMessage.editReply({ content: successText, components: [row] })
                    : loadingMsg.edit({ content: successText, components: [row] });

            } catch (error) {
                console.error("Spotify Integration Error:", error);
                const msg = `❌ Error fetching Spotify content: ${error.message}`;
                return isInteraction ? interactionOrMessage.editReply(msg) : interactionOrMessage.reply(msg);
            }
        }

        // Handle YouTube Playlists
        if (query.includes("list=")) {
            let result;
            try {
                result = await interactionOrMessage.client.music.search(query, { requester: user });
            } catch (err) {
                const errorMsg = getSearchErrorMsg(null, err);
                return isInteraction ? interactionOrMessage.editReply(errorMsg) : interactionOrMessage.reply(errorMsg);
            }

            const errorMsg = getSearchErrorMsg(result, null);
            if (errorMsg) {
                return isInteraction ? interactionOrMessage.editReply(errorMsg) : interactionOrMessage.reply(errorMsg);
            }

            if (result.type === 'PLAYLIST') {
                const cappedTracks = result.tracks.slice(0, MAX_PLAYLIST_TRACKS);
                let addedCount = 0;
                let duplicateCount = 0;
                for (const track of cappedTracks) {
                    const isDuplicate = player.queue.find(t => t.uri === track.uri) || (player.queue.current && player.queue.current.uri === track.uri);
                    if (!isDuplicate) {
                        if (player.queue.length >= MAX_QUEUE_SIZE) break;
                        player.queue.add(track);
                        addedCount++;
                    } else {
                        duplicateCount++;
                    }
                }

                if (addedCount > 0 && !player.playing) player.play();

                const dupMsg = duplicateCount > 0 ? ` (Skipped **${duplicateCount}** duplicates)` : "";
                const msg = `✅ Added **${addedCount}** songs from YouTube playlist: **${result.playlistName}**${dupMsg}`;
                return isInteraction ? interactionOrMessage.editReply(msg) : interactionOrMessage.reply(msg);
            }
        }

        // Handle Normal Search / Single URL
        let result;
        try {
            result = await interactionOrMessage.client.music.search(query, { requester: user });
        } catch (err) {
            const errorMsg = getSearchErrorMsg(null, err);
            return isInteraction ? interactionOrMessage.editReply(errorMsg) : interactionOrMessage.reply(errorMsg);
        }

        const errorMsg = getSearchErrorMsg(result, null);
        if (errorMsg) {
            return isInteraction ? interactionOrMessage.editReply(errorMsg) : interactionOrMessage.reply(errorMsg);
        }

        const track = result.tracks[0];
        const isDuplicate = player.queue.find(t => t.uri === track.uri) || (player.queue.current && player.queue.current.uri === track.uri);
        
        if (isDuplicate) {
            const msg = `❌ **${track.title}** is already in the queue.`;
            return isInteraction ? interactionOrMessage.editReply(msg) : interactionOrMessage.reply(msg);
        }

        if (player.queue.length >= MAX_QUEUE_SIZE) {
            const msg = `❌ Queue is full! Maximum **${MAX_QUEUE_SIZE}** tracks allowed per server.`;
            return isInteraction ? interactionOrMessage.editReply(msg) : interactionOrMessage.reply(msg);
        }

        player.queue.add(track);

        if (!player.playing) {
            player.play();
        }

        const msgText = `✅ Added **${track.title}** to the queue.`;
        return isInteraction ? interactionOrMessage.editReply(msgText) : interactionOrMessage.reply(msgText);
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

function getSearchErrorMsg(result, err) {
    if (err) {
        const message = err.message ? err.message.toLowerCase() : "";
        if (message.includes("node")) return "❌ The music server (Lavalink) is currently offline or unreachable.";
        return `❌ Search Error: ${err.message}`;
    }

    if (!result || (result.type !== 'ERROR' && (!result.tracks || !result.tracks.length))) {
        return "❌ No results found. Please try a different search.";
    }

    if (result.type === 'ERROR') {
        const errorMessage = result.errorName || result.exception?.message || "Unknown error";
        const lowerMsg = errorMessage.toLowerCase();
        
        if (lowerMsg.includes("age restricted") || lowerMsg.includes("sign in") || lowerMsg.includes("bot")) {
            return "❌ This track is **age-restricted** or requires a login and cannot be played.";
        } else if (lowerMsg.includes("region") || lowerMsg.includes("country")) {
            return "❌ This track is **region-blocked** and cannot be played.";
        } else if (lowerMsg.includes("copyright") || lowerMsg.includes("blocked")) {
            return "❌ This track is **blocked** due to copyright restrictions.";
        } else {
            return `❌ Search Error: \`${errorMessage}\``;
        }
    }

    return null;
}