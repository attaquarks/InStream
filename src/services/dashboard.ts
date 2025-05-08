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

// Base URL for the Flask API 
// Remove trailing /api, as it's included in the specific endpoint fetch below
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'; 

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

  const url = `${API_BASE_URL}/api/dashboard-data?${params.toString()}`;
  console.log(`Fetching dashboard data from: ${url}`); // Log the URL being fetched

  try {
    
     const response = await fetch(url);

     if (!response.ok) {
       // Attempt to read error message from response body
       let errorBody = 'Failed to fetch dashboard data';
       try {
          const errorData = await response.json();
          errorBody = errorData.message || `HTTP error! status: ${response.status}`;
       } catch (e) {
          // Ignore JSON parsing error, use status text
          console.error("Could not parse error response JSON:", e);
          errorBody = `HTTP error! status: ${response.status} - ${response.statusText}`;
       }
       console.error("API Error Response:", errorBody);
       throw new Error(errorBody);
     }

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
    console.error('Error fetching dashboard data:', error);
    // Re-throw the error to be handled by the calling component
    // Ensure it's an actual Error object
    if (error instanceof Error) {
        throw error;
    } else {
        throw new Error(String(error) || "An unknown error occurred during fetch.");
    }
  }
}

