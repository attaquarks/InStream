// src/components/dashboard/platform-distribution-card.tsx
"use client";

import type { FC } from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface PlatformDistributionData {
  labels: string[];
  data: number[];
}

interface PlatformDistributionCardProps {
  platformData: PlatformDistributionData | null;
  isLoading: boolean;
  error?: string | null;
}

const PlatformDistributionCard: FC<PlatformDistributionCardProps> = ({ platformData, isLoading, error }) => {

  const chartConfig = platformData?.labels.reduce((config, label, index) => {
     config[label] = {
       label: label.charAt(0).toUpperCase() + label.slice(1),
       color: `hsl(var(--chart-${(index % 5) + 1}))`, // Cycle through chart colors
     };
     return config;
   }, {} as any) || {}; // Use a proper type for ChartConfig if defined elsewhere

  const chartData = platformData ? platformData.labels.map((label, index) => ({
    name: label,
    value: platformData.data[index],
    fill: chartConfig[label]?.color || '#ccc', // Use color from config
  })) : [];

  const totalPlatforms = platformData ? platformData.data.reduce((sum, val) => sum + val, 0) : 0;

  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Platform Distribution</CardTitle>
        <CardDescription>Breakdown of posts by source platform.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
           <div className="flex justify-center items-center h-[250px]">
             <Skeleton className="h-[180px] w-[180px] rounded-full" />
           </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Failed to load platform data."}</AlertDescription>
          </Alert>
        ) : platformData && totalPlatforms > 0 ? (
           <ChartContainer config={chartConfig} className="h-[250px] w-full">
             <RechartsPieChart>
               <ChartTooltip
                 cursor={false}
                 content={<ChartTooltipContent hideLabel className="bg-background text-foreground" />}
               />
               <Pie
                 data={chartData}
                 dataKey="value"
                 nameKey="name"
                 outerRadius={80} // Adjust size as needed
                 strokeWidth={5}
               >
                 {chartData.map((entry) => (
                   <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                 ))}
               </Pie>
                <ChartLegend
                 content={<ChartLegendContent nameKey="name" className="flex-wrap justify-center gap-x-4" />} // Adjust legend layout
                 />
             </RechartsPieChart>
           </ChartContainer>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Data</AlertTitle>
            <AlertDescription>No platform distribution data available.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PlatformDistributionCard;
