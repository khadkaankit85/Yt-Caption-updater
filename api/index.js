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

async function startUpdatingVideoTitle(res) {
    try {
        // Check if the token is expired and refresh it if needed
        if (isTokenExpired(oAuth2Client.credentials)) {
            await refreshToken(oAuth2Client);
        }

        // Initialize YouTube API client
        const service = google.youtube('v3');

        // Fetch video details and view count in one go
        const videoDetails = await getVideoDetails(service, videoId);
        const viewCount = await getVideoViewCount(videoId, apiKey);

        if (!videoDetails) {
            return res.status(404).send('No video found.');
        }

        const currentTitle = videoDetails.snippet.title;
        const newTitle = `This video has ${viewCount} Views. Last updated on ${new Date().toLocaleString()}`;

        // Check if the title needs to be updated
        if (currentTitle === newTitle) {
            return res.status(200).send('Title is already up-to-date.');
        }

        // Update the video title
        const updateResponse = await updateVideoTitle(service, videoId, newTitle);
        console.log('Title updated successfully:', updateResponse.data.snippet.title);
        return res.status(200).send(updateResponse.data.snippet.title);

    } catch (error) {
        return res.status(500).send('Error updating video title: ' + error);
    }
}

async function getVideoDetails(service, videoId) {
    const response = await service.videos.list({
        auth: oAuth2Client,
        part: 'snippet',
        id: videoId,
    });
    return response.data.items.length > 0 ? response.data.items[0] : null;
}

async function getVideoViewCount(videoId, apiKey) {
    const url = `${mainUrlYt}videos?part=statistics&id=${videoId}&key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.items && data.items.length > 0 ? data.items[0].statistics.viewCount : 0;
    } catch (error) {
        console.error('Error fetching video data:', error);
        return 0;
    }
}

async function updateVideoTitle(service, videoId, newTitle) {
    return await service.videos.update({
        auth: oAuth2Client,
        part: 'snippet',
        resource: {
            id: videoId,
            snippet: {
                title: newTitle,
            },
        },
    });
}

function isTokenExpired(token) {
    return !token || !token.expiry_date || Date.now() >= token.expiry_date || token === undefined;
}

async function refreshToken(oAuth2Client) {
    try {
        const { token } = await oAuth2Client.refreshAccessToken();
        oAuth2Client.setCredentials(token);
        console.log('Token refreshed successfully:', token.access_token);
    } catch (error) {
        console.error('Error refreshing access token:', error);
    }
}

export default async function handler(req, res) {
    if (req.method === 'GET' && req.url === '/update') {
        await startUpdatingVideoTitle(res);
    } else {
        res.status(404).send('Not Found');
    }
}

