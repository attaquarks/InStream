// src/app/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-lg shadow">
        <Skeleton className="h-8 w-1/3" />
        <div className="flex space-x-2">
           <Skeleton className="h-9 w-24" />
           <Skeleton className="h-9 w-24" />
           <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Filters Card Skeleton */}
      <Card className="mb-6 shadow-sm">
          <CardHeader>
              <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
               </div>
          </CardContent>
      </Card>

      {/* Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-6 w-6 rounded-sm" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-3/5 mb-1" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts Row 1 Skeleton */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
           <Card className="h-[380px]"><CardContent className="pt-6"><Skeleton className="h-full w-full" /></CardContent></Card>
        </div>
        <div className="lg:col-span-1">
           <Card className="h-[380px]"><CardContent className="pt-6 flex flex-col items-center space-y-4">
               <Skeleton className="h-[150px] w-[150px] rounded-full" />
               <div className="flex justify-around w-full">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
               </div>
               </CardContent></Card>
        </div>
      </div>

      {/* Word Cloud and Top Hashtags Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="h-[380px]"><CardContent className="pt-6"><Skeleton className="h-full w-full" /></CardContent></Card>
        <Card className="h-[380px]"><CardContent className="pt-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                 <Skeleton className="h-4 w-1/3" />
                 <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
            </CardContent></Card>
      </div>

      {/* Platform Distribution and Engagement Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
             <Card className="h-[330px]"><CardContent className="pt-6 flex justify-center items-center"><Skeleton className="h-[180px] w-[180px] rounded-full" /></CardContent></Card>
          </div>
          <div className="lg:col-span-2">
             <Card className="h-[330px]"><CardContent className="pt-6"><Skeleton className="h-full w-full" /></CardContent></Card>
          </div>
       </div>

      {/* Recent Posts Table Skeleton */}
       <div>
           <Card>
               <CardHeader>
                   <Skeleton className="h-6 w-1/4" />
               </CardHeader>
               <CardContent>
                  <div className="space-y-4">
                     {[...Array(5)].map((_, i) => (
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
                  <div className="mt-4 flex justify-center">
                      <Skeleton className="h-9 w-48" />
                  </div>
               </CardContent>
           </Card>
       </div>
    </div>
  );
}
