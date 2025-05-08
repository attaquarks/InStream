// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import DashboardHeader from '@/components/dashboard/dashboard-header';
import FiltersCard from '@/components/dashboard/filters-card';
import TrendingSummaryCard from '@/components/dashboard/trending-summary-card';
import ActivityChartCard, { type ActivityDataPoint } from '@/components/dashboard/activity-chart-card';
import SentimentAnalysisCard from '@/components/dashboard/sentiment-analysis-card';
import TopPostsCard from '@/components/dashboard/top-posts-card';
import { fetchTweets, type Tweet } from '@/services/twitter';
import { summarizeTrendingTopics } from '@/ai/flows/summarize-trending-topics';
import { analyzeSentiment, type SentimentAnalysisOutput } from '@/ai/flows/sentiment-analysis-insights';
import { useToast } from "@/hooks/use-toast";

const DEFAULT_QUERY = "AI trends";

export default function DashboardPage() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [trendingSummary, setTrendingSummary] = useState<string | null>(null);
  const [sentimentResult, setSentimentResult] = useState<SentimentAnalysisOutput | null>(null);
  const [activityData, setActivityData] = useState<ActivityDataPoint[]>([]);
  
  const [isLoadingTweets, setIsLoadingTweets] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingSentiment, setIsLoadingSentiment] = useState(false);
  
  const [errorTweets, setErrorTweets] = useState<string | null>(null);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [errorSentiment, setErrorSentiment] = useState<string | null>(null);

  const { toast } = useToast();

  const aggregateActivityData = (fetchedTweets: Tweet[]): ActivityDataPoint[] => {
    if (!fetchedTweets || fetchedTweets.length === 0) return [];
    
    const countsByHour: Record<string, number> = {};
    fetchedTweets.forEach(tweet => {
      try {
        const date = new Date(tweet.createdAt);
        const hourKey = `${String(date.getHours()).padStart(2, '0')}:00`; // "HH:00"
        countsByHour[hourKey] = (countsByHour[hourKey] || 0) + 1;
      } catch (e) {
        console.warn("Invalid date format for tweet:", tweet.id, tweet.createdAt);
      }
    });
    
    return Object.entries(countsByHour)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort by hour
  };

  const loadData = useCallback(async (currentQuery: string) => {
    setIsLoadingTweets(true);
    setIsLoadingSummary(true);
    setIsLoadingSentiment(true);
    setErrorTweets(null);
    setErrorSummary(null);
    setErrorSentiment(null);

    try {
      toast({ title: "Fetching Data...", description: `Loading insights for "${currentQuery}".` });
      const fetchedTweets = await fetchTweets({ query: currentQuery, maxResults: 50 });
      setTweets(fetchedTweets);
      setActivityData(aggregateActivityData(fetchedTweets));
      setErrorTweets(null);

      if (fetchedTweets.length > 0) {
        // Fetch summary
        try {
          const summaryOutput = await summarizeTrendingTopics({ query: currentQuery });
          setTrendingSummary(summaryOutput.summary);
          setErrorSummary(null);
        } catch (e) {
          console.error("Error fetching summary:", e);
          setErrorSummary("Failed to generate trending summary.");
          setTrendingSummary(null);
          toast({ variant: "destructive", title: "Summary Error", description: "Could not generate trending topics summary." });
        }

        // Fetch sentiment
        try {
          const tweetTexts = fetchedTweets.map(t => t.text);
          const sentimentOutput = await analyzeSentiment({ topic: currentQuery, tweets: tweetTexts });
          setSentimentResult(sentimentOutput);
          setErrorSentiment(null);
        } catch (e) {
          console.error("Error fetching sentiment:", e);
          setErrorSentiment("Failed to perform sentiment analysis.");
          setSentimentResult(null);
          toast({ variant: "destructive", title: "Sentiment Error", description: "Could not perform sentiment analysis." });
        }
      } else {
        setTrendingSummary(null);
        setSentimentResult(null);
        toast({ title: "No Data", description: `No tweets found for "${currentQuery}".` });
      }

    } catch (error) {
      console.error("Error fetching tweets:", error);
      setErrorTweets("Failed to fetch tweets. Please try again.");
      setTweets([]);
      setActivityData([]);
      setTrendingSummary(null);
      setSentimentResult(null);
      toast({ variant: "destructive", title: "Data Fetch Error", description: "Could not load data. Please check console." });
    } finally {
      setIsLoadingTweets(false);
      setIsLoadingSummary(false);
      setIsLoadingSentiment(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData(query);
  }, [loadData, query]); // Query dependency will trigger reload on change

  const handleRefresh = () => {
    loadData(query);
  };

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery); // This will trigger useEffect to reload data
  };

  const topPosts = tweets.sort((a, b) => (b.likes + b.retweets) - (a.likes + a.retweets)).slice(0, 5);
  const overallLoading = isLoadingTweets || isLoadingSummary || isLoadingSentiment;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <DashboardHeader onRefresh={handleRefresh} isLoading={overallLoading} />
      
      <div className="mb-6">
        <FiltersCard initialQuery={query} onSearch={handleSearch} isLoading={overallLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <TrendingSummaryCard summary={trendingSummary} isLoading={isLoadingSummary} error={errorSummary} />
        </div>
        <div className="lg:col-span-2">
          <ActivityChartCard activityData={activityData} isLoading={isLoadingTweets} error={errorTweets} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <SentimentAnalysisCard sentimentResult={sentimentResult} isLoading={isLoadingSentiment} error={errorSentiment}/>
        </div>
        <div>
          <TopPostsCard posts={topPosts} isLoading={isLoadingTweets} error={errorTweets} />
        </div>
      </div>
      {/* Placeholder for word cloud or other visualizations */}
      {/* <div className="mt-6">
        <Card>
          <CardHeader><CardTitle>Trending Terms (Word Cloud - Coming Soon)</CardTitle></CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
            Word cloud visualization will appear here.
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}
