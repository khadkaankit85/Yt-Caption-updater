// const { google } = require('googleapis');
// const fs = require('fs');
// const readline = require('readline');
// const fetch = require('node-fetch');

import { google } from 'googleapis'
import fs from 'fs'
import readline from 'readline'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
dotenv.config()

const videoId = "oQ-pEiGQvD4";
const apiKey = process.env.YOUTUBE_V3_API_KEY;

const CREDENTIALS_PATH = "Authentication.json";
const TOKEN_PATH = "token.json";


// Load client secrets from a local file
fs.readFile(CREDENTIALS_PATH, (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content), startUpdatingVideoTitle);
});

function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        const parsedToken = JSON.parse(token);
        if (isTokenExpired(parsedToken)) {
            refreshToken(oAuth2Client, parsedToken.refresh_token, (newToken) => {
                oAuth2Client.setCredentials(newToken);
                callback(oAuth2Client);
            });
        } else {
            oAuth2Client.setCredentials(parsedToken);
            callback(oAuth2Client);
        }
    });
}

function startUpdatingVideoTitle(auth) {
    setInterval(async () => {
        const viewCount = await getVideoViewCount(videoId, apiKey);
        const newTitle = `This video has ${viewCount} Views`;

        const service = google.youtube('v3');
        service.videos.list({
            auth: auth,
            part: 'snippet',
            id: videoId,
        }, (err, response) => {
            if (err) return console.error('The API returned an error: ' + err);
            if (response.data.items.length === 0) {
                console.log('No video found.');
                return;
            }
            const video = response.data.items[0];
            video.snippet.title = newTitle;

            service.videos.update({
                auth: auth,
                part: 'snippet',
                resource: {
                    id: videoId,
                    snippet: video.snippet,
                },
            }, (err, response) => {
                if (err) return console.error('Error updating video title: ' + err);
                console.log('Title updated successfully:', response.data.snippet.title);
            });
        });
    }, 1000 * 60 * 10);  // Updates every 10 minutes
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
        // Store the new token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return console.error('Error writing token to file', err);
            console.log('Token refreshed and saved successfully');
            callback(token); // Pass the entire token object
        });
    });
}


function getAccessToken(oAuth2Client, callback) {
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
            });
            callback(oAuth2Client);
        });
    });
}
