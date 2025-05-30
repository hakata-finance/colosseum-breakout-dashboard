'use client';

import { useState } from 'react';
import { Project } from '@/types/project';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bookmark, 
  BookmarkX, 
  Heart, 
  MessageSquare, 
  Users, 
  ExternalLink,
  Trash2,
  Star,
  Filter
} from 'lucide-react';
import { formatNumber, truncate } from '@/lib/utils';

interface BookmarksPanelProps {
  projects: Project[];
  onProjectSelect?: (project: Project) => void;
  className?: string;
}

export function BookmarksPanel({ 
  projects, 
  onProjectSelect,
  className 
}: BookmarksPanelProps) {
  const { 
    bookmarks, 
    isLoading, 
    toggleBookmark, 
    clearBookmarks, 
    getBookmarkedProjects,
    bookmarkCount 
  } = useBookmarks();

  const [showAll, setShowAll] = useState(false);

  const bookmarkedProjects = getBookmarkedProjects(projects);
  const displayedProjects = showAll ? bookmarkedProjects : bookmarkedProjects.slice(0, 5);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-[120px]" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bookmarkCount === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Bookmarked Projects (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No bookmarks yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click the bookmark icon on any project to save it for later.
            </p>
            <Button variant="outline" size="sm" disabled>
              <Filter className="mr-2 h-4 w-4" />
              Browse Projects
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-blue-500" />
            Bookmarked Projects ({bookmarkCount})
          </CardTitle>
          {bookmarkCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearBookmarks}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedProjects.map(project => (
            <BookmarkItem
              key={project.id}
              project={project}
              onToggleBookmark={toggleBookmark}
              onSelect={onProjectSelect}
            />
          ))}
          
          {bookmarkedProjects.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full"
            >
              {showAll 
                ? `Show Less` 
                : `Show ${bookmarkedProjects.length - 5} More`
              }
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface BookmarkItemProps {
  project: Project;
  onToggleBookmark: (id: number) => void;
  onSelect?: (project: Project) => void;
}

function BookmarkItem({ project, onToggleBookmark, onSelect }: BookmarkItemProps) {
  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      {/* Project Image */}
      <div className="flex-shrink-0">
        {project.image?.url ? (
          <img
            src={project.image.url}
            alt={project.name}
            className="w-12 h-12 rounded object-cover"
            onError={(e) => {
              e.currentTarget.src = '/api/placeholder/48/48';
            }}
          />
        ) : (
          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
            <Star className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Project Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-medium truncate">{project.name}</h4>
          {project.tracks && project.tracks.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {project.tracks[0]}
            </Badge>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground mb-2">
          {truncate(project.description || 'No description', 80)}
        </p>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {formatNumber(project.likes || 0)}
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {formatNumber(project.comments || 0)}
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {project.teamMembers?.length || 1}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {onSelect && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(project)}
            className="h-8 w-8 p-0"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleBookmark(project.id)}
          className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600"
        >
          <BookmarkX className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Bookmark button component for use in other parts of the app
interface BookmarkButtonProps {
  projectId: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  showText?: boolean;
}

export function BookmarkButton({ 
  projectId, 
  size = 'md', 
  variant = 'ghost',
  showText = false 
}: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark, isLoading } = useBookmarks();
  
  const bookmarked = isBookmarked(projectId);
  
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default';

  return (
    <Button
      variant={variant}
      size={buttonSize}
      onClick={() => toggleBookmark(projectId)}
      disabled={isLoading}
      className={bookmarked ? 'text-blue-500 hover:text-blue-600' : ''}
    >
      <Bookmark 
        className={`${iconSize} ${bookmarked ? 'fill-current' : ''} ${showText ? 'mr-2' : ''}`} 
      />
      {showText && (bookmarked ? 'Bookmarked' : 'Bookmark')}
    </Button>
  );
}
