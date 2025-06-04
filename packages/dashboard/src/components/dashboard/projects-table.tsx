"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { ProjectDescriptionModal } from "@/components/project-description-modal";
import { Project, FilterOptions } from "@/types/project";
import { formatNumber, truncate } from "@/lib/utils";
import {
  Heart,
  MessageSquare,
  Users,
  MapPin,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  SlidersHorizontal,
  Search,
} from "lucide-react";
import Image from 'next/image';

interface ProjectsTableProps {
  projects: Project[];
  filters: FilterOptions;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  onProjectClick?: (project: Project) => void;
  BookmarkButton?: React.ComponentType<{
    projectId: number;
    size: string;
    variant: string;
  }>;
  // Search props
  searchValue: string;
  onSearchChange: (value: string) => void;
  isSearching?: boolean;
  // Filter props
  hasActiveFilters: boolean;
  onOpenFilters: () => void;
  onClearFilters: () => void;
  // Loading prop
  isLoading?: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 250];
const DEFAULT_PAGE_SIZE = 20;

// Create a new loading skeleton component for the table
const TableLoadingSkeleton = () => (
  <>
    {[...Array(10)].map((_, i) => (
      <TableRow key={i} className="h-20 border-gray-800">
        <TableCell className="py-2">
          <div className="w-8 h-4 bg-gray-700 rounded animate-pulse" />
        </TableCell>
        <TableCell className="py-2">
          <div className="space-y-2">
            <div className="w-32 h-4 bg-gray-700 rounded animate-pulse" />
            <div className="w-24 h-3 bg-gray-700 rounded animate-pulse" />
          </div>
        </TableCell>
        <TableCell className="py-2">
          <div className="space-y-2">
            <div className="w-48 h-4 bg-gray-700 rounded animate-pulse" />
            <div className="w-40 h-3 bg-gray-700 rounded animate-pulse" />
            <div className="w-36 h-3 bg-gray-700 rounded animate-pulse" />
          </div>
        </TableCell>
        <TableCell className="py-2 text-center">
          <div className="w-20 h-4 bg-gray-700 rounded animate-pulse mx-auto" />
        </TableCell>
        <TableCell className="py-2 text-center">
          <div className="w-16 h-4 bg-gray-700 rounded animate-pulse mx-auto" />
        </TableCell>
        <TableCell className="py-2 text-center">
          <div className="w-12 h-4 bg-gray-700 rounded animate-pulse mx-auto" />
        </TableCell>
        <TableCell className="py-2 text-center">
          <div className="w-12 h-4 bg-gray-700 rounded animate-pulse mx-auto" />
        </TableCell>
        <TableCell className="py-2 text-center">
          <div className="w-12 h-4 bg-gray-700 rounded animate-pulse mx-auto" />
        </TableCell>
        <TableCell className="py-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <div className="w-6 h-6 bg-gray-700 rounded animate-pulse" />
            <div className="w-6 h-6 bg-gray-700 rounded animate-pulse" />
            <div className="w-6 h-6 bg-gray-700 rounded animate-pulse" />
          </div>
        </TableCell>
      </TableRow>
    ))}
  </>
);

export function ProjectsTable({
  projects,
  filters,
  onFiltersChange,
  searchValue,
  onSearchChange,
  isSearching = false,
  isLoading = false,
  hasActiveFilters,
  onOpenFilters,
  onClearFilters,
}: ProjectsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());
  const [teamPopover, setTeamPopover] = useState<number | null>(null);

  // Change the ref type to match the popover div
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setTeamPopover(null);
      }
    };

    if (teamPopover !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [teamPopover]);

  // Ensure projects is always an array to prevent crashes
  const safeProjects = useMemo(
    () => (Array.isArray(projects) ? projects : []),
    [projects]
  );
  const projectCount = safeProjects.length;
  const totalPages = Math.max(1, Math.ceil(projectCount / itemsPerPage));

  const paginatedProjects = useMemo(() => {
    if (projectCount === 0) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return safeProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [safeProjects, currentPage, itemsPerPage, projectCount]);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
      document
        .getElementById("projects-table")
        ?.scrollIntoView({ behavior: "smooth" });
    },
    [totalPages]
  );

  const handlePageSizeChange = useCallback((newSize: string) => {
    const size = parseInt(newSize) || DEFAULT_PAGE_SIZE;
    setItemsPerPage(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const handleSort = useCallback(
    (column: FilterOptions["sortBy"]) => {
      if (!onFiltersChange) return;
      const newOrder =
        filters.sortBy === column && filters.sortOrder === "desc"
          ? "asc"
          : "desc";
      onFiltersChange({ sortBy: column, sortOrder: newOrder });
      setCurrentPage(1);
    },
    [filters.sortBy, filters.sortOrder, onFiltersChange]
  );

  const getSortIcon = useCallback(
    (column: FilterOptions["sortBy"]) => {
      if (filters.sortBy !== column) {
        return <ChevronsUpDown className="h-3 w-3 ml-1 opacity-50" />;
      }
      return filters.sortOrder === "asc" ? (
        <ChevronUp className="h-3 w-3 ml-1" />
      ) : (
        <ChevronDown className="h-3 w-3 ml-1" />
      );
    },
    [filters.sortBy, filters.sortOrder]
  );

  // Reset to first page when projects change, but ensure page is valid
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [projectCount, totalPages, currentPage]);

  // Determine if we have an empty state
  const isEmpty = projectCount === 0;
  const hasSearchOrFilters = Boolean(searchValue?.trim() || hasActiveFilters);

  const toggleDescription = useCallback((projectId: number) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  }, []);

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
          value={searchValue || ""} // Ensure value is never undefined
          onChange={onSearchChange}
          placeholder="Search projects and descriptions..."
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
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-16 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
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
                  Try adjusting your search terms or filters to find more
                  projects
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                {searchValue?.trim() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSearchChange("")}
                  >
                    Clear search
                  </Button>
                )}
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={onClearFilters}>
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
    if (isLoading) {
      return <TableLoadingSkeleton />;
    }
    
    if (isEmpty) {
      return renderEmptyState();
    }

    return paginatedProjects.map((project, index) => {
      const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
      const teamSize = project.teamMembers?.length || 1;

      return (
        <TableRow
          key={`${project.id}-${globalIndex}`}
          className="hover:bg-muted/50 transition-colors h-20 border-gray-800"
        >
          <TableCell className="font-medium text-muted-foreground text-xs">
            {globalIndex}
          </TableCell>
          <TableCell className="py-2">
            <div className="space-y-1">
              <div className="font-medium text-xs text-foreground">
                {project.name || "Unnamed Project"}
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
          <TableCell className="py-4 max-w-[350px]">
            <div 
              className="text-xs text-gray-300 leading-relaxed cursor-pointer hover:text-gray-200 transition-colors"
              onClick={() => toggleDescription(project.id)}
            >
              {project.description?.trim() ? (
                expandedDescriptions.has(project.id) ? 
                  project.description : 
                  truncate(project.description, 140)
              ) : (
                <span className="text-gray-500">No description</span>
              )}
            </div>
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
            <span className="text-xs">{project.country?.trim() || "—"}</span>
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
          <TableCell className="text-center py-4 relative">
            <div 
              className="flex items-center justify-center gap-1 cursor-pointer hover:bg-gray-800/30 rounded px-3 py-1 transition-colors min-w-[50px]"
              onClick={() => setTeamPopover(teamPopover === project.id ? null : project.id)}
            >
              <Users className="h-3 w-3 text-green-500 flex-shrink-0" />
              <span className="font-medium text-xs whitespace-nowrap">{teamSize}</span>
            </div>
            
            {/* Enhanced Team Details Popover with Smart Positioning */}
            {teamPopover === project.id && (
              <div 
                ref={popoverRef}
                className={`absolute left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 border border-gray-700 rounded-md shadow-lg p-3 min-w-[220px] ${
                  // Show above if it's one of the last few rows
                  index >= paginatedProjects.length - 3 
                    ? 'bottom-full mb-1' 
                    : 'top-full mt-1'
                }`}
              >
                <div className="space-y-3">
                  <div className="text-xs font-medium text-gray-300 border-b border-gray-700 pb-2">
                    Team Members ({teamSize})
                  </div>
                  {project.teamMembers?.length > 0 ? (
                    project.teamMembers.map((member, i) => (
                      <div key={i} className="flex items-center gap-3 hover:bg-gray-800/30 rounded p-2 transition-colors">
                        {/* Avatar */}
                        <div className="relative">
                          {member.avatarUrl ? (
                            <Image 
                              src={member.avatarUrl} 
                              alt={member.displayName || member.username}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full object-cover border border-gray-600"
                              onError={(e) => {
                                // Fallback to initials if image fails
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) {
                                  fallback.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-semibold border border-gray-600 ${member.avatarUrl ? 'hidden' : 'flex'}`}
                          >
                            {member.displayName?.charAt(0) || member.username?.charAt(0) || '?'}
                          </div>
                        </div>
                        
                        {/* Member Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-200 truncate">
                            {member.displayName || member.username || 'Unknown'}
                          </div>
                          {member.username && (
                            <a
                              href={`https://x.com/${member.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              @{member.username}
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 text-center py-2">
                      No team details available
                    </div>
                  )}
                </div>
              </div>
            )}
          </TableCell>
          <TableCell className="py-2">
            <div className="flex items-center justify-center gap-1">
              {/* Repository Link */}
              {(project.repoLink || project.github_url) && (
                <a
                  href={project.repoLink || project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-7 w-7 p-0 hover:bg-gray-700 rounded-md transition-all duration-200 hover:scale-105 active:scale-95 group"
                  title="GitHub Repository"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-gray-500 group-hover:text-gray-300 transition-colors">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
                    <path d="M9 18c-4.51 2-5-2-7-2"/>
                  </svg>
                </a>
              )}
              
              {/* Presentation Link */}
              {project.presentationLink && (
                <a
                  href={project.presentationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-7 w-7 p-0 hover:bg-gray-700 rounded-md transition-all duration-200 hover:scale-105 active:scale-95 group"
                  title="Presentation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-gray-500 group-hover:text-gray-300 transition-colors">
                    <path d="M2 3h20"/>
                    <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/>
                    <path d="m7 21 5-5 5 5"/>
                  </svg>
                </a>
              )}
              
              {/* Technical Demo Link */}
              {project.technicalDemoLink && (
                <a
                  href={project.technicalDemoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-7 w-7 p-0 hover:bg-gray-700 rounded-md transition-all duration-200 hover:scale-105 active:scale-95 group"
                  title="Technical Demo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-gray-500 group-hover:text-gray-300 transition-colors">
                    <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/>
                    <rect x="2" y="6" width="14" height="12" rx="2"/>
                  </svg>
                </a>
              )}
              
              {/* Arena Project Link - Official Colosseum Logo */}
              {project.slug && (
                <a
                  href={`https://arena.colosseum.org/projects/explore/${project.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-7 w-7 p-0 hover:bg-gray-700 rounded-md transition-all duration-200 hover:scale-105 active:scale-95 group"
                  title="View on Arena"
                >
                  <svg width="12" height="12" viewBox="0 0 918 918" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500 group-hover:text-gray-300 transition-colors">
                    <rect x="17.1494" y="17.1494" width="883.699" height="883.699" rx="49.4307" stroke="currentColor" strokeWidth="34.2988"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M740.451 194.414H177.547V263.005H740.451V194.414ZM684.763 316.249H233.114V384.839H684.763V316.249ZM424.644 438.105H493.235V739.306H424.644V438.105ZM356.057 438.105H287.467V739.306H356.057V738.105ZM561.883 438.105H630.473V739.306H561.883V438.105Z" fill="currentColor"/>
                  </svg>
                </a>
              )}
            </div>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <Card id="projects-table">
      <CardHeader className="pb-2">{renderSearchHeader()}</CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border overflow-x-auto">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="h-12 border-b-2">
                <TableHead className="w-[50px] text-sm py-2 font-semibold">
                  #
                </TableHead>
                <TableHead className="w-[180px] text-sm py-2">
                  <div className="w-full text-left font-semibold">Project</div>
                </TableHead>
                <TableHead className="w-[350px] text-sm py-2 font-semibold">
                  Description
                </TableHead>
                <TableHead className="w-[120px] text-center text-sm py-2 font-semibold">
                  Tracks
                </TableHead>
                <TableHead className="w-[100px] text-center text-sm py-2">
                  <button
                    className="w-full font-semibold hover:bg-gray-800/30 transition-all duration-200 rounded-sm p-1 group"
                    onClick={() => handleSort("country")}
                    disabled={isEmpty}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <MapPin className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      Country
                      <span className="group-hover:opacity-100 transition-opacity">
                        {getSortIcon("country")}
                      </span>
                    </div>
                  </button>
                </TableHead>
                <TableHead className="w-[80px] text-center text-sm py-2">
                  <button
                    className="w-full font-semibold hover:bg-gray-800/30 transition-all duration-200 rounded-sm p-1 group"
                    onClick={() => handleSort("likes")}
                    disabled={isEmpty}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Heart className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      Likes
                      <span className="group-hover:opacity-100 transition-opacity">
                        {getSortIcon("likes")}
                      </span>
                    </div>
                  </button>
                </TableHead>
                <TableHead className="w-[90px] text-center text-sm py-2">
                  <button
                    className="w-full font-semibold hover:bg-gray-800/30 transition-all duration-200 rounded-sm p-1 group"
                    onClick={() => handleSort("comments")}
                    disabled={isEmpty}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      Comments
                      <span className="group-hover:opacity-100 transition-opacity">
                        {getSortIcon("comments")}
                      </span>
                    </div>
                  </button>
                </TableHead>
                <TableHead className="w-[80px] text-center text-sm py-2">
                  <button
                    className="w-full font-semibold hover:bg-gray-800/30 transition-all duration-200 rounded-sm p-1 group"
                    onClick={() => handleSort("teamSize")}
                    disabled={isEmpty}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      Team
                      <span className="group-hover:opacity-100 transition-opacity">
                        {getSortIcon("teamSize")}
                      </span>
                    </div>
                  </button>
                </TableHead>
                <TableHead className="w-[100px] text-center text-sm py-2 font-semibold">
                  Links
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderTableContent()}</TableBody>
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
