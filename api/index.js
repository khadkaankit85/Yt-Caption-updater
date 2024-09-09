import { google } from 'googleapis';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const videoId = "oQ-pEiGQvD4";
const apiKey = process.env.YOUTUBE_V3_API_KEY;

const mainUrlYt = "https://www.googleapis.com/youtube/v3/";

const oAuth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_V3_CLIENT_ID,
    process.env.YOUTUBE_V3_CLIENT_SECRET,
    process.env.YOUTUBE_V3_REDIRECT_URI
);

oAuth2Client.setCredentials({
    access_token: process.env.YOUTUBE_V3_ACCESS_TOKEN,
    refresh_token: process.env.YOUTUBE_V3_REFRESH_TOKEN,
});

async function startUpdatingVideoTitle() {
    try {
        const viewCount = await getVideoViewCount(videoId, apiKey);
        const newTitle = `This video has ${viewCount} Views`;

        const service = google.youtube('v3');
        const response = await service.videos.list({
            auth: oAuth2Client,
            part: 'snippet',
            id: videoId,
        });

        if (response.data.items.length === 0) {
            console.log('No video found.');
            return;
        }

        const video = response.data.items[0];
        video.snippet.title = newTitle;

        const updateResponse = await service.videos.update({
            auth: oAuth2Client,
            part: 'snippet',
            resource: {
                id: videoId,
                snippet: video.snippet,
            },
        });

        console.log('Title updated successfully:', updateResponse.data.snippet.title);
    } catch (error) {
        console.error('Error updating video title:', error);
    }
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

function refreshToken(oAuth2Client, callback) {
    oAuth2Client.refreshAccessToken((err, token) => {
        if (err) return console.error('Error refreshing access token', err);
        console.log('New access token:', token.access_token);

        oAuth2Client.setCredentials(token);
        callback(token);
    });
}

export default async function handler(req, res) {
    if (req.method === 'GET') {
        await startUpdatingVideoTitle();
        res.status(200).send('Video title updated successfully!');
    } else {
        res.status(405).send('Method Not Allowed');
    }
}
