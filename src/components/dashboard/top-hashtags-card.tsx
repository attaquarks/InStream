// src/components/dashboard/top-hashtags-card.tsx
"use client";

import type { FC } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Info, ArrowUp, ArrowDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge"; // For sentiment badge

export interface HashtagTopic {
  name: string; // Hashtag text (e.g., #AI)
  posts: number; // Number of posts using this hashtag
  engagement?: number; // Optional: Total engagement for posts with this hashtag
  sentiment?: number; // Optional: Average sentiment score (e.g., 0-10)
  trend?: 'up' | 'down' | 'neutral'; // Optional: Trend indicator
}

interface TopHashtagsCardProps {
  hashtags: HashtagTopic[];
  isLoading: boolean;
  error?: string | null;
}

const TopHashtagsCard: FC<TopHashtagsCardProps> = ({ hashtags, isLoading, error }) => {

  const getSentimentBadge = (score: number | undefined) => {
     if (score === undefined) return <Badge variant="outline">N/A</Badge>;
     if (score >= 7) return <Badge className="bg-green-600 hover:bg-green-700">Positive</Badge>;
     if (score >= 4) return <Badge className="bg-yellow-500 hover:bg-yellow-600">Neutral</Badge>;
     return <Badge variant="destructive">Negative</Badge>;
  };

  const getTrendIcon = (trend: string | undefined) => {
     if (trend === 'up') return <ArrowUp className="h-4 w-4 text-green-600" />;
     if (trend === 'down') return <ArrowDown className="h-4 w-4 text-red-600" />;
     return <span className="text-muted-foreground">-</span>;
   };


  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Top Hashtags</CardTitle>
        <CardDescription>Most frequently used hashtags in the discussion.</CardDescription>
        {/* Add Sort Dropdown here if needed */}
      </CardHeader>
      <CardContent className="p-0"> {/* Remove padding for full-width table */}
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                 <Skeleton className="h-4 w-1/3" />
                 <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        ) : error ? (
           <div className="p-4">
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error || "Failed to load hashtags."}</AlertDescription>
            </Alert>
           </div>
        ) : hashtags && hashtags.length > 0 ? (
           <ScrollArea className="h-[280px]"> {/* Adjust height as needed */}
              <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Hashtag</TableHead>
                     <TableHead className="text-right">Posts</TableHead>
                     {/* Uncomment if data is available */}
                     {/* <TableHead className="text-right">Engagement</TableHead> */}
                     {/* <TableHead className="text-right">Sentiment</TableHead> */}
                     {/* <TableHead className="text-right">Trend</TableHead> */}
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {hashtags.map((hashtag) => (
                     <TableRow key={hashtag.name}>
                       <TableCell className="font-medium">#{hashtag.name}</TableCell>
                       <TableCell className="text-right">{hashtag.posts?.toLocaleString() ?? '0'}</TableCell>
                       {/* Uncomment if data is available */}
                       {/* <TableCell className="text-right">{hashtag.engagement?.toLocaleString() ?? 'N/A'}</TableCell> */}
                       {/* <TableCell className="text-right">{getSentimentBadge(hashtag.sentiment)}</TableCell> */}
                       {/* <TableCell className="text-right">{getTrendIcon(hashtag.trend)}</TableCell> */}
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
           </ScrollArea>
        ) : (
          <div className="p-4">
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Data</AlertTitle>
                <AlertDescription>No trending hashtags found for the current filters.</AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopHashtagsCard;
