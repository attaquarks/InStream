// src/components/dashboard/top-posts-card.tsx
"use client";

import type { FC } from 'react';
import type { Tweet } from '@/services/twitter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, Repeat, MessageSquare, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


interface TopPostsCardProps {
  posts: Tweet[];
  isLoading: boolean;
  error?: string | null;
}

const TopPostsCard: FC<TopPostsCardProps> = ({ posts, isLoading, error }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Top Posts</CardTitle>
        <CardDescription>Most engaging posts related to the topic.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Failed to load posts."}</AlertDescription>
          </Alert>
        ) : posts && posts.length > 0 ? (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {posts.map((post, index) => (
                <div key={post.id}>
                  <p className="text-sm font-medium text-card-foreground">{post.text}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center"><ThumbsUp className="w-3 h-3 mr-1" /> {post.likes}</span>
                    <span className="flex items-center"><Repeat className="w-3 h-3 mr-1" /> {post.retweets}</span>
                    {/* <span className="flex items-center"><MessageSquare className="w-3 h-3 mr-1" /> N/A</span> Comments not in Tweet interface */}
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  {index < posts.length - 1 && <Separator className="my-3" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Posts Available</AlertTitle>
            <AlertDescription>No posts found for the current query.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default TopPostsCard;
