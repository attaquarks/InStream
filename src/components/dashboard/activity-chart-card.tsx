// src/components/dashboard/activity-chart-card.tsx
"use client";

import type { FC } from 'react';
import { BarChart, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export interface ActivityDataPoint {
  date: string; // e.g., "YYYY-MM-DD" or "HH:00"
  count: number;
}

interface ActivityChartCardProps {
  activityData: ActivityDataPoint[];
  isLoading: boolean;
  error?: string | null;
}

const chartConfig = {
  posts: {
    label: "Posts",
    color: "hsl(var(--primary))",
  },
};

const ActivityChartCard: FC<ActivityChartCardProps> = ({ activityData, isLoading, error }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Activity Over Time</CardTitle>
        <CardDescription>Volume of posts related to the topic.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : error ? (
           <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Failed to load activity data."}</AlertDescription>
          </Alert>
        ) : activityData && activityData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <RechartsLineChart data={activityData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
                tickFormatter={(value) => value.slice(-5)} // Show HH:MM or last part of date
                stroke="hsl(var(--card-foreground))"
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                stroke="hsl(var(--card-foreground))"
               />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" labelClassName="text-background" className="bg-card-foreground text-background" />}
              />
              <Line type="monotone" dataKey="count" strokeWidth={2} stroke="hsl(var(--primary))" dot={false} name="Posts" />
               <ChartLegend content={<ChartLegendContent />} />
            </RechartsLineChart>
          </ChartContainer>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Activity Data</AlertTitle>
            <AlertDescription>No activity data available for the current query.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityChartCard;
