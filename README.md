# Twitter Thread Analyzer

A tool to extract PUBLIC contact information from Twitter/X thread replies.

## Description

Twitter Thread Analyzer is a web application that allows you to analyze Twitter/X threads and extract contact information (emails, phone numbers, and links) from replies. This can be useful for finding potential leads or contacts who have responded to a specific tweet.

## Features

- Extract contact information from Twitter thread replies
- Display original tweet information
- Show metrics (replies, retweets, likes)
- Export results to CSV

## Prerequisites

Before running this application, you need:

1. Node.js (v14 or higher)
2. npm (Node Package Manager)
3. A Twitter API bearer token
   - You can get a free key here: [Twitter Developer Portal](https://developer.twitter.com/)
   - Create a project and app to get your bearer token. Please Please PLEASE do not share the key to anyone

## Installation

1. Clone this repository (ofc)

2. Install dependencies:
   ```
   npm install
   ```

3. Update the Twitter API bearer token:
   - Open `start-server.sh`
   - Replace `"dont use mine :)"` with your actual Twitter API bearer token

## Running the Application

1. Start the backend server:
   ```
   ./start-server.sh
   ```

2. In a separate terminal, start the frontend:
   ```
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```
   or the URL shown in your terminal after running `npm run dev`

## Usage

1. Enter a Twitter/X URL in the input field (format: https://x.com/username/status/tweetId)
2. Click "Analyze Thread"
3. View the results, including any replies with contact information
4. Use the "Export to CSV" button to download the data

## Limitations

- Twitter API has rate limits that may restrict the number of requests you can make
- The application will show an error message when the rate limit is reached
- Only replies containing contact information (emails, phone numbers, links) are displayed

## Technologies Used

- Frontend: React, TypeScript, Vite, TailwindCSS
- Backend: Node.js, Express
- API: Twitter API v2
