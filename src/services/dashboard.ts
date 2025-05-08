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
    sentimentScore: number;
    sentimentChange: number;
    reach: number; // Assuming this maps to trending topics count or similar
    reachChange: number;
  };
  activityData: { // Contains data potentially structured by interval
    labels: string[];
    datasets: {
        label: string;
        data: number[];
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

// Base URL for the Flask API (adjust if needed)
// Assume the Flask app is running on port 5000 locally during development
// In production, this would be the deployed API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Fetches consolidated dashboard data from the Flask backend.
 *
 * @param options - Filtering options (source, keyword, timeRange).
 * @returns A promise that resolves to the DashboardData object.
 */
export async function fetchDashboardData(options: FetchDashboardOptions = {}): Promise<DashboardData> {
  const { source = 'all', keyword = 'all', timeRange = '7' } = options;

  // Construct query parameters
  const params = new URLSearchParams({
    source,
    keyword: keyword === 'all' ? '' : keyword, // Send empty string if 'all'
    timeRange,
  });

  const url = `${API_BASE_URL}/dashboard-data?${params.toString()}`;
  console.log(`Fetching dashboard data from: ${url}`); // Log the URL being fetched

  try {
    // Simulate API delay
    // await new Promise(resolve => setTimeout(resolve, 1000));
    // In a real app, fetch from your backend API
     const response = await fetch(url);

     if (!response.ok) {
       // Attempt to read error message from response body
       let errorBody = 'Failed to fetch dashboard data';
       try {
          const errorData = await response.json();
          errorBody = errorData.message || `HTTP error! status: ${response.status}`;
       } catch (e) {
          // Ignore JSON parsing error, use status text
          errorBody = `HTTP error! status: ${response.status} - ${response.statusText}`;
       }
       throw new Error(errorBody);
     }

     const data: DashboardData = await response.json();

     // --- Data Transformation/Structuring ---
     // Structure activityData for the chart component if needed
     // The Flask API currently returns datasets, adapt if structure changes
     if (data.activityData && data.activityData.labels && data.activityData.datasets) {
        // Example: Transforming API dataset structure to ActivityDataPoint[] for 'daily' view
        const dailyActivity: ActivityDataPoint[] = data.activityData.labels.map((label, index) => {
            const point: ActivityDataPoint = { date: label };
            data.activityData!.datasets.forEach(dataset => {
                 point[dataset.label.toLowerCase()] = dataset.data[index] ?? 0; // Assuming label is platform name
             });
            return point;
        });
        // Assign transformed data (you might need similar logic for weekly/monthly if API changes)
        data.activityData.daily = dailyActivity;
     }


    return data;

    // --- Mock Data (Remove or comment out when using the actual API) ---
    /*
    console.warn("Using MOCK dashboard data");
     const mockData = generateMockDashboardData();
     // Simulate filtering based on options (basic example)
     if (keyword && keyword !== 'all') {
         mockData.recentPosts = mockData.recentPosts?.filter(p => p.content.toLowerCase().includes(keyword.toLowerCase())) ?? [];
         mockData.topTopics = mockData.topTopics?.filter(t => t.name.toLowerCase().includes(keyword.toLowerCase())) ?? [];
     }
     if (source && source !== 'all') {
         mockData.recentPosts = mockData.recentPosts?.filter(p => p.platform.toLowerCase() === source.toLowerCase()) ?? [];
         // Adjust other metrics based on source if necessary
     }
     return mockData;
     */
     // --- End Mock Data ---

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Re-throw the error to be handled by the calling component
    throw error;
  }
}


// Mock data function (for testing without the Flask backend)
function generateMockDashboardData(): DashboardData {
     const today = new Date();
     const generateDateLabels = (days: number, interval: 'day' | 'week' | 'month'): string[] => {
         const labels: string[] = [];
         for (let i = 0; i < days; i++) {
             const date = new Date(today);
             if (interval === 'day') date.setDate(today.getDate() - (days - 1 - i));
             // Add logic for week/month intervals if needed
             labels.push(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
         }
         return labels;
     };

      const activityLabels = generateDateLabels(7, 'day');
      const engagementLabels = generateDateLabels(7, 'day');

    return {
      metrics: {
        totalPosts: Math.floor(Math.random() * 1000) + 500,
        postsChange: Math.floor(Math.random() * 21) - 10, // -10 to +10 %
        engagementRate: Math.random() * 5 + 1, // 1.0 to 6.0 %
        engagementChange: Math.floor(Math.random() * 11) - 5, // -5 to +5 %
        sentimentScore: Math.random() * 4 + 3, // 3.0 to 7.0
        sentimentChange: Math.floor(Math.random() * 7) - 3, // -3 to +3 %
        reach: Math.floor(Math.random() * 5000) + 1000,
        reachChange: Math.floor(Math.random() * 16) - 8, // -8 to +8 %
      },
      activityData: {
         labels: activityLabels,
         datasets: [
             { label: 'twitter', data: activityLabels.map(() => Math.floor(Math.random() * 30) + 5) },
             { label: 'facebook', data: activityLabels.map(() => Math.floor(Math.random() * 20) + 3) }
             // Add more platform datasets as needed
         ],
         // Populate daily/weekly/monthly if needed based on datasets
         daily: activityLabels.map((label, index) => ({
                date: label,
                twitter: Math.floor(Math.random() * 30) + 5, // Example transformation
                facebook: Math.floor(Math.random() * 20) + 3,
            })),
       },
      sentimentDistribution: {
        positive: Math.floor(Math.random() * 500) + 200,
        neutral: Math.floor(Math.random() * 300) + 100,
        negative: Math.floor(Math.random() * 100) + 50,
      },
      wordCloudData: [
        { text: 'AI', value: Math.floor(Math.random() * 50) + 20 },
        { text: 'NextJS', value: Math.floor(Math.random() * 40) + 15 },
        { text: 'Cloud', value: Math.floor(Math.random() * 35) + 10 },
        { text: 'Analytics', value: Math.floor(Math.random() * 30) + 10 },
        { text: 'Data', value: Math.floor(Math.random() * 25) + 8 },
        { text: 'React', value: Math.floor(Math.random() * 20) + 5 },
        { text: 'API', value: Math.floor(Math.random() * 18) + 5 },
         { text: 'Trend', value: Math.floor(Math.random() * 15) + 4 },
      ],
      topTopics: [ // Actually hashtags based on current structure
        { name: 'AI', posts: Math.floor(Math.random() * 100) + 50 },
        { name: 'Tech', posts: Math.floor(Math.random() * 80) + 40 },
        { name: 'WebDev', posts: Math.floor(Math.random() * 70) + 30 },
        { name: 'OpenSource', posts: Math.floor(Math.random() * 60) + 25 },
        { name: 'CloudComputing', posts: Math.floor(Math.random() * 50) + 20 },
      ],
      platformDistribution: {
        labels: ['Twitter', 'Facebook', 'Instagram', 'LinkedIn'],
        data: [
             Math.floor(Math.random() * 50) + 20,
             Math.floor(Math.random() * 30) + 15,
             Math.floor(Math.random() * 20) + 10,
             Math.floor(Math.random() * 10) + 5
            ],
      },
      engagementMetrics: {
         labels: engagementLabels,
         datasets: [
             { label: 'Avg Likes', data: engagementLabels.map(() => Math.floor(Math.random() * 50) + 10) },
             { label: 'Avg Shares', data: engagementLabels.map(() => Math.floor(Math.random() * 10) + 2) }
            ]
      },
      recentPosts: [
        { platform: 'Twitter', author: 'User1', content: 'Loving the new Next.js features! #webdev', sentiment: 'Positive', likes: 150, shares: 20, date: new Date(today.getTime() - 1 * 24 * 3600 * 1000).toISOString() },
        { platform: 'Facebook', author: 'User2', content: 'Discussing the impact of AI on jobs.', sentiment: 'Neutral', likes: 50, shares: 5, date: new Date(today.getTime() - 2 * 24 * 3600 * 1000).toISOString() },
        { platform: 'Twitter', author: 'User3', content: 'Cloud costs are getting out of hand!', sentiment: 'Negative', likes: 25, shares: 3, date: new Date(today.getTime() - 3 * 24 * 3600 * 1000).toISOString() },
         { platform: 'LinkedIn', author: 'User4', content: 'Great insights on data analytics strategies.', sentiment: 'Positive', likes: 80, shares: 15, date: new Date(today.getTime() - 4 * 24 * 3600 * 1000).toISOString() },
         { platform: 'Twitter', author: 'User5', content: 'Trying out the latest AI tools for coding.', sentiment: 'Positive', likes: 120, shares: 18, date: new Date(today.getTime() - 5 * 24 * 3600 * 1000).toISOString() },
          { platform: 'Facebook', author: 'User6', content: 'Is AI overhyped right now?', sentiment: 'Neutral', likes: 60, shares: 8, date: new Date(today.getTime() - 6 * 24 * 3600 * 1000).toISOString() },
      ],
    };
 }
