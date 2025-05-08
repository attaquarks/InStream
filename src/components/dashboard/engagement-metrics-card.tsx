// src/components/dashboard/engagement-metrics-card.tsx
"use client";

import type { FC } from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface EngagementMetricsData {
  labels: string[]; // Dates or time periods
  datasets: {
    label: string; // e.g., 'Avg Likes', 'Avg Shares'
    data: number[];
    borderColor?: string; // Optional for line charts
    backgroundColor?: string; // Optional for bar charts
    tension?: number; // Optional for line charts
    fill?: boolean; // Optional for line charts
  }[];
}

interface EngagementMetricsCardProps {
  engagementData: EngagementMetricsData | null;
  isLoading: boolean;
  error?: string | null;
}

const EngagementMetricsCard: FC<EngagementMetricsCardProps> = ({ engagementData, isLoading, error }) => {

  const chartConfig = engagementData?.datasets.reduce((config, dataset, index) => {
    config[dataset.label] = {
      label: dataset.label,
      color: `hsl(var(--chart-${(index % 5) + 1}))`, // Cycle through chart colors
    };
    return config;
  }, {} as any) || {}; // Use a proper type for ChartConfig if defined elsewhere


  // Combine data for Recharts BarChart (assumes labels align across datasets)
   const chartData = engagementData?.labels.map((label, index) => {
     const dataPoint: { [key: string]: string | number } = { name: label }; // 'name' is often used as the category key in recharts
     engagementData.datasets.forEach(dataset => {
       dataPoint[dataset.label] = dataset.data[index] ?? 0;
     });
     return dataPoint;
   }) || [];


  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Engagement Metrics Over Time</CardTitle>
        <CardDescription>Average engagement per post over the selected period.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Failed to load engagement data."}</AlertDescription>
          </Alert>
        ) : engagementData && engagementData.datasets.length > 0 ? (
           <ChartContainer config={chartConfig} className="h-[250px] w-full">
             {/* Using BarChart based on Flask template, but Line might also work */}
             <RechartsBarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} />
               <XAxis
                 dataKey="name" // Use 'name' which holds the date label
                 tickLine={false}
                 axisLine={false}
                 tickMargin={8}
                 tickFormatter={(value) => { // Basic date formatting
                    try {
                        return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    } catch { return value;}
                 }}
                 className="text-xs"
               />
               <YAxis
                 tickLine={false}
                 axisLine={false}
                 tickMargin={8}
                 className="text-xs"
                />
               <ChartTooltip
                 cursor={false}
                 content={<ChartTooltipContent indicator="dot" className="bg-background text-foreground" />}
               />
                <ChartLegend content={<ChartLegendContent />} />
               {engagementData.datasets.map((dataset) => (
                 <Bar
                   key={dataset.label}
                   dataKey={dataset.label}
                   fill={chartConfig[dataset.label]?.color || '#ccc'}
                   radius={4} // Optional: rounded corners for bars
                 />
               ))}
             </RechartsBarChart>
           </ChartContainer>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Data</AlertTitle>
            <AlertDescription>No engagement metrics available for the current filters.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default EngagementMetricsCard;

