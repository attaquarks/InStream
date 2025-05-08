// src/components/dashboard/sentiment-analysis-card.tsx
"use client";

import type { FC } from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Smile, Frown, Meh, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Updated interface to match Flask API structure
export interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

interface SentimentAnalysisCardProps {
  sentimentResult: SentimentDistribution | null;
  isLoading: boolean;
  error?: string | null;
}

const chartConfig = {
  positive: { label: "Positive", color: "hsl(var(--chart-2))" }, // Greenish
  neutral: { label: "Neutral", color: "hsl(var(--chart-3))" },  // Greyish/Blueish
  negative: { label: "Negative", color: "hsl(var(--chart-1))" }, // Reddish
}

const SentimentAnalysisCard: FC<SentimentAnalysisCardProps> = ({ sentimentResult, isLoading, error }) => {

  const chartData = sentimentResult ? [
    { name: 'Positive', value: sentimentResult.positive, fill: chartConfig.positive.color },
    { name: 'Neutral', value: sentimentResult.neutral, fill: chartConfig.neutral.color },
    { name: 'Negative', value: sentimentResult.negative, fill: chartConfig.negative.color },
  ] : [];

  const totalSentiments = sentimentResult ? sentimentResult.positive + sentimentResult.neutral + sentimentResult.negative : 0;

  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Sentiment Distribution</CardTitle>
        <CardDescription>Overall sentiment across analyzed posts.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-[150px] w-[150px] rounded-full" />
            <div className="flex justify-around w-full">
               <Skeleton className="h-8 w-16" />
               <Skeleton className="h-8 w-16" />
               <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Failed to load sentiment."}</AlertDescription>
          </Alert>
        ) : sentimentResult && totalSentiments > 0 ? (
          <div className="flex flex-col items-center">
            <ChartContainer config={chartConfig} className="h-[150px] w-full">
              <RechartsPieChart>
                <ChartTooltip
                   cursor={false}
                   content={<ChartTooltipContent hideLabel className="bg-background text-foreground" />}
                 />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={60}
                  strokeWidth={5}
                 >
                   {chartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                 </Pie>
              </RechartsPieChart>
            </ChartContainer>
            <div className="flex justify-around w-full mt-4 text-center">
              <div>
                <Smile className="h-6 w-6 mx-auto text-green-500 mb-1" />
                <div className="font-bold text-foreground">{sentimentResult.positive.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Positive</div>
              </div>
              <div>
                <Meh className="h-6 w-6 mx-auto text-gray-500 mb-1" />
                <div className="font-bold text-foreground">{sentimentResult.neutral.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Neutral</div>
              </div>
              <div>
                <Frown className="h-6 w-6 mx-auto text-red-500 mb-1" />
                <div className="font-bold text-foreground">{sentimentResult.negative.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Negative</div>
              </div>
            </div>
          </div>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Sentiment Data</AlertTitle>
            <AlertDescription>No sentiment data available for the current filters.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SentimentAnalysisCard;
