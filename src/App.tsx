import React, { useState } from 'react';
import { MessageSquare, Download, AlertCircle, Users, Share2, Heart, Mail, Phone, Link as LinkIcon } from 'lucide-react';
import { extractTweetId } from './utils';
import { TweetData } from './types';
import axios from 'axios';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tweetData, setTweetData] = useState<TweetData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a Twitter URL');
      return;
    }

    setError('');
    setLoading(true);
    setTweetData(null);

    try {
      const tweetId = extractTweetId(url);
      if (!tweetId) {
        throw new Error('Invalid Twitter URL');
      }

      const response = await axios.post('http://localhost:3001/api/scrape', { url });
      setTweetData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching tweet data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!tweetData) return;

    const csvContent = [
      ['Username', 'Name', 'Reply Text', 'Emails', 'Phone Numbers', 'Links'].join(','),
      ...tweetData.replies.map(reply => {
        return [
          reply.author.username,
          reply.author.name,
          `"${reply.text.replace(/"/g, '""')}"`,
          `"${reply.contactInfo.emails.join('; ')}"`,
          `"${reply.contactInfo.phones.join('; ')}"`,
          `"${reply.contactInfo.links.join('; ')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twitter-replies-${tweetData.id}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Twitter Thread Analyzer
          </h1>
          <p className="text-lg text-gray-600">
            Extract contact information from Twitter thread replies
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste Twitter URL here..."
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Analyzing...' : 'Analyze Thread'}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing thread replies...</p>
          </div>
        )}

        {/* Results */}
        {tweetData && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MessageSquare className="text-blue-600" size={24} />
                Analysis Results
              </h2>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
              >
                <Download size={16} />
                Export to CSV
              </button>
            </div>

            {/* Tweet Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                  <MessageSquare size={20} />
                  <span className="font-semibold">{tweetData.publicMetrics.replyCount}</span>
                </div>
                <p className="text-sm text-gray-600">Replies</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                  <Share2 size={20} />
                  <span className="font-semibold">{tweetData.publicMetrics.retweetCount}</span>
                </div>
                <p className="text-sm text-gray-600">Retweets</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
                  <Heart size={20} />
                  <span className="font-semibold">{tweetData.publicMetrics.likeCount}</span>
                </div>
                <p className="text-sm text-gray-600">Likes</p>
              </div>
            </div>

            {/* Original Tweet */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Original Tweet</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users size={24} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="font-semibold">{tweetData.author.name}</p>
                    <p className="text-sm text-gray-600">@{tweetData.author.username}</p>
                  </div>
                </div>
                <p className="text-gray-700">{tweetData.text}</p>
              </div>
            </div>

            {/* Replies */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Replies with Contact Information ({tweetData.replies.length})
              </h3>
              <div className="space-y-4">
                {tweetData.replies.map((reply) => (
                  <div key={reply.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users size={20} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="font-semibold">{reply.author.name}</p>
                          <p className="text-sm text-gray-600">@{reply.author.username}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{reply.text}</p>
                    
                    {/* Contact Information */}
                    <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                      {reply.contactInfo.emails.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={16} className="text-blue-500 flex-shrink-0" />
                          <span className="text-blue-700">{reply.contactInfo.emails.join(', ')}</span>
                        </div>
                      )}
                      {reply.contactInfo.phones.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={16} className="text-green-500 flex-shrink-0" />
                          <span className="text-green-700">{reply.contactInfo.phones.join(', ')}</span>
                        </div>
                      )}
                      {reply.contactInfo.links.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <LinkIcon size={16} className="text-purple-500 flex-shrink-0" />
                          <span className="text-purple-700">{reply.contactInfo.links.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;