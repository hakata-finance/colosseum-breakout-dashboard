'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Add shimmer effect
export function SkeletonShimmer() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-shimmer" />
    </div>
  );
}

export function SkeletonOverviewCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[60px] mb-2" />
            <Skeleton className="h-3 w-[140px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SkeletonCharts() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className={i === 4 ? "md:col-span-2" : ""}>
          <CardHeader>
            <Skeleton className="h-5 w-[150px]" />
            <Skeleton className="h-3 w-[200px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 10 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-9 w-[300px]" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search bar skeleton */}
        <Skeleton className="h-10 w-full" />
        
        {/* Table header skeleton */}
        <div className="border rounded-md">
          <div className="flex items-center space-x-4 p-4 border-b bg-muted/50">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[60px]" />
            <Skeleton className="h-4 w-[60px]" />
            <Skeleton className="h-4 w-[60px]" />
            <Skeleton className="h-4 w-8" />
          </div>
          
          {/* Table rows skeleton */}
          <div className="space-y-0">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border-b last:border-b-0">
                <Skeleton className="h-4 w-8" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-3 w-[80px]" />
                </div>
                <Skeleton className="h-4 w-[180px]" />
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-[60px] rounded-full" />
                  <Skeleton className="h-5 w-[50px] rounded-full" />
                </div>
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Pagination skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-[200px]" />
          <div className="flex space-x-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonSearchInput() {
  return (
    <div className="relative">
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function SkeletonFilterPanel() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-[120px]" />
          <Skeleton className="h-6 w-[80px]" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[400px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[120px]" />
          <Skeleton className="h-9 w-[80px]" />
          <Skeleton className="h-9 w-[80px]" />
        </div>
      </div>

      {/* Search & Filter Bar Skeleton */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SkeletonSearchInput />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[80px]" />
        </div>
      </div>

      {/* Overview Cards Skeleton */}
      <SkeletonOverviewCards />

      {/* Charts Skeleton */}
      <SkeletonCharts />

      {/* Table Skeleton */}
      <SkeletonTable />
    </div>
  );
}
