export function extractTweetId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('twitter.com') && !urlObj.hostname.includes('x.com')) {
      return null;
    }

    const pathParts = urlObj.pathname.split('/');
    const statusIndex = pathParts.indexOf('status');
    if (statusIndex === -1 || !pathParts[statusIndex + 1]) {
      return null;
    }

    return pathParts[statusIndex + 1];
  } catch {
    return null;
  }
}