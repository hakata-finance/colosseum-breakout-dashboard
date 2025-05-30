'use client';

import { useState, useMemo, useCallback } from 'react';
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
import { ExternalLink, Heart, MessageSquare, Users, MapPin, ChevronUp, ChevronDown, ChevronsUpDown, SlidersHorizontal, Info } from "lucide-react";

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

  const totalPages = Math.ceil(projects.length / itemsPerPage);
  
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return projects.slice(startIndex, startIndex + itemsPerPage);
  }, [projects, currentPage, itemsPerPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    document.getElementById('projects-table')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handlePageSizeChange = useCallback((newSize: string) => {
    const size = parseInt(newSize);
    setItemsPerPage(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const handleSort = useCallback((column: FilterOptions['sortBy']) => {
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

  // Reset to first page when projects change
  useMemo(() => {
    setCurrentPage(1);
  }, [projects.length]);

  const openProjectUrl = useCallback((slug: string) => {
    window.open(`https://arena.colosseum.org/projects/explore/${slug}`, '_blank');
  }, []);

  if (projects.length === 0) {
    return (
      <Card id="projects-table">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Projects (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {filters.search || filters.tracks.length > 0 || filters.countries.length > 0 
              ? 'No projects found matching your filters.' 
              : 'No projects found.'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="projects-table">
      <CardHeader className="pb-2">
        {/* Single Row with Title, Search, Filters, and Page Size */}
        <div className="flex items-center gap-4">
          {/* Projects Title and Count */}
          <div className="flex items-center gap-2 shrink-0">
            <Users className="h-4 w-4" />
            <span className="text-base font-semibold">Projects ({formatNumber(projects.length)})</span>
          </div>
          
          {/* Search Bar - Takes up remaining space */}
          <div className="flex-1 max-w-md">
            <SearchInput
              value={searchValue}
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
            
            {/* Page Size Selector */}
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
          </div>
        </div>
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
                <TableHead className="w-[70px] text-center text-xs py-1">Team</TableHead>
                <TableHead className="w-[60px] text-center text-xs py-1">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProjects.map((project, index) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                const teamSize = project.teamMembers?.length || 1;
                
                return (
                  <TableRow key={project.id} className="hover:bg-muted/50 h-16">
                    <TableCell className="font-medium text-muted-foreground text-xs">
                      {globalIndex}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="space-y-1">
                        <div className="font-medium text-xs text-foreground">
                          {project.name}
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
                      <div className="flex flex-wrap gap-1 justify-center">
                        {project.tracks?.length > 0 ? (
                          project.tracks.slice(0, 2).map((track, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-hakata-purple/10 text-hakata-purple dark:bg-hakata-purple/20 dark:text-hakata-light-purple border border-hakata-purple/20 dark:border-hakata-purple/30"
                            >
                              {track}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                        {project.tracks?.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{project.tracks.length - 2}</span>
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
                          className="h-6 w-6 p-0"
                          title="View on Arena"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="pt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              totalItems={projects.length}
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
