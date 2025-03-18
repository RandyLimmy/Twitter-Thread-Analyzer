export interface ContactInfo {
  emails: string[];
  phones: string[];
  links: string[];
}

export interface TweetData {
  id: string;
  text: string;
  author: {
    username: string;
    name: string;
    publicMetrics: {
      followersCount: number;
      followingCount: number;
    };
  };
  publicMetrics: {
    replyCount: number;
    retweetCount: number;
    likeCount: number;
  };
  replies: Array<{
    id: string;
    text: string;
    author: {
      username: string;
      name: string;
    };
    contactInfo: ContactInfo;
  }>;
}