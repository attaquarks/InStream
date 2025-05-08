// src/components/dashboard/sentiment-analysis-card.tsx
"use client";

import type { FC } from 'react';
import type { SentimentAnalysisOutput } from '@/ai/flows/sentiment-analysis-insights';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { AlertTriangle, Smile, Frown, Meh, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


interface SentimentAnalysisCardProps {
  sentimentResult: SentimentAnalysisOutput | null;
  isLoading: boolean;
  error?: string | null;
}

const SentimentAnalysisCard: FC<SentimentAnalysisCardProps> = ({ sentimentResult, isLoading, error }) => {
  const getSentimentBadgeVariant = (sentimentText: string | undefined) => {
    if (!sentimentText) return "default";
    const lowerSentiment = sentimentText.toLowerCase();
    if (lowerSentiment.includes("positive")) return "default"; // Default is primary, good for positive
    if (lowerSentiment.includes("negative")) return "destructive";
    if (lowerSentiment.includes("neutral")) return "secondary";
    return "outline";
  };

  const getSentimentIcon = (sentimentText: string | undefined) => {
    if (!sentimentText) return <Info className="h-4 w-4" />;
    const lowerSentiment = sentimentText.toLowerCase();
    if (lowerSentiment.includes("positive")) return <Smile className="h-5 w-5 text-green-500" />;
    if (lowerSentiment.includes("negative")) return <Frown className="h-5 w-5 text-red-500" />;
    if (lowerSentiment.includes("neutral")) return <Meh className="h-5 w-5 text-yellow-500" />;
    return <Info className="h-4 w-4" />;
  };


  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Sentiment Analysis</CardTitle>
        <CardDescription>Overall sentiment of the public discussion.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Failed to load sentiment."}</AlertDescription>
          </Alert>
        ) : sentimentResult && sentimentResult.sentiment ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center space-x-2">
              {getSentimentIcon(sentimentResult.sentiment)}
              <Badge variant={getSentimentBadgeVariant(sentimentResult.sentiment)} className="text-lg px-3 py-1">
                {sentimentResult.sentiment.split(" ")[0]}
              </Badge>
            </div>
            <p className="text-sm text-center text-card-foreground">{sentimentResult.sentiment.substring(sentimentResult.sentiment.indexOf(" ") + 1)}</p>
          </div>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Sentiment Data</AlertTitle>
            <AlertDescription>Could not perform sentiment analysis for the current query.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SentimentAnalysisCard;
