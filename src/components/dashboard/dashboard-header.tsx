// src/components/dashboard/dashboard-header.tsx
"use client";

import type { FC } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Plus } from "lucide-react";

interface DashboardHeaderProps {
  onRefresh: () => void;
  onExport: () => void; // Add export handler prop
  onNewCollection: () => void; // Add new collection handler prop
  isLoading: boolean;
}

const DashboardHeader: FC<DashboardHeaderProps> = ({ onRefresh, onExport, onNewCollection, isLoading }) => {
  return (
    <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-lg shadow">
      <h1 className="text-2xl font-semibold text-card-foreground">InStream Analytics Dashboard</h1>
      <div className="flex space-x-2">
        <Button onClick={onRefresh} disabled={isLoading} variant="outline" size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button onClick={onExport} disabled={isLoading} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
         <Button onClick={onNewCollection} disabled={isLoading} variant="default" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Collection
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
