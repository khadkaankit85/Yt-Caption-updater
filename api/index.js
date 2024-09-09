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
        // Check if the token is expired and refresh it if needed
        if (isTokenExpired(oAuth2Client.credentials)) {
            await refreshToken(oAuth2Client);
        }

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
    // If token doesn't have an expiry_date, assume it's not expired
    if (!token || !token.expiry_date) return false;

    return Date.now() >= token.expiry_date;
}

async function refreshToken(oAuth2Client) {
    try {
        const { token } = await oAuth2Client.refreshAccessToken();

        // Update the credentials with the new token
        oAuth2Client.setCredentials(token);

        // Log or save the new token as needed
        console.log('Token refreshed successfully:', token.access_token);

    } catch (error) {
        console.error('Error refreshing access token:', error);
    }
}

export default async function handler(req, res) {
    if (req.method === 'GET' && req.url === '/update') {
        await startUpdatingVideoTitle();
        res.status(200).send('Video title updated successfully!');
    } else {
        res.status(404).send('Not Found');
    }
}
