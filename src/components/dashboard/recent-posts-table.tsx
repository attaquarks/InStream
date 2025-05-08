// src/components/dashboard/recent-posts-table.tsx
"use client";

import type { FC } from 'react';
import { useState } from 'react';
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
import { AlertTriangle, Info, Eye } from 'lucide-react'; // Added Eye icon
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"; // For filtering
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"; // Import Pagination components


// Interface matching the Python API structure for recent posts
export interface RecentPost {
  platform: string;
  author?: string;
  content: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  sentimentScore?: number;
  likes?: number;
  shares?: number;
  date: string; // Assuming ISO string format from API
}

interface RecentPostsTableProps {
  posts: RecentPost[];
  isLoading: boolean;
  error?: string | null;
}

type SentimentFilter = 'all' | 'positive' | 'neutral' | 'negative';

const POSTS_PER_PAGE = 5; // Number of posts to display per page

const RecentPostsTable: FC<RecentPostsTableProps> = ({ posts, isLoading, error }) => {
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const getSentimentBadge = (sentiment: RecentPost['sentiment']) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return <Badge className="bg-green-600 hover:bg-green-700 text-white">Positive</Badge>;
      case 'neutral': return <Badge className="bg-gray-500 hover:bg-gray-600 text-white">Neutral</Badge>;
      case 'negative': return <Badge variant="destructive">Negative</Badge>;
      default: return <Badge variant="outline">{sentiment}</Badge>;
    }
  };

  const filteredPosts = posts.filter(post =>
    sentimentFilter === 'all' || post.sentiment.toLowerCase() === sentimentFilter
  );

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };


  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
         <CardTitle className="text-lg">Recent Posts</CardTitle>
         <CardDescription>Latest posts matching the current filters.</CardDescription>
        </div>
         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="outline" size="sm">
               Filter: {sentimentFilter.charAt(0).toUpperCase() + sentimentFilter.slice(1)}
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end">
             <DropdownMenuLabel>Filter by Sentiment</DropdownMenuLabel>
             <DropdownMenuSeparator />
             <DropdownMenuItem onSelect={() => { setSentimentFilter('all'); setCurrentPage(1); }}>All</DropdownMenuItem>
             <DropdownMenuItem onSelect={() => { setSentimentFilter('positive'); setCurrentPage(1); }}>Positive</DropdownMenuItem>
             <DropdownMenuItem onSelect={() => { setSentimentFilter('neutral'); setCurrentPage(1); }}>Neutral</DropdownMenuItem>
             <DropdownMenuItem onSelect={() => { setSentimentFilter('negative'); setCurrentPage(1); }}>Negative</DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>
      </CardHeader>
      <CardContent>
        {isLoading ? (
           <div className="space-y-4">
            {[...Array(POSTS_PER_PAGE)].map((_, i) => (
               <div key={i} className="flex items-center space-x-4">
                 <Skeleton className="h-8 w-16" />
                 <Skeleton className="h-8 w-24" />
                 <Skeleton className="h-8 flex-grow" />
                 <Skeleton className="h-8 w-20" />
                 <Skeleton className="h-8 w-16" />
                 <Skeleton className="h-8 w-16" />
                 <Skeleton className="h-8 w-24" />
                 <Skeleton className="h-8 w-12" />
               </div>
             ))}
           </div>
        ) : error ? (
           <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Failed to load posts."}</AlertDescription>
          </Alert>
        ) : paginatedPosts.length > 0 ? (
            <>
           <ScrollArea className="h-[350px] w-full"> {/* Adjust height */}
               <Table className="data-table">
                 <TableHeader>
                   <TableRow>
                     <TableHead>Platform</TableHead>
                     <TableHead>Author</TableHead>
                     <TableHead>Content</TableHead>
                     <TableHead>Sentiment</TableHead>
                     <TableHead className="text-right">Likes</TableHead>
                     <TableHead className="text-right">Shares</TableHead>
                     <TableHead>Date</TableHead>
                     <TableHead>Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {paginatedPosts.map((post, index) => (
                     <TableRow key={post.date + index}> {/* Use a more unique key if available */}
                       <TableCell>{post.platform}</TableCell>
                       <TableCell>{post.author || 'N/A'}</TableCell>
                       <TableCell className="max-w-xs truncate" title={post.content}>
                         {post.content}
                       </TableCell>
                       <TableCell>{getSentimentBadge(post.sentiment)}</TableCell>
                       <TableCell className="text-right">{post.likes?.toLocaleString() ?? '0'}</TableCell>
                       <TableCell className="text-right">{post.shares?.toLocaleString() ?? '0'}</TableCell>
                       <TableCell>
                         {new Date(post.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                       </TableCell>
                       <TableCell>
                         <Button variant="ghost" size="icon" onClick={() => alert(`Viewing post: ${post.content.substring(0, 50)}...`)}>
                           <Eye className="h-4 w-4" />
                         </Button>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
           </ScrollArea>
            {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} aria-disabled={currentPage === 1} tabIndex={currentPage === 1 ? -1 : undefined} className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}/>
                        </PaginationItem>
                        {/* Simplified Pagination - consider adding logic for ellipsis later */}
                         {[...Array(totalPages)].map((_, i) => (
                            <PaginationItem key={i}>
                              <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }} isActive={currentPage === i + 1}>
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                        <PaginationItem>
                          <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} aria-disabled={currentPage === totalPages} tabIndex={currentPage === totalPages ? -1 : undefined} className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}/>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                 </div>
             )}
          </>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Posts Available</AlertTitle>
            <AlertDescription>No posts found matching the current filters.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentPostsTable;
