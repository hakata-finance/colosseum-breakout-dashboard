'use client';

import { Suspense, useState, useCallback } from 'react';
import Link from 'next/link';
import { useProjects } from '@/hooks/use-projects';
import { useSearch } from '@/hooks/useSearch';
import { SearchInput } from '@/components/ui/search-input';
import { FilterSidebar } from '@/components/dashboard/filter-sidebar';
import { Charts } from '@/components/dashboard/charts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  RefreshCw,
  ArrowLeft,
  SlidersHorizontal,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { SkeletonCharts } from '@/components/ui/skeleton-components';

// Separate component that uses useSearchParams
function ChartsContent() {
  const { projects, loading, lastFetch, error, fetchData, clearError } = useProjects();
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);

  const {
    filters,
    filteredProjects,
    isSearching,
    resultCount,
    updateFilters,
    clearFilters,
    hasActiveFilters
  } = useSearch(projects);

  const handleFetchData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchChange = useCallback((value: string) => {
    updateFilters({ search: value });
  }, [updateFilters]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <BarChart3 className="h-8 w-8" />
                Analytics & Charts
              </h1>
              <p className="text-muted-foreground">
                {lastFetch 
                  ? `Data from: ${lastFetch.toLocaleString()}` 
                  : 'No data loaded'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleFetchData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="ml-auto"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {projects.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                No Data Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                No project data available for charts. Load data from the main dashboard first.
              </p>
              <div className="flex gap-2">
                <Link href="/">
                  <Button variant="outline">
                    Go to Dashboard
                  </Button>
                </Link>
                <Button onClick={handleFetchData} disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Loading...' : 'Load Data'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Search & Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <SearchInput
                  value={filters.search}
                  onChange={handleSearchChange}
                  placeholder="Filter charts by project name and description..."
                  isSearching={isSearching}
                  resultCount={resultCount}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 justify-end">
                {hasActiveFilters && (
                  <Button variant="ghost" onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
                <Button
                  variant={hasActiveFilters ? "default" : "outline"}
                  onClick={() => setShowFilterSidebar(true)}
                  className="shrink-0"
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-2 bg-hakata-accent dark:bg-hakata-accent text-white dark:text-hakata-dark rounded-full w-2 h-2" />
                  )}
                </Button>
              </div>
            </div>

            {/* Results Summary - Always reserve space */}
            <div className="h-5">
              {(filters.search || hasActiveFilters) && (
                <div className="text-sm text-muted-foreground">
                  Analyzing {resultCount} of {projects.length} projects
                  {filters.search && ` matching "${filters.search}"`}
                </div>
              )}
            </div>

            {/* Charts Section */}
            <Charts projects={filteredProjects} />
          </>
        )}

        {/* Filter Sidebar */}
        <FilterSidebar
          projects={projects}
          filters={filters}
          onFiltersChange={updateFilters}
          isOpen={showFilterSidebar}
          onClose={() => setShowFilterSidebar(false)}
        />
      </div>
    </div>
  );
}

// Loading fallback component
function ChartsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-32 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 w-64 bg-muted rounded animate-pulse" />
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-64 w-full bg-muted rounded animate-pulse" />
        <SkeletonCharts />
      </div>
    </div>
  );
}

export default function ChartsPage() {
  return (
    <Suspense fallback={<ChartsLoading />}>
      <ChartsContent />
    </Suspense>
  );
}
