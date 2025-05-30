'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { ProjectDescriptionModal } from "@/components/project-description-modal";
import { Tooltip } from "@/components/ui/tooltip";
import { Project, FilterOptions } from "@/types/project";
import { formatNumber, truncate } from "@/lib/utils";
import { ExternalLink, Heart, MessageSquare, Users, MapPin, ChevronUp, ChevronDown, ChevronsUpDown, SlidersHorizontal, Info, Search } from "lucide-react";

interface ProjectsTableProps {
  projects: Project[];
  filters: FilterOptions;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  onProjectClick?: (project: Project) => void;
  BookmarkButton?: React.ComponentType<{ projectId: number; size: string; variant: string }>;
  // Search props
  searchValue: string;
  onSearchChange: (value: string) => void;
  isSearching?: boolean;
  // Filter props
  hasActiveFilters: boolean;
  onOpenFilters: () => void;
  onClearFilters: () => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

export function ProjectsTable({ 
  projects, 
  filters, 
  onFiltersChange, 
  onProjectClick, 
  BookmarkButton,
  searchValue,
  onSearchChange,
  isSearching = false,
  hasActiveFilters,
  onOpenFilters,
  onClearFilters
}: ProjectsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Ensure projects is always an array to prevent crashes
  const safeProjects = Array.isArray(projects) ? projects : [];
  const projectCount = safeProjects.length;
  const totalPages = Math.max(1, Math.ceil(projectCount / itemsPerPage));
  
  const paginatedProjects = useMemo(() => {
    if (projectCount === 0) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return safeProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [safeProjects, currentPage, itemsPerPage, projectCount]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    document.getElementById('projects-table')?.scrollIntoView({ behavior: 'smooth' });
  }, [totalPages]);

  const handlePageSizeChange = useCallback((newSize: string) => {
    const size = parseInt(newSize) || DEFAULT_PAGE_SIZE;
    setItemsPerPage(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const handleSort = useCallback((column: FilterOptions['sortBy']) => {
    if (!onFiltersChange) return;
    const newOrder = filters.sortBy === column && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    onFiltersChange({ sortBy: column, sortOrder: newOrder });
    setCurrentPage(1);
  }, [filters.sortBy, filters.sortOrder, onFiltersChange]);

  const getSortIcon = useCallback((column: FilterOptions['sortBy']) => {
    if (filters.sortBy !== column) {
      return <ChevronsUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return filters.sortOrder === 'asc' ? 
      <ChevronUp className="h-3 w-3 ml-1" /> : 
      <ChevronDown className="h-3 w-3 ml-1" />;
  }, [filters.sortBy, filters.sortOrder]);

  // Reset to first page when projects change, but ensure page is valid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [projectCount, totalPages, currentPage]);

  const openProjectUrl = useCallback((slug: string) => {
    if (!slug) return;
    window.open(`https://arena.colosseum.org/projects/explore/${slug}`, '_blank');
  }, []);

  // Determine if we have an empty state
  const isEmpty = projectCount === 0;
  const hasSearchOrFilters = Boolean(searchValue?.trim() || hasActiveFilters);

  // Always render the search bar - this prevents it from disappearing
  const renderSearchHeader = () => (
    <div className="flex items-center gap-4">
      {/* Projects Title and Count */}
      <div className="flex items-center gap-2 shrink-0">
        <Users className="h-4 w-4" />
        <span className="text-base font-semibold">
          Projects ({formatNumber(projectCount)})
        </span>
      </div>
      
      {/* Search Bar - Always visible and takes up remaining space */}
      <div className="flex-1 max-w-md">
        <SearchInput
          key="search-input" // Stable key to prevent re-mounting
          value={searchValue || ''} // Ensure value is never undefined
          onChange={onSearchChange}
          placeholder="Search projects..."
          isSearching={isSearching}
          className="w-full"
        />
      </div>
      
      {/* Right Side: Filters and Page Size Selector */}
      <div className="flex items-center gap-3 shrink-0 ml-auto">
        {/* Filters Section */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" onClick={onClearFilters} size="sm">
              Clear All
            </Button>
          )}
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            onClick={onOpenFilters}
            size="sm"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-white/80 text-background rounded-full w-2 h-2" />
            )}
          </Button>
        </div>
        
        {/* Page Size Selector - Only show when we have data */}
        {!isEmpty && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Show:</span>
            <Select value={itemsPerPage.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-16 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={9} className="text-center py-12">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          {hasSearchOrFilters ? (
            <>
              <Search className="h-12 w-12 opacity-20" />
              <div>
                <p className="text-sm font-medium">
                  No projects found matching your search
                </p>
                <p className="text-xs mt-1">
                  Try adjusting your search terms or filters to find more projects
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                {searchValue?.trim() && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onSearchChange('')}
                  >
                    Clear search
                  </Button>
                )}
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onClearFilters}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <Users className="h-12 w-12 opacity-20" />
              <div>
                <p className="text-sm font-medium">No projects found</p>
                <p className="text-xs mt-1">
                  No project data is currently available
                </p>
              </div>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  const renderTableContent = () => {
    if (isEmpty) {
      return renderEmptyState();
    }

    return paginatedProjects.map((project, index) => {
      const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
      const teamSize = project.teamMembers?.length || 1;
      
      return (
        <TableRow key={`${project.id}-${globalIndex}`} className="hover:bg-muted/50 h-16">
          <TableCell className="font-medium text-muted-foreground text-xs">
            {globalIndex}
          </TableCell>
          <TableCell className="py-2">
            <div className="space-y-1">
              <div className="font-medium text-xs text-foreground">
                {project.name || 'Unnamed Project'}
              </div>
              {project.twitterHandle && (
                <a
                  href={`https://x.com/${project.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                >
                  @{project.twitterHandle}
                </a>
              )}
            </div>
          </TableCell>
          <TableCell className="py-2">
            <Tooltip 
              content={project.description?.trim() || 'No description available'} 
              maxWidth="max-w-lg"
              side="top"
            >
              <div className="group cursor-pointer">
                <div className="text-xs line-clamp-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-relaxed">
                  {project.description?.trim() ? 
                    truncate(project.description, 140) : 
                    'No description'
                  }
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProject(project);
                  }}
                  className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Info className="h-3 w-3" />
                  <span className="text-xs">Full details</span>
                </button>
              </div>
            </Tooltip>
          </TableCell>
          <TableCell className="py-2">
            <div className="text-xs text-center leading-relaxed max-w-[120px]">
              {project.tracks?.length > 0 ? (
                <div className="space-y-0.5">
                  {project.tracks.map((track, i) => (
                    <div
                      key={i}
                      className="text-hakata-purple dark:text-hakata-light-purple font-medium"
                    >
                      {track}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </TableCell>
          <TableCell className="text-center py-2">
            <span className="text-xs">
              {project.country?.trim() || '—'}
            </span>
          </TableCell>
          <TableCell className="text-center py-2">
            <div className="flex items-center justify-center gap-1">
              <Heart className="h-3 w-3 text-red-500" />
              <span className="font-medium text-xs">
                {formatNumber(project.likes || 0)}
              </span>
            </div>
          </TableCell>
          <TableCell className="text-center py-2">
            <div className="flex items-center justify-center gap-1">
              <MessageSquare className="h-3 w-3 text-blue-500" />
              <span className="font-medium text-xs">
                {formatNumber(project.comments || 0)}
              </span>
            </div>
          </TableCell>
          <TableCell className="text-center py-2">
            <div className="flex items-center justify-center gap-1">
              <Users className="h-3 w-3 text-green-500" />
              <span className="font-medium text-xs">{teamSize}</span>
            </div>
          </TableCell>
          <TableCell className="py-2">
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openProjectUrl(project.slug)}
                disabled={!project.slug}
                className="h-6 w-6 p-0"
                title="View on Arena"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <Card id="projects-table">
      <CardHeader className="pb-2">
        {renderSearchHeader()}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border overflow-x-auto">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="h-6">
                <TableHead className="w-[50px] text-xs py-1">#</TableHead>
                <TableHead className="w-[180px] text-xs py-1">
                  <button
                    className="w-full text-left font-semibold hover:text-hakata-purple dark:hover:text-hakata-light-purple transition-colors flex items-center group"
                    onClick={() => handleSort('name')}
                    disabled={isEmpty}
                  >
                    Project
                    <span className="group-hover:opacity-100">
                      {getSortIcon('name')}
                    </span>
                  </button>
                </TableHead>
                <TableHead className="w-[350px] text-xs py-1">Description</TableHead>
                <TableHead className="w-[120px] text-center text-xs py-1">Tracks</TableHead>
                <TableHead className="w-[100px] text-center text-xs py-1">
                  <button
                    className="w-full font-semibold hover:text-hakata-purple dark:hover:text-hakata-light-purple transition-colors group"
                    onClick={() => handleSort('country')}
                    disabled={isEmpty}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Country
                      <span className="group-hover:opacity-100">
                        {getSortIcon('country')}
                      </span>
                    </div>
                  </button>
                </TableHead>
                <TableHead className="w-[80px] text-center text-xs py-1">
                  <button
                    className="w-full font-semibold hover:text-hakata-purple dark:hover:text-hakata-light-purple transition-colors group"
                    onClick={() => handleSort('likes')}
                    disabled={isEmpty}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Heart className="h-3 w-3" />
                      Likes
                      <span className="group-hover:opacity-100">
                        {getSortIcon('likes')}
                      </span>
                    </div>
                  </button>
                </TableHead>
                <TableHead className="w-[90px] text-center text-xs py-1">
                  <button
                    className="w-full font-semibold hover:text-hakata-purple dark:hover:text-hakata-light-purple transition-colors group"
                    onClick={() => handleSort('comments')}
                    disabled={isEmpty}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Comments
                      <span className="group-hover:opacity-100">
                        {getSortIcon('comments')}
                      </span>
                    </div>
                  </button>
                </TableHead>
                <TableHead className="w-[70px] text-center text-xs py-1">
                  <button
                    className="w-full font-semibold hover:text-hakata-purple dark:hover:text-hakata-light-purple transition-colors group"
                    onClick={() => handleSort('teamSize')}
                    disabled={isEmpty}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3 w-3" />
                      Team
                      <span className="group-hover:opacity-100">
                        {getSortIcon('teamSize')}
                      </span>
                    </div>
                  </button>
                </TableHead>
                <TableHead className="w-[60px] text-center text-xs py-1">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderTableContent()}
            </TableBody>
          </Table>
        </div>
        
        {!isEmpty && totalPages > 1 && (
          <div className="pt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              totalItems={projectCount}
            />
          </div>
        )}
      </CardContent>
      
      {/* Project Description Modal */}
      {selectedProject && (
        <ProjectDescriptionModal
          project={selectedProject}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </Card>
  );
}
