'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Project, FilterOptions } from '@/types/project';

/**
 * DEBOUNCE STRATEGY:
 * 
 * 1. UI Updates (immediate): Input field shows changes instantly for responsiveness
 * 2. Search Computation (adaptive debounce):
 *    - Clear search: 100ms (instant clear)
 *    - Short queries (1-2 chars): 600ms (likely typos, wait longer)
 *    - Medium queries (3-5 chars): 500ms (balanced timing)
 *    - Long queries (6+ chars): 400ms (intentional, respond faster)
 * 3. Filter Changes: 200ms (non-search filters like tracks/countries)
 * 4. URL Updates: 800ms (prevents excessive browser history entries)
 * 
 * This strategy follows industry best practices:
 * - Google: 150-200ms for instant search
 * - Slack: ~400ms for search
 * - GitHub: ~300-400ms
 * - Heavy computation dashboards: 400-600ms
 */

const DEFAULT_FILTERS: FilterOptions = {
  search: '',
  tracks: [],
  countries: [],
  teamSizeRange: [1, 50],
  likesRange: [0, 100],
  sortBy: 'likes',
  sortOrder: 'desc',
};

export function useSearch(projects: Project[]) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from URL params
  const [filters, setFilters] = useState<FilterOptions>(() => {
    const urlSearch = searchParams.get('q') || '';
    const urlSort = searchParams.get('sort') || 'likes';
    const urlOrder = searchParams.get('order') || 'desc';
    const urlTracks = searchParams.get('tracks')?.split(',').filter(Boolean) || [];
    const urlCountries = searchParams.get('countries')?.split(',').filter(Boolean) || [];
    
    return {
      ...DEFAULT_FILTERS,
      search: urlSearch,
      sortBy: urlSort as FilterOptions['sortBy'],
      sortOrder: urlOrder as FilterOptions['sortOrder'],
      tracks: urlTracks,
      countries: urlCountries,
    };
  });

  // Separate debounced search value
  const [debouncedFilters, setDebouncedFilters] = useState<FilterOptions>(filters);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const urlSyncRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const cacheRef = useRef<Map<string, Project[]>>(new Map());

  // Pre-compute search index (only when projects change)
  const searchIndex = useMemo(() => {
    return projects.map((project) => ({
      id: project.id,
      searchableText: [
        project.name || '',
        project.description || ''
      ].join(' ').toLowerCase().trim(),
      normalizedName: (project.name || '').toLowerCase(),
      normalizedDescription: (project.description || '').toLowerCase(),
      normalizedCountry: (project.country || '').toLowerCase(),
      normalizedTracks: (project.tracks || []).map(t => t.toLowerCase()),
      teamSize: project.teamMembers?.length || 1,
      project
    }));
  }, [projects]);

  // Fast search function (optimized)
  const performSearch = useCallback((currentFilters: FilterOptions): Project[] => {
    const cacheKey = JSON.stringify(currentFilters);
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey)!;
    }

    let filtered = [...searchIndex];

    // Text search with scoring (only if search term is long enough)
    if (currentFilters.search && currentFilters.search.length >= 2) {
      const searchTerm = currentFilters.search.toLowerCase();
      const queryTerms = searchTerm.split(/\s+/).filter(Boolean);
      const scores = new Map<number, number>();

      filtered = filtered.filter(item => {
        let score = 0;
        let matchCount = 0;

        // Quick name check first (most common)
        if (item.normalizedName.includes(searchTerm)) {
          score += 100;
          matchCount++;
        }

        // Description match (if no name match)
        if (matchCount === 0 && item.normalizedDescription.includes(searchTerm)) {
          score += 80;
          matchCount++;
        }

        // Multi-term search in name and description only
        if (matchCount === 0) {
          for (const term of queryTerms) {
            if (item.searchableText.includes(term)) {
              score += 30;
              matchCount++;
              break; // Exit early for performance
            }
          }
        }

        if (matchCount > 0) {
          scores.set(item.id, score);
          return true;
        }
        return false;
      });

      // Sort by relevance if searching
      filtered.sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0));
    }

    // Apply other filters (quick operations)
    if (currentFilters.tracks.length > 0) {
      const trackSet = new Set(currentFilters.tracks.map(t => t.toLowerCase()));
      filtered = filtered.filter(item =>
        item.normalizedTracks.some(track => trackSet.has(track))
      );
    }

    if (currentFilters.countries.length > 0) {
      const countrySet = new Set(currentFilters.countries.map(c => c.toLowerCase()));
      filtered = filtered.filter(item =>
        countrySet.has(item.normalizedCountry)
      );
    }

    // Team size filter
    if (currentFilters.teamSizeRange[0] > 1 || currentFilters.teamSizeRange[1] < 50) {
      filtered = filtered.filter(item =>
        item.teamSize >= currentFilters.teamSizeRange[0] &&
        item.teamSize <= currentFilters.teamSizeRange[1]
      );
    }

    // Likes filter
    if (currentFilters.likesRange[0] > 0 || currentFilters.likesRange[1] < 100) {
      filtered = filtered.filter(item =>
        (item.project.likes || 0) >= currentFilters.likesRange[0] &&
        (item.project.likes || 0) <= currentFilters.likesRange[1]
      );
    }

    // Final sort (if not already sorted by relevance)
    if (!currentFilters.search || currentFilters.search.length < 2) {
      filtered.sort((a, b) => {
        let aValue: string | number, bValue: string | number;
        
        switch (currentFilters.sortBy) {
          case 'likes':
            aValue = a.project.likes || 0;
            bValue = b.project.likes || 0;
            break;
          case 'comments':
            aValue = a.project.comments || 0;
            bValue = b.project.comments || 0;
            break;
          case 'name':
            aValue = a.project.name || '';
            bValue = b.project.name || '';
            break;
          case 'country':
            aValue = a.project.country || '';
            bValue = b.project.country || '';
            break;
          default:
            aValue = a.project.likes || 0;
            bValue = b.project.likes || 0;
        }

        return currentFilters.sortOrder === 'asc' 
          ? (aValue > bValue ? 1 : -1)
          : (aValue < bValue ? 1 : -1);
      });
    }

    const results = filtered.map(item => item.project);
    
    // Cache results (limit cache size)
    if (cacheRef.current.size >= 20) {
      const firstKey = cacheRef.current.keys().next().value;
      if (firstKey !== undefined) {
        cacheRef.current.delete(firstKey);
      }
    }
    cacheRef.current.set(cacheKey, results);

    return results;
  }, [searchIndex]);

  // Debounce the search computation
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsSearching(true);

    // Adaptive debouncing based on operation type and data size
    let delay = 100; // Default for non-search operations
    
    if (filters.search !== debouncedFilters.search) {
      // Search text debouncing - longer for better UX
      if (filters.search.length === 0) {
        delay = 100; // Clear search immediately
      } else if (filters.search.length <= 2) {
        delay = 600; // Longer delay for short queries (often typos)
      } else if (filters.search.length <= 5) {
        delay = 500; // Medium delay for medium queries
      } else {
        delay = 400; // Shorter delay for longer, more intentional queries
      }
    } else {
      // Filter changes (tracks, countries, etc.) - faster response
      delay = 200;
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
      setIsSearching(false);
    }, delay);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [filters, debouncedFilters.search]);

  // Update filters function (immediate UI update)
  const updateFilters = useCallback((updates: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  // Sync URL with filters (debounced)
  useEffect(() => {
    if (urlSyncRef.current) {
      clearTimeout(urlSyncRef.current);
    }

    // URL updates can be longer since they're not user-facing
    // This prevents excessive browser history entries
    urlSyncRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (filters.search) params.set('q', filters.search);
      if (filters.sortBy !== 'likes') params.set('sort', filters.sortBy);
      if (filters.sortOrder !== 'desc') params.set('order', filters.sortOrder);
      if (filters.tracks.length > 0) params.set('tracks', filters.tracks.join(','));
      if (filters.countries.length > 0) params.set('countries', filters.countries.join(','));
      
      const urlString = params.toString();
      const currentUrl = window.location.search.substring(1);
      
      if (urlString !== currentUrl) {
        router.replace(`?${urlString}`, { scroll: false });
      }
    }, 800); // Longer delay for URL updates - prevents excessive history entries

    return () => {
      if (urlSyncRef.current) {
        clearTimeout(urlSyncRef.current);
      }
    };
  }, [filters, router]);

  // Get filtered results (only updates when debounced filters change)
  const filteredProjects = useMemo(() => 
    performSearch(debouncedFilters), 
    [debouncedFilters, performSearch]
  );

  // Clear cache when projects change
  useEffect(() => {
    cacheRef.current.clear();
  }, [projects]);

  const clearFilters = useCallback(() => {
    updateFilters(DEFAULT_FILTERS);
  }, [updateFilters]);

  return {
    filters,
    filteredProjects,
    isSearching,
    resultCount: filteredProjects.length,
    updateFilters,
    clearFilters,
    hasActiveFilters: filters.search || filters.tracks.length > 0 || filters.countries.length > 0
  };
}
