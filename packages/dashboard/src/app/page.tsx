'use client';

import { Suspense, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  ExternalLink,
} from 'lucide-react';
import { SkeletonDashboard } from '@/components/ui/skeleton-components';

// Hakata Finance Branding Banner
function HakataBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-3">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Hakata Finance Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-sm">
              <span className="font-medium">Built with ❤️ by </span>
              <Link 
                href="https://hakata.fi"
                target="_blank"
                className="font-bold hover:underline"
              >
                Hakata Finance
              </Link>
              <span className="ml-2 opacity-90">• Leading DeFi Protocol on Solana</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <Link 
              href="https://hakata.fi" 
              target="_blank"
              className="hover:underline flex items-center gap-1"
            >
              Website <ExternalLink className="w-3 h-3" />
            </Link>
            <Link 
              href="https://x.com/HakataFinance" 
              target="_blank"
              className="hover:underline flex items-center gap-1"
            >
              Twitter <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Footer Component
function HakataFooter() {
  return (
    <footer className="border-t bg-muted/30 mt-12">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Hakata Finance Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-lg">Hakata Finance</h3>
                <p className="text-sm text-muted-foreground">Stock-focused perp DEX on Solana</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Connect</h4>
            <div className="space-y-2 text-sm">
              <Link href="https://x.com/HakataFinance" target="_blank" className="block hover:underline text-muted-foreground hover:text-foreground">
                Twitter
              </Link>
              <Link href="https://hakata.fi/discord-breakout-dashboard" target="_blank" className="block hover:underline text-muted-foreground hover:text-foreground">
                Discord
              </Link>
              <Link href="https://github.com/hakata-finance/hakata-perps" target="_blank" className="block hover:underline text-muted-foreground hover:text-foreground">
                GitHub
              </Link>
            </div>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>© 2025 Hakata Finance. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">
            Showcasing our development capabilities through open-source tools
          </p>
        </div>
      </div>
    </footer>
  );
}

// Separate component that uses useSearchParams
function DashboardContent() {
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hakata Finance Banner */}
      <HakataBanner />
      
      <div className="flex-1">
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
                  : 'Advanced analytics for Colosseum hackathon projects'
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
                  Click &quot;Fetch Data&quot; to load projects from the Colosseum API.
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
      
      {/* Hakata Finance Footer */}
      <HakataFooter />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<SkeletonDashboard />}>
      <DashboardContent />
    </Suspense>
  );
}
