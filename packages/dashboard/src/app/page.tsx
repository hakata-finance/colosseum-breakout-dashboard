'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { exportToCSV, exportToJSON } from '@/lib/api';
import { useProjects } from '@/hooks/use-projects';
import { useSearch } from '@/hooks/useSearch';
import { SearchInput } from '@/components/ui/search-input';
import { FilterSidebar } from '@/components/dashboard/filter-sidebar';
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { ProjectsTable } from '@/components/dashboard/projects-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  RefreshCw,
  Download,
  Database,
  SlidersHorizontal,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

export default function Dashboard() {
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

  const handleExportCSV = useCallback(() => {
    try {
      exportToCSV(filteredProjects);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  }, [filteredProjects]);

  const handleExportJSON = useCallback(() => {
    try {
      exportToJSON(filteredProjects);
    } catch (error) {
      console.error('Failed to export JSON:', error);
    }
  }, [filteredProjects]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Colosseum Projects Dashboard
            </h1>
            <p className="text-muted-foreground">
              {lastFetch 
                ? `Last updated: ${lastFetch.toLocaleString()}` 
                : 'No data loaded'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/charts">
              <Button variant="outline" disabled={projects.length === 0}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </Link>
            <Button onClick={handleFetchData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Fetching...' : 'Fetch Data'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportCSV} 
              disabled={filteredProjects.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportJSON} 
              disabled={filteredProjects.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              JSON
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
                <Database className="h-5 w-5" />
                No Data Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Click "Fetch Data" to load projects from the Colosseum API.
              </p>
              <Button onClick={handleFetchData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Fetching...' : 'Fetch Data'}
              </Button>
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
                  placeholder="Search projects by name and description..."
                  isSearching={isSearching}
                  resultCount={resultCount}
                  className="w-full"
                  autoFocus
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

            {/* Collapsible Filter Panel */}
            {/* Filter sidebar is now rendered at the bottom */}

            {/* Results Summary - Always reserve space */}
            <div className="h-5">
              {filters.search && (
                <div className="text-sm text-muted-foreground">
                  Showing {resultCount} of {projects.length} projects
                  {filters.search && ` matching "${filters.search}"`}
                </div>
              )}
            </div>

            {/* Overview Cards */}
            <OverviewCards projects={filteredProjects} />

            {/* Projects Table */}
            <ProjectsTable 
              projects={filteredProjects}
              filters={filters}
              onFiltersChange={updateFilters}
            />
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
