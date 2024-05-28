const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');
require("dotenv").config()

const apiKey = process.env.YOUTUBE_V3_API_KEY
const videoId = "oQ-pEiGQvD4"

// Load client secrets from a local file
const CREDENTIALS_PATH = "Authentication.json"; // Path to your OAuth 2.0 credentials
const TOKEN_PATH = 'token.json'; // Path to store the token

// Replace with your video ID
const VIDEO_ID = 'oQ-pEiGQvD4';
const API_KEY = process.env.YOUTUBE_V3_API_KEY; // Replace with your YouTube Data API key

// Base URL for YouTube Data API
const mainUrlYt = "https://www.googleapis.com/youtube/v3/";

// Load client secrets from a local file
fs.readFile(CREDENTIALS_PATH, (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content), updateVideoTitleBasedOnViews);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the given callback function
 * @param {Object} credentials The authorization client credentials
 * @param {function} callback The callback to call with the authorized client
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        else {
            oAuth2Client.setCredentials(JSON.parse(token));
            callback(oAuth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then execute the given callback with the authorized OAuth2 client
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for
 * @param {getEventsCallback} callback The callback for the authorized client
 */
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
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
 * Get the view count of a YouTube video
 */



async function getVideoViewCount() {
    const url = `${mainUrlYt}videos?part=statistics&id=${videoId}&key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            const viewCount = data.items[0].statistics.viewCount;
            console.log(viewCount);
            return viewCount;
        } else {
            return 0;
        }
    } catch (error) {
        console.error('Error fetching video data:', error);
        return 0;
    }
}

/**
 * Update the title of a YouTube video based on its view count
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client
 */
async function updateVideoTitleBasedOnViews(auth) {
    setInterval(async () => {

        const viewCount = await getVideoViewCount(VIDEO_ID, API_KEY);
        const newTitle = `This video has ${viewCount} Views`;

        const service = google.youtube('v3');
        service.videos.list({
            auth: auth,
            part: 'snippet',
            id: VIDEO_ID,
        }, (err, response) => {
            if (err) return console.error('The API returned an error: ' + err);
            if (response.data.items.length === 0) {
                console.log('No video found.');
                return;
            }
            const video = response.data.items[0];
            console.log(video.snippet.title)
            video.snippet.title = newTitle;
            console.log(video.snippet.title)

            service.videos.update({
                auth: auth,
                part: 'snippet',
                resource: {
                    id: VIDEO_ID,
                    snippet: video.snippet,
                },
            }, (err, response) => {
                if (err) return console.error('Error updating video title: ' + err);
                console.log('Title updated successfully:', response.data.snippet.title);
            });
        });


    }, 1000 * 60 * 10)


}

