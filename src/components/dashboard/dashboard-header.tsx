// src/components/dashboard/dashboard-header.tsx
"use client";

import type { FC } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

const DashboardHeader: FC<DashboardHeaderProps> = ({ onRefresh, isLoading }) => {
  return (
    <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-lg shadow">
      <h1 className="text-2xl font-semibold text-card-foreground">InStream Analytics Dashboard</h1>
      <Button onClick={onRefresh} disabled={isLoading} variant="outline">
        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh Data
      </Button>
    </div>
  );
};

export default DashboardHeader;
