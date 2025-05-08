// src/components/dashboard/metric-card.tsx
"use client";

import type { FC, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ArrowDown } from 'lucide-react';

interface MetricCardProps {
  title?: string;
  value?: string | number;
  change?: number; // Percentage change (e.g., 5 for +5%, -2 for -2%)
  icon?: ReactNode;
  isLoading: boolean;
}

const MetricCard: FC<MetricCardProps> = ({ title, value, change, icon, isLoading }) => {
  const isPositiveChange = change !== undefined && change >= 0;
  const changeText = change !== undefined ? `${Math.abs(change)}%` : '0%';

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-6 w-6 rounded-sm" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-3/5 mb-1" />
          <Skeleton className="h-4 w-1/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm transition-all duration-300 ease-in-out hover:shadow-md hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon || <Skeleton className="h-6 w-6 rounded-sm" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {change !== undefined && (
          <p className="text-xs text-muted-foreground flex items-center">
            <span className={`mr-1 ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveChange ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            </span>
            <span className={`${isPositiveChange ? 'text-green-700' : 'text-red-700'} font-medium`}>
              {changeText}
            </span>
            <span className="ml-1">vs last period</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
