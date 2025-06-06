'use client';

import { Suspense, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { exportToCSV } from '@/lib/api';
import { useProjects } from '@/hooks/use-projects';
import { useSearch } from '@/hooks/useSearch';
import { FilterSidebar } from '@/components/dashboard/filter-sidebar';
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { ProjectsTable } from '@/components/dashboard/projects-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast, ToastContainer } from '@/components/ui/toast';
import {
  Download,
  Database,
  AlertCircle,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { SkeletonDashboard } from '@/components/ui/skeleton-components';
import { Project } from '@/types/project';

// Compact Header with Action Buttons
function CompactHeader({ 
  projects, 
  lastFetch, 
  onExportCSV, 
  filteredProjects 
}: {
  projects: Project[];
  lastFetch: Date | null;
  onExportCSV: () => void;
  filteredProjects: Project[];
}) {
  return (
    <div className="border-b bg-gray-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20">
                <Image
                  src="/logo_colosseum.jpg"
                  alt="Colosseum"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">Colosseum Breakout Dashboard</h1>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Advanced hackathon analytics</span>
                  {lastFetch && (
                    <span>• Updated {lastFetch.toLocaleTimeString()} ({Intl.DateTimeFormat().resolvedOptions().timeZone})</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Action Buttons */}
            <Link href="/charts">
              <Button variant="outline" disabled={projects.length === 0} size="sm">
                <BarChart3 className="mr-1 h-3 w-3" />
                Charts
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={onExportCSV} 
              disabled={filteredProjects.length === 0}
              size="sm"
            >
              <Download className="mr-1 h-3 w-3" />
              Export CSV
            </Button>
            
            {/* Powered by - Desktop only */}
            <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l text-xs text-muted-foreground">
              <span>made with ❤️ by</span>
              <Link
                href="https://arena.colosseum.org/projects/explore/hakata-finance"
                target="_blank"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <div className="w-4 h-4 rounded overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="Hakata Finance"
                    width={16}
                    height={16}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-medium">Hakata Finance team</span>
                <ExternalLink className="w-2 h-2" />
              </Link>
              
              {/* Social Icons */}
              <div className="flex items-center gap-1 ml-3 pl-3 border-l border-muted-foreground/30">
                <Link
                  href="https://x.com/HakataFinance"
                  target="_blank"
                  className="p-1.5 hover:bg-muted/50 rounded transition-colors group"
                  title="Follow us on Twitter"
                >
                  <svg className="h-3.5 w-3.5 group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </Link>
                <Link
                  href="https://hakata.fi/discord-breakout-dashboard"
                  target="_blank"
                  className="p-1.5 hover:bg-muted/50 rounded transition-colors group"
                  title="Join our Discord"
                >
                  <svg className="h-3.5 w-3.5 group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"/>
                  </svg>
                </Link>
                <Link
                  href="https://github.com/hakata-finance/colosseum-breakout-dashboard"
                  target="_blank"
                  className="p-1.5 hover:bg-muted/50 rounded transition-colors group"
                  title="View source code"
                >
                  <svg className="h-3.5 w-3.5 group-hover:text-foreground transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Separate component that uses useSearchParams
function DashboardContent() {
  const { projects, lastFetch, error, clearError } = useProjects();
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const { success, error: showError, toasts, removeToast } = useToast();

  // Show toast for errors
  useEffect(() => {
    if (error) {
      showError('Refresh failed', error);
    }
  }, [error, showError]);

  const {
    filters,
    filteredProjects,
    isSearching,
    updateFilters,
    clearFilters,
    hasActiveFilters
  } = useSearch(projects);

  const handleSearchChange = useCallback((value: string) => {
    updateFilters({ search: value });
  }, [updateFilters]);

  const handleExportCSV = useCallback(() => {
    try {
      exportToCSV(filteredProjects);
      success('Export successful', `Downloaded ${filteredProjects.length} projects as CSV`);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      showError('Export failed', 'Unable to download CSV file');
    }
  }, [filteredProjects, success, showError]);

  return (
    <div className="min-h-screen bg-background">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Compact Header with Actions */}
      <CompactHeader 
        projects={projects}
        lastFetch={lastFetch}
        onExportCSV={handleExportCSV}
        filteredProjects={filteredProjects}
      />
      
      {/* Main Content */}
      <div className="container mx-auto p-6 space-y-6">
        {/* Error Display */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-4">
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
                Dashboard will auto-load data.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Compact Overview */}
            <OverviewCards projects={filteredProjects} />
            
            {/* Projects Table with integrated search and filters */}
            <ProjectsTable 
              projects={filteredProjects}
              filters={filters}
              onFiltersChange={updateFilters}
              searchValue={filters.search}
              onSearchChange={handleSearchChange}
              isSearching={isSearching}
              hasActiveFilters={hasActiveFilters}
              onOpenFilters={() => setShowFilterSidebar(true)}
              onClearFilters={clearFilters}
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

export default function Dashboard() {
  return (
    <Suspense fallback={<SkeletonDashboard />}>
      <DashboardContent />
    </Suspense>
  );
}
