# YouTube Video Title Updater

This application uses the YouTube Data API v3 to update the title of a YouTube video based on its view count. It periodically checks the view count and updates the video title to reflect the current number of views.

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## Features

- Fetches view count of a YouTube video using YouTube Data API v3.
- Updates the title of a YouTube video to include the current view count.
- Handles OAuth 2.0 authentication for accessing YouTube API.
- Periodically checks and updates the video title.

## Technologies

- **Node.js**
- **Google APIs (YouTube Data API v3)**
- **OAuth 2.0**

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/khadkaankit85/Yt-Caption-updater.git
   cd Yt-Caption-updater
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Setup environment variables:**

   Create a `.env` file in the root directory and add your YouTube Data API key:

   ```env
   YOUTUBE_V3_API_KEY= <your api key>
   YOUTUBE_V3_ACCESS_TOKEN=<your token>
   YOUTUBE_V3_REFRESH_TOKEN=<your refresh token>
   YOUTUBE_V3_CLIENT_ID= <your client id>
   YOUTUBE_V3_CLIENT_SECRET= <your client secret>
   YOUTUBE_V3_REDIRECT_URI=http://localhost:3000
   ```

4. **Add OAuth 2.0 credentials:**

   Save your OAuth 2.0 client credentials in a file named `Authentication.json` in the root directory. You can obtain these credentials from the Google Cloud Console.

## Usage

1. **Run the application:**

   ```bash
   node index.js
   ```

   The application will prompt you to authorize access to your YouTube account if it is not already authorized.

2. **Follow the authorization steps:**

   The application will provide a URL. Open this URL in your browser and authorize the application. Enter the authorization code back in the terminal when prompted.

3. **Monitor the updates:**

   The application will periodically check the view count of the specified video and update its title accordingly.
