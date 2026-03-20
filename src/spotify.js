const axios = require("axios");

let accessToken = null;
let tokenExpiry = 0;

/**
 * Fetch a Spotify access token using Client Credentials flow.
 */
async function getAccessToken() {
    if (accessToken && Date.now() < tokenExpiry) return accessToken;

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in .env");
    }

    const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({ grant_type: "client_credentials" }).toString(),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
            }
        }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000; // Refresh 60s early
    return accessToken;
}

/**
 * Parse a Spotify URL and return { type, id }.
 */
function parseSpotifyUrl(url) {
    const regex = /(?:https:\/\/open\.spotify\.com\/|spotify:)(?:intl-[a-z]{2}\/)?(track|album|playlist)[/:]([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    if (!match) return null;
    return { type: match[1], id: match[2] };
}

/**
 * Fetch track names from the Spotify API.
 * @param {string} url The Spotify URL.
 * @returns {Promise<string[]>} Array of "Artist - Track" strings.
 */
async function getSpotifyData(url) {
    const parsed = parseSpotifyUrl(url);
    if (!parsed) throw new Error("Invalid Spotify URL.");

    const token = await getAccessToken();
    const headers = { Authorization: `Bearer ${token}` };

    if (parsed.type === "track") {
        const { data } = await axios.get(`https://api.spotify.com/v1/tracks/${parsed.id}`, { headers });
        const artists = data.artists.map(a => a.name).join(", ");
        return [`${artists} - ${data.name}`];
    }

    if (parsed.type === "playlist") {
        const tracks = [];
        let next = `https://api.spotify.com/v1/playlists/${parsed.id}/tracks?fields=items(track(name,artists(name))),next&limit=100`;

        while (next && tracks.length < 300) {
            const { data } = await axios.get(next, { headers });
            for (const item of data.items) {
                if (item.track) {
                    const artists = item.track.artists.map(a => a.name).join(", ");
                    tracks.push(`${artists} - ${item.track.name}`);
                }
            }
            next = data.next;
        }
        return tracks;
    }

    if (parsed.type === "album") {
        const tracks = [];
        let next = `https://api.spotify.com/v1/albums/${parsed.id}/tracks?limit=50`;

        while (next && tracks.length < 300) {
            const { data } = await axios.get(next, { headers });
            for (const item of data.items) {
                const artists = item.artists.map(a => a.name).join(", ");
                tracks.push(`${artists} - ${item.name}`);
            }
            next = data.next;
        }
        return tracks;
    }

    return [];
}

module.exports = { getSpotifyData };
