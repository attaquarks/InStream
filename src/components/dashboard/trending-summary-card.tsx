// src/components/dashboard/trending-summary-card.tsx
"use client";

import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TrendingSummaryCardProps {
  summary: string | null;
  isLoading: boolean;
  error?: string | null;
}

const TrendingSummaryCard: FC<TrendingSummaryCardProps> = ({ summary, isLoading, error }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Trending Topics Summary</CardTitle>
        <CardDescription>AI-generated overview of the current discussion trends.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Failed to load summary."}</AlertDescription>
          </Alert>
        ) : summary ? (
          <p className="text-sm text-card-foreground">{summary}</p>
        ) : (
           <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Summary Available</AlertTitle>
            <AlertDescription>Could not generate a summary for the current query.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendingSummaryCard;
