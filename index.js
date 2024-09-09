import express from 'express';
import { google } from 'googleapis';
import fs from 'fs';
import readline from 'readline';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const videoId = "oQ-pEiGQvD4";
const apiKey = process.env.YOUTUBE_V3_API_KEY;
const mainUrlYt = "https://www.googleapis.com/youtube/v3/";
const CREDENTIALS_PATH = "Authentication.json";
const TOKEN_PATH = "token.json";

// Load client secrets from a local file
fs.readFile(CREDENTIALS_PATH, (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content));
});

function authorize(credentials) {
    const { client_secret, client_id, redirect_uris } = credentials;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client);
        const parsedToken = JSON.parse(token);
        if (isTokenExpired(parsedToken)) {
            refreshToken(oAuth2Client, parsedToken.refresh_token, (newToken) => {
                oAuth2Client.setCredentials(newToken);
            });
        } else {
            oAuth2Client.setCredentials(parsedToken);
        }
    });

    // Start Express server after authentication
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// Define the API endpoint
app.get('/update-title', (req, res) => {
    const auth = new google.auth.OAuth2();
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return res.status(500).send('Authentication token not found.');
        auth.setCredentials(JSON.parse(token));
        startUpdatingVideoTitle(auth)
            .then(() => res.send('Title updated successfully'))
            .catch(error => res.status(500).send(`Error: ${error.message}`));
    });
});

async function startUpdatingVideoTitle(auth) {
    const viewCount = await getVideoViewCount(videoId, apiKey);
    const newTitle = `This video has ${viewCount} Views`;

    const service = google.youtube('v3');
    const response = await service.videos.list({
        auth: auth,
        part: 'snippet',
        id: videoId,
    });

    if (response.data.items.length === 0) {
        throw new Error('No video found.');
    }

    const video = response.data.items[0];
    video.snippet.title = newTitle;

    await service.videos.update({
        auth: auth,
        part: 'snippet',
        resource: {
            id: videoId,
            snippet: video.snippet,
        },
    });
}

async function getVideoViewCount(videoId, apiKey) {
    const url = `${mainUrlYt}videos?part=statistics&id=${videoId}&key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            return data.items[0].statistics.viewCount;
        } else {
            return 0;
        }
    } catch (error) {
        console.error('Error fetching video data:', error);
        return 0;
    }
}

function isTokenExpired(token) {
    return token.expiry_date < Date.now();
}

function refreshToken(oAuth2Client, refreshToken, callback) {
    oAuth2Client.refreshAccessToken((err, token) => {
        if (err) return console.error('Error refreshing access token', err);
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return console.error('Error writing token to file', err);
            console.log('Token refreshed and saved successfully');
            callback(token);
        });
    });
}

function getAccessToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
        });
    });
}

// In case of non-GET requests
app.use((req, res) => {
    res.status(404).send('Endpoint not found');
});
