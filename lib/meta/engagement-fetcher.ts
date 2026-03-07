/**
 * Facebook Engagement Fetcher
 *
 * Fetches post engagement metrics (likes, comments, shares, reactions)
 * from the Graph API v22.0. Uses pages_read_engagement permission.
 */

import type { FBEngagementData } from './types';

const GRAPH_API = 'https://graph.facebook.com/v22.0';

const ENGAGEMENT_FIELDS = [
  'likes.summary(total_count)',
  'comments.summary(total_count)',
  'shares',
  'reactions.summary(total_count)',
  'permalink_url',
].join(',');

/** Fetch engagement metrics for a single post */
export async function fetchPostEngagement(
  fbPostId: string,
  pageAccessToken: string
): Promise<FBEngagementData> {
  const url = `${GRAPH_API}/${fbPostId}?fields=${ENGAGEMENT_FIELDS}&access_token=${pageAccessToken}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(`Engagement fetch failed for ${fbPostId}: ${err.error?.message || res.statusText}`);
  }

  const data = await res.json();

  const engagement: FBEngagementData = {
    likes_count: data.likes?.summary?.total_count ?? 0,
    comments_count: data.comments?.summary?.total_count ?? 0,
    shares_count: data.shares?.count ?? 0,
    reactions_count: data.reactions?.summary?.total_count ?? 0,
    permalink_url: data.permalink_url,
  };

  // Try to fetch insights (requires pages_read_insights — may not be available)
  try {
    const insightsUrl = `${GRAPH_API}/${fbPostId}/insights?metric=post_impressions,post_engaged_users,post_clicks&access_token=${pageAccessToken}`;
    const insRes = await fetch(insightsUrl);
    if (insRes.ok) {
      const insData = await insRes.json();
      for (const metric of insData.data || []) {
        const value = metric.values?.[0]?.value ?? 0;
        if (metric.name === 'post_impressions') engagement.impressions = value;
        if (metric.name === 'post_engaged_users') engagement.engaged_users = value;
        if (metric.name === 'post_clicks') engagement.clicks = value;
      }
    }
  } catch {
    // Insights not available — non-critical
  }

  return engagement;
}

/** Fetch engagement for multiple posts sequentially (respects rate limits) */
export async function fetchBatchEngagement(
  posts: { fbPostId: string; publicationId: string }[],
  pageAccessToken: string
): Promise<Map<string, FBEngagementData>> {
  const results = new Map<string, FBEngagementData>();

  for (const post of posts) {
    try {
      const engagement = await fetchPostEngagement(post.fbPostId, pageAccessToken);
      results.set(post.publicationId, engagement);
    } catch (err) {
      console.error(`[EngagementFetcher] Failed for post ${post.fbPostId}:`, err);
      // Continue with other posts
    }
  }

  return results;
}
