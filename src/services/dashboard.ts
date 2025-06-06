// src/services/dashboard.ts

import type { ActivityDataPoint } from '@/components/dashboard/activity-chart-card';
import type { SentimentDistribution } from '@/components/dashboard/sentiment-analysis-card';
import type { WordCloudDataItem } from '@/components/dashboard/word-cloud-card';
import type { HashtagTopic } from '@/components/dashboard/top-hashtags-card';
import type { PlatformDistributionData } from '@/components/dashboard/platform-distribution-card';
import type { EngagementMetricsData } from '@/components/dashboard/engagement-metrics-card';
import type { RecentPost } from '@/components/dashboard/recent-posts-table';

// Structure matching the Flask API response for /api/dashboard-data
export interface DashboardData {
  metrics: {
    totalPosts: number;
    postsChange: number;
    engagementRate: number;
    engagementChange: number;
    sentimentScore: number; // Assuming 0-10 scale from API
    sentimentChange: number;
    reach: number;
    reachChange: number;
  };
  activityData: { // Contains data potentially structured by interval
    labels: string[];
    datasets: {
        label: string; // Platform name
        data: number[]; // Count per label/date
        borderColor?: string;
        tension?: number;
        fill?: boolean;
    }[];
    // Store raw data or pre-process for different views if needed
    daily?: ActivityDataPoint[];
    weekly?: ActivityDataPoint[];
    monthly?: ActivityDataPoint[];
  } | null;
  sentimentDistribution: SentimentDistribution | null;
  wordCloudData: WordCloudDataItem[] | null;
  topTopics: HashtagTopic[] | null; // API returns hashtags here
  platformDistribution: PlatformDistributionData | null;
  engagementMetrics: EngagementMetricsData | null;
  recentPosts: RecentPost[] | null;
}

interface FetchDashboardOptions {
  source?: string;
  keyword?: string;
  timeRange?: string; // e.g., '1', '7', '30', '90'
}

// Ensure NEXT_PUBLIC_API_URL is defined and accessible
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn('NEXT_PUBLIC_API_URL environment variable not set. Defaulting to http://localhost:5000');
}
console.log(`Using API Base URL: ${API_BASE_URL}`); // Log the determined base URL

/**
 * Fetches consolidated dashboard data from the Flask backend.
 *
 * @param options - Filtering options (source, keyword, timeRange).
 * @returns A promise that resolves to the DashboardData object.
 */
export async function fetchDashboardData(options: FetchDashboardOptions = {}): Promise<DashboardData> {
  const { source = 'all', keyword = '', timeRange = '7' } = options; // Default keyword to empty string

  // Construct query parameters
  const params = new URLSearchParams({
    source,
    keyword, // Send empty string if no keyword
    timeRange,
  });

  // Validate URL construction
  let url: string;
  try {
    url = new URL(`/api/dashboard-data?${params.toString()}`, API_BASE_URL).toString();
    console.log(`Fetching dashboard data from: ${url}`); // Log the URL being fetched
  } catch (e) {
    console.error("Error constructing API URL:", e);
    throw new Error(`Invalid API URL constructed: ${API_BASE_URL}. Please check the NEXT_PUBLIC_API_URL environment variable.`);
  }


  try {

     const response = await fetch(url);

     if (!response.ok) {
       // Attempt to read error message from response body
       let errorBody = `HTTP error! status: ${response.status} - ${response.statusText}`;
       try {
         const errorData = await response.json();
         errorBody = errorData.message || JSON.stringify(errorData) || errorBody; // Use detailed message if available
       } catch (e) {
         // If JSON parsing fails, just use the status text
         console.warn("Could not parse error response JSON:", e);
       }
       console.error(`API Error Response for ${url}: ${errorBody}`);
       throw new Error(`Failed to fetch dashboard data: ${errorBody}`);
     }

    // If response is OK, proceed to parse JSON
    const data: DashboardData = await response.json();

    // --- Data Transformation/Structuring ---
    if (data.activityData && data.activityData.labels && data.activityData.datasets) {
       const dailyActivity: ActivityDataPoint[] = data.activityData.labels.map((label, index) => {
           const point: ActivityDataPoint = { date: label };
           data.activityData!.datasets.forEach(dataset => {
                // Ensure the key is lowercase and valid for object property access
                const platformKey = dataset.label.toLowerCase().replace(/[^a-z0-9]/gi, ''); // Basic sanitization
                if (platformKey) {
                   point[platformKey] = dataset.data[index] ?? 0;
                }
            });
           return point;
       });
       data.activityData.daily = dailyActivity;
    } else {
       console.warn("Activity data received from API is missing labels or datasets.");
       // Ensure activityData is at least null or an empty structure if expected by components
       data.activityData = data.activityData || { labels: [], datasets: [], daily: [] };
    }

     // Ensure other potentially null fields are handled gracefully
    data.sentimentDistribution = data.sentimentDistribution || { positive: 0, neutral: 0, negative: 0 };
    data.wordCloudData = data.wordCloudData || [];
    data.topTopics = data.topTopics || [];
    data.platformDistribution = data.platformDistribution || { labels: [], data: [] };
    data.engagementMetrics = data.engagementMetrics || { labels: [], datasets: [] };
    data.recentPosts = data.recentPosts || [];

    return data;

  } catch (error) {
    // Log the specific type of error if possible
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error(`'Failed to fetch' error for URL: ${url}. Possible causes: Server not running, Network issue, CORS problem, or incorrect API URL (${API_BASE_URL}).`);
         throw new Error(`Failed to load dashboard data. Could not connect to the backend server at ${API_BASE_URL}. Please ensure it's running and accessible.`);
    } else {
        console.error(`Error fetching dashboard data from ${url}:`, error);
    }

    // Re-throw a consistent error message
    throw new Error(`Failed to load dashboard data. ${error instanceof Error ? error.message : 'An unknown error occurred. Please check the browser console and ensure the backend server is running.'}`);
  }
}
