// src/components/dashboard/word-cloud-card.tsx
"use client";

import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface WordCloudDataItem {
  text: string;
  value: number; // Represents frequency or importance
}

interface WordCloudCardProps {
  wordCloudData: WordCloudDataItem[];
  isLoading: boolean;
  error?: string | null;
}

const WordCloudCard: FC<WordCloudCardProps> = ({ wordCloudData, isLoading, error }) => {
  // Placeholder for actual word cloud rendering logic (e.g., using react-wordcloud or d3-cloud)
  const renderWordCloud = () => {
    // In a real implementation, you would use a library here
    // For now, just display a placeholder message or list the words
    return (
      <div className="flex flex-wrap gap-2 items-center justify-center text-center text-muted-foreground h-full">
         {wordCloudData.length > 0 ? (
             wordCloudData.slice(0, 30).map(word => ( // Show top 30 words as simple text for placeholder
                 <span
                    key={word.text}
                    className="p-1 rounded bg-muted text-foreground"
                     style={{ fontSize: `${Math.max(10, Math.min(24, 10 + Math.log2(word.value + 1) * 2))}px` }} // Basic size scaling
                   >
                     {word.text}
                   </span>
             ))
         ) : (
           "Word Cloud visualization will appear here."
         )}
       </div>
    );
  };

  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Word Cloud</CardTitle>
        <CardDescription>Most frequent terms in the discussion.</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]"> {/* Fixed height for the content area */}
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : error ? (
           <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Failed to load word cloud data."}</AlertDescription>
          </Alert>
        ) : wordCloudData && wordCloudData.length > 0 ? (
          renderWordCloud()
        ) : (
           <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Data</AlertTitle>
            <AlertDescription>No keywords found for the word cloud.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default WordCloudCard;
