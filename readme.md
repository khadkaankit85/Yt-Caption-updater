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
   git clone https://github.com/khadkaankit85/yt-video-title-updater.git
   cd yt-video-title-updater
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Setup environment variables:**

   Create a `.env` file in the root directory and add your YouTube Data API key:

   ```env
   YOUTUBE_V3_API_KEY=YOUR_YOUTUBE_API_KEY
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

## Configuration

- **CREDENTIALS_PATH:** Path to your OAuth 2.0 credentials file (default: `Authentication.json`)
- **TOKEN_PATH:** Path to store the OAuth 2.0 token (default: `token.json`)
- **VIDEO_ID:** The ID of the YouTube video to be updated
- **API_KEY:** Your YouTube Data API key from the `.env` file

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
