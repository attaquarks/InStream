// src/components/dashboard/filters-card.tsx
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";

interface FiltersCardProps {
  initialQuery: string;
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const FiltersCard: FC<FiltersCardProps> = ({ initialQuery, onSearch, isLoading }) => {
  const [currentQuery, setCurrentQuery] = useState(initialQuery);

  const handleSearch = () => {
    if (currentQuery.trim()) {
      onSearch(currentQuery.trim());
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filter Options</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Enter topic or keyword (e.g., Next.js)"
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className="bg-background text-foreground placeholder:text-muted-foreground" 
            disabled={isLoading}
          />
          <Button type="submit" onClick={handleSearch} disabled={isLoading}>
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
        </div>
        {/* Placeholder for time range filter if added later */}
        {/* <div className="mt-4">
          <Label htmlFor="time-range">Time Range (Coming Soon)</Label>
          <Select disabled>
            <SelectTrigger id="time-range">
              <SelectValue placeholder="Last 24 hours" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div> */}
      </CardContent>
    </Card>
  );
};

export default FiltersCard;
