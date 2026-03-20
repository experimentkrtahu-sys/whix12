FROM node:20-bookworm-slim

# Install OpenJDK 17 for Lavalink
RUN apt-get update && \
    apt-get install -y openjdk-17-jre-headless && \
    rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy all application files
COPY . .

# Expose Lavalink's port if you ever need to connect to it externally (optional)
EXPOSE 2333

# Start script as the main container command
CMD ["bash", "start.sh"]
