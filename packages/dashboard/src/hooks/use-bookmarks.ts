'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project } from '@/types/project';

const BOOKMARKS_STORAGE_KEY = 'colosseum-bookmarked-projects';
const RECENT_SEARCHES_KEY = 'colosseum-recent-searches';

/**
 * Hook for managing bookmarked projects
 */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setBookmarks(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save bookmarks to localStorage whenever they change
  const saveBookmarks = useCallback((newBookmarks: number[]) => {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(newBookmarks));
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }, []);

  const toggleBookmark = useCallback((projectId: number) => {
    setBookmarks(prev => {
      const updated = prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId];
      
      saveBookmarks(updated);
      return updated;
    });
  }, [saveBookmarks]);

  const addBookmark = useCallback((projectId: number) => {
    setBookmarks(prev => {
      if (prev.includes(projectId)) return prev;
      const updated = [...prev, projectId];
      saveBookmarks(updated);
      return updated;
    });
  }, [saveBookmarks]);

  const removeBookmark = useCallback((projectId: number) => {
    setBookmarks(prev => {
      const updated = prev.filter(id => id !== projectId);
      saveBookmarks(updated);
      return updated;
    });
  }, [saveBookmarks]);

  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
    saveBookmarks([]);
  }, [saveBookmarks]);

  const isBookmarked = useCallback((projectId: number) => {
    return bookmarks.includes(projectId);
  }, [bookmarks]);

  const getBookmarkedProjects = useCallback((projects: Project[]) => {
    return projects.filter(project => bookmarks.includes(project.id));
  }, [bookmarks]);

  return {
    bookmarks,
    isLoading,
    toggleBookmark,
    addBookmark,
    removeBookmark,
    clearBookmarks,
    isBookmarked,
    getBookmarkedProjects,
    bookmarkCount: bookmarks.length,
  };
}

/**
 * Hook for managing recent searches
 */
export function useRecentSearches(maxSearches: number = 10) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, maxSearches));
        }
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, [maxSearches]);

  const addRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    setRecentSearches(prev => {
      // Remove if already exists
      const filtered = prev.filter(search => search !== query);
      // Add to beginning
      const updated = [query, ...filtered].slice(0, maxSearches);
      
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent search:', error);
      }
      
      return updated;
    });
  }, [maxSearches]);

  const removeRecentSearch = useCallback((query: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(search => search !== query);
      
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to remove recent search:', error);
      }
      
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }, []);

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  };
}

/**
 * Hook for managing saved filter presets
 */
export function useSavedFilters() {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const SAVED_FILTERS_KEY = 'colosseum-saved-filters';

  interface SavedFilter {
    id: string;
    name: string;
    filters: {
      search?: string;
      tracks?: string[];
      countries?: string[];
      teamSizeRange?: [number, number];
      likesRange?: [number, number];
    };
    createdAt: string;
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_FILTERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSavedFilters(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load saved filters:', error);
    }
  }, []);

  const saveFilter = useCallback((name: string, filters: SavedFilter['filters']) => {
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      filters,
      createdAt: new Date().toISOString(),
    };

    setSavedFilters(prev => {
      const updated = [...prev, newFilter];
      try {
        localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save filter:', error);
      }
      return updated;
    });

    return newFilter.id;
  }, []);

  const deleteFilter = useCallback((id: string) => {
    setSavedFilters(prev => {
      const updated = prev.filter(filter => filter.id !== id);
      try {
        localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to delete filter:', error);
      }
      return updated;
    });
  }, []);

  const loadFilter = useCallback((id: string) => {
    return savedFilters.find(filter => filter.id === id);
  }, [savedFilters]);

  return {
    savedFilters,
    saveFilter,
    deleteFilter,
    loadFilter,
  };
}

/**
 * Enhanced storage utilities with error handling and data migration
 */
export class LocalStorageManager {
  private prefix: string;

  constructor(prefix: string = 'colosseum') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}-${key}`;
  }

  set<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify({
        data: value,
        timestamp: Date.now(),
        version: 1,
      });
      
      localStorage.setItem(this.getKey(key), serialized);
      return true;
    } catch (error) {
      console.error(`Failed to set ${key}:`, error);
      
      // If quota exceeded, try to free up space
      if (error instanceof DOMException && error.code === 22) {
        this.clearOldData();
        // Try again
        try {
          localStorage.setItem(this.getKey(key), JSON.stringify(value));
          return true;
        } catch {
          return false;
        }
      }
      
      return false;
    }
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return defaultValue;

      const parsed = JSON.parse(item);
      
      // Handle legacy data without metadata
      if (parsed && typeof parsed === 'object' && 'data' in parsed) {
        return parsed.data as T;
      }
      
      return parsed as T;
    } catch (error) {
      console.error(`Failed to get ${key}:`, error);
      return defaultValue;
    }
  }

  remove(key: string): boolean {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
      return false;
    }
  }

  clear(): boolean {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }

  private clearOldData(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item);
              if (parsed.timestamp && parsed.timestamp < oneWeekAgo) {
                localStorage.removeItem(key);
              }
            }
          } catch {
            // Invalid JSON, remove it
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Failed to clear old data:', error);
    }
  }

  getStorageSize(): { used: number; total: number; percentage: number } {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
      
      // Estimate total storage (5MB is typical)
      const total = 5 * 1024 * 1024;
      const percentage = (used / total) * 100;
      
      return { used, total, percentage };
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }
}

// Export a singleton instance
export const storage = new LocalStorageManager('colosseum-dashboard');
