// src/components/dashboard/activity-chart-card.tsx
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button'; // Using Button for toggle for now
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group" // Alternative

export interface ActivityDataPoint {
  date: string; // Can be date string or hour string "HH:00"
  // Dynamically include platforms like { date: '2023-01-01', twitter: 10, facebook: 5 }
  [platform: string]: any; // Use a more specific type if possible
}

interface ActivityChartCardProps {
  // Pass different data arrays or a single structured one
  activityData: ActivityDataPoint[]; // Main data source
  dailyData?: ActivityDataPoint[];
  weeklyData?: ActivityDataPoint[];
  monthlyData?: ActivityDataPoint[];
  isLoading: boolean;
  error?: string | null;
}

type ViewType = 'daily' | 'weekly' | 'monthly';

const ActivityChartCard: FC<ActivityChartCardProps> = ({
  activityData, // Using this as the primary source for now
  dailyData,
  weeklyData,
  monthlyData,
  isLoading,
  error
}) => {
  const [viewType, setViewType] = useState<ViewType>('daily');

  // Determine which data to display based on viewType
  // This logic needs refinement based on how data is actually passed
  const currentData = viewType === 'daily' ? activityData : // Defaulting to activityData
                     viewType === 'weekly' ? (weeklyData || activityData) :
                     (monthlyData || activityData);

  // Dynamically determine platforms/lines to render from the data
  const platforms = currentData.length > 0
    ? Object.keys(currentData[0]).filter(key => key !== 'date')
    : [];

  const chartConfig = platforms.reduce((config, platform, index) => {
    config[platform] = {
      label: platform.charAt(0).toUpperCase() + platform.slice(1),
      // Assign colors programmatically or use a predefined map
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
    return config;
  }, {} as any); // Use a proper type for ChartConfig if defined elsewhere


  const handleViewChange = (value: ViewType) => {
      if (value) { // Check if value is not empty (ToggleGroup returns "" if deselected)
         setViewType(value);
      }
   };

  return (
    <Card className="h-full shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">Activity Over Time</CardTitle>
          <CardDescription>Volume of posts across platforms.</CardDescription>
        </div>
         {/* Toggle Group for view switching */}
         <ToggleGroup type="single" defaultValue="daily" value={viewType} onValueChange={handleViewChange} size="sm">
             <ToggleGroupItem value="daily" aria-label="Toggle daily">Daily</ToggleGroupItem>
             <ToggleGroupItem value="weekly" aria-label="Toggle weekly" disabled>Weekly</ToggleGroupItem> {/* Example disabled */}
             <ToggleGroupItem value="monthly" aria-label="Toggle monthly" disabled>Monthly</ToggleGroupItem> {/* Example disabled */}
         </ToggleGroup>
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
        ) : currentData && currentData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <RechartsLineChart data={currentData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                // tickFormatter={(value) => value.slice(-5)} // Adjust formatter based on interval
                tickFormatter={(value) => {
                    try {
                       // Basic formatter, adjust based on actual date format and interval
                       if (viewType === 'daily' || viewType === 'weekly') {
                           return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                       } else if (viewType === 'monthly') {
                           return new Date(value).toLocaleDateString(undefined, { month: 'short', year: 'numeric'});
                       }
                       return value; // Fallback
                    } catch { return value; } // Handle invalid dates
                }}
                stroke="hsl(var(--card-foreground))"
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                stroke="hsl(var(--card-foreground))"
                className="text-xs"
               />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" labelClassName="text-background" className="bg-card-foreground text-background" />}
              />
               <ChartLegend content={<ChartLegendContent />} />
              {platforms.map((platform) => (
                <Line
                  key={platform}
                  type="monotone"
                  dataKey={platform}
                  strokeWidth={2}
                  stroke={chartConfig[platform]?.color || '#ccc'} // Use color from config
                  dot={false}
                  name={chartConfig[platform]?.label || platform} // Use label from config
                />
              ))}
            </RechartsLineChart>
          </ChartContainer>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Activity Data</AlertTitle>
            <AlertDescription>No activity data available for the current filters.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityChartCard;
