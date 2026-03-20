#!/bin/bash

echo "Starting Lavalink server..."
java -jar Lavalink.jar &

# Wait for Lavalink to initialize before starting the bot
sleep 10

echo "Starting Discord bot..."
node src/index.js
