require("dotenv").config();
const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const setupLavalink = require("./lavalink");
const queueStore = require("./utils/queueStore");
const volumeStore = require("./utils/volumeStore");
const logger = require("./utils/logger");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

client.music = setupLavalink(client);

client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity("Music on Slash!", { type: ActivityType.Listening });

    // Register Slash Commands
    const commands = client.commands.map(command => command.data.toJSON());
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    try {
        console.log("Registering global slash commands...");
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log("Successfully registered slash commands.");
    } catch (error) {
        console.error("Error registering slash commands:", error);
    }

    // Restore Queues
    console.log("Starting queue restoration...");
    const guilds = client.guilds.cache.map(g => g.id);
    const guildsToRestore = guilds.filter(id => {
        const data = queueStore.getQueue(id);
        return data && data.current;
    });

    if (guildsToRestore.length === 0) {
        console.log("No queues to restore. Skipping.");
    } else {
        // Wait for at least one Lavalink node to be ready (max 10s)
        const hasNode = client.music.shoukaku.nodes.size > 0 && 
            [...client.music.shoukaku.nodes.values()].some(n => n.state === 2);
        if (!hasNode) {
            console.log("Waiting for Lavalink node to connect...");
            await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    console.log("Lavalink node connection timed out after 10s. Skipping restoration.");
                    resolve();
                }, 10000);
                client.music.shoukaku.on("ready", () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
        }

        for (const guildId of guildsToRestore) {
            const data = queueStore.getQueue(guildId);
            console.log(`Restoring queue for guild ${guildId}`);
            try {
                const player = await client.music.createPlayer({
                    guildId: data.guildId,
                    textId: data.textId,
                    voiceId: data.voiceId,
                    volume: volumeStore.getVolume(data.guildId)
                });

                if (data.loop) player.setLoop(data.loop);

                const resolveTrack = async (t) => {
                    try {
                        if (!t?.uri) return null;
                        const res = await client.music.search(t.uri, { requester: t.requester });
                        return res?.tracks?.length ? res.tracks[0] : null;
                    } catch { return null; }
                };

                const currentTrack = await resolveTrack(data.current);
                if (currentTrack) player.queue.add(currentTrack);

                if (data.queue && data.queue.length) {
                    for (const trackData of data.queue) {
                        const t = await resolveTrack(trackData);
                        if (t) player.queue.add(t);
                    }
                }

                if (player.queue.length > 0) {
                    player.play();
                    console.log(`Successfully restored queue for guild ${guildId}`);
                } else {
                    console.log(`No valid tracks found to restore for guild ${guildId}`);
                    queueStore.saveQueue(guildId, null);
                    player.destroy();
                }
            } catch (err) {
                console.error(`Failed to restore queue for guild ${guildId}:`, err.message);
                queueStore.saveQueue(guildId, null); // Clear broken cache entry
            }
        }
    }
    console.log("Queue restoration complete.");
});

client.on("interactionCreate", async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    } else if (interaction.isButton()) {
        const action = interaction.customId;
        const player = client.music.getPlayer(interaction.guildId);

        if (!player) return interaction.reply({ content: "No music is playing.", ephemeral: true });

        if (action === "music_pause") {
            const paused = player.paused;
            player.pause(!paused);
            const stateText = !paused ? "⏸️ Paused" : "▶️ Resumed";
            await interaction.reply({ content: `${stateText} by ${interaction.user.tag}`, ephemeral: false });

            // Update the Now Playing message button label
            const msgData = player.data.get("nowPlayingMessage");
            if (msgData) {
                try {
                    const ch = interaction.client.channels.cache.get(msgData.channelId);
                    if (ch) {
                        const nowMsg = await ch.messages.fetch(msgData.messageId).catch(() => null);
                        if (nowMsg && nowMsg.components) {
                            const updatedRows = nowMsg.components.map(row => {
                                return new ActionRowBuilder().addComponents(
                                    row.components.map(c => {
                                        const btn = new ButtonBuilder(c.data);
                                        if (c.customId === "music_pause") {
                                            btn.setEmoji(!paused ? "1484519220409536634" : "1484519427939766283");
                                            btn.setLabel(!paused ? "Resume" : "Pause");
                                        }
                                        return btn;
                                    })
                                );
                            });
                            await nowMsg.edit({ components: updatedRows }).catch(() => null);
                        }
                    }
                } catch (err) {}
            }
        } else if (action === "music_skip") {
            player.skip();
            await interaction.reply({ content: `Skipped by ${interaction.user.tag}`, ephemeral: false });
        } else if (action === "music_stop") {
            player.destroy();
            await interaction.reply({ content: `Stopped by ${interaction.user.tag}`, ephemeral: false });
        } else if (action === "music_previous") {
            const previousTrack = player.queue.previous.pop();
            if (!previousTrack) {
                return interaction.reply({ content: "No previous track to play.", ephemeral: true });
            }
            if (player.queue.current) {
                player.queue.unshift(player.queue.current);
            }
            player.queue.unshift(previousTrack);
            player.skip();
            await interaction.reply({ content: `Playing previous track requested by ${interaction.user.tag}`, ephemeral: false });
        } else if (action === "music_loop") {
            const currentLoop = player.loop; 
            let nextLoop = "none";
            if (currentLoop === "none") nextLoop = "track";
            else if (currentLoop === "track") nextLoop = "queue";
            
            player.setLoop(nextLoop);
            await interaction.reply({ content: `Looping mode set to **${nextLoop}** by ${interaction.user.tag}`, ephemeral: false });
        } else if (action === "music_shuffle") {
            player.queue.shuffle();
            await interaction.reply({ content: `Queue shuffled by ${interaction.user.tag}`, ephemeral: false });
        }
    }
});

// --- Auto Cleanup: empty voice channel ---
const leaveTimers = new Map();

client.on("voiceStateUpdate", (oldState, newState) => {
    const player = client.music.getPlayer(oldState.guild.id);
    if (!player) return;

    const botVoiceChannelId = player.voiceId;
    if (!botVoiceChannelId) return;

    const voiceChannel = oldState.guild.channels.cache.get(botVoiceChannelId);
    if (!voiceChannel) return;

    // Count human members in the channel
    const humanMembers = voiceChannel.members.filter(m => !m.user.bot).size;

    if (humanMembers === 0) {
        // Start 90s timer if not already running
        if (!leaveTimers.has(oldState.guild.id)) {
            console.log(`[AutoCleanup] Voice channel empty in guild ${oldState.guild.id}. Starting 90s timer.`);
            const timer = setTimeout(() => {
                const currentPlayer = client.music.getPlayer(oldState.guild.id);
                if (currentPlayer) {
                    console.log(`[AutoCleanup] Destroying player in guild ${oldState.guild.id} (empty for 90s).`);
                    const textChannel = client.channels.cache.get(currentPlayer.textId);
                    if (textChannel) {
                        textChannel.send("👋 Left the voice channel due to inactivity (no one in channel for 90 seconds).");
                    }
                    currentPlayer.destroy();
                }
                leaveTimers.delete(oldState.guild.id);
            }, 90000);
            leaveTimers.set(oldState.guild.id, timer);
        }
    } else {
        // Someone is here, cancel timer
        if (leaveTimers.has(oldState.guild.id)) {
            console.log(`[AutoCleanup] Someone rejoined in guild ${oldState.guild.id}. Cancelling timer.`);
            clearTimeout(leaveTimers.get(oldState.guild.id));
            leaveTimers.delete(oldState.guild.id);
        }
    }
});

client.on("messageCreate", async message => {
    if (message.author.bot || !message.guild) return;
    const prefix = "!";
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args.join(" "));
    } catch (error) {
        logger.error(`Command !${commandName}`, error);
        message.reply("There was an error executing that command!");
    }
});

// --- Guild Join/Leave Logging ---
client.on("guildCreate", (guild) => {
    logger.guild("JOINED", guild);
});

client.on("guildDelete", (guild) => {
    logger.guild("LEFT", guild);
});

client.login(process.env.TOKEN);