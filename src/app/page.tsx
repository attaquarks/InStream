// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import FiltersCard from '@/components/dashboard/filters-card';
import MetricCard from '@/components/dashboard/metric-card';
import ActivityChartCard, { type ActivityDataPoint } from '@/components/dashboard/activity-chart-card';
import SentimentAnalysisCard from '@/components/dashboard/sentiment-analysis-card';
import WordCloudCard from '@/components/dashboard/word-cloud-card';
import TopHashtagsCard from '@/components/dashboard/top-hashtags-card';
import PlatformDistributionCard from '@/components/dashboard/platform-distribution-card';
import EngagementMetricsCard from '@/components/dashboard/engagement-metrics-card';
import RecentPostsTable from '@/components/dashboard/recent-posts-table';

import { fetchTweets, type Tweet } from '@/services/twitter'; // Keep for potential future use or parts of data
import { summarizeTrendingTopics } from '@/ai/flows/summarize-trending-topics'; // Keep for potential future use or parts of data
import { analyzeSentiment, type SentimentAnalysisOutput } from '@/ai/flows/sentiment-analysis-insights'; // Keep for potential future use or parts of data
import { useToast } from "@/hooks/use-toast";

import { fetchDashboardData, type DashboardData } from '@/services/dashboard'; // Import new service
import { TrendingUp, MessageSquareText, Smile, Users } from 'lucide-react'; // Icons for metric cards

const DEFAULT_QUERY = "AI trends";
const DEFAULT_SOURCE = "all";
const DEFAULT_TIME_RANGE = "7"; // Default to 7 days

export default function DashboardPage() {
  const [filters, setFilters] = useState({
    source: DEFAULT_SOURCE,
    keyword: DEFAULT_QUERY,
    timeRange: DEFAULT_TIME_RANGE,
  });
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadData = useCallback(async (currentFilters: typeof filters) => {
    setIsLoading(true);
    setError(null);
    console.log("Loading data with filters:", currentFilters); // Log filters

    try {
      toast({ title: "Fetching Data...", description: `Loading insights for ${currentFilters.keyword || 'all keywords'}.` });
      const data = await fetchDashboardData(currentFilters);
      console.log("Fetched data:", data); // Log fetched data
      setDashboardData(data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
      setDashboardData(null); // Clear data on error
      toast({ variant: "destructive", title: "Data Fetch Error", description: err instanceof Error ? err.message : "Could not load data." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData(filters);
  }, [loadData, filters]);

  const handleRefresh = () => {
    loadData(filters);
  };

  const handleSearch = (newFilters: { source: string; keyword: string; timeRange: string }) => {
    setFilters(newFilters);
  };

  // Placeholder for collection modal trigger
  const handleNewCollection = () => {
    // In a real app, this would open a modal
    toast({ title: "New Collection", description: "Functionality to start a new data collection process." });
  };

  // Placeholder for export action
  const handleExport = () => {
    // In a real app, this would trigger a download
    toast({ title: "Export Data", description: "Functionality to export dashboard data." });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background text-foreground">
      <DashboardHeader
        onRefresh={handleRefresh}
        onExport={handleExport}
        onNewCollection={handleNewCollection}
        isLoading={isLoading}
      />

      <div className="mb-6">
        <FiltersCard
          initialFilters={filters}
          onSearch={handleSearch}
          isLoading={isLoading}
          // Pass top hashtags/keywords for the dropdown
          keywords={dashboardData?.topTopics?.map(t => t.name) || []} 
        />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[...Array(4)].map((_, i) => <MetricCard key={i} isLoading={true} />)}
        </div>
        // Add more skeleton loaders for other sections if desired
      )}

      {!isLoading && error && (
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && dashboardData && (
        <>
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Total Posts"
              value={dashboardData.metrics.totalPosts?.toLocaleString() ?? '0'}
              change={dashboardData.metrics.postsChange ?? 0}
              icon={<MessageSquareText className="h-6 w-6 text-primary" />}
              isLoading={isLoading}
            />
            <MetricCard
              title="Engagement Rate"
              value={`${dashboardData.metrics.engagementRate?.toFixed(1) ?? '0.0'}%`}
              change={dashboardData.metrics.engagementChange ?? 0}
              icon={<TrendingUp className="h-6 w-6 text-success-foreground" />} // Assuming success color for engagement
              isLoading={isLoading}
            />
            <MetricCard
              title="Avg. Sentiment" // Title adjusted
              value={dashboardData.metrics.sentimentScore?.toFixed(1) ?? '0.0'}
              change={dashboardData.metrics.sentimentChange ?? 0}
              icon={<Smile className="h-6 w-6 text-yellow-500" />} // Assuming warning color for sentiment
              isLoading={isLoading}
            />
             <MetricCard
              title="Reach" // Title adjusted
              value={dashboardData.metrics.reach?.toLocaleString() ?? '0'}
              change={dashboardData.metrics.reachChange ?? 0}
              icon={<Users className="h-6 w-6 text-info-foreground" />} // Assuming info color for reach
              isLoading={isLoading}
            />
          </div>

          {/* Main Dashboard Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <ActivityChartCard
                activityData={dashboardData.activityData?.daily || []} // Adjust based on selected view
                isLoading={isLoading}
                // Add daily/weekly/monthly data props if API provides them separately
              />
            </div>
            <div className="lg:col-span-1">
              <SentimentAnalysisCard
                sentimentResult={dashboardData.sentimentDistribution}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Word Cloud and Top Topics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <WordCloudCard wordCloudData={dashboardData.wordCloudData || []} isLoading={isLoading} />
            </div>
            <div>
              <TopHashtagsCard hashtags={dashboardData.topTopics || []} isLoading={isLoading} />
            </div>
          </div>

          {/* Platform Distribution and Engagement Metrics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
             <div className="lg:col-span-1">
               <PlatformDistributionCard platformData={dashboardData.platformDistribution} isLoading={isLoading} />
             </div>
             <div className="lg:col-span-2">
               <EngagementMetricsCard engagementData={dashboardData.engagementMetrics} isLoading={isLoading} />
             </div>
          </div>

          {/* Recent Posts Table */}
          <div>
            <RecentPostsTable posts={dashboardData.recentPosts || []} isLoading={isLoading} />
          </div>
        </>
      )}
    </div>
  );
}
