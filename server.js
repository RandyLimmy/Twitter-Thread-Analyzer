import express from 'express';
import cors from 'cors';
import axios from 'axios';

// Twitter API credentials
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || 'YOUR_TWITTER_BEARER_TOKEN';

const app = express();

// Configure CORS to allow requests from our frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'], // Vite's ports
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Configure Twitter API client
const twitterClient = axios.create({
  baseURL: 'https://api.twitter.com/2',
  headers: {
    'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;
const requestCounts = new Map();

// Rate limiting middleware
const rateLimiter = (req, res, next) => {
  const now = Date.now();
  const clientIP = req.ip;
  
  if (!requestCounts.has(clientIP)) {
    requestCounts.set(clientIP, { count: 1, windowStart: now });
    return next();
  }

  const clientData = requestCounts.get(clientIP);
  if (now - clientData.windowStart > RATE_LIMIT_WINDOW) {
    clientData.count = 1;
    clientData.windowStart = now;
    return next();
  }

  if (clientData.count >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  }

  clientData.count++;
  next();
};

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/scrape', rateLimiter, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Extract tweet ID from URL
    const tweetId = url.split('/status/')[1]?.split('?')[0];
    if (!tweetId) {
      return res.status(400).json({ error: 'Invalid Twitter URL' });
    }

    console.log(`Processing tweet ID: ${tweetId}`);

    try {
      // Fetch the tweet data using Twitter API
      const tweetResponse = await twitterClient.get(`/tweets/${tweetId}`, {
        params: {
          'expansions': 'author_id',
          'tweet.fields': 'public_metrics,created_at',
          'user.fields': 'name,username,public_metrics'
        }
      });

      // Fetch conversation (replies) using Twitter API
      const conversationResponse = await twitterClient.get(`/tweets/search/recent`, {
        params: {
          'query': `conversation_id:${tweetId}`,
          'expansions': 'author_id',
          'tweet.fields': 'in_reply_to_user_id,author_id,created_at,conversation_id',
          'user.fields': 'name,username',
          'max_results': 100
        }
      });

      // Process tweet data
      const tweet = tweetResponse.data.data;
      const users = tweetResponse.data.includes.users;
      const author = users.find(user => user.id === tweet.author_id);

      // Process replies
      let replies = [];
      if (conversationResponse.data.data) {
        // Extract contact information from replies
        replies = conversationResponse.data.data.map(reply => {
          const replyAuthor = conversationResponse.data.includes.users.find(
            user => user.id === reply.author_id
          );
          
          // Extract contact information using regex patterns
          const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
          const phonePattern = /(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g;
          const linkPattern = /(https?:\/\/[^\s]+)/g;
          
          const contactInfo = {
            emails: reply.text.match(emailPattern) || [],
            phones: reply.text.match(phonePattern) || [],
            links: reply.text.match(linkPattern) || []
          };

          return {
            id: reply.id,
            text: reply.text,
            author: {
              username: replyAuthor?.username || 'unknown',
              name: replyAuthor?.name || 'Unknown User'
            },
            contactInfo
          };
        });

        // Filter replies to only include those with contact information
        replies = replies.filter(reply => 
          reply.contactInfo.emails.length > 0 || 
          reply.contactInfo.phones.length > 0 || 
          reply.contactInfo.links.length > 0
        );
      }

      // Create response object
      const result = {
        id: tweetId,
        text: tweet.text,
        author: {
          username: author.username,
          name: author.name,
          publicMetrics: {
            followersCount: author.public_metrics?.followers_count || 0,
            followingCount: author.public_metrics?.following_count || 0
          }
        },
        publicMetrics: {
          replyCount: tweet.public_metrics?.reply_count || 0,
          retweetCount: tweet.public_metrics?.retweet_count || 0,
          likeCount: tweet.public_metrics?.like_count || 0
        },
        replies
      };
      
      console.log('Analysis complete. Found:', {
        tweetText: tweet.text ? 'Yes' : 'No',
        authorInfo: author ? 'Yes' : 'No',
        replyCount: replies.length
      });
      
      res.json(result);
    } catch (apiError) {
      console.log('Twitter API error:', apiError.message);
      
      // Return error message instead of sample data
      res.status(429).json({ 
        error: 'Twitter API rate limit reached. Please try again later.' 
      });
    }
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: 'Failed to scrape tweet data' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
