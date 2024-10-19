import { google, youtube_v3 } from "googleapis";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { Response, Request } from "express";
import { OAuth2Client } from "google-auth-library";

// for development
// import express from "express";

// const app = express();
// const PORT = 3000;
// app.get("/", async (req, res) => {
//     await startUpdatingVideoTitle(res);
// });
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

dotenv.config();

interface VideoStatisticsResponse {
  items: {
    statistics: {
      viewCount: string;
    };
  }[];
}

const videoId = "_rIprh79_ZY";
const apiKey: string = process.env.YOUTUBE_V3_API_KEY!;
const mainUrlYt = "https://www.googleapis.com/youtube/v3/";

const oAuth2Client = new OAuth2Client(
  process.env.YOUTUBE_V3_CLIENT_ID,
  process.env.YOUTUBE_V3_CLIENT_SECRET,
  process.env.YOUTUBE_V3_REDIRECT_URI
);

oAuth2Client.setCredentials({
  access_token: process.env.YOUTUBE_V3_ACCESS_TOKEN,
  refresh_token: process.env.YOUTUBE_V3_REFRESH_TOKEN,
});

async function startUpdatingVideoTitle(res: Response): Promise<void> {
  console.log("Starting video title update");
  try {
    // Check if the token is expired and refresh it if needed
    if (isTokenExpired(oAuth2Client.credentials)) {
      console.log("Token expired, refreshing...");
      await refreshToken(oAuth2Client);
    }

    // Initialize YouTube API client
    const service: youtube_v3.Youtube = google.youtube({
      version: "v3",
      auth: oAuth2Client, // Provide the authenticated client
    });

    // Fetch video details and view count in one go
    console.log("Fetching video details");
    const videoDetails = await getVideoDetails(service, videoId);
    console.log("Video details fetched:", videoDetails);

    const viewCount = await getVideoViewCount(videoId, apiKey);
    console.log("Video view count fetched:", viewCount);

    if (!videoDetails) {
      res.status(404).send("No video found.");
      return;
    }

    const currentTitle = videoDetails.snippet!.title!;
    const newTitle = `This video has ${viewCount} Views. Last updated on ${new Date().toLocaleString()}`;

    // Check if the title needs to be updated
    if (currentTitle === newTitle) {
      res.status(200).send("Title is already up-to-date.");
      return;
    }

    // Get valid category IDs
    const validCategories = await getValidCategories(service);
    const categoryId = Array.from(validCategories.keys())[0]; // Use the first valid category

    // Update the video title
    console.log("Updating video title");
    const updateResponse = await updateVideoTitle(
      service,
      videoId,
      newTitle,
      categoryId
    );

    console.log("Title updated successfully:", updateResponse.snippet!.title);
    res.status(200).send(updateResponse.snippet!.title);
  } catch (error) {
    console.error("Error updating video title:", error);
    res
      .status(500)
      .send("Error updating video title: " + JSON.stringify(error));
  }
}

async function getVideoDetails(
  service: youtube_v3.Youtube,
  videoId: string
): Promise<youtube_v3.Schema$Video | null> {
  const response = await service.videos.list({
    part: ["snippet"], // Array of strings, not a single string
    id: [videoId], // id should be an array of strings
    key: apiKey, // Ensure API key is included here
  });

  return response.data.items && response.data.items.length > 0
    ? response.data.items[0]
    : null;
}

async function getVideoViewCount(
  videoId: string,
  apiKey: string
): Promise<number> {
  const url = `${mainUrlYt}videos?part=statistics&id=${videoId}&key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data: VideoStatisticsResponse =
      (await response.json()) as VideoStatisticsResponse;
    return data.items && data.items.length > 0
      ? parseInt(data.items[0].statistics.viewCount)
      : 0;
  } catch (error) {
    console.error("Error fetching video data:", error);
    return 0;
  }
}

async function getValidCategories(
  service: youtube_v3.Youtube
): Promise<Map<string, string>> {
  const response = await service.videoCategories.list({
    part: ["snippet"],
    regionCode: "US", // You can specify other region codes if needed
  });

  const categories = new Map<string, string>();
  response.data.items?.forEach((item) => {
    categories.set(item.id!, item.snippet!.title!);
  });

  return categories;
}

async function updateVideoTitle(
  service: youtube_v3.Youtube,
  videoId: string,
  newTitle: string,
  categoryId: string
): Promise<youtube_v3.Schema$Video> {
  const response = await service.videos.update({
    part: ["snippet"], // Make this an array of strings
    requestBody: {
      id: videoId,
      snippet: {
        title: newTitle,
        categoryId: categoryId, // Add a valid categoryId here
      },
    },
  });
  return response.data as youtube_v3.Schema$Video;
}

function isTokenExpired(token: any): boolean {
  return !token || !token.expiry_date || Date.now() >= token.expiry_date;
}

async function refreshToken(oAuth2Client: OAuth2Client): Promise<void> {
  try {
    const { credentials } = await oAuth2Client.refreshAccessToken();
    oAuth2Client.setCredentials(credentials);
    console.log("Token refreshed successfully:");
  } catch (error) {
    console.error("Error refreshing access token:", error);
  }
}

export default async function handler(
  req: Request,
  res: Response
): Promise<void> {
  if (req.method === "GET" && req.url === "/update") {
    await startUpdatingVideoTitle(res);
  } else {
    res.status(404).send("Not Found");
  }
}
