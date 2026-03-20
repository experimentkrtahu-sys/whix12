const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "..", "..", "logs");

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getTimestamp() {
    return new Date().toISOString();
}

function writeToFile(filename, message) {
    const filepath = path.join(LOG_DIR, filename);
    const line = `[${getTimestamp()}] ${message}\n`;
    fs.appendFileSync(filepath, line, "utf8");
}

const logger = {
    command(guildId, userId, commandName, args = "") {
        const msg = `[CMD] Guild:${guildId} User:${userId} /${commandName} ${args}`.trim();
        console.log(msg);
        writeToFile("commands.log", msg);
    },

    error(context, error) {
        const msg = `[ERR] ${context}: ${error.message || error}`;
        console.error(msg);
        writeToFile("errors.log", msg);
    },

    guild(action, guild) {
        const msg = `[GUILD] ${action}: ${guild.name} (${guild.id}) — ${guild.memberCount} members`;
        console.log(msg);
        writeToFile("guilds.log", msg);
    },

    lavalink(action, nodeName, details = "") {
        const msg = `[LAVALINK] ${action}: Node "${nodeName}" ${details}`.trim();
        console.log(msg);
        writeToFile("lavalink.log", msg);
    },

    info(message) {
        const msg = `[INFO] ${message}`;
        console.log(msg);
        writeToFile("bot.log", msg);
    }
};

module.exports = logger;
