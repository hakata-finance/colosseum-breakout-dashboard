'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Project, FilterOptions } from "@/types/project";
import { formatNumber, truncate } from "@/lib/utils";
import { ExternalLink, Heart, MessageSquare, Users, MapPin, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

interface ProjectsTableProps {
  projects: Project[];
  filters: FilterOptions;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  onProjectClick?: (project: Project) => void;
  BookmarkButton?: React.ComponentType<{ projectId: number; size: string; variant: string }>;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

export function ProjectsTable({ projects, filters, onFiltersChange, onProjectClick, BookmarkButton }: ProjectsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);

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
    window.open(`https://colosseum.org/projects/${slug}`, '_blank');
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Projects ({formatNumber(projects.length)})
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select value={itemsPerPage.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20">
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
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead className="min-w-[200px]">
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
                <TableHead className="min-w-[300px]">Description</TableHead>
                <TableHead className="text-center">Tracks</TableHead>
                <TableHead className="text-center">
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
                <TableHead className="text-center">
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
                <TableHead className="text-center">
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
                <TableHead className="text-center">Team</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProjects.map((project, index) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                const teamSize = project.teamMembers?.length || 1;
                
                return (
                  <TableRow key={project.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-muted-foreground">
                      {globalIndex}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <button
                          onClick={() => onProjectClick?.(project)}
                          className="font-medium text-sm hover:text-hakata-purple dark:hover:text-hakata-light-purple cursor-pointer transition-colors text-left"
                        >
                          {project.name}
                        </button>
                        {project.twitterHandle && (
                          <div className="text-xs text-muted-foreground">
                            @{project.twitterHandle}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {project.description?.trim() ? 
                          truncate(project.description, 100) : 
                          'No description'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {project.tracks?.length > 0 ? (
                          project.tracks.map((track, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-hakata-purple/10 text-hakata-purple dark:bg-hakata-purple/20 dark:text-hakata-light-purple border border-hakata-purple/20 dark:border-hakata-purple/30"
                            >
                              {track}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">No tracks</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className="text-sm"
                      >
                        {project.country?.trim() || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Heart className="h-3 w-3 text-red-500" />
                        <span className="font-medium">
                          {formatNumber(project.likes || 0)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <MessageSquare className="h-3 w-3 text-blue-500" />
                        <span className="font-medium">
                          {formatNumber(project.comments || 0)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-3 w-3 text-green-500" />
                        <span className="font-medium">{teamSize}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {BookmarkButton && (
                          <BookmarkButton 
                            projectId={project.id}
                            size="sm"
                            variant="ghost"
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openProjectUrl(project.slug)}
                          className="h-8 w-8 p-0"
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={projects.length}
          />
        )}
      </CardContent>
    </Card>
  );
}
