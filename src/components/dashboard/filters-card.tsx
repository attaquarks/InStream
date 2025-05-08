// src/components/dashboard/filters-card.tsx
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface FiltersCardProps {
  initialFilters: {
    source: string;
    keyword: string;
    timeRange: string;
  };
  onSearch: (filters: { source: string; keyword: string; timeRange: string }) => void;
  isLoading: boolean;
  keywords?: string[]; // Optional list of keywords/hashtags for dropdown
}

const FiltersCard: FC<FiltersCardProps> = ({ initialFilters, onSearch, isLoading, keywords = [] }) => {
  const [currentSource, setCurrentSource] = useState(initialFilters.source);
  const [currentKeyword, setCurrentKeyword] = useState(initialFilters.keyword);
  const [currentTimeRange, setCurrentTimeRange] = useState(initialFilters.timeRange);

  const handleSearch = () => {
    onSearch({
      source: currentSource,
      keyword: currentKeyword.trim() || 'all', // Default to 'all' if empty
      timeRange: currentTimeRange,
    });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Filter Options</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Data Source */}
          <div className="space-y-1">
            <Label htmlFor="filterDataSource">Data Source</Label>
            <Select value={currentSource} onValueChange={setCurrentSource} disabled={isLoading}>
              <SelectTrigger id="filterDataSource">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                {/* Add other sources as needed */}
                {/* <SelectItem value="facebook">Facebook</SelectItem> */}
                {/* <SelectItem value="instagram">Instagram</SelectItem> */}
                {/* <SelectItem value="linkedin">LinkedIn</SelectItem> */}
              </SelectContent>
            </Select>
          </div>

          {/* Keyword Input/Select */}
           <div className="space-y-1">
              <Label htmlFor="filterKeyword">Keyword</Label>
               <Input
                  id="filterKeyword"
                  type="text"
                  placeholder="Enter keyword or select"
                  value={currentKeyword === 'all' ? '' : currentKeyword} // Show empty if 'all'
                  onChange={(e) => setCurrentKeyword(e.target.value || 'all')} // Set to 'all' if cleared
                  className="bg-background text-foreground placeholder:text-muted-foreground"
                  disabled={isLoading}
                  list="keyword-suggestions" // Link to datalist
                />
                {/* Datalist for suggestions (optional enhancement) */}
                <datalist id="keyword-suggestions">
                   {keywords.map(kw => <option key={kw} value={kw} />)}
                 </datalist>

               {/* Or Use Select if you prefer a dropdown */}
               {/* <Select value={currentKeyword} onValueChange={setCurrentKeyword} disabled={isLoading}>
                <SelectTrigger id="filterKeyword">
                  <SelectValue placeholder="Select keyword" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Keywords</SelectItem>
                  {keywords.map(kw => (
                    <SelectItem key={kw} value={kw}>{kw}</SelectItem>
                  ))}
                 </SelectContent>
               </Select> */}
          </div>

          {/* Time Range */}
          <div className="space-y-1">
            <Label htmlFor="filterTimeRange">Time Range</Label>
            <Select value={currentTimeRange} onValueChange={setCurrentTimeRange} disabled={isLoading}>
              <SelectTrigger id="filterTimeRange">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 Hours</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <div>
            <Button onClick={handleSearch} disabled={isLoading} className="w-full">
              <Search className="mr-2 h-4 w-4" /> Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FiltersCard;
